/**
 * 直播管理 — 直播中控工作台
 * 直播商品：从上架排品中添加（添加时选择上架 / 预告，默认上架）；上架 / 预告、置顶（仅 1 个，低于讲解）、讲解（默认置顶）、
 * SKU 库存（需保存）/ 上下架、展示序号、上移下移。
 * 预告：C 端展示商品预告但不可购买；上架：C 端可正常下单。
 * 直播商品上下架只控制 C 端小黄车是否展示，不改直播排品上下架。
 * 直播排品 tab：仅展示已上架且未加入直播商品的排品。
 * 弹幕：点击可禁言（本场）、回复、屏蔽（C 端不展示该条）、置顶（同时仅 1 条，C 端左上角展示）。
 * 禁言/取消禁言、置顶/取消置顶需二次确认；点「发送」可选普通发送或置顶发送（置顶发送不再二次确认）；回复弹窗也可置顶发送；全部弹幕置顶条固定顶部并分页，关键词回车或点查询筛选。
 * 一键评论 / 快捷回复按当前场次分别存储，不在各场次间共享。
 * 新增一键评论 / 快捷回复、发送弹幕与回复均过敏感词风控，命中则拦截。
 * 观看记录：当前在线 / 累计观看 / 观看人次。
 * 福袋开奖：符合条件人数不足时，按 min(中奖人数, 参与人数) 补虚拟用户进中奖名单。
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

  var QUICK_REPLIES = ['欢迎来到直播间～', '这款正在讲解，库存有限先拍', '下单备注自提门店即可'];
  var QUICK_REPLY_KEY = 'lf_live_quick_replies_by_session_v1';
  var QUICK_REPLY_MAX = 10;
  var QUICK_REPLY_MAX_LEN = 30;
  var QUICK_COMMENT_KEY = 'lf_live_quick_comments_by_session_v1';
  var QUICK_COMMENT_MAX = 10;
  var QUICK_COMMENT_MAX_LEN = 20;
  var DEFAULT_QUICK_COMMENTS = [
    { id: 'qc-1', text: '已拍已拍' },
    { id: 'qc-2', text: '给力给力' },
    { id: 'qc-3', text: '满意满意' },
    { id: 'qc-4', text: '爱了爱了' }
  ];
  var PICK_CHECK =
    '<svg class="lf-live-pick__check" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 6.2l2.8 2.8L10 3.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  var sessionId = '';
  var mainTab = 'product';
  var productTab = 'cart';
  var sideTab = 'metrics';
  var watchTab = 'online';
  var watchSortDesc = true;
  var watchStatusFilter = '';
  var likeTab = 'detail';
  var likeSortDesc = true;
  var chatKeyword = '';
  var chatPage = 1;
  var chatPageSize = 50;
  var danmuMenuTarget = null;
  var pendingConfirm = null;
  var expandedIds = {};
  var virtualUser = '';
  var schedFilter = { name: '', sku: '', category: '' };
  var cartFilter = { name: '', sku: '' };
  var pendingStock = {};
  var selectedCart = {};
  var selectedSched = {};
  var pendingAddIds = [];
  var C_STATE_KEY = 'lf_live_c_state_v1';
  var LIKE_REPORT_KEY = 'lf_live_like_reports_v1';
  var TASK_DURATION_SEC = 1440 * 60;
  var welfareUi = {
    open: false,
    kind: 'coupon',
    tab: 'issue',
    planId: '',
    duration: '',
    quantity: '',
    winnerCount: '',
    drawType: 'RANDOM',
    assignUsers: [],
    assignKeyword: '',
    assignSearched: false,
    bagWinDraft: 'session'
  };
  var welfareTickTimer = null;
  var addCouponUi = { templateId: '', keyword: '', stock: '100', page: 1 };
  var addBagUi = { templateId: '', keyword: '', stock: '' };
  var addSignUi = { templateId: '', keyword: '' };
  var addTaskUi = { templateId: '', keyword: '' };
  var WELFARE_META = {
    coupon: {
      type: 'COUPON',
      title: '发放优惠券',
      issueTab: '发放优惠券',
      recordTab: '优惠券记录',
      primary: '立即发放',
      panelClass: '',
      emptyPlan: '该场次暂无绑定的优惠券活动',
      emptyRecord: '暂无发放记录'
    },
    bag: {
      type: 'FORTUNE_BAG',
      title: '发放福袋',
      issueTab: '发放福袋',
      recordTab: '福袋记录',
      primary: '立即发放',
      panelClass: 'is-bag',
      emptyPlan: '该场次暂无绑定的福袋活动',
      emptyRecord: '暂无发放记录'
    },
    sign: {
      type: 'SIGN_IN',
      title: '发放签到',
      issueTab: '发放签到',
      recordTab: '签到记录',
      primary: '立即发放',
      panelClass: 'is-sign',
      emptyPlan: '该场次暂无绑定的签到活动',
      emptyRecord: '暂无签到记录'
    },
    task: {
      type: 'TASK',
      title: '发放观看奖励',
      issueTab: '发放观看奖励',
      recordTab: '观看奖励记录',
      primary: '立即发放',
      panelClass: 'is-task',
      emptyPlan: '该场次暂无绑定的观看奖励活动',
      emptyRecord: '暂无观看奖励记录'
    }
  };
  var WELFARE_GIFT_ICO =
    '<svg class="lf-welfare-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="10" width="18" height="11" rx="1"/><path d="M3 14h18M12 10v11"/><path d="M12 10C9 6 6 6.5 6 9c0 1.5 1.8 2.2 6 1 4.2 1.2 6 .5 6-1 0-2.5-3-3-6-1z"/></svg>';
  var WELFARE_COIN_ICO =
    '<svg class="lf-welfare-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 8v8M9.5 10.5c.4-1 2.6-1.2 3.4 0 .7 1-.3 1.8-1.7 2.2 1.5.3 2.6 1.1 2 2.2-.6 1.1-2.7 1.1-3.4 0"/></svg>';
  var WELFARE_EMPTY_SVG =
    '<svg viewBox="0 0 160 160" aria-hidden="true"><ellipse cx="80" cy="132" rx="46" ry="8" fill="#f2f3f5"/><rect x="48" y="52" width="64" height="54" rx="4" fill="#f5f7fa" stroke="#e4e7ed"/><path d="M48 70h64" stroke="#e4e7ed"/><circle cx="80" cy="44" r="14" fill="#fafafa" stroke="#e4e7ed"/><path d="M68 92h24" stroke="#dcdfe6" stroke-linecap="round"/></svg>';

  function toast(msg, type) {
    if (typeof showToast === 'function') showToast(msg, type || 'success');
  }

  function rejectSensitive(text) {
    var api = window.MdmLiveSensitiveWords;
    if (!api || typeof api.check !== 'function') return false;
    var r = api.check(text);
    if (!r || !r.blocked) return false;
    toast(r.message || '内容包含敏感词，请修改后再试', 'warning');
    return true;
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
        muted: false,
        mutedUsers: {},
        recentOrders: [],
        chatMessages: [],
        watchViewers: [],
        watchVisits: [],
        watchRecords: [],
        likeDetails: [],
        likeUsers: [],
        visitCount: 0
      };
    }
    var m = Demo.controlMetrics[id];
    if (!m.chatMessages) m.chatMessages = [];
    if (!m.watchRecords) m.watchRecords = [];
    if (!m.recentOrders) m.recentOrders = [];
    if (!m.mutedUsers) m.mutedUsers = {};
    if (!m.watchViewers) m.watchViewers = [];
    if (!m.watchVisits) m.watchVisits = [];
    if (!m.likeDetails) m.likeDetails = [];
    if (!m.likeUsers) m.likeUsers = [];
    if (!m.watchViewers.length && m.watchRecords.length) {
      m.watchViewers = m.watchRecords.map(function (w, i) {
        return {
          id: w.id || 'wv-' + i,
          userId: w.userId || w.id || 'u-' + i,
          nickname: w.nickname || '匿名用户',
          lastEnterTime: w.enterTime || '',
          enterCount: w.enterCount || 1,
          totalDuration: w.duration || w.totalDuration || '',
          online: w.online !== false,
          muted: !!w.muted
        };
      });
    }
    return m;
  }

  function avatarHue(name) {
    var hue = 0;
    var s = String(name || '');
    for (var i = 0; i < s.length; i++) hue += s.charCodeAt(i);
    return hue % 360;
  }

  function avatarHtml(name) {
    var n = name || '匿';
    return (
      '<span class="lf-live-avatar" style="background:hsl(' +
      avatarHue(n) +
      ',58%,52%)">' +
      escapeHtml(n.charAt(0)) +
      '</span>'
    );
  }

  function chatUserKey(userId, nickname) {
    return userId || nickname || '';
  }

  function isUserMuted(m, userId, nickname) {
    var map = (m && m.mutedUsers) || {};
    if (userId && map[userId]) return true;
    if (nickname && map[nickname]) return true;
    return false;
  }

  function setUserMuted(userId, nickname, on) {
    var m = metricsOf(sessionId);
    m.mutedUsers = m.mutedUsers || {};
    var key = chatUserKey(userId, nickname);
    if (!key) return;
    if (on) {
      m.mutedUsers[key] = true;
      if (userId) m.mutedUsers[userId] = true;
    } else {
      delete m.mutedUsers[key];
      if (userId) delete m.mutedUsers[userId];
      if (nickname) delete m.mutedUsers[nickname];
    }
    (m.watchViewers || []).forEach(function (v) {
      if ((userId && v.userId === userId) || (nickname && v.nickname === nickname)) {
        v.muted = !!on;
      }
    });
  }

  function findChatById(id) {
    var msgs = metricsOf(sessionId).chatMessages || [];
    for (var i = 0; i < msgs.length; i++) {
      if (msgs[i].id === id) return msgs[i];
    }
    return null;
  }

  function pinnedChatOf(sess) {
    var msgs = (metricsOf((sess && sess.id) || sessionId).chatMessages || []);
    var found = null;
    msgs.forEach(function (m) {
      if (m && m.pinned && !m.isSys) found = m;
    });
    return found;
  }

  function setChatPinned(msg, on) {
    var msgs = metricsOf(sessionId).chatMessages || [];
    msgs.forEach(function (m) {
      if (!m) return;
      if (on) m.pinned = !!(msg && m.id === msg.id);
      else if (msg && m.id === msg.id) m.pinned = false;
    });
  }

  function closeDanmuMenu() {
    var menu = document.getElementById('danmuActMenu');
    if (menu) menu.hidden = true;
    danmuMenuTarget = null;
  }

  function openDanmuMenu(ev, msg) {
    if (isEndedLocked()) {
      toastEndedLock('interact');
      return;
    }
    if (!msg || msg.isSys) return;
    ev.preventDefault();
    ev.stopPropagation();
    var menu = document.getElementById('danmuActMenu');
    if (!menu) return;
    danmuMenuTarget = msg;
    var muted = isUserMuted(metricsOf(sessionId), msg.userId, msg.user);
    var muteBtn = document.getElementById('danmuActMute');
    var blockBtn = document.getElementById('danmuActBlock');
    var pinBtn = document.getElementById('danmuActPin');
    if (pinBtn) {
      pinBtn.textContent = msg.pinned ? '取消置顶' : '置顶';
    }
    if (muteBtn) {
      muteBtn.hidden = !!(msg.isAnchor || msg.isSys);
      muteBtn.textContent = muted ? '恢复' : '禁言';
    }
    if (blockBtn) {
      blockBtn.textContent = msg.blocked ? '取消屏蔽' : '屏蔽';
    }
    menu.hidden = false;
    var x = ev.clientX;
    var y = ev.clientY;
    var rect = menu.getBoundingClientRect();
    if (x + rect.width > window.innerWidth - 8) x = window.innerWidth - rect.width - 8;
    if (y + rect.height > window.innerHeight - 8) y = window.innerHeight - rect.height - 8;
    menu.style.left = Math.max(8, x) + 'px';
    menu.style.top = Math.max(8, y) + 'px';
  }

  function timeSortValue(s) {
    return String(s || '');
  }

  function normalizeSchedStatus(st) {
    if (typeof Demo.normalizeSchedStatus === 'function') return Demo.normalizeSchedStatus(st);
    if (st === 'enabled' || st === 'on_shelf' || st === 'listing') return 'enabled';
    if (st === 'disabled' || st === 'off_shelf' || st === 'delisting') return 'disabled';
    return 'draft';
  }

  function ensureControlFields(p, index) {
    if (p.inCart == null) {
      p.inCart =
        p.liveStatus === 'explaining' ||
        p.liveStatus === 'displaying' ||
        p.liveStatus === 'selling' ||
        p.liveStatus === 'preview';
    }
    if (p.saleMode == null) {
      if (p.spuOn === true || (p.inCart && p.liveStatus && p.liveStatus !== 'off_shelf' && p.liveStatus !== 'preview')) {
        p.saleMode = 'selling';
      } else {
        p.saleMode = 'preview';
      }
    }
    if (p.explaining == null) p.explaining = p.liveStatus === 'explaining';
    if (p.pinned == null) p.pinned = false;
    if (p.cartSort == null) p.cartSort = index + 1;
    if (p.previewPriceMode == null) p.previewPriceMode = 'sale';
  }

  function skusOf(p) {
    if (p.skus && p.skus.length) return p.skus;
    return [
      {
        id: (p.id || 'x') + '-sku',
        specName: p.spec || '默认规格',
        price: p.price,
        marketPrice: p.marketPrice,
        stock: p.stock,
        enabled: true
      }
    ];
  }

  function displayStock(p, sku) {
    var bag = pendingStock[p.id];
    if (bag && Object.prototype.hasOwnProperty.call(bag, sku.id)) return bag[sku.id];
    return sku.stock != null ? sku.stock : 0;
  }

  function syncLiveStatus(p) {
    if (p.saleMode === 'preview') {
      p.liveStatus = p.explaining ? 'explaining' : 'preview';
      return;
    }
    if (p.explaining) {
      p.liveStatus = 'explaining';
      return;
    }
    var skus = skusOf(p);
    var onSkus = skus.filter(function (s) {
      return s.enabled !== false;
    });
    var stock = onSkus.reduce(function (sum, s) {
      return sum + (Number(s.stock) || 0);
    }, 0);
    p.stock = stock;
    if (!onSkus.length || stock <= 0) {
      p.liveStatus = 'sold_out';
      return;
    }
    p.liveStatus = 'selling';
  }

  function statusLabel(st) {
    if (st === 'live') return '直播中';
    if (st === 'upcoming') return '未开始';
    if (st === 'ended') return '已结束';
    return st || '—';
  }

  var ENDED_LOCK_MSG = '已结束场次仅可查看，不能提交操作';

  function isEndedLocked() {
    var sess = sessionId ? findSession(sessionId) : null;
    return !!(sess && sess.status === 'ended');
  }

  function toastEndedLock(kind) {
    var map = {
      danmu: '已结束场次不能发布弹幕',
      deliver: '已结束场次不能发放活动，仅可查看',
      interact: '已结束场次不能置顶、回复或禁言'
    };
    toast(map[kind] || ENDED_LOCK_MSG, 'warning');
  }

  function isEndedViewOnlyEl(el) {
    if (!el || !el.closest) return false;
    if (el.closest('#sidebar-container, #header-container, #controlPicker')) return true;
    if (el.id === 'controlBackBtn' || el.closest('#controlBackBtn')) return true;
    if (el.id === 'controlEnterBtn' || el.id === 'controlSessionSelect') return true;
    if (el.id === 'btnPushUrl' || el.id === 'btnCopyPush') return true;
    if (el.hasAttribute('data-close-dialog')) return true;
    if (el.closest('#controlMainTabs, #controlProductSubTabs, #controlSideTabs, #watchSubTabs, #sidePaneChatPager, #welfareDrawerTabs')) {
      return true;
    }
    if (
      el.id === 'welfareDrawerClose' ||
      el.id === 'welfareDrawerCancel' ||
      el.id === 'welfareDrawerRefresh'
    ) {
      return true;
    }
    if (el.closest('.lf-live-control-filter')) return true;
    // 已结束仍可配置快捷回复 / 一键评论 / 虚拟互动账号
    if (
      el.closest(
        '.lf-live-interact-tools, #quickReplyBox, #quickCommentBox, #btnVirtualAccount, #btnQuickReply, #btnQuickComment'
      )
    ) {
      return true;
    }
    var allowIds = {
      cartFilterQuery: 1,
      cartFilterReset: 1,
      schedFilterQuery: 1,
      schedFilterReset: 1,
      chatKeywordQuery: 1,
      watchSortBtn: 1,
      btnVirtualAccount: 1,
      btnQuickReply: 1,
      btnQuickComment: 1,
      quickReplyAddBtn: 1,
      quickCommentAddBtn: 1,
      quickReplyInput: 1,
      quickCommentInput: 1
    };
    if (el.id && allowIds[el.id]) return true;
    if (el.id === 'watchStatusFilter' || el.id === 'chatKeywordInput') return true;
    if (el.getAttribute('data-act') === 'expand') return true;
    if (isEndedShelfEl(el)) return true;
    return false;
  }

  function isEndedShelfEl(el) {
    if (!el) return false;
    var act = el.getAttribute('data-act');
    if (
      act === 'sale-mode' ||
      act === 'remove' ||
      act === 'sku-toggle' ||
      act === 'add' ||
      act === 'select'
    ) {
      return true;
    }
    var allowIds = {
      btnCartBatchRemove: 1,
      btnSchedBatchAdd: 1,
      btnGoSched: 1,
      addCartConfirm: 1,
      cartSelectAll: 1,
      schedSelectAll: 1
    };
    if (el.id && allowIds[el.id]) return true;
    if (el.classList && el.classList.contains('lf-live-card-check')) return true;
    if (el.classList && el.classList.contains('lf-live-sched-add')) return true;
    if (el.name === 'addCartSaleMode') return true;
    return false;
  }

  function syncEndedLock() {
    var locked = isEndedLocked();
    var page = document.querySelector('.lf-live-control-page');
    if (page) page.classList.toggle('lf-live-control--ended', locked);
    var drawerLock = document.getElementById('welfareDrawer');
    if (drawerLock) drawerLock.classList.toggle('lf-live-control--ended', locked);
    var hint = document.getElementById('controlEndedHint');
    if (hint) hint.hidden = !locked;

    var lockIds = [
      'btnStartLive',
      'btnStopLive',
      'btnMuteChat',
      'btnSendDanmu',
      'btnCartSettings',
      'btnCartTimedRemove',
      'btnSchedTimedAdd',
      'btnDeliverWelfare',
      'welfareDrawerPrimary',
      'cartSettingsConfirm',
      'timedRemoveConfirm',
      'timedAddConfirm',
      'danmuConfirmOk',
      'danmuReplySend',
      'danmuReplySendPin',
      'controlDanmuInput',
      'danmuReplyText'
    ];
    lockIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (el && locked) el.disabled = true;
    });

    if (!locked) return;
    var roots = [document.getElementById('controlWorkspace')].concat(
      Array.prototype.slice.call(document.querySelectorAll('.lf-live-dialog, #danmuActMenu, #welfareDrawer'))
    );
    roots.forEach(function (root) {
      if (!root) return;
      root
        .querySelectorAll(
          'button, input, textarea, select, a[data-watch-act], [data-chat-pin], [data-pin-close], [data-danmu-act], [data-send-mode]'
        )
        .forEach(function (el) {
          if (isEndedViewOnlyEl(el)) return;
          if (el.tagName === 'A' || el.hasAttribute('data-chat-pin') || el.hasAttribute('data-pin-close') || el.hasAttribute('data-danmu-act') || el.hasAttribute('data-send-mode')) {
            el.setAttribute('aria-disabled', 'true');
            el.classList.add('is-disabled');
            return;
          }
          el.disabled = true;
        });
    });
  }

  function statusBadgeClass(st) {
    if (st === 'live') return 'lf-live-badge lf-live-badge--live';
    if (st === 'upcoming') return 'lf-live-badge lf-live-badge--warn';
    return 'lf-live-badge lf-live-badge--muted';
  }

  function formatMoney(n) {
    var v = Number(n);
    if (isNaN(v)) return '¥0.00';
    return '¥' + v.toFixed(2);
  }

  function orderPayDisplay(o) {
    var total = Number(o && o.amount);
    if (isNaN(total)) total = 0;
    var paid = o && o.paidAmount != null ? Number(o.paidAmount) : o && o.paid ? total : 0;
    if (isNaN(paid)) paid = 0;
    if (paid > 0 || (o && o.paid && paid >= 0 && o.statusLabel === '已支付')) {
      var showPaid = paid > 0 ? paid : total;
      if (showPaid > 0) return { text: formatMoney(showPaid), title: '实付金额' };
    }
    var payable = o && o.payableAmount != null ? Number(o.payableAmount) : total;
    if (isNaN(payable)) payable = total;
    return { text: formatMoney(payable), title: '待支付金额' };
  }

  function formatNum(n) {
    var v = Number(n) || 0;
    if (v >= 10000) return (v / 10000).toFixed(1) + 'w';
    return String(v);
  }

  function formatSessionTime(startAt, endAt) {
    function short(t) {
      if (!t) return '—';
      return String(t).replace(/^\d{4}-/, '').slice(0, 11);
    }
    return short(startAt) + ' - ' + short(endAt);
  }

  function nowTime() {
    return nowDateTime();
  }

  /** 全部弹幕发送时间：YYYY-MM-DD HH:mm:ss；仅有时分秒时补当前场次开播日期 */
  function formatChatTime(t) {
    var raw = String(t || '').trim();
    if (!raw) return '';
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw;
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(raw)) {
      var sess = findSession(sessionId);
      var dateSrc = (sess && (sess.actualStartAt || sess.startAt)) || '';
      var datePart = String(dateSrc).slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart + ' ' + raw;
    }
    return raw;
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

  function fillCategoryFilter() {
    var sel = document.getElementById('schedFilterCategory');
    if (!sel) return;
    sel.innerHTML =
      '<option value="">全部类目</option>' +
      (Demo.categories || [])
        .map(function (c) {
          return '<option value="' + escapeHtml(c.id) + '">' + escapeHtml(c.name) + '</option>';
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
    expandedIds = {};
    closePickPanels();
    render();
  }

  function allCartProducts() {
    var list = productsOf(sessionId);
    list.forEach(ensureControlFields);
    return list
      .filter(function (p) {
        return !!p.inCart;
      })
      .sort(compareCart);
  }

  function cartProducts() {
    return allCartProducts().filter(function (p) {
      if (cartFilter.name && String(p.name || '').indexOf(cartFilter.name) < 0) return false;
      if (cartFilter.sku && String(p.sku || '').indexOf(cartFilter.sku) < 0) return false;
      return true;
    });
  }

  function updateCartCount() {
    var n = allCartProducts().length;
    var tab = document.getElementById('controlCartTabBtn');
    var count = document.getElementById('controlCartCount');
    if (tab) tab.textContent = '直播商品(' + n + ')';
    if (count) count.textContent = '共 ' + n + ' 件';
  }

  function compareCart(a, b) {
    if (a.explaining && !b.explaining) return -1;
    if (!a.explaining && b.explaining) return 1;
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return (a.cartSort || 0) - (b.cartSort || 0);
  }

  function schedProducts() {
    var list = productsOf(sessionId);
    list.forEach(ensureControlFields);
    return list.filter(function (p) {
      if (p.inCart) return false;
      if (normalizeSchedStatus(p.status) !== 'enabled') return false;
      if (schedFilter.name && String(p.name || '').indexOf(schedFilter.name) < 0) return false;
      if (schedFilter.sku && String(p.sku || '').indexOf(schedFilter.sku) < 0) return false;
      if (schedFilter.category && String(p.categoryId || '') !== schedFilter.category) return false;
      return true;
    });
  }

  function findProduct(id) {
    var list = productsOf(sessionId);
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return { item: list[i], index: i, list: list };
    }
    return null;
  }

  function findSku(p, skuId) {
    var skus = skusOf(p);
    for (var i = 0; i < skus.length; i++) {
      if (skus[i].id === skuId) return skus[i];
    }
    return null;
  }

  function nextCartSort() {
    var max = 0;
    allCartProducts().forEach(function (p) {
      if ((p.cartSort || 0) > max) max = p.cartSort;
    });
    return max + 1;
  }

  function normalizeSaleMode(mode) {
    return mode === 'preview' ? 'preview' : 'selling';
  }

  function saleModeLabel(mode) {
    return normalizeSaleMode(mode) === 'selling' ? '上架' : '预告';
  }

  function addToCart(p, saleMode) {
    ensureControlFields(p, 0);
    p.inCart = true;
    p.saleMode = normalizeSaleMode(saleMode);
    p.explaining = false;
    p.pinned = false;
    p.pendingAdd = null;
    p.removeAt = null;
    p.previewPriceMode = p.previewPriceMode || 'sale';
    p.cartSort = nextCartSort();
    syncLiveStatus(p);
    compactCartSort();
  }

  function removeFromCart(p) {
    p.inCart = false;
    p.saleMode = 'preview';
    p.explaining = false;
    p.pinned = false;
    p.removeAt = null;
    delete pendingStock[p.id];
    delete selectedCart[p.id];
    syncLiveStatus(p);
    compactCartSort();
  }

  function formatClock(ts) {
    if (!ts) return '';
    var d = new Date(ts);
    function pad(n) {
      return n < 10 ? '0' + n : String(n);
    }
    return pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function toLocalInput(ts) {
    var d = new Date(ts);
    function pad(n) {
      return n < 10 ? '0' + n : String(n);
    }
    return (
      d.getFullYear() +
      '-' +
      pad(d.getMonth() + 1) +
      '-' +
      pad(d.getDate()) +
      'T' +
      pad(d.getHours()) +
      ':' +
      pad(d.getMinutes())
    );
  }

  function fromLocalInput(str) {
    if (!str) return '';
    var s = String(str);
    return s.replace('T', ' ') + (s.length === 16 ? ':00' : '');
  }

  function nowDateTime() {
    var d = new Date();
    function pad(n) {
      return n < 10 ? '0' + n : String(n);
    }
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

  function stampActualStart(sess) {
    if (sess && !sess.actualStartAt) sess.actualStartAt = nowDateTime();
  }

  function stampActualEnd(sess) {
    if (!sess) return;
    if (!sess.actualStartAt) sess.actualStartAt = nowDateTime();
    sess.actualEndAt = nowDateTime();
  }

  function parseSessionTs(str) {
    if (str == null || str === '') return NaN;
    var s = String(str).trim();
    if (!s) return NaN;
    var ts = new Date(s).getTime();
    if (!isFinite(ts)) ts = new Date(s.replace('T', ' ').replace(/-/g, '/')).getTime();
    return ts;
  }

  function processScheduled() {
    var sess = findSession(sessionId);
    var now = Date.now();
    var changed = false;
    if (sess && sess.status === 'live' && sess.autoCloseEnabled) {
      var closeTs = parseSessionTs(sess.autoCloseAt);
      if (isFinite(closeTs) && now >= closeTs) {
        sess.status = 'ended';
        stampActualEnd(sess);
        changed = true;
        var rel = releaseEndedWelfareStock(sess);
        toast(rel.any ? endedStockToast('已到关播时间', rel) : '已到关播时间，直播已结束');
      }
    }
    productsOf(sessionId).forEach(function (p) {
      ensureControlFields(p, 0);
      if (p.inCart && p.removeAt && now >= p.removeAt) {
        removeFromCart(p);
        changed = true;
      }
      if (!p.inCart && p.pendingAdd) {
        var pendingMode = p.pendingAdd.saleMode;
        if (p.pendingAdd.type === 'at' && p.pendingAdd.at && now >= p.pendingAdd.at) {
          addToCart(p, pendingMode);
          changed = true;
        } else if (p.pendingAdd.type === 'on_live_start' && sess && sess.status === 'live') {
          addToCart(p, pendingMode);
          changed = true;
        }
      }
    });
    if (expireWelfareWindows()) changed = true;
    if (sess && releaseEndedWelfareStock(sess).any) changed = true;
    return changed;
  }

  function priceBlock(p) {
    var html = '<span class="lf-live-cart-card__sale">' + escapeHtml(formatMoney(p.price)) + '</span>';
    if (p.marketPrice != null && Number(p.marketPrice) > 0) {
      html += '<span class="lf-live-cart-card__market">' + escapeHtml(formatMoney(p.marketPrice)) + '</span>';
    }
    return '<div class="lf-live-cart-card__prices">' + html + '</div>';
  }

  function selectedCartIds() {
    return Object.keys(selectedCart).filter(function (id) {
      return selectedCart[id];
    });
  }

  function selectedSchedIds() {
    return Object.keys(selectedSched).filter(function (id) {
      return selectedSched[id];
    });
  }

  function clearExplainExcept(keepId) {
    productsOf(sessionId).forEach(function (p) {
      if (p.id !== keepId) p.explaining = false;
    });
  }

  function clearPinExcept(keepId) {
    productsOf(sessionId).forEach(function (p) {
      if (p.id !== keepId) p.pinned = false;
    });
  }

  function thumbHtml(item, seq) {
    var name = String(item.name || '商');
    var ch = name.charAt(0);
    var hue = 0;
    for (var i = 0; i < name.length; i++) hue += name.charCodeAt(i);
    hue = 18 + (hue % 40);
    var inner = item.img
      ? '<span class="lf-live-thumb"><img src="' + escapeHtml(item.img) + '" alt=""></span>'
      : '<span class="lf-live-thumb lf-live-thumb--ph" style="--ph-hue:' +
        hue +
        '">' +
        '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="8" y="12" width="32" height="24" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="18" cy="21" r="3" fill="currentColor"/><path d="M12 32l8-8 6 6 5-5 5 7H12z" fill="currentColor" opacity=".45"/></svg>' +
        '<em>' +
        escapeHtml(ch) +
        '</em></span>';
    var badge =
      seq != null
        ? '<span class="lf-live-thumb-seq">' + escapeHtml(String(seq)) + '</span>'
        : '';
    return '<span class="lf-live-thumb-wrap">' + badge + inner + '</span>';
  }

  function serializeLiveCartProduct(p) {
    var skus = skusOf(p);
    var enabled = skus.filter(function (s) {
      return s.enabled !== false;
    });
    var use = enabled.length ? enabled : skus;
    var liveSpecs = use.map(function (s) {
      return {
        label: s.specName || p.spec || '默认规格',
        price: Number(s.price != null ? s.price : p.price) || 0,
        marketPrice: s.marketPrice != null ? s.marketPrice : p.marketPrice
      };
    });
    if (!liveSpecs.length) {
      liveSpecs = [
        {
          label: p.spec || '默认规格',
          price: Number(p.price) || 0,
          marketPrice: p.marketPrice
        }
      ];
    }
    var previewMode =
      p.previewPriceMode === 'question' || p.previewPriceMode === 'market' ? p.previewPriceMode : 'sale';
    return {
      id: p.id,
      name: p.name,
      shortName: p.name,
      spec: liveSpecs[0].label,
      defaultSpec: liveSpecs[0].label,
      specs: liveSpecs.map(function (s) {
        return s.label;
      }),
      liveSpecs: liveSpecs,
      price: Number(p.price) || 0,
      livePrice: Number(p.price) || 0,
      marketPrice: p.marketPrice,
      originPrice: p.marketPrice,
      img: p.img || '',
      desc: p.desc || p.intro || '',
      saleMode: p.saleMode === 'preview' ? 'preview' : 'selling',
      previewPriceMode: previewMode,
      explaining: !!p.explaining,
      pinned: !!p.pinned,
      cartSort: p.cartSort || 0,
      liveStatus: p.liveStatus || '',
      fulfillType: p.deliveryMode === 'mail' ? 'express' : 'pickup'
    };
  }

  function syncCState() {
    var cartList = allCartProducts().map(serializeLiveCartProduct);
    var explaining = null;
    var previewMode = 'sale';
    cartList.forEach(function (p) {
      if (p.explaining && !explaining) explaining = p;
    });
    if (explaining && explaining.saleMode === 'preview') {
      previewMode = explaining.previewPriceMode || 'sale';
    } else {
      cartList.some(function (p) {
        if (p.saleMode !== 'preview') return false;
        previewMode = p.previewPriceMode || 'sale';
        return true;
      });
    }
    try {
      var prevCState = {};
      try {
        var prevRaw = localStorage.getItem(C_STATE_KEY);
        var prevData = prevRaw ? JSON.parse(prevRaw) : null;
        if (prevData && typeof prevData === 'object') prevCState = prevData;
      } catch (e0) {}
      localStorage.setItem(
        C_STATE_KEY,
        JSON.stringify({
          cartProducts: cartList,
          explaining: explaining,
          previewPriceMode: previewMode,
          chatMessages: (metricsOf(sessionId).chatMessages || []).map(function (m) {
            return {
              id: m.id,
              userId: m.userId || '',
              user: m.user,
              text: m.text,
              time: m.time || '',
              isAnchor: !!m.isAnchor,
              isSys: !!m.isSys,
              blocked: !!m.blocked,
              pinned: !!m.pinned
            };
          }),
          mutedUserIds: Object.keys(metricsOf(sessionId).mutedUsers || {}).filter(function (k) {
            return !!(metricsOf(sessionId).mutedUsers || {})[k];
          }),
          muted: !!metricsOf(sessionId).muted,
          sessionId: sessionId,
          quickComments: selectedQuickCommentTextsForSync(),
          cViewerPart: (function () {
            var sess = findSession(sessionId);
            if (!sess || typeof Demo.formatCViewerText !== 'function') return '';
            var cfg = Demo.normalizeCViewerConfig(sess);
            return Demo.formatCViewerText(Demo.resolveCViewerCount(sess, metricsOf(sessionId)), cfg.display);
          })(),
          cViewerText: (function () {
            var sess = findSession(sessionId);
            if (!sess || typeof Demo.formatCViewerText !== 'function') return '';
            return viewerLikeLineOf(sess);
          })(),
          cLike: (function () {
            var sess = findSession(sessionId);
            if (!sess || typeof Demo.cLikePayloadOf !== 'function') return null;
            return Demo.cLikePayloadOf(sess, metricsOf(sessionId));
          })(),
          cLikeUserExtra: Math.max(0, Math.floor(Number(prevCState.cLikeUserExtra) || 0))
        })
      );
    } catch (e) {}
  }

  function compactCartSort() {
    var list = productsOf(sessionId)
      .filter(function (p) {
        return !!p.inCart;
      })
      .sort(function (a, b) {
        return (a.cartSort || 0) - (b.cartSort || 0);
      });
    list.forEach(function (p, i) {
      p.cartSort = i + 1;
    });
    return list;
  }

  function insertCartAt(p, targetSeq) {
    var list = compactCartSort();
    var n = list.length;
    if (!n) return false;
    if (targetSeq === '' || targetSeq == null) return false;
    var to = Math.floor(Number(targetSeq));
    if (!isFinite(to)) return false;
    to = Math.max(1, Math.min(n, to));
    var from = p.cartSort;
    if (from === to) return false;
    var ordered = list.filter(function (item) {
      return item.id !== p.id;
    });
    ordered.splice(to - 1, 0, p);
    ordered.forEach(function (item, i) {
      item.cartSort = i + 1;
    });
    return true;
  }

  function setActiveTab(rootId, attr, value) {
    var root = document.getElementById(rootId);
    if (!root) return;
    root.querySelectorAll('[' + attr + ']').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute(attr) === value);
    });
  }

  function renderHeader(sess) {
    var pickerTitle = document.getElementById('controlPickerTitle');
    var meta = document.getElementById('controlSessionMeta');
    var actions = document.getElementById('controlTopActions');
    var badge = document.getElementById('controlStatusBadge');
    var startBtn = document.getElementById('btnStartLive');
    var stopBtn = document.getElementById('btnStopLive');
    var push = document.getElementById('broadcastPushUrl');

    if (!sess) {
      if (pickerTitle) pickerTitle.hidden = false;
      if (meta) meta.hidden = true;
      if (actions) actions.hidden = true;
      return;
    }

    if (pickerTitle) pickerTitle.hidden = true;
    if (meta) {
      meta.hidden = false;
      meta.innerHTML =
        '<span>直播名称：<b>' +
        escapeHtml(sess.name || '—') +
        '</b></span>' +
        '<span>主播：<b>' +
        escapeHtml(sess.anchorName || '—') +
        '</b></span>' +
        '<span>开播时间：<b>' +
        escapeHtml(formatSessionTime(sess.startAt, sess.endAt)) +
        '</b></span>' +
        '<span>实际开播：<b>' +
        escapeHtml(sess.actualStartAt || '—') +
        '</b></span>' +
        '<span>实际结束：<b>' +
        escapeHtml(sess.actualEndAt || '—') +
        '</b></span>' +
        '<span>直播场次ID：<b>' +
        escapeHtml(sess.id || '—') +
        '</b></span>';
    }
    if (actions) actions.hidden = false;
    if (badge) {
      badge.className = statusBadgeClass(sess.status);
      badge.textContent = statusLabel(sess.status);
    }
    if (startBtn) {
      startBtn.hidden = sess.status === 'live' || sess.status === 'ended';
      startBtn.disabled = !sess || sess.status === 'ended';
    }
    if (stopBtn) {
      stopBtn.hidden = sess.status !== 'live';
      stopBtn.disabled = sess.status !== 'live';
    }
    if (push) push.value = sess.pushUrl || '';
  }

  function viewerLikeLineOf(sess) {
    if (!sess || typeof Demo.formatCViewerText !== 'function') return '0人观看·0次点赞';
    var metrics = metricsOf(sess.id);
    var cfg = typeof Demo.normalizeCViewerConfig === 'function' ? Demo.normalizeCViewerConfig(sess) : { display: 'online' };
    var viewerText = Demo.formatCViewerText(Demo.resolveCViewerCount(sess, metrics), cfg.display);
    var likeCount = typeof Demo.resolveCLikeCount === 'function' ? Demo.resolveCLikeCount(sess, metrics) : (metrics.likes || 0);
    if (typeof Demo.formatCViewerLikeLine === 'function') return Demo.formatCViewerLikeLine(viewerText, likeCount);
    return viewerText + '·' + likeCount + '次点赞';
  }

  function renderBroadcastStats(sess) {
    var el = document.getElementById('broadcastPreviewStats');
    if (!el) return;
    el.textContent = viewerLikeLineOf(sess);
  }

  function renderBroadcast(sess) {
    var preview = document.getElementById('broadcastPreview');
    var live = sess && sess.status === 'live';
    if (preview) {
      preview.classList.toggle('is-live', !!live);
      var ph = preview.querySelector('.lf-live-broadcast-preview__placeholder');
      if (ph) ph.textContent = live ? '直播画面' : '直播画面';
    }
    renderBroadcastStats(sess);
    var muteBtn = document.getElementById('btnMuteChat');
    var muted = !!(metricsOf(sess.id).muted);
    if (muteBtn) {
      muteBtn.classList.toggle('is-on', muted);
      muteBtn.setAttribute('aria-pressed', muted ? 'true' : 'false');
      muteBtn.textContent = muted ? '已禁言' : '禁言';
    }
    renderDanmuOverlay(sess);
  }

  function renderDanmuOverlay(sess) {
    var pinBox = document.getElementById('broadcastDanmuPin');
    var pin = pinnedChatOf(sess);
    if (pinBox) {
      if (!pin || pin.blocked) {
        pinBox.hidden = true;
        pinBox.innerHTML = '';
      } else {
        pinBox.hidden = false;
        pinBox.innerHTML =
          '<div class="lf-live-danmu-pin__item" data-chat-id="' +
          escapeHtml(pin.id) +
          '"><span class="lf-live-danmu-pin__bar"></span><span class="lf-live-danmu-pin__body"><span class="lf-live-danmu-pin__user">@' +
          escapeHtml(pin.user || '观众') +
          '</span><span class="lf-live-danmu-pin__text">' +
          escapeHtml(pin.text || '') +
          '</span></span>' +
          (isEndedLocked()
            ? ''
            : '<button type="button" class="lf-live-danmu-pin__close" data-pin-close aria-label="取消置顶">×</button>') +
          '</div>';
      }
    }
    var box = document.getElementById('broadcastDanmu');
    if (!box) return;
    var msgs = (metricsOf(sess.id).chatMessages || []).filter(function (m) {
      return !m.isSys && !m.blocked;
    });
    var last = msgs.slice(-8);
    box.innerHTML = last
      .map(function (m) {
        return (
          '<div class="lf-live-danmu-overlay__item" data-chat-id="' +
          escapeHtml(m.id) +
          '"><b>' +
          escapeHtml(m.user) +
          '</b> ' +
          escapeHtml(m.text) +
          '</div>'
        );
      })
      .join('');
  }

  function productBadges(p) {
    var html = '';
    if (p.explaining) html += '<span class="lf-live-badge lf-live-badge--live">讲解中</span>';
    else if (p.pinned) html += '<span class="lf-live-badge lf-live-badge--ok">置顶</span>';
    if (p.saleMode === 'preview') html += '<span class="lf-live-badge lf-live-badge--muted">预告</span>';
    else if (p.liveStatus === 'sold_out') html += '<span class="lf-live-badge lf-live-badge--danger">售罄</span>';
    else html += '<span class="lf-live-badge lf-live-badge--warn">上架</span>';
    return html;
  }

  function renderCart() {
    var box = document.getElementById('controlCartList');
    if (!box) return;
    updateCartCount();
    var list = cartProducts();
    var total = allCartProducts().length;
    var allEl = document.getElementById('cartSelectAll');
    if (allEl) {
      allEl.checked = total > 0 && list.every(function (p) {
        return selectedCart[p.id];
      });
    }
    if (!total) {
      box.innerHTML = '<div class="lf-live-empty-inline">暂无直播商品，请从直播排品中添加</div>';
      return;
    }
    if (!list.length) {
      box.innerHTML = '<div class="lf-live-empty-inline">没有符合条件的直播商品</div>';
      return;
    }
    box.innerHTML = list
      .map(function (p) {
        var skus = skusOf(p);
        var expanded = !!expandedIds[p.id];
        var selling = p.saleMode !== 'preview';
        var previewMode = p.previewPriceMode || 'sale';
        var skuRows = skus
          .map(function (sku) {
            var on = sku.enabled !== false;
            return (
              '<div class="lf-live-cart-sku" data-sku-id="' +
              escapeHtml(sku.id) +
              '">' +
              '<span class="lf-live-cart-sku__spec">' +
              escapeHtml(sku.specName || '默认规格') +
              '</span>' +
              '<span class="lf-live-cart-sku__price">' +
              escapeHtml(formatMoney(sku.price)) +
              '</span>' +
              '<label class="lf-live-cart-sku__stock">库存 ' +
              '<input class="erp-input" type="number" min="0" data-stock-input value="' +
              escapeHtml(String(displayStock(p, sku))) +
              '"></label>' +
              '<button type="button" class="erp-btn erp-btn--primary" data-act="sku-save">保存</button>' +
              '<button type="button" class="erp-btn" data-act="sku-toggle">' +
              (on ? '下架 SKU' : '上架 SKU') +
              '</button></div>'
            );
          })
          .join('');
        var skuBlock = expanded ? '<div class="lf-live-cart-skus">' + skuRows + '</div>' : '';
        var previewRow = selling
          ? ''
          : '<div class="lf-live-preview-price">预告价格展示 ' +
            '<button type="button" data-act="preview-price" data-mode="question"' +
            (previewMode === 'question' ? ' class="is-mode-on"' : '') +
            '>问号</button>' +
            '<button type="button" data-act="preview-price" data-mode="market"' +
            (previewMode === 'market' ? ' class="is-mode-on"' : '') +
            '>划线价</button>' +
            '<button type="button" data-act="preview-price" data-mode="sale"' +
            (previewMode === 'sale' ? ' class="is-mode-on"' : '') +
            '>售价</button></div>';
        var extraHint = '';
        if (p.removeAt) extraHint += '<div class="lf-live-card-hint">将于 ' + escapeHtml(formatClock(p.removeAt)) + ' 下架</div>';
        return (
          '<div class="lf-live-cart-card" data-id="' +
          escapeHtml(p.id) +
          '">' +
          '<div class="lf-live-cart-card__main">' +
          '<input type="checkbox" class="lf-live-card-check" data-act="select"' +
          (selectedCart[p.id] ? ' checked' : '') +
          '>' +
          thumbHtml(p, p.cartSort || 1) +
          '<div class="lf-live-cart-card__info">' +
          '<div class="lf-live-cart-card__name">' +
          escapeHtml(p.name) +
          ' ' +
          productBadges(p) +
          '</div>' +
          '<div class="lf-live-cart-card__code">' +
          escapeHtml(p.sku || '—') +
          '</div>' +
          priceBlock(p) +
          '</div></div>' +
          previewRow +
          extraHint +
          '<div class="lf-live-cart-card__ops">' +
          '<span class="lf-live-ops-group">' +
          '<button type="button" data-act="sale-mode" data-mode="selling"' +
          (selling ? ' class="is-mode-on"' : '') +
          '>上架</button>' +
          '<button type="button" data-act="sale-mode" data-mode="preview"' +
          (selling ? '' : ' class="is-mode-on"') +
          '>预告</button>' +
          '<button type="button" data-act="remove">下架</button></span>' +
          '<button type="button" data-act="pin">' +
          (p.pinned ? '取消置顶' : '置顶') +
          '</button>' +
          '<button type="button" data-act="explain">' +
          (p.explaining ? '取消讲解' : '讲解') +
          '</button>' +
          '<span class="lf-live-sort-group">' +
          '<span class="lf-live-sort-group__label">排序</span>' +
          '<input class="lf-live-seq-input" data-seq-input type="number" min="1" max="' +
          total +
          '" value="' +
          escapeHtml(String(p.cartSort || 1)) +
          '" title="输入序号后点击保存">' +
          '<button type="button" class="is-primary" data-act="seq-save">保存</button></span>' +
          '<button type="button" data-act="expand">' +
          (expanded ? '收起SKU' : 'SKU管理(' + skus.length + ')') +
          '</button>' +
          '</div>' +
          skuBlock +
          '</div>'
        );
      })
      .join('');
  }

  function renderSched() {
    var box = document.getElementById('controlSchedList');
    if (!box) return;
    var list = schedProducts();
    var countEl = document.getElementById('controlSchedCount');
    if (countEl) countEl.textContent = '共 ' + list.length + ' 件';
    var allEl = document.getElementById('schedSelectAll');
    if (allEl) {
      allEl.checked = list.length > 0 && list.every(function (p) {
        return selectedSched[p.id];
      });
    }
    if (!list.length) {
      box.innerHTML = '<div class="lf-live-empty-inline">暂无待添加的上架排品</div>';
      return;
    }
    box.innerHTML = list
      .map(function (p) {
        var pending = '';
        if (p.pendingAdd && p.pendingAdd.type === 'on_live_start') {
          pending =
            '<div class="lf-live-card-hint">开播后自动添加（' +
            escapeHtml(saleModeLabel(p.pendingAdd.saleMode)) +
            '）</div>';
        } else if (p.pendingAdd && p.pendingAdd.at) {
          pending =
            '<div class="lf-live-card-hint">将于 ' +
            escapeHtml(formatClock(p.pendingAdd.at)) +
            ' 添加（' +
            escapeHtml(saleModeLabel(p.pendingAdd.saleMode)) +
            '）</div>';
        }
        return (
          '<div class="lf-live-cart-card" data-id="' +
          escapeHtml(p.id) +
          '">' +
          '<div class="lf-live-cart-card__main">' +
          '<input type="checkbox" class="lf-live-card-check" data-act="select"' +
          (selectedSched[p.id] ? ' checked' : '') +
          '>' +
          thumbHtml(p) +
          '<div class="lf-live-cart-card__info">' +
          '<div class="lf-live-cart-card__name">' +
          escapeHtml(p.name) +
          '</div>' +
          '<div class="lf-live-cart-card__code">' +
          escapeHtml(p.sku || '—') +
          (p.category ? ' · ' + escapeHtml(p.category) : '') +
          '</div>' +
          priceBlock(p) +
          '</div>' +
          '<button type="button" class="lf-live-sched-add is-primary" data-act="add">添加到直播商品</button>' +
          '</div>' +
          pending +
          '</div>'
        );
      })
      .join('');
  }

  function renderProductPanes() {
    var cartPane = document.getElementById('controlCartPane');
    var schedPane = document.getElementById('controlSchedPane');
    if (cartPane) cartPane.hidden = productTab !== 'cart';
    if (schedPane) schedPane.hidden = productTab !== 'sched';
    setActiveTab('controlProductSubTabs', 'data-product-tab', productTab);
    updateCartCount();
    if (productTab === 'cart') renderCart();
    else renderSched();
  }

  function renderMainTabs() {
    var productPane = document.getElementById('controlTabProduct');
    if (productPane) productPane.hidden = false;
    setActiveTab('controlMainTabs', 'data-main-tab', mainTab);
  }

  function welfareEmptyHtml(text) {
    return (
      '<div class="lf-welfare-empty">' +
      WELFARE_EMPTY_SVG +
      '<div>' +
      escapeHtml(text) +
      '</div></div>'
    );
  }

  function welfarePlans() {
    var meta = WELFARE_META[welfareUi.kind] || WELFARE_META.coupon;
    var sess = findSession(sessionId);
    return ((sess && sess.templates) || []).filter(function (t) {
      return t.type === meta.type;
    });
  }

  function welfarePlanIdOf(t) {
    return (t && (t.planId || t.id)) || '';
  }

  function selectedWelfarePlan() {
    var list = welfarePlans();
    var i;
    for (i = 0; i < list.length; i++) {
      if (welfarePlanIdOf(list[i]) === welfareUi.planId) return list[i];
    }
    return list[0] || null;
  }

  function findTemplateByPlanId(planId) {
    var sess = findSession(sessionId);
    var list = (sess && sess.templates) || [];
    var i;
    for (i = 0; i < list.length; i++) {
      if (welfarePlanIdOf(list[i]) === planId) return list[i];
    }
    return null;
  }

  function welfareWindowsOfPlan(planId) {
    if (!planId || !Demo.welfareWindowsOf) return [];
    return Demo.welfareWindowsOf(planId);
  }

  function collectKindWindowRows() {
    var plans = welfarePlans();
    var rows = [];
    var i;
    var j;
    var list;
    for (i = 0; i < plans.length; i++) {
      list = welfareWindowsOfPlan(welfarePlanIdOf(plans[i])) || [];
      for (j = 0; j < list.length; j++) {
        rows.push({ window: list[j], plan: plans[i] });
      }
    }
    rows.sort(function (a, b) {
      var ta = parseSessionTs(a.window && a.window.startedAt);
      var tb = parseSessionTs(b.window && b.window.startedAt);
      var na = isFinite(ta) ? ta : 0;
      var nb = isFinite(tb) ? tb : 0;
      if (nb !== na) return nb - na;
      return String((b.window && b.window.id) || '').localeCompare(String((a.window && a.window.id) || ''));
    });
    return rows;
  }

  function findWelfareWindowById(windowId) {
    if (!windowId) return null;
    var rows = collectKindWindowRows();
    var i;
    for (i = 0; i < rows.length; i++) {
      if (String(rows[i].window.id) === String(windowId)) return rows[i];
    }
    return null;
  }

  function couponPlanUnfinished(t) {
    if (!t || t.released) return false;
    return planHasActiveWindow(t);
  }

  function otherUnfinishedCoupon(exceptPlanId) {
    var list = welfarePlans();
    var i;
    for (i = 0; i < list.length; i++) {
      if (exceptPlanId && welfarePlanIdOf(list[i]) === exceptPlanId) continue;
      if (couponPlanUnfinished(list[i])) return list[i];
    }
    return null;
  }

  function couponNextBlockedReason(plan) {
    if (!plan) return '';
    var other = otherUnfinishedCoupon(welfarePlanIdOf(plan));
    if (!other) return '';
    var name = liveCouponFields(other).name || '优惠券活动';
    return '前一个券活动「' + name + '」尚未发放完毕，不能发放下一个券活动';
  }

  function couponIssueBlockedReason(plan) {
    if (!plan) return '';
    if (planHasActiveWindow(plan)) {
      return '当前券活动正在发放，结束后或停止本轮后才能继续发放';
    }
    return couponNextBlockedReason(plan);
  }

  function windowProgress(w) {
    if (!w) return 0;
    if (w.status === 'CLOSED') return 100;
    var dur = Number(w.durationSec);
    var start = parseSessionTs(w.startedAt);
    if (!isFinite(dur) || dur <= 0 || !isFinite(start)) return 0;
    return Math.min(100, Math.max(0, Math.round(((Date.now() - start) / 1000 / dur) * 100)));
  }

  function formatWelfareTime(str) {
    if (!str) return '';
    return String(str).replace('T', ' ').slice(0, 19);
  }

  function couponThresholdText(plan) {
    var live = liveCouponFields(plan);
    var den = live.denomination != null ? live.denomination : 0;
    if (live.threshold) return '满 ' + live.threshold + ' 减 ' + den;
    return '无门槛减 ' + den;
  }

  function signRewardLabel(reward) {
    if (!reward || !reward.rewardType || reward.rewardType === 'NONE') return '无奖励';
    if (reward.rewardType === 'POINTS') return (reward.pointsAmount || 0) + '积分';
    if (reward.rewardType === 'COUPON') {
      var c = reward.prizeCouponId && Demo.findCouponTemplate ? Demo.findCouponTemplate(reward.prizeCouponId) : null;
      if (!c) return '优惠券';
      var th = c.threshold != null && Number(c.threshold) > 0 ? '满' + c.threshold : '无门槛';
      return '券 ' + c.name + '（' + c.id + '）' + th + '减' + (c.denomination != null ? c.denomination : 0);
    }
    if (reward.rewardType === 'FORTUNE_BAG') {
      var b = reward.prizeBagId && Demo.findBagTemplate ? Demo.findBagTemplate(reward.prizeBagId) : null;
      if (!b) return '福袋';
      return '福袋 ' + b.name + '（' + b.id + '）';
    }
    return reward.rewardType;
  }

  function signRewardShort(reward) {
    if (!reward || !reward.rewardType || reward.rewardType === 'NONE') return '无';
    if (reward.rewardType === 'POINTS') return (reward.pointsAmount || 0) + '积分';
    if (reward.rewardType === 'COUPON') {
      var c = reward.prizeCouponId && Demo.findCouponTemplate ? Demo.findCouponTemplate(reward.prizeCouponId) : null;
      return c ? '券' + c.name : '优惠券';
    }
    if (reward.rewardType === 'FORTUNE_BAG') {
      var b = reward.prizeBagId && Demo.findBagTemplate ? Demo.findBagTemplate(reward.prizeBagId) : null;
      return b ? '福袋' + b.name : '福袋';
    }
    return '—';
  }

  function signTemplateOf(t) {
    if (!t || !t.templateId || !Demo.findSignTemplate) return null;
    return Demo.findSignTemplate(t.templateId);
  }

  function liveSignFields(t) {
    var tpl = signTemplateOf(t);
    var status = tpl ? tpl.status : '';
    var statusKey = status === 'disabled' || status === 'expired' ? status : 'enabled';
    if (t && t.interrupted) statusKey = 'interrupted';
    return {
      name: tpl ? tpl.name : '—',
      templateId: (t && t.templateId) || '—',
      status: status,
      statusLabel: t && t.interrupted ? '已中断' : tpl && Demo.signTemplateStatusLabel ? Demo.signTemplateStatusLabel(status) : '—',
      statusKey: tpl || (t && t.interrupted) ? statusKey : 'disabled',
      totalRounds: tpl ? Number(tpl.totalRounds) || 0 : 0,
      rewards: tpl ? tpl.rewards || [] : [],
      roundsUsed: t && t.roundsUsed != null ? Number(t.roundsUsed) || 0 : t && t.signIn ? Number(t.signIn.roundsUsed) || 0 : 0
    };
  }

  function signRewardRulesText(rewards) {
    return (rewards || [])
      .map(function (r, i) {
        return '第' + (i + 1) + '次 ' + signRewardLabel(r);
      })
      .join('；');
  }

  function signRewardRulesShort(rewards) {
    return (rewards || [])
      .map(function (r, i) {
        return '第' + (i + 1) + '次' + signRewardShort(r);
      })
      .join(' · ');
  }

  function taskTemplateOf(t) {
    if (!t || !t.templateId || !Demo.findTaskTemplate) return null;
    return Demo.findTaskTemplate(t.templateId);
  }

  function taskMilestoneRewardOf(m) {
    if (!m) return { rewardType: 'NONE' };
    if (m.rewardType) return m;
    return { rewardType: 'POINTS', pointsAmount: m.pointsAmount || 0 };
  }

  function taskMilestoneLabel(m) {
    return '观看满' + (m && m.threshold != null ? m.threshold : 0) + '分钟 ' + signRewardLabel(taskMilestoneRewardOf(m));
  }

  function taskMilestoneShort(m) {
    return (m && m.threshold != null ? m.threshold : 0) + '分钟' + signRewardShort(taskMilestoneRewardOf(m));
  }

  function taskRewardRulesText(milestones) {
    return (milestones || []).map(taskMilestoneLabel).join('；');
  }

  function taskRewardRulesShort(milestones) {
    return (milestones || []).map(taskMilestoneShort).join(' · ');
  }

  function liveTaskFields(t) {
    var tpl = taskTemplateOf(t);
    var status = tpl ? tpl.status : '';
    var statusKey = status === 'disabled' || status === 'expired' ? status : 'enabled';
    if (t && t.interrupted) statusKey = 'interrupted';
    else if (t && t.delivered && t.activeWindowId) statusKey = 'progress';
    var milestones = tpl ? tpl.milestones || [] : t && t.task ? t.task.milestones || [] : [];
    var delivered = !!(t && t.delivered);
    var active = !!(t && t.activeWindowId);
    var phaseLabel = '未发放';
    if (t && t.interrupted) phaseLabel = '已中断';
    else if (delivered && active) phaseLabel = '进行中';
    else if (delivered) phaseLabel = '已结束';
    return {
      name: tpl ? tpl.name : t && t.name ? t.name : '—',
      templateId: (t && t.templateId) || '—',
      status: status,
      statusLabel: t && t.interrupted ? '已中断' : tpl && Demo.taskTemplateStatusLabel ? Demo.taskTemplateStatusLabel(status) : '—',
      statusKey: tpl || (t && t.interrupted) ? statusKey : 'disabled',
      milestones: milestones,
      delivered: delivered,
      active: active,
      phaseLabel: phaseLabel
    };
  }

  function taskHasActiveWindow(p) {
    if (!p) return false;
    if (p.activeWindowId) return true;
    var list = welfareWindowsOfPlan(welfarePlanIdOf(p));
    var i;
    for (i = 0; i < list.length; i++) {
      if (list[i].status === 'ACTIVE') return true;
    }
    return false;
  }

  function publishActiveWatchReward(plan) {
    if (!Demo.publishWatchRewardIssue) return;
    var sess = findSession(sessionId);
    if (!plan || !sess) {
      Demo.publishWatchRewardIssue(null);
      return;
    }
    var live = liveTaskFields(plan);
    Demo.publishWatchRewardIssue({
      sessionId: sess.id,
      planId: welfarePlanIdOf(plan),
      templateId: live.templateId,
      status: plan.interrupted ? 'interrupted' : plan.delivered && taskHasActiveWindow(plan) ? 'active' : plan.delivered ? 'ended' : 'none',
      startedAt: nowWelfareTs(),
      name: live.name,
      milestones: live.milestones
    });
  }

  function nextRoundIndex(list) {
    var max = -1;
    (list || []).forEach(function (w) {
      if (w.roundIndex > max) max = w.roundIndex;
    });
    return max + 1;
  }

  function couponRemain(t) {
    if (!t) return 0;
    var total = Number(t.quotaTotal != null ? t.quotaTotal : t.stock) || 0;
    var issued = Number(t.issuedQty) || 0;
    return Math.max(0, total - issued);
  }

  function couponRoundCount(t) {
    if (!t) return 0;
    if (t.roundCount != null) return Number(t.roundCount) || 0;
    return welfareWindowsOfPlan(welfarePlanIdOf(t)).length;
  }

  function planHasActiveWindow(t) {
    if (!t) return false;
    var list = welfareWindowsOfPlan(welfarePlanIdOf(t)) || [];
    var i;
    var active = null;
    for (i = 0; i < list.length; i++) {
      if (list[i] && list[i].status === 'ACTIVE') {
        active = list[i];
        break;
      }
    }
    if (t.activeWindowId && (!active || String(t.activeWindowId) !== String(active.id))) {
      t.activeWindowId = active ? active.id : null;
    }
    return !!active;
  }

  function couponLockedReason(t) {
    if (!t) return '请先选择优惠券活动';
    var live = liveCouponFields(t);
    if (live.status === 'disabled') return '券模板已禁用，无法选择发放';
    if (live.status === 'expired') return '券模板已过期，无法选择发放';
    if (couponRemain(t) < 1) return '该券已发完，无法选择发放';
    return '';
  }

  function couponFaceTitle(t) {
    var live = liveCouponFields(t);
    var th = live.threshold != null && Number(live.threshold) > 0 ? '满' + live.threshold : '无门槛';
    return th + '减' + (live.denomination != null ? live.denomination : 0);
  }

  function couponRoundsLabel(t) {
    var n = couponRoundCount(t);
    return n < 1 ? '暂未发放' : '已发' + n + '轮';
  }

  function recordRoundNo(w) {
    if (!w) return 1;
    if (w.roundNo != null && w.roundNo !== '') {
      var n = Number(w.roundNo);
      if (isFinite(n) && n > 0) return n;
    }
    return (Number(w.roundIndex) || 0) + 1;
  }

  function recordJoinHtml(w) {
    var people = w && w.participantCount != null ? w.participantCount : 0;
    var times = w && w.participateTimes != null ? w.participateTimes : people;
    return (
      '<div class="record-card__metric"><div class="record-card__metric-label">参与人数</div><div class="record-card__metric-value">' +
      escapeHtml(String(people)) +
      ' 人</div></div>' +
      '<div class="record-card__metric"><div class="record-card__metric-label">参与次数</div><div class="record-card__metric-value">' +
      escapeHtml(String(times)) +
      ' 次</div></div>'
    );
  }

  function recordTitleHtml(seq, name) {
    return (
      '<span class="record-card__no">' +
      escapeHtml(String(seq)) +
      '</span><span class="record-card__name">' +
      escapeHtml(name || '—') +
      '</span>'
    );
  }

  function couponTemplateOf(t) {
    if (!t || !t.templateId || !Demo.findCouponTemplate) return null;
    return Demo.findCouponTemplate(t.templateId);
  }

  function liveCouponFields(t) {
    var tpl = couponTemplateOf(t);
    var status = tpl ? tpl.status : '';
    var statusKey = status === 'disabled' || status === 'expired' ? status : 'enabled';
    return {
      name: tpl ? tpl.name : '—',
      templateId: (t && t.templateId) || '—',
      threshold: tpl ? tpl.threshold : null,
      denomination: tpl ? tpl.denomination : 0,
      status: status,
      statusLabel: tpl && Demo.couponTemplateStatusLabel ? Demo.couponTemplateStatusLabel(status) : '—',
      statusKey: tpl ? statusKey : 'disabled'
    };
  }

  function couponStatusText(t) {
    return liveCouponFields(t).statusLabel;
  }

  function couponStatusKey(t) {
    return liveCouponFields(t).statusKey;
  }

  function ensureCouponStockReleased(sess) {
    if (!sess || sess.status !== 'ended') return false;
    var changed = false;
    (sess.templates || []).forEach(function (t) {
      if (t.type !== 'COUPON' || t.released) return;
      var remain = couponRemain(t);
      t.released = true;
      t.releasedQty = remain;
      if (remain > 0 && Demo.releaseCouponStock) Demo.releaseCouponStock(t.templateId, remain);
      changed = true;
    });
    return changed;
  }

  function ensureBagStockReleased(sess) {
    if (!sess || sess.status !== 'ended') return false;
    var changed = false;
    (sess.templates || []).forEach(function (t) {
      if (t.type !== 'FORTUNE_BAG' || t.released) return;
      var remain = couponRemain(t);
      t.released = true;
      t.releasedQty = remain;
      if (remain > 0 && Demo.releaseBagStock) Demo.releaseBagStock(t.templateId, remain);
      changed = true;
    });
    return changed;
  }

  function releaseEndedWelfareStock(sess) {
    var couponRel = ensureCouponStockReleased(sess);
    var bagRel = ensureBagStockReleased(sess);
    return { couponRel: couponRel, bagRel: bagRel, any: couponRel || bagRel };
  }

  function endedStockToast(prefix, rel) {
    rel = rel || {};
    if (rel.couponRel && rel.bagRel) return prefix + '，剩余发券、福袋库存已释放回模板';
    if (rel.couponRel) return prefix + '，剩余发券库存已释放回券模板';
    if (rel.bagRel) return prefix + '，剩余福袋库存已释放回福袋模板';
    return prefix;
  }

  function bagWinRuleOf(sess) {
    sess = sess || findSession(sessionId);
    if (!sess) return 'session';
    if (sess.bagWinRule === 'template' || sess.bagWinRule === 'none' || sess.bagWinRule === 'session') {
      return sess.bagWinRule;
    }
    if (sess.bagSettings) {
      if (sess.bagSettings.winOncePerSession) return 'session';
      if (sess.bagSettings.winOncePerTemplate) return 'template';
      return 'none';
    }
    return 'session';
  }

  function saveBagWinRule() {
    if (isEndedLocked()) return toastEndedLock('deliver');
    var sess = findSession(sessionId);
    if (!sess) return;
    var val = welfareUi.bagWinDraft || 'session';
    if (val !== 'template' && val !== 'none') val = 'session';
    sess.bagWinRule = val;
    toast('福袋中奖设置已保存');
  }

  function bagTemplateOf(t) {
    if (!t || !t.templateId || !Demo.findBagTemplate) return null;
    return Demo.findBagTemplate(t.templateId);
  }

  function bagPrizeThumbHtml(name, img) {
    var n = String(name || '福');
    if (img) {
      return '<span class="bag-prize__thumb"><img src="' + escapeHtml(img) + '" alt=""></span>';
    }
    return '<span class="bag-prize__thumb">' + escapeHtml(n.charAt(0)) + '</span>';
  }

  function bagPrizeHtml(tpl) {
    if (!tpl) return '—';
    var typeLabel = Demo.bagPrizeTypeLabel ? Demo.bagPrizeTypeLabel(tpl.prizeType) : '—';
    var typeTag = '<em class="bag-prize__type">' + escapeHtml(typeLabel) + '</em>';
    if (tpl.prizeType === 'COUPON') {
      var c = Demo.findCouponTemplate ? Demo.findCouponTemplate(tpl.prizeCouponId) : null;
      if (!c) {
        return '<div class="bag-prize">' + typeTag + '<span>券模板 ' + escapeHtml(tpl.prizeCouponId || '—') + '</span></div>';
      }
      var th = c.threshold != null && Number(c.threshold) > 0 ? '满 ' + c.threshold : '无门槛';
      return (
        '<div class="bag-prize">' +
        typeTag +
        '<span class="bag-prize__name">' +
        escapeHtml(c.name) +
        '</span><span>ID ' +
        escapeHtml(c.id) +
        '</span><span>' +
        escapeHtml(th) +
        '</span><span>减 ' +
        escapeHtml(String(c.denomination != null ? c.denomination : 0)) +
        '</span></div>'
      );
    }
    if (tpl.prizeType === 'POINTS') {
      return (
        '<div class="bag-prize">' +
        typeTag +
        '<span class="bag-prize__name">' +
        escapeHtml(String(tpl.pointsAmount != null ? tpl.pointsAmount : 0)) +
        ' 积分</span></div>'
      );
    }
    if (tpl.prizeType === 'PRODUCT') {
      return (
        '<div class="bag-prize bag-prize--product">' +
        bagPrizeThumbHtml(tpl.productName, tpl.productImg) +
        '<div><div class="bag-prize__name">' +
        escapeHtml(tpl.productName || '—') +
        '</div><div class="bag-prize__spec">' +
        escapeHtml(tpl.productSpec || '') +
        '</div></div></div>'
      );
    }
    return '<div class="bag-prize">' + typeTag + '</div>';
  }

  function bagPrizeTitle(tpl) {
    if (!tpl) return '—';
    if (tpl.prizeType === 'COUPON') {
      var c = Demo.findCouponTemplate ? Demo.findCouponTemplate(tpl.prizeCouponId) : null;
      return c ? c.name : '优惠券';
    }
    if (tpl.prizeType === 'POINTS') return (tpl.pointsAmount != null ? tpl.pointsAmount : 0) + ' 积分';
    if (tpl.prizeType === 'PRODUCT') return tpl.productName || '商品';
    return '—';
  }

  function liveBagFields(t) {
    var tpl = bagTemplateOf(t);
    var status = tpl ? tpl.status : '';
    var statusKey = status === 'disabled' || status === 'expired' ? status : 'enabled';
    return {
      name: tpl ? tpl.name : '—',
      templateId: (t && t.templateId) || '—',
      status: status,
      statusLabel: tpl && Demo.bagTemplateStatusLabel ? Demo.bagTemplateStatusLabel(status) : '—',
      statusKey: tpl ? statusKey : 'disabled',
      prizeType: tpl ? tpl.prizeType : '',
      prizeHtml: bagPrizeHtml(tpl),
      prizeTitle: bagPrizeTitle(tpl)
    };
  }

  function bagPrizeSummary(tpl) {
    if (!tpl) return '—';
    if (tpl.prizeType === 'COUPON') {
      var c = Demo.findCouponTemplate ? Demo.findCouponTemplate(tpl.prizeCouponId) : null;
      if (!c) return '券 ' + (tpl.prizeCouponId || '');
      var th = c.threshold != null && Number(c.threshold) > 0 ? '满' + c.threshold : '无门槛';
      return c.name + '（' + c.id + '）' + th + ' 减' + (c.denomination != null ? c.denomination : 0);
    }
    if (tpl.prizeType === 'POINTS') return (tpl.pointsAmount != null ? tpl.pointsAmount : 0) + ' 积分';
    if (tpl.prizeType === 'PRODUCT') {
      return (tpl.productName || '商品') + (tpl.productSpec ? ' / ' + tpl.productSpec : '');
    }
    return '—';
  }

  function requiredPositiveInt(val) {
    var s = String(val == null ? '' : val).trim();
    if (!s) return { ok: false, empty: true, value: 0 };
    var n = Math.floor(Number(s));
    if (!isFinite(n) || n < 1) return { ok: false, empty: false, value: 0 };
    return { ok: true, empty: false, value: n };
  }

  function welfareMissingRequiredLabel() {
    var kind = welfareUi.kind;
    if (kind === 'coupon') {
      if (!requiredPositiveInt(welfareUi.duration).ok) return '持续时间';
      if (!requiredPositiveInt(welfareUi.quantity).ok) return '发放数量';
    } else if (kind === 'bag') {
      if (!requiredPositiveInt(welfareUi.duration).ok) return '福袋持续时间';
      if (!requiredPositiveInt(welfareUi.winnerCount).ok) return '中奖人数';
      if (welfareUi.drawType === 'ASSIGN' && !(welfareUi.assignUsers || []).length) return '指定中奖用户';
    } else if (kind === 'sign') {
      if (!requiredPositiveInt(welfareUi.duration).ok) return '持续时间';
    }
    return '';
  }

  function toastFillRequired() {
    var label = welfareMissingRequiredLabel();
    if (!label) return false;
    toast('请填写' + label, 'warning');
    return true;
  }

  function maskPhone(phone) {
    var s = String(phone || '');
    if (s.length < 7) return s;
    if (s.indexOf('*') >= 0) return s;
    return s.slice(0, 3) + '****' + s.slice(-4);
  }

  function maskNick(name) {
    var s = String(name || '');
    if (s.length <= 1) return s + '**';
    return s.charAt(0) + '**' + (s.length > 2 ? s.charAt(s.length - 1) : '');
  }

  var BAG_VIRTUAL_SUR = ['林', '周', '吴', '郑', '冯', '陈', '黄', '赵', '钱', '孙', '王', '李'];
  var BAG_VIRTUAL_GIVEN = ['小雨', '阿宁', '果果', '晚风', '星河', '北北', '安安', '小川', '乐乐', '清清', '柚子', '米粒', '小鱼', '阿白', '暖暖'];
  var BAG_DEFAULT_AVATAR =
    '<svg class="record-card__winner-face" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="#dcdfe6"/><circle cx="16" cy="12" r="5" fill="#fff"/><path d="M6 27c1.6-6 5.2-9 10-9s8.4 3 10 9" fill="#fff"/></svg>';

  function shuffleCopy(list) {
    var arr = (list || []).slice();
    var i;
    var j;
    var t;
    for (i = arr.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  }

  function bagAudiencePool() {
    var seen = {};
    var out = [];
    function pushUser(userId, nickname) {
      var id = String(userId || '').trim();
      var name = String(nickname || '').trim();
      if (!id && !name) return;
      var key = id || name;
      if (seen[key]) return;
      seen[key] = true;
      out.push({ userId: id || 'u-' + key, nickname: name || '观众' });
    }
    (Demo.liveAudience || []).forEach(function (u) {
      pushUser(u.userId, u.nickname);
    });
    var m = sessionId ? metricsOf(sessionId) : null;
    ((m && m.watchViewers) || []).forEach(function (v) {
      pushUser(v.userId, v.nickname);
    });
    return out;
  }

  function sessionBagPlans() {
    var sess = findSession(sessionId);
    return ((sess && sess.templates) || []).filter(function (t) {
      return t && t.type === 'FORTUNE_BAG';
    });
  }

  function bagPastWinnerIdMap(plan, exceptWindowId) {
    var rule = bagWinRuleOf();
    var map = {};
    if (rule === 'none') return map;
    var tplId = plan && plan.templateId;
    sessionBagPlans().forEach(function (p) {
      if (rule === 'template' && String(p.templateId || '') !== String(tplId || '')) return;
      (welfareWindowsOfPlan(welfarePlanIdOf(p)) || []).forEach(function (w) {
        if (!w || String(w.id) === String(exceptWindowId)) return;
        if (w.status === 'ACTIVE') return;
        (w.rewards || []).forEach(function (r) {
          if (!r || r.virtual) return;
          if (r.userId) map[String(r.userId)] = true;
        });
      });
    });
    return map;
  }

  function nextBagVirtualName(used) {
    var i;
    var name;
    for (i = 0; i < 80; i++) {
      name =
        BAG_VIRTUAL_SUR[Math.floor(Math.random() * BAG_VIRTUAL_SUR.length)] +
        BAG_VIRTUAL_GIVEN[Math.floor(Math.random() * BAG_VIRTUAL_GIVEN.length)];
      if (!used[name]) {
        used[name] = true;
        return name;
      }
    }
    name = '观众' + String(Date.now()).slice(-4);
    used[name] = true;
    return name;
  }

  function ensureBagJoiners(w) {
    if (!w) return [];
    if (!Array.isArray(w.joinerIds)) w.joinerIds = [];
    var have = {};
    w.joinerIds.forEach(function (id) {
      have[String(id)] = true;
    });
    (w.assignedUserIds || []).forEach(function (id) {
      if (have[String(id)]) return;
      w.joinerIds.push(String(id));
      have[String(id)] = true;
    });
    w.participantCount = w.joinerIds.length;
    w.participateTimes = Math.max(Number(w.participateTimes) || 0, w.participantCount);
    w.participateTimes = w.participateTimes;
    return w.joinerIds;
  }

  function growBagJoiners(w) {
    if (!w || w.status !== 'ACTIVE') return false;
    if (!Array.isArray(w.joinerIds)) w.joinerIds = [];
    var pool = bagAudiencePool();
    var have = {};
    w.joinerIds.forEach(function (id) {
      have[String(id)] = true;
    });
    var i;
    for (i = 0; i < pool.length; i++) {
      if (have[String(pool[i].userId)]) continue;
      w.joinerIds.push(pool[i].userId);
      w.participantCount = w.joinerIds.length;
      w.participateTimes = Math.max(Number(w.participateTimes) || 0, w.participantCount);
      return true;
    }
    return false;
  }

  function growActiveBagJoiners() {
    sessionBagPlans().forEach(function (p) {
      (welfareWindowsOfPlan(welfarePlanIdOf(p)) || []).forEach(function (w) {
        if (w && w.status === 'ACTIVE') growBagJoiners(w);
      });
    });
  }

  function userByBagId(userId) {
    var id = String(userId || '');
    var found = findAudienceUser(id);
    if (found) return { userId: found.userId, nickname: found.nickname };
    var pool = bagAudiencePool();
    var i;
    for (i = 0; i < pool.length; i++) {
      if (String(pool[i].userId) === id) return pool[i];
    }
    var mem = findAssignMember(id);
    if (mem) return { userId: mem.userId, nickname: mem.nickname };
    return { userId: id, nickname: '观众' };
  }

  function settleBagRound(plan, w) {
    if (!w || w.winnersSettled) return;
    w.winnersSettled = true;
    var y = Number(w.winnerTotal != null ? w.winnerTotal : w.winnerCount) || 0;
    var prize = (plan ? liveBagFields(plan).prizeTitle : '') || w.prizeTitle || '';
    ensureBagJoiners(w);
    var a = Number(w.participantCount) || (w.joinerIds || []).length;
    var blocked = bagPastWinnerIdMap(plan, w.id);
    var assignedIds = {};
    (w.assignedUserIds || []).forEach(function (id) {
      assignedIds[String(id)] = true;
    });
    var eligible = [];
    (w.joinerIds || []).forEach(function (id) {
      var sid = String(id);
      if (assignedIds[sid]) return;
      if (blocked[sid]) return;
      eligible.push(sid);
    });
    var assignedList = (w.assignedUserIds || []).map(String);
    var x = assignedList.length + eligible.length;
    var target = y <= a ? y : a;
    if (target < 0) target = 0;
    var virtualNeed = Math.max(0, target - x);
    var takeReal = Math.max(0, target - virtualNeed);
    var rewards = [];
    var usedNames = {};
    function pushReal(userId) {
      if (rewards.length >= takeReal) return;
      var u = userByBagId(userId);
      var name = u.nickname || '观众';
      usedNames[name] = true;
      rewards.push({
        userId: u.userId,
        nickname: name,
        nickMasked: maskNick(name),
        nickMasked: maskNick(name),
        prizeTitle: prize,
        prizeTitle: prize,
        virtual: false
      });
    }
    assignedList.forEach(pushReal);
    shuffleCopy(eligible).forEach(pushReal);
    var n;
    for (n = 0; n < virtualNeed; n++) {
      var vn = nextBagVirtualName(usedNames);
      rewards.push({
        userId: 'virtual-' + Date.now() + '-' + n,
        nickname: vn,
        nickMasked: maskNick(vn),
        nickMasked: maskNick(vn),
        prizeTitle: prize,
        prizeTitle: prize,
        virtual: true
      });
    }
    w.rewards = rewards;
    w.winnerCount = rewards.length;
    w.eligibleCount = x;
    w.virtualFillCount = virtualNeed;
  }

  function findAudienceUser(userId) {
    var list = Demo.liveAudience || [];
    var i;
    for (i = 0; i < list.length; i++) {
      if (String(list[i].userId) === String(userId)) return list[i];
    }
    return null;
  }

  function findAssignMember(userId) {
    if (Demo.findMember360) {
      var found = Demo.findMember360(userId);
      if (found) return found;
    }
    var list = member360List();
    var i;
    for (i = 0; i < list.length; i++) {
      if (String(list[i].userId) === String(userId)) return list[i];
    }
    return findAudienceUser(userId);
  }

  function clearPlanActiveWindow(planId, windowId) {
    var t = findTemplateByPlanId(planId);
    if (t && t.activeWindowId && (!windowId || t.activeWindowId === windowId)) {
      t.activeWindowId = null;
    }
  }

  function expireWelfareWindows() {
    var map = Demo.welfareWindows || {};
    var now = Date.now();
    var changed = false;
    Object.keys(map).forEach(function (planId) {
      (map[planId] || []).forEach(function (w) {
        if (w.status !== 'ACTIVE') return;
        var end = parseSessionTs(w.endedAt);
        if (isFinite(end) && now >= end) {
          var plan = findTemplateByPlanId(planId);
          var kind = plan && plan.type === 'FORTUNE_BAG' ? 'bag' : plan && plan.type === 'COUPON' ? 'coupon' : '';
          if (kind === 'bag') settleBagRound(plan, w);
          w.status = 'CLOSED';
          changed = true;
          rollbackWindowStock(plan, w, kind);
          clearPlanActiveWindow(planId, w.id);
        }
      });
    });
    return changed;
  }

  function startWelfareTick() {
    stopWelfareTick();
    welfareTickTimer = window.setInterval(tickWelfareProgress, 1000);
  }

  function stopWelfareTick() {
    if (welfareTickTimer) {
      window.clearInterval(welfareTickTimer);
      welfareTickTimer = null;
    }
  }

  function tickWelfareProgress() {
    growActiveBagJoiners();
    var expired = expireWelfareWindows();
    if (!welfareUi.open) return;
    if (expired) {
      renderWelfareDrawer();
      return;
    }
    var body = document.getElementById('welfareDrawerBody');
    if (!body) return;
    body.querySelectorAll('[data-window-id]').forEach(function (card) {
      var id = card.getAttribute('data-window-id');
      var found = findWelfareWindowById(id);
      var w = found ? found.window : null;
      if (!w) return;
      var pct = windowProgress(w);
      var bar = card.querySelector('.record-card__progress-bar-inner');
      var text = card.querySelector('.record-card__progress-text');
      if (bar) bar.style.width = pct + '%';
      if (text) text.textContent = '时间进度 ' + pct + '%';
    });
  }

  function closeWelfareDrawer() {
    var drawer = document.getElementById('welfareDrawer');
    if (drawer) drawer.hidden = true;
    welfareUi.open = false;
    if (mainTab !== 'product') {
      mainTab = 'product';
      renderMainTabs();
    }
  }

  function openWelfareDrawer(kind) {
    if (!WELFARE_META[kind]) return;
    var same = welfareUi.open && welfareUi.kind === kind;
    welfareUi.open = true;
    welfareUi.kind = kind;
    if (!same) {
      welfareUi.tab = 'issue';
      welfareUi.planId = '';
      welfareUi.duration = '';
      welfareUi.quantity = '';
      welfareUi.winnerCount = '';
      welfareUi.drawType = 'RANDOM';
      welfareUi.assignUsers = [];
      welfareUi.assignKeyword = '';
      welfareUi.assignSearched = false;
      welfareUi.bagWinDraft = bagWinRuleOf();
    }
    var plans = welfarePlans();
    if (!welfareUi.planId && plans[0]) welfareUi.planId = welfarePlanIdOf(plans[0]);
    var drawer = document.getElementById('welfareDrawer');
    if (drawer) drawer.hidden = false;
    renderWelfareDrawer();
    startWelfareTick();
  }

  function welfarePrimaryState(plan, plans) {
    var ended = isEndedLocked();
    var kind = welfareUi.kind;
    var tip = '';
    var disabled = ended || !plan;
    var label = (WELFARE_META[kind] || {}).primary || '立即发放';
    var show = true;
    if (kind === 'coupon') {
      show = !!plans.length;
      if (plan && plan.released) {
        disabled = true;
        tip = '直播已结束，剩余库存已释放，不能再次发放';
      } else if (plan && couponLockedReason(plan)) {
        disabled = true;
        tip = couponLockedReason(plan);
      } else if (plan && couponIssueBlockedReason(plan)) {
        disabled = true;
        tip = couponIssueBlockedReason(plan);
      } else if (plan) {
        var couponQty = requiredPositiveInt(welfareUi.quantity);
        if (couponQty.ok && couponQty.value > couponRemain(plan)) {
          disabled = true;
          tip = '本活动剩余发券库存不足（剩余 ' + couponRemain(plan) + ' 张）';
        }
      }
    } else if (kind === 'bag') {
      show = !!plans.length;
      if (plan && plan.released) {
        disabled = true;
        tip = '直播已结束，剩余库存已释放，不能再次发放';
      } else if (plan && planHasActiveWindow(plan)) {
        tip = '上一轮福袋进行中，结束后可发放下一轮';
        disabled = true;
      } else if (plan && couponRemain(plan) < 1) {
        disabled = true;
        tip = '本活动福袋库存已用完';
      } else if (plan) {
        var bagWin = requiredPositiveInt(welfareUi.winnerCount);
        if (bagWin.ok && bagWin.value > couponRemain(plan)) {
          disabled = true;
          tip = '本活动剩余福袋库存不足（剩余 ' + couponRemain(plan) + '）';
        } else if (welfareUi.drawType === 'ASSIGN' && bagWin.ok) {
          var picked = (welfareUi.assignUsers || []).length;
          if (picked > bagWin.value) {
            disabled = true;
            tip = '指定中奖用户数量不得大于本轮中奖人数';
          }
        }
      } else {
        disabled = true;
      }
    } else if (kind === 'sign') {
      show = !!plans.length;
      var liveSign = plan ? liveSignFields(plan) : null;
      var used = liveSign ? liveSign.roundsUsed : 0;
      var total = liveSign ? liveSign.totalRounds : 0;
      if (plan && plan.interrupted) {
        disabled = true;
        tip = '该签到活动已中断，不能再次发放';
      } else if (plan && plan.activeWindowId) {
        tip = '上一轮签到进行中，结束后可发放下一轮';
        disabled = true;
      } else if (plan && total > 0 && used >= total) {
        disabled = true;
        tip = '已完成全部轮次发放';
      } else if (!plan) {
        disabled = true;
      }
    } else if (kind === 'task') {
      show = !!plans.length;
      var liveTask = plan ? liveTaskFields(plan) : null;
      if (plan && plan.interrupted) {
        disabled = true;
        tip = '该观看奖励活动已中断，不能再次发放';
      } else if (plan && plan.delivered) {
        disabled = true;
        label = liveTask && liveTask.active ? '进行中' : '本活动已结束';
        tip = liveTask && liveTask.active ? '本活动进行中，C 端正在统计观看时长' : '本活动已结束，不能再次发放';
      } else if (plan) {
        label = '立即发放';
      } else {
        disabled = true;
      }
    }
    if (ended) disabled = true;
    return { show: show, disabled: disabled, tip: tip, label: label };
  }

  function renderWelfareDrawer() {
    expireWelfareWindows();
    var meta = WELFARE_META[welfareUi.kind] || WELFARE_META.coupon;
    var title = document.getElementById('welfareDrawerTitle');
    if (title) title.textContent = meta.title;
    var panel = document.getElementById('welfareDrawerPanel');
    if (panel) {
      panel.classList.remove('is-bag', 'is-sign', 'is-task');
      if (meta.panelClass) panel.classList.add(meta.panelClass);
    }
    var tabs = document.getElementById('welfareDrawerTabs');
    if (tabs) {
      tabs.innerHTML =
        '<button type="button" data-welfare-tab="issue"' +
        (welfareUi.tab === 'issue' ? ' class="is-active"' : '') +
        '>' +
        escapeHtml(meta.issueTab) +
        '</button>' +
        '<button type="button" data-welfare-tab="record"' +
        (welfareUi.tab === 'record' ? ' class="is-active"' : '') +
        '>' +
        escapeHtml(meta.recordTab) +
        '</button>';
    }
    var plans = welfarePlans();
    if (!welfareUi.planId && plans[0]) welfareUi.planId = welfarePlanIdOf(plans[0]);
    var plan = selectedWelfarePlan();
    var body = document.getElementById('welfareDrawerBody');
    if (body) {
      body.innerHTML =
        welfareUi.tab === 'record' ? renderWelfareRecord(meta, plan) : renderWelfareIssue(meta, plans, plan);
    }
    applyWelfarePrimary();
    syncEndedLock();
  }

  function applyWelfarePrimary() {
    var plans = welfarePlans();
    var plan = selectedWelfarePlan();
    var primaryState = welfarePrimaryState(plan, plans);
    var wrap = document.getElementById('welfarePrimaryWrap');
    var primary = document.getElementById('welfareDrawerPrimary');
    if (wrap) {
      wrap.hidden = !primaryState.show;
      if (primaryState.tip) wrap.setAttribute('data-tip', primaryState.tip);
      else wrap.removeAttribute('data-tip');
    }
    if (primary) {
      primary.textContent = primaryState.label;
      primary.disabled = primaryState.disabled;
    }
  }

  function renderWelfareIssue(meta, plans, plan) {
    var kind = welfareUi.kind;
    if (kind === 'sign') return renderSignIssue(meta, plans, plan);
    if (kind === 'task') return renderTaskIssue(meta, plans, plan);
    if (kind === 'coupon') return renderCouponIssue(meta, plans, plan);
    return renderBagIssue(meta, plans, plan);
  }

  function renderBagIssue(meta, plans, plan) {
    var ended = isEndedLocked();
    var rule = welfareUi.bagWinDraft || bagWinRuleOf();
    var settings =
      '<div class="bag-settings"><div class="bag-settings__title">福袋中奖设置' +
      '<span class="lf-live-subtab-tip bag-settings__help" tabindex="0" data-tip="每个人均可以参与任意一轮福袋抽奖活动，若中奖设置为每人只能中一次，那么下次随机开奖将会自动剔除此人。">?</span></div>' +
      '<div class="bag-settings__radios">' +
      '<label><input type="radio" name="bagWinRule" value="session"' +
      (rule === 'session' ? ' checked' : '') +
      (ended ? ' disabled' : '') +
      '> 每个场次每人只能中一次</label>' +
      '<label><input type="radio" name="bagWinRule" value="template"' +
      (rule === 'template' ? ' checked' : '') +
      (ended ? ' disabled' : '') +
      '> 每个福袋模板每人只能中一次</label>' +
      '<label><input type="radio" name="bagWinRule" value="none"' +
      (rule === 'none' ? ' checked' : '') +
      (ended ? ' disabled' : '') +
      '> 不限制</label>' +
      '<button type="button" class="erp-btn erp-btn--primary" id="btnSaveBagWin"' +
      (ended ? ' disabled' : '') +
      '>保存</button></div></div>';
    var toolbar =
      '<div class="coupon-dialog__issue-toolbar"><button type="button" class="erp-btn erp-btn--primary" id="btnAddBag"' +
      (ended ? ' disabled' : '') +
      '>添加福袋</button></div>';
    if (!plans.length) {
      return '<div class="bag-dialog__pane">' + settings + toolbar + welfareEmptyHtml(meta.emptyPlan) + '</div>';
    }
    var cards = plans
      .map(function (t) {
        var id = welfarePlanIdOf(t);
        var live = liveBagFields(t);
        var total = t.quotaTotal != null ? t.quotaTotal : t.stock;
        var issued = t.issuedQty != null ? t.issuedQty : 0;
        var issuing = planHasActiveWindow(t);
        var tags = '';
        if (issuing) tags += '<em class="coupon-card__tag coupon-card__tag--live">正在发放</em>';
        if (live.status === 'disabled' || live.status === 'expired') {
          tags +=
            '<em class="coupon-card__status coupon-card__status--' +
            live.statusKey +
            '">' +
            escapeHtml(live.statusLabel) +
            '</em>';
        } else if (couponRemain(t) < 1) {
          tags += '<em class="coupon-card__tag coupon-card__tag--done">已结束</em>';
        }
        var releaseHtml = t.released
          ? '<span class="coupon-card__release-inline"> · 释放库存 ' +
            escapeHtml(String(t.releasedQty != null ? t.releasedQty : 0)) +
            '</span>'
          : '';
        return (
          '<div class="coupon-card bag-card' +
          (id === welfareUi.planId ? ' coupon-card--selected bag-card--selected' : '') +
          (t.released ? ' coupon-card--released' : '') +
          '" data-plan-id="' +
          escapeHtml(id) +
          '"><div class="coupon-card__head"><span class="coupon-card__title">' +
          escapeHtml(live.name) +
          '</span>' +
          tags +
          '</div><div class="coupon-card__sub">' +
          escapeHtml(live.name) +
          '（' +
          escapeHtml(String(live.templateId)) +
          '）　发放数量：' +
          escapeHtml(String(issued)) +
          '/' +
          escapeHtml(String(total == null ? '—' : total)) +
          '　发放轮次：' +
          escapeHtml(couponRoundsLabel(t)) +
          releaseHtml +
          '</div><div class="coupon-card__sub">' +
          live.prizeHtml +
          '</div></div>'
        );
      })
      .join('');
    var remain = plan ? couponRemain(plan) : 0;
    var form = plan
      ? '<div class="bag-dialog__form"><div class="bag-dialog__form-title">发放设置</div>' +
        '<div class="lf-welfare-form-grid">' +
        '<label class="lf-welfare-field"><span><span class="erp-req">*</span>福袋持续时间（单位：分钟）</span>' +
        '<input class="erp-input" type="number" min="1" step="1" id="welfareDuration" value="' +
        escapeHtml(welfareUi.duration) +
        '" placeholder="请输入"></label>' +
        '<label class="lf-welfare-field"><span><span class="erp-req">*</span>中奖人数（单位：人）</span>' +
        '<input class="erp-input" type="number" min="1" step="1" id="welfareWinnerCount" value="' +
        escapeHtml(welfareUi.winnerCount) +
        '" placeholder="请输入"' +
        (remain > 0 ? ' max="' + remain + '"' : '') +
        '></label>' +
        '<div class="lf-welfare-field" style="grid-column:1/-1"><span>中奖类型</span>' +
        '<div class="bag-draw-radios">' +
        '<label><input type="radio" name="welfareDrawType" value="RANDOM"' +
        (welfareUi.drawType === 'ASSIGN' ? '' : ' checked') +
        '> 随机（系统随机抽取）</label>' +
        '<label class="lf-live-subtab-tip bag-assign-tip" tabindex="0" data-tip="指定的人数不受中奖设置规则控制，且若指定中奖人数小于中奖人数，那么多出来的中奖人数还是会从符合条件的参与人中进行随机抽取。"><input type="radio" name="welfareDrawType" value="ASSIGN"' +
        (welfareUi.drawType === 'ASSIGN' ? ' checked' : '') +
        '> 指定中奖</label></div>' +
        (welfareUi.drawType === 'ASSIGN' ? renderAssignUsersBlock() : '') +
        '</div></div>' +
        (plan.released
          ? '<p class="lf-live-dialog__hint">本场已结束，剩余库存已释放，不能再次发放。</p>'
          : '<p class="lf-live-dialog__hint">本活动剩余可发 ' +
            remain +
            '（总数量 ' +
            (plan.quotaTotal || plan.stock || 0) +
            '）。</p>') +
        '</div>'
      : '';
    return (
      '<div class="bag-dialog__pane">' +
      settings +
      toolbar +
      '<div class="bag-dialog__cards">' +
      cards +
      '</div>' +
      form +
      '</div>'
    );
  }

  function renderAssignUsersBlock() {
    var win = requiredPositiveInt(welfareUi.winnerCount);
    var picked = welfareUi.assignUsers || [];
    var chips = picked
      .map(function (u) {
        return (
          '<span class="audience-chip">' +
          escapeHtml(u.nickname) +
          ' · ' +
          escapeHtml(maskPhone(u.phone)) +
          '<button type="button" data-assign-remove="' +
          escapeHtml(u.userId) +
          '" aria-label="移除">×</button></span>'
        );
      })
      .join('');
    return (
      '<div class="assign-users"><div class="assign-users__title"><span class="erp-req">*</span>指定中奖用户</div>' +
      '<p class="assign-users__hint">已选 ' +
      picked.length +
      ' 人' +
      (win.ok ? '，不得超过本轮中奖人数 ' + win.value + ' 人' : '。请先填写中奖人数') +
      '。指定用户不受中奖设置限制；少于中奖人数时，差额从符合条件的参与人中随机抽取。</p>' +
      '<div class="assign-users__chips">' +
      (chips || '') +
      '</div>' +
      '<div class="assign-search">' +
      '<label class="assign-search__label" for="assignUserKeyword"><span class="erp-req">*</span>搜索会员</label>' +
      '<div class="pts-member-search-box">' +
      '<input class="erp-input" id="assignUserKeyword" type="text" placeholder="会员ID / 手机号 / 昵称，如 U10001" value="' +
      escapeHtml(welfareUi.assignKeyword || '') +
      '" autocomplete="off">' +
      '<button type="button" class="erp-btn erp-btn--primary" id="assignUserSearchBtn">搜索</button></div>' +
      '<p class="assign-users__hint">数据来自会员360-会员管理。可搜会员ID（如 U10001）、手机号或昵称，点搜索后选择。</p>' +
      '<div class="pts-member-result" id="assignUserResults">' +
      renderAssignUserRows() +
      '</div></div></div>'
    );
  }

  function audienceSearchFields(u) {
    return [u.userId, u.nickname, u.phone].concat(u.aliases || []);
  }

  function member360List() {
    if (Demo.listMember360) return Demo.listMember360();
    return Demo.liveAudience || [];
  }

  function memberMatchesKeyword(u, kw) {
    kw = String(kw || '').trim().toLowerCase();
    if (!kw) return false;
    var kwDigits = kw.replace(/\D/g, '');
    var fields = audienceSearchFields(u);
    var i;
    for (i = 0; i < fields.length; i++) {
      if (String(fields[i] || '').toLowerCase().indexOf(kw) >= 0) return true;
    }
    var phoneDigits = String(u.phone || '').replace(/\D/g, '');
    if (kwDigits && (phoneDigits.indexOf(kwDigits) >= 0 || String(u.userId || '').indexOf(kwDigits) >= 0)) {
      return true;
    }
    return false;
  }

  function filteredAssignCandidates() {
    var kw = String(welfareUi.assignKeyword || '').trim();
    if (!welfareUi.assignSearched || !kw) return [];
    var selected = {};
    (welfareUi.assignUsers || []).forEach(function (u) {
      selected[String(u.userId)] = true;
    });
    return member360List()
      .filter(function (u) {
        if (selected[String(u.userId)]) return false;
        return memberMatchesKeyword(u, kw);
      })
      .slice(0, 20);
  }

  function renderAssignUserRows() {
    if (!welfareUi.assignSearched) {
      return '<div class="pts-member-result-empty">请先搜索并选择会员</div>';
    }
    var list = filteredAssignCandidates();
    if (!list.length) {
      return '<div class="pts-member-result-empty">未找到匹配会员</div>';
    }
    return list
      .map(function (u) {
        return (
          '<div class="pts-member-result-item assign-member-item" data-assign-add="' +
          escapeHtml(u.userId) +
          '"><div class="assign-member-item__name">' +
          escapeHtml(u.nickname) +
          '（会员ID ' +
          escapeHtml(u.userId) +
          '）</div><div class="assign-member-item__phone">' +
          escapeHtml(maskPhone(u.phone) || u.phone || '—') +
          '</div></div>'
        );
      })
      .join('');
  }

  function searchAssignUsers() {
    var inp = document.getElementById('assignUserKeyword');
    welfareUi.assignKeyword = inp ? inp.value : welfareUi.assignKeyword;
    var kw = String(welfareUi.assignKeyword || '').trim();
    if (!kw) {
      welfareUi.assignSearched = false;
      refreshAssignUserResults();
      return toast('请输入会员ID / 手机号 / 昵称', 'warning');
    }
    welfareUi.assignSearched = true;
    refreshAssignUserResults();
  }

  function refreshAssignUserResults() {
    var box = document.getElementById('assignUserResults');
    if (box) box.innerHTML = renderAssignUserRows();
  }

  function addAssignUser(userId) {
    var win = requiredPositiveInt(welfareUi.winnerCount);
    if (!win.ok) return toast('请先填写中奖人数', 'warning');
    var picked = welfareUi.assignUsers || [];
    if (picked.length >= win.value) {
      return toast('指定中奖用户数量不得大于本轮福袋的中奖人数', 'warning');
    }
    var user = findAssignMember(userId);
    if (!user) return;
    var exists = picked.some(function (u) {
      return String(u.userId) === String(user.userId);
    });
    if (exists) return;
    picked.push({ userId: user.userId, nickname: user.nickname, phone: user.phone });
    welfareUi.assignUsers = picked;
    renderWelfareDrawer();
  }

  function removeAssignUser(userId) {
    welfareUi.assignUsers = (welfareUi.assignUsers || []).filter(function (u) {
      return String(u.userId) !== String(userId);
    });
    renderWelfareDrawer();
  }

  function renderCouponIssue(meta, plans, plan) {
    var ended = isEndedLocked();
    var toolbar =
      '<div class="coupon-dialog__issue-toolbar"><button type="button" class="erp-btn erp-btn--primary" id="btnAddCoupon"' +
      (ended ? ' disabled' : '') +
      '>添加优惠券</button></div>';
    if (!plans.length) {
      return '<div class="coupon-dialog__pane">' + toolbar + welfareEmptyHtml(meta.emptyPlan) + '</div>';
    }
    var cards = plans
      .map(function (t) {
        var id = welfarePlanIdOf(t);
        var live = liveCouponFields(t);
        var total = t.quotaTotal != null ? t.quotaTotal : t.stock;
        var issued = t.issuedQty != null ? t.issuedQty : 0;
        var lockReason = couponLockedReason(t);
        var locked = !!lockReason;
        var issuing = planHasActiveWindow(t);
        var tags = '';
        if (issuing) tags += '<em class="coupon-card__tag coupon-card__tag--live">正在发放</em>';
        if (live.status === 'disabled' || live.status === 'expired') {
          tags +=
            '<em class="coupon-card__status coupon-card__status--' +
            live.statusKey +
            '">' +
            escapeHtml(live.statusLabel) +
            '</em>';
        } else if (couponRemain(t) < 1) {
          tags += '<em class="coupon-card__tag coupon-card__tag--done">已结束</em>';
        }
        var releaseHtml = t.released
          ? '<span class="coupon-card__release-inline"> · 释放库存 ' +
            escapeHtml(String(t.releasedQty != null ? t.releasedQty : 0)) +
            '</span>'
          : '';
        return (
          '<div class="coupon-card' +
          (id === welfareUi.planId ? ' coupon-card--selected' : '') +
          (locked ? ' coupon-card--locked' : '') +
          '" data-plan-id="' +
          escapeHtml(id) +
          '"' +
          (locked ? ' data-locked="1" data-lock-reason="' + escapeHtml(lockReason) + '"' : '') +
          '><div class="coupon-card__head"><span class="coupon-card__title">' +
          escapeHtml(couponFaceTitle(t)) +
          '</span>' +
          tags +
          '</div><div class="coupon-card__sub">' +
          escapeHtml(live.name) +
          '（' +
          escapeHtml(String(live.templateId)) +
          '）　发放数量：' +
          escapeHtml(String(issued)) +
          '/' +
          escapeHtml(String(total == null ? '—' : total)) +
          '　发放轮次：' +
          escapeHtml(couponRoundsLabel(t)) +
          releaseHtml +
          '</div></div>'
        );
      })
      .join('');
    var remain = plan ? couponRemain(plan) : 0;
    var lockedPlan = plan ? couponLockedReason(plan) : '';
    var form = plan
      ? '<div class="coupon-dialog__form"><div class="coupon-dialog__form-title">发放设置</div>' +
        '<div class="lf-welfare-form-grid">' +
        '<label class="lf-welfare-field"><span><span class="erp-req">*</span>持续时间（单位：分钟）</span>' +
        '<input class="erp-input" type="number" min="1" step="1" id="welfareDuration" value="' +
        escapeHtml(welfareUi.duration) +
        '" placeholder="请输入"' +
        (lockedPlan ? ' disabled' : '') +
        '></label>' +
        '<label class="lf-welfare-field"><span><span class="erp-req">*</span>发放数量（单位：张）</span>' +
        '<input class="erp-input" type="number" min="1" step="1" id="welfareQuantity" value="' +
        escapeHtml(welfareUi.quantity) +
        '" placeholder="请输入"' +
        (remain > 0 ? ' max="' + remain + '"' : '') +
        (lockedPlan ? ' disabled' : '') +
        '></label></div>' +
        (lockedPlan
          ? '<p class="lf-live-dialog__hint">' + escapeHtml(lockedPlan) + '</p>'
          : '<p class="lf-live-dialog__hint">本活动剩余可发 ' + remain + ' 张（总数量 ' + (plan.quotaTotal || plan.stock || 0) + '）。</p>') +
        '</div>'
      : '';
    return (
      '<div class="coupon-dialog__pane">' +
      toolbar +
      '<div class="coupon-dialog__cards">' +
      cards +
      '</div>' +
      form +
      '</div>'
    );
  }

  function renderSignIssue(meta, plans, plan) {
    var ended = isEndedLocked();
    var toolbar =
      '<div class="coupon-dialog__issue-toolbar"><button type="button" class="erp-btn erp-btn--primary" id="btnAddSign"' +
      (ended ? ' disabled' : '') +
      '>添加签到</button></div>';
    if (!plans.length) {
      return '<div class="signin-dialog__pane">' + toolbar + welfareEmptyHtml(meta.emptyPlan) + '</div>';
    }
    var cards = plans
      .map(function (t) {
        var id = welfarePlanIdOf(t);
        var live = liveSignFields(t);
        var used = live.roundsUsed;
        var total = live.totalRounds;
        var allDone = total > 0 && used >= total;
        var pills = '';
        var i;
        for (i = 0; i < total; i++) {
          var cls = 'signin-round';
          if (t.interrupted && i >= used) cls += ' signin-round--interrupted';
          else if (i < used) cls += ' signin-round--issued';
          else if (i === used && !t.interrupted && !allDone) cls += ' signin-round--issuable';
          pills +=
            '<span class="' +
            cls +
            '">' +
            (i + 1) +
            (i < used ? '已发' : i === used && !t.interrupted && !allDone ? '可发' : '') +
            '</span>';
        }
        return (
          '<div class="coupon-card' +
          (id === welfareUi.planId ? ' coupon-card--selected' : '') +
          (t.interrupted ? ' coupon-card--released' : '') +
          '" data-plan-id="' +
          escapeHtml(id) +
          '"><div class="coupon-card__head"><span class="coupon-card__name">' +
          escapeHtml(live.name) +
          '</span><em class="coupon-card__status coupon-card__status--' +
          (t.interrupted ? 'interrupted' : allDone ? 'disabled' : live.statusKey) +
          '">' +
          escapeHtml(t.interrupted ? '已中断' : allDone ? '已结束' : live.statusLabel) +
          '</em></div><div class="coupon-card__sub">' +
          escapeHtml(String(live.templateId)) +
          ' · ' +
          escapeHtml(String(total)) +
          '次 · ' +
          escapeHtml(String(used)) +
          '/' +
          escapeHtml(String(total)) +
          '轮 · ' +
          escapeHtml(String(t.deliveredCount || 0)) +
          '人次 · ' +
          escapeHtml(signRewardRulesShort(live.rewards)) +
          '</div><div class="signin-rounds">' +
          pills +
          '</div></div>'
        );
      })
      .join('');
    var live = plan ? liveSignFields(plan) : null;
    var used = live ? live.roundsUsed : 0;
    var total = live ? live.totalRounds : 0;
    var allDone = !!(plan && total > 0 && used >= total);
    var interrupted = !!(plan && plan.interrupted);
    var form = plan
      ? '<div class="signin-dialog__form"><div class="signin-dialog__form-title">发放设置</div>' +
        '<div class="lf-welfare-form-grid lf-welfare-form-grid--1"><label class="lf-welfare-field"><span><span class="erp-req">*</span>持续时间（单位：分钟）</span>' +
        '<input class="erp-input" type="number" min="1" step="1" id="welfareDuration" value="' +
        escapeHtml(welfareUi.duration) +
        '" placeholder="请输入"' +
        (allDone || interrupted ? ' disabled' : '') +
        '></label></div></div>'
      : '';
    var tip = '';
    if (interrupted) {
      tip = '<div class="signin-dialog__tip signin-dialog__tip--info">该签到活动已中断，不能再次发放。已领取的奖励仍然有效。</div>';
    } else if (allDone) {
      tip = '<div class="signin-dialog__tip signin-dialog__tip--success">已完成全部 ' + total + ' 轮发放。</div>';
    } else if (plan) {
      tip =
        '<div class="signin-dialog__tip signin-dialog__tip--info">点击「立即发放」开启<span class="signin-dialog__tip-highlight">第 ' +
        (used + 1) +
        ' 次签到</span>。</div>';
    }
    return (
      '<div class="signin-dialog__pane">' +
      toolbar +
      '<div class="coupon-dialog__cards">' +
      cards +
      '</div>' +
      form +
      tip +
      '</div>'
    );
  }

  function renderTaskIssue(meta, plans, plan) {
    var ended = isEndedLocked();
    var toolbar =
      '<div class="coupon-dialog__issue-toolbar"><button type="button" class="erp-btn erp-btn--primary" id="btnAddTask"' +
      (ended ? ' disabled' : '') +
      '>添加观看奖励</button></div>';
    if (!plans.length) {
      return '<div class="task-dialog__pane">' + toolbar + welfareEmptyHtml(meta.emptyPlan) + '</div>';
    }
    var cards = plans
      .map(function (t) {
        var id = welfarePlanIdOf(t);
        var live = liveTaskFields(t);
        var pills = (live.milestones || [])
          .map(function (m) {
            var cls = 'signin-round';
            if (t.interrupted) cls += ' signin-round--interrupted';
            else if (live.active) cls += ' signin-round--issuable';
            else if (live.delivered) cls += ' signin-round--issued';
            return '<span class="' + cls + '">' + escapeHtml(taskMilestoneShort(m)) + '</span>';
          })
          .join('');
        return (
          '<div class="coupon-card' +
          (id === welfareUi.planId ? ' coupon-card--selected' : '') +
          (t.interrupted ? ' coupon-card--released' : '') +
          '" data-plan-id="' +
          escapeHtml(id) +
          '"><div class="coupon-card__head"><span class="coupon-card__name">' +
          escapeHtml(live.name) +
          '</span><em class="coupon-card__status coupon-card__status--' +
          live.statusKey +
          '">' +
          escapeHtml(t.interrupted ? '已中断' : live.phaseLabel) +
          '</em></div><div class="coupon-card__sub">' +
          escapeHtml(String(live.templateId)) +
          ' · ' +
          escapeHtml(String((live.milestones || []).length)) +
          '档 · ' +
          escapeHtml(String(t.deliveredCount || 0)) +
          '人次 · ' +
          escapeHtml(taskRewardRulesShort(live.milestones)) +
          '</div><div class="signin-rounds">' +
          pills +
          '</div></div>'
        );
      })
      .join('');
    var live = plan ? liveTaskFields(plan) : null;
    var interrupted = !!(plan && plan.interrupted);
    var delivered = !!(plan && plan.delivered);
    var tip = '';
    if (interrupted) {
      tip = '<div class="task-dialog__tip task-dialog__tip--info">该观看奖励活动已中断，不能再次发放。已领取的奖励仍然有效。</div>';
    } else if (delivered && live && live.active) {
      tip = '<div class="task-dialog__tip task-dialog__tip--info">本活动进行中。C 端从发放时开始统计观看时长，达成条件后自动发奖并弹窗提醒。</div>';
    } else if (delivered) {
      tip = '<div class="task-dialog__tip task-dialog__tip--warning">本活动已结束，不能再次发放。</div>';
    } else if (plan) {
      tip = '<div class="task-dialog__tip task-dialog__tip--info">点击「立即发放」后，C 端才会开始统计观看时长并计算奖励。</div>';
    }
    return (
      '<div class="task-dialog__pane">' +
      toolbar +
      '<div class="coupon-dialog__cards">' +
      cards +
      '</div>' +
      tip +
      '</div>'
    );
  }

  function renderWelfareRecord(meta, plan) {
    var refresh =
      '<div class="' +
      (welfareUi.kind === 'bag'
        ? 'bag-dialog__record-toolbar'
        : welfareUi.kind === 'sign'
          ? 'signin-dialog__record-toolbar'
          : welfareUi.kind === 'task'
            ? 'task-dialog__record-toolbar'
            : 'coupon-dialog__record-toolbar') +
      '"><button type="button" class="erp-btn" id="welfareDrawerRefresh">刷新</button></div>';
    var rows = collectKindWindowRows();
    if (!rows.length) return refresh + welfareEmptyHtml(meta.emptyRecord);
    var total = rows.length;
    var cards = rows
      .map(function (row, i) {
        var seq = total - i;
        var w = row.window;
        var p = row.plan;
        if (welfareUi.kind === 'bag') return renderBagRecordCard(w, p, seq);
        if (welfareUi.kind === 'sign') return renderSignRecordCard(w, p, seq);
        if (welfareUi.kind === 'task') return renderTaskRecordCard(w, p, seq);
        return renderCouponRecordCard(w, p, seq);
      })
      .join('');
    var listClass =
      welfareUi.kind === 'bag'
        ? 'bag-dialog__records'
        : welfareUi.kind === 'sign'
          ? 'signin-dialog__records'
          : welfareUi.kind === 'task'
            ? 'task-dialog__records'
            : 'coupon-dialog__records';
    return refresh + '<div class="' + listClass + '">' + cards + '</div>';
  }

  function recordStatusBadge(w, activeText) {
    var active = w.status === 'ACTIVE';
    var interrupted = !active && !!w.interrupted;
    return (
      '<span class="record-card__status record-card__status--' +
      (active ? 'active' : interrupted ? 'interrupted' : 'closed') +
      '">' +
      (active ? activeText : interrupted ? '已中断' : '已结束') +
      '</span>'
    );
  }

  function recordStopBtn(w, kind) {
    if (w.status !== 'ACTIVE') return '';
    return (
      '<button type="button" class="erp-btn erp-btn--danger-plain" data-welfare-stop="' +
      escapeHtml(String(w.id)) +
      '" data-welfare-stop-kind="' +
      kind +
      '">停止</button>'
    );
  }

  function renderCouponRecordCard(w, plan, seq) {
    var pct = windowProgress(w);
    var live = liveCouponFields(plan);
    return (
      '<div class="record-card" data-window-id="' +
      escapeHtml(String(w.id)) +
      '"><div class="record-card__head">' +
      recordTitleHtml(seq, live.name) +
      recordStatusBadge(w, '进行中') +
      '</div><div class="record-card__metrics">' +
      '<div class="record-card__metric"><div class="record-card__metric-label">门槛</div><div class="record-card__metric-value">' +
      escapeHtml(couponThresholdText(plan)) +
      '</div></div>' +
      '<div class="record-card__metric"><div class="record-card__metric-label">发放数量</div><div class="record-card__metric-value">' +
      escapeHtml(String(w.couponTotalStock || 0)) +
      ' 张</div></div>' +
      '<div class="record-card__metric"><div class="record-card__metric-label">领取人数</div><div class="record-card__metric-value">' +
      escapeHtml(String(w.couponClaimedCount || 0)) +
      ' 人</div></div>' +
      (w.rolledBackQty
        ? '<div class="record-card__metric"><div class="record-card__metric-label">回滚库存</div><div class="record-card__metric-value">' +
          escapeHtml(String(w.rolledBackQty)) +
          ' 张</div></div>'
        : '') +
      '<div class="record-card__metric"><div class="record-card__metric-label">已用人数</div><div class="record-card__metric-value">' +
      escapeHtml(String(w.couponUsedCount || 0)) +
      ' 人</div></div>' +
      recordJoinHtml(w) +
      '<div class="record-card__metric"><div class="record-card__metric-label">轮次</div><div class="record-card__metric-value">' +
      escapeHtml(String(recordRoundNo(w))) +
      '</div></div>' +
      '<div class="record-card__metric"><div class="record-card__metric-label">持续时长</div><div class="record-card__metric-value">' +
      Math.round((w.durationSec || 0) / 60) +
      ' 分钟</div></div></div>' +
      '<div class="record-card__progress"><div class="record-card__progress-bar"><div class="record-card__progress-bar-inner" style="width:' +
      pct +
      '%"></div></div><span class="record-card__progress-text">时间进度 ' +
      pct +
      '%</span></div>' +
      '<div class="record-card__footer"><span class="record-card__time">' +
      escapeHtml(formatWelfareTime(w.startedAt)) +
      ' ~ ' +
      escapeHtml(formatWelfareTime(w.endedAt)) +
      '</span>' +
      recordStopBtn(w, 'coupon') +
      '</div></div>'
    );
  }

  function renderBagRecordCard(w, plan, seq) {
    var pct = windowProgress(w);
    var live = plan ? liveBagFields(plan) : { name: '—', prizeTitle: '' };
    var winners = (w.rewards || [])
      .map(function (r) {
        var isVirtual = !!r.virtual;
        var label = r.nickMasked || r.nickMasked || '匿名用户';
        var prize = r.prizeTitle || r.prizeTitle || '';
        var face = isVirtual
          ? BAG_DEFAULT_AVATAR
          : '<span class="record-card__winner-letter">' + escapeHtml(String(r.nickname || label).charAt(0) || '用') + '</span>';
        return (
          '<span class="record-card__winner' +
          (isVirtual ? ' is-virtual' : '') +
          '"' +
          (isVirtual ? ' title="虚拟用户"' : '') +
          '>' +
          face +
          '<em>' +
          escapeHtml(label) +
          (prize ? ' · ' + escapeHtml(prize) : '') +
          (isVirtual ? '<i>虚</i>' : '') +
          '</em></span>'
        );
      })
      .join('');
    return (
      '<div class="record-card" data-window-id="' +
      escapeHtml(String(w.id)) +
      '"><div class="record-card__head"><div class="record-card__title-wrap">' +
      WELFARE_GIFT_ICO +
      recordTitleHtml(seq, live.name) +
      '</div>' +
      recordStatusBadge(w, '进行中') +
      '</div><div class="record-card__metrics record-card__metrics--6">' +
      '<div class="record-card__metric"><div class="record-card__metric-label">奖品</div><div class="record-card__metric-value">' +
      escapeHtml(live.prizeTitle || w.prizeTitle || '—') +
      '</div></div>' +
      '<div class="record-card__metric"><div class="record-card__metric-label">轮次</div><div class="record-card__metric-value">' +
      escapeHtml(String(recordRoundNo(w))) +
      '</div></div>' +
      '<div class="record-card__metric"><div class="record-card__metric-label">持续时长</div><div class="record-card__metric-value">' +
      Math.round((w.durationSec || 0) / 60) +
      ' 分钟</div></div>' +
      '<div class="record-card__metric"><div class="record-card__metric-label">中奖类型</div><div class="record-card__metric-value">' +
      (w.drawType === 'ASSIGN' ? '指定中奖' : '随机抽取') +
      '</div></div>' +
      recordJoinHtml(w) +
      '<div class="record-card__metric"><div class="record-card__metric-label">中奖人数</div><div class="record-card__metric-value">' +
      escapeHtml(String(w.status === 'ACTIVE' ? w.winnerTotal || w.winnerCount || 0 : w.winnerCount || 0)) +
      ' 人</div></div>' +
      (w.rolledBackQty
        ? '<div class="record-card__metric"><div class="record-card__metric-label">回滚库存</div><div class="record-card__metric-value">' +
          escapeHtml(String(w.rolledBackQty)) +
          ' 个</div></div>'
        : '') +
      '</div>' +
      (winners
        ? '<div class="record-card__winners"><div class="record-card__winners-title">中奖用户</div><div class="record-card__winners-list">' +
          winners +
          '</div></div>'
        : '') +
      '<div class="record-card__progress"><div class="record-card__progress-bar"><div class="record-card__progress-bar-inner" style="width:' +
      pct +
      '%"></div></div><span class="record-card__progress-text">时间进度 ' +
      pct +
      '%</span></div>' +
      '<div class="record-card__footer"><span class="record-card__time">' +
      escapeHtml(formatWelfareTime(w.startedAt)) +
      ' ~ ' +
      escapeHtml(formatWelfareTime(w.endedAt)) +
      '</span>' +
      recordStopBtn(w, 'bag') +
      '</div></div>'
    );
  }

  function renderSignRecordCard(w, plan, seq) {
    var live = liveSignFields(plan);
    return (
      '<div class="record-card" data-window-id="' +
      escapeHtml(String(w.id)) +
      '"><div class="record-card__head">' +
      recordTitleHtml(seq, live.name) +
      recordStatusBadge(w, '进行中') +
      '</div><div class="record-card__metrics record-card__metrics--4">' +
      '<div class="record-card__metric"><div class="record-card__metric-label">轮次</div><div class="record-card__metric-value">' +
      escapeHtml(String(recordRoundNo(w))) +
      '</div></div>' +
      recordJoinHtml(w) +
      '<div class="record-card__metric"><div class="record-card__metric-label">持续时长</div><div class="record-card__metric-value">' +
      Math.round((w.durationSec || 0) / 60) +
      ' 分钟</div></div></div>' +
      '<div class="record-card__footer"><span class="record-card__time">' +
      escapeHtml(formatWelfareTime(w.startedAt)) +
      ' ~ ' +
      escapeHtml(formatWelfareTime(w.endedAt)) +
      '</span>' +
      recordStopBtn(w, 'sign') +
      '</div></div>'
    );
  }

  function renderTaskRecordCard(w, plan, seq) {
    var live = liveTaskFields(plan);
    var subs = (live.milestones || [])
      .map(function (m) {
        return (
          '<div class="record-card__sub"><span class="record-card__sub-title"><span class="record-card__sub-dot"></span> ' +
          escapeHtml(taskMilestoneLabel(m)) +
          '</span></div>'
        );
      })
      .join('');
    return (
      '<div class="record-card" data-window-id="' +
      escapeHtml(String(w.id)) +
      '"><div class="record-card__head"><div class="record-card__head-info">' +
      recordTitleHtml(seq, live.name) +
      '</div>' +
      recordStatusBadge(w, '进行中') +
      '</div>' +
      '<div class="record-card__metrics record-card__metrics--4">' +
      '<div class="record-card__metric"><div class="record-card__metric-label">轮次</div><div class="record-card__metric-value">' +
      escapeHtml(String(recordRoundNo(w))) +
      '</div></div>' +
      recordJoinHtml(w) +
      '</div>' +
      (subs
        ? '<div class="record-card__subs"><div class="record-card__subs-title">奖励规则</div><div class="record-card__subs-list">' +
          subs +
          '</div></div>'
        : '') +
      '<div class="record-card__footer"><span class="record-card__time">' +
      escapeHtml(formatWelfareTime(w.startedAt)) +
      '</span>' +
      recordStopBtn(w, 'task') +
      '</div></div>'
    );
  }

  function couponThresholdLabel(threshold) {
    if (threshold != null && Number(threshold) > 0) return '满 ' + threshold;
    return '无门槛';
  }

  function couponFaceLabel(tpl) {
    return '减' + (tpl && tpl.denomination != null ? tpl.denomination : 0) + '元';
  }

  function couponThresholdCell(tpl) {
    if (!tpl || tpl.threshold == null || Number(tpl.threshold) <= 0) return '无门槛';
    return tpl.threshold + '元';
  }

  function createCouponPaginationBar(opts) {
    var page = opts.page;
    var pageSize = opts.pageSize;
    var total = opts.total;
    var onPage = opts.onPage;
    var maxPage = Math.max(1, Math.ceil(total / pageSize) || 1);
    var bar = document.createElement('div');
    bar.className = 'erp-pagination';
    var totalEl = document.createElement('span');
    totalEl.className = 'erp-pagination__total';
    totalEl.textContent = '共 ' + total + ' 条';
    bar.appendChild(totalEl);
    var mid = document.createElement('div');
    mid.className = 'erp-pagination__mid';
    var hint = document.createElement('span');
    hint.className = 'erp-pagination__hint';
    hint.textContent = pageSize + ' 条/页';
    mid.appendChild(hint);
    var pages = document.createElement('div');
    pages.className = 'erp-pagination__pages';
    var windowStart = Math.max(1, Math.min(page - 1, maxPage - 2));
    var p;
    for (p = windowStart; p <= Math.min(maxPage, windowStart + 2); p++) {
      (function (pp) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'erp-page-btn' + (pp === page ? ' is-active' : '');
        b.textContent = String(pp);
        b.addEventListener('click', function () {
          onPage(pp);
        });
        pages.appendChild(b);
      })(p);
    }
    mid.appendChild(pages);
    bar.appendChild(mid);
    var right = document.createElement('div');
    right.className = 'erp-pagination__right';
    var gotoLabel = document.createElement('span');
    gotoLabel.className = 'erp-pagination__goto-label';
    gotoLabel.textContent = '前往';
    right.appendChild(gotoLabel);
    var inp = document.createElement('input');
    inp.className = 'erp-pagination__goto-input';
    inp.type = 'number';
    inp.min = '1';
    inp.max = String(maxPage);
    inp.value = String(Math.min(page, maxPage));
    inp.addEventListener('change', function () {
      var v = Math.min(maxPage, Math.max(1, Number(inp.value) || 1));
      onPage(v);
    });
    right.appendChild(inp);
    var pageLabel = document.createElement('span');
    pageLabel.className = 'erp-pagination__goto-label';
    pageLabel.textContent = '页';
    right.appendChild(pageLabel);
    bar.appendChild(right);
    return bar;
  }

  function closeAddCouponModal() {
    var backdrop = document.querySelector('[data-ml-coupon-modal]');
    if (backdrop) backdrop.remove();
  }

  function openAddCouponDialog() {
    if (isEndedLocked()) return toastEndedLock('deliver');
    closeAddCouponModal();
    addCouponUi.templateId = '';
    addCouponUi.keyword = '';
    addCouponUi.stock = '100';
    addCouponUi.page = 1;

    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop';
    backdrop.setAttribute('data-ml-coupon-modal', '1');
    var modal = document.createElement('div');
    modal.className = 'erp-modal erp-modal--ml-coupon';

    var header = document.createElement('div');
    header.className = 'erp-modal__header';
    var title = document.createElement('h2');
    title.className = 'erp-modal__title';
    title.textContent = '选择优惠券';
    header.appendChild(title);
    var ha = document.createElement('div');
    ha.className = 'erp-modal__header-actions';
    var bx = document.createElement('button');
    bx.type = 'button';
    bx.className = 'erp-modal__header-btn';
    bx.innerHTML = '&times;';
    ha.appendChild(bx);
    header.appendChild(ha);

    var body = document.createElement('div');
    body.className = 'erp-modal__body';
    var tabs = document.createElement('div');
    tabs.className = 'member-coupon-tabs';
    var tab1 = document.createElement('button');
    tab1.type = 'button';
    tab1.className = 'member-coupon-tab is-active';
    tab1.textContent = '商品优惠券';
    tabs.appendChild(tab1);
    body.appendChild(tabs);

    var toolbar = document.createElement('div');
    toolbar.className = 'erp-toolbar member-coupon-toolbar';
    var searchInp = document.createElement('input');
    searchInp.className = 'erp-input member-coupon-search';
    searchInp.type = 'text';
    searchInp.placeholder = '请输入优惠券名称';
    searchInp.style.maxWidth = '280px';
    var searchBtn = document.createElement('button');
    searchBtn.type = 'button';
    searchBtn.className = 'erp-btn';
    searchBtn.textContent = '搜索';
    toolbar.appendChild(searchInp);
    toolbar.appendChild(searchBtn);
    body.appendChild(toolbar);

    var scroll = document.createElement('div');
    scroll.className = 'ml-coupon-table-wrap';
    var table = document.createElement('table');
    table.className = 'erp-table ml-coupon-table';
    var thead = document.createElement('thead');
    var trh = document.createElement('tr');
    ['优惠券名称', '券面值', '门槛', '适用渠道', '有效期', '领取限制', '剩余库存'].forEach(function (h) {
      var th = document.createElement('th');
      th.textContent = h;
      trh.appendChild(th);
    });
    thead.appendChild(trh);
    var tbody = document.createElement('tbody');
    table.appendChild(thead);
    table.appendChild(tbody);
    scroll.appendChild(table);
    body.appendChild(scroll);

    var pagHost = document.createElement('div');
    pagHost.className = 'member-coupon-pagination';
    body.appendChild(pagHost);

    var stockWrap = document.createElement('div');
    stockWrap.className = 'erp-modal-field ml-coupon-stock';
    stockWrap.innerHTML =
      '<label class="erp-modal-field__label"><span class="erp-req">*</span>发券库存</label>' +
      '<div class="erp-modal-field__control">' +
      '<input class="erp-input" id="addCouponStock" type="number" min="1" step="1" value="100">' +
      '<p class="lf-live-dialog__hint" id="addCouponStockHint" style="margin:8px 0 0">将从所选券模板剩余库存中预扣。</p>' +
      '</div>';
    body.appendChild(stockWrap);

    var footer = document.createElement('div');
    footer.className = 'erp-modal__footer';
    var bCancel = document.createElement('button');
    bCancel.type = 'button';
    bCancel.className = 'erp-btn';
    bCancel.textContent = '取消';
    var bOk = document.createElement('button');
    bOk.type = 'button';
    bOk.className = 'erp-btn erp-btn--primary';
    bOk.textContent = '确定';
    footer.appendChild(bCancel);
    footer.appendChild(bOk);

    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(footer);
    backdrop.appendChild(modal);

    function filteredList() {
      var k = String(addCouponUi.keyword || '').trim().toLowerCase();
      return (Demo.couponTemplates || []).filter(function (c) {
        if (c.status === 'expired') return false;
        if (!k) return true;
        return (
          String(c.name || '').toLowerCase().indexOf(k) >= 0 ||
          String(c.id || '').toLowerCase().indexOf(k) >= 0
        );
      });
    }

    function paintCouponTable() {
      var all = filteredList();
      var total = all.length;
      var pageSize = 10;
      var maxPage = Math.max(1, Math.ceil(total / pageSize) || 1);
      if ((addCouponUi.page || 1) > maxPage) addCouponUi.page = maxPage;
      var start = ((addCouponUi.page || 1) - 1) * pageSize;
      var slice = all.slice(start, start + pageSize);
      tbody.innerHTML = '';
      if (!slice.length) {
        var emptyTr = document.createElement('tr');
        var emptyTd = document.createElement('td');
        emptyTd.colSpan = 7;
        emptyTd.className = 'member-level-coupon-picker__empty';
        emptyTd.style.textAlign = 'center';
        emptyTd.textContent = '无匹配优惠券';
        emptyTr.appendChild(emptyTd);
        tbody.appendChild(emptyTr);
      } else {
        slice.forEach(function (c) {
          var selectable = c.status === 'enabled' && Number(c.stock) > 0;
          var tr = document.createElement('tr');
          if (c.id === addCouponUi.templateId) tr.className = 'is-selected';
          if (!selectable) tr.className = (tr.className ? tr.className + ' ' : '') + 'is-disabled';
          tr.style.cursor = selectable ? 'pointer' : 'not-allowed';

          var tdName = document.createElement('td');
          tdName.className = 'ml-coupon-table__name';
          var nameLabel = document.createElement('label');
          nameLabel.className = 'ml-coupon-table__check';
          var cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.value = c.id;
          cb.checked = c.id === addCouponUi.templateId;
          cb.disabled = !selectable;
          var nameText = document.createElement('span');
          nameText.textContent = c.name;
          nameLabel.appendChild(cb);
          nameLabel.appendChild(nameText);
          tdName.appendChild(nameLabel);
          tr.appendChild(tdName);

          [
            couponFaceLabel(c),
            couponThresholdCell(c),
            c.channel || '全渠道',
            c.validPeriod || '领取后7天有效',
            c.collectLimit || '不限',
            String(c.stock)
          ].forEach(function (text) {
            var td = document.createElement('td');
            td.textContent = text;
            tr.appendChild(td);
          });

          function pickThis(ev) {
            if (ev) ev.stopPropagation();
            if (!selectable) return;
            addCouponUi.templateId = c.id;
            paintCouponTable();
            syncAddCouponHint();
          }

          cb.addEventListener('change', function (ev) {
            if (!selectable) return;
            if (cb.checked) addCouponUi.templateId = c.id;
            else if (addCouponUi.templateId === c.id) addCouponUi.templateId = '';
            paintCouponTable();
            syncAddCouponHint();
            ev.stopPropagation();
          });
          tr.addEventListener('click', function (ev) {
            if (ev.target === cb) return;
            pickThis(ev);
          });
          tbody.appendChild(tr);
        });
      }
      pagHost.innerHTML = '';
      pagHost.appendChild(
        createCouponPaginationBar({
          page: addCouponUi.page || 1,
          pageSize: pageSize,
          total: total,
          onPage: function (p) {
            addCouponUi.page = p;
            paintCouponTable();
          }
        })
      );
      syncAddCouponHint();
    }

    searchBtn.addEventListener('click', function () {
      addCouponUi.keyword = searchInp.value || '';
      addCouponUi.page = 1;
      paintCouponTable();
    });
    searchInp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        addCouponUi.keyword = searchInp.value || '';
        addCouponUi.page = 1;
        paintCouponTable();
      }
    });
    bx.addEventListener('click', closeAddCouponModal);
    bCancel.addEventListener('click', closeAddCouponModal);
    bOk.addEventListener('click', confirmAddCoupon);
    backdrop.addEventListener('click', function (ev) {
      if (ev.target === backdrop) closeAddCouponModal();
    });

    paintCouponTable();
    document.body.appendChild(backdrop);
    searchInp.focus();
  }

  function syncAddCouponHint() {
    var hint = document.getElementById('addCouponStockHint');
    var tpl = Demo.findCouponTemplate ? Demo.findCouponTemplate(addCouponUi.templateId) : null;
    if (!hint) return;
    if (!tpl) {
      hint.textContent = '将从所选券模板剩余库存中预扣。同一券模板可多次关联。';
      return;
    }
    hint.textContent =
      '已选「' + tpl.name + '」（' + tpl.id + '），剩余库存 ' + tpl.stock + ' 张，添加后立即预扣。';
  }

  function confirmAddCoupon() {
    if (isEndedLocked()) return toastEndedLock('deliver');
    var sess = findSession(sessionId);
    if (!sess) return;
    var tpl = Demo.findCouponTemplate ? Demo.findCouponTemplate(addCouponUi.templateId) : null;
    if (!tpl) return toast('请选择优惠券', 'warning');
    if (tpl.status !== 'enabled') return toast('仅能添加启用中的券模板', 'warning');
    var qty = Math.floor(Number((document.getElementById('addCouponStock') || {}).value || addCouponUi.stock || 0));
    if (!qty || qty < 1) return toast('请填写发券库存', 'warning');
    if (qty > tpl.stock) return toast('发券库存不能大于券模板剩余库存（' + tpl.stock + '）', 'warning');
    if (!Demo.deductCouponStock(tpl.id, qty)) return toast('预扣库存失败，请重试', 'warning');
    if (!sess.templates) sess.templates = [];
    var planId = Demo.nextCouponPlanId();
    sess.templates.push({
      id: planId,
      planId: planId,
      activityId: planId,
      templateId: tpl.id,
      type: 'COUPON',
      typeName: '优惠券',
      quotaTotal: qty,
      stock: qty,
      issuedQty: 0,
      roundCount: 0,
      deliveredCount: 0,
      released: false,
      releasedQty: null
    });
    Demo.welfareWindowsOf(planId);
    welfareUi.planId = planId;
    closeAddCouponModal();
    toast('已添加「' + tpl.name + '」，预扣库存 ' + qty + ' 张');
    renderWelfareDrawer();
  }

  function filteredBagTemplates() {
    var kw = String(addBagUi.keyword || '').trim().toLowerCase();
    return (Demo.bagTemplates || []).filter(function (tpl) {
      if (!kw) return true;
      return (
        String(tpl.name || '').toLowerCase().indexOf(kw) >= 0 ||
        String(tpl.id || '').toLowerCase().indexOf(kw) >= 0
      );
    });
  }

  function renderAddBagList() {
    var box = document.getElementById('addBagList');
    if (!box) return;
    var list = filteredBagTemplates();
    var head =
      '<div class="add-coupon-row add-bag-row add-coupon-row--head"><span>福袋名称</span><span>模板ID</span><span>奖品类型</span><span>奖品</span><span>状态</span><span>剩余库存</span></div>';
    if (!list.length) {
      box.innerHTML = head + '<div class="add-coupon-empty">没有匹配的福袋模板</div>';
      return;
    }
    box.innerHTML =
      head +
      list
        .map(function (tpl) {
          var selectable = tpl.status === 'enabled' && Number(tpl.stock) > 0;
          var selected = selectable && addBagUi.templateId === tpl.id;
          return (
            '<div class="add-coupon-row add-bag-row' +
            (selected ? ' add-coupon-row--selected' : '') +
            (selectable ? '' : ' add-coupon-row--disabled') +
            '" data-bag-tpl="' +
            escapeHtml(tpl.id) +
            '"' +
            (selectable ? '' : ' data-disabled="1"') +
            '><span>' +
            escapeHtml(tpl.name) +
            '</span><span>' +
            escapeHtml(tpl.id) +
            '</span><span>' +
            escapeHtml(Demo.bagPrizeTypeLabel ? Demo.bagPrizeTypeLabel(tpl.prizeType) : '') +
            '</span><span>' +
            escapeHtml(bagPrizeSummary(tpl)) +
            '</span><span>' +
            escapeHtml(Demo.bagTemplateStatusLabel(tpl.status)) +
            '</span><span>' +
            escapeHtml(String(tpl.stock)) +
            '</span></div>'
          );
        })
        .join('');
    syncAddBagHint();
  }

  function syncAddBagHint() {
    var hint = document.getElementById('addBagStockHint');
    var tpl = Demo.findBagTemplate ? Demo.findBagTemplate(addBagUi.templateId) : null;
    if (!hint) return;
    if (!tpl) {
      hint.textContent = '将从所选福袋模板剩余库存中预扣。同一福袋模板可多次关联。';
      return;
    }
    hint.textContent =
      '已选「' + tpl.name + '」（' + tpl.id + '），剩余库存 ' + tpl.stock + '，添加后立即预扣。';
  }

  function openAddBagDialog() {
    if (isEndedLocked()) return toastEndedLock('deliver');
    addBagUi.templateId = '';
    addBagUi.keyword = '';
    addBagUi.stock = '';
    var kw = document.getElementById('addBagKeyword');
    var stock = document.getElementById('addBagStock');
    if (kw) kw.value = '';
    if (stock) stock.value = '';
    renderAddBagList();
    openDialog('addBagDialog');
  }

  function confirmAddBag() {
    if (isEndedLocked()) return toastEndedLock('deliver');
    var sess = findSession(sessionId);
    if (!sess) return;
    var tpl = Demo.findBagTemplate ? Demo.findBagTemplate(addBagUi.templateId) : null;
    if (!tpl) return toast('请先选择福袋模板', 'warning');
    if (tpl.status !== 'enabled') return toast('仅能添加启用中的福袋模板', 'warning');
    var qty = Math.floor(Number((document.getElementById('addBagStock') || {}).value || addBagUi.stock || 0));
    if (!qty || qty < 1) return toast('请填写福袋库存', 'warning');
    if (qty > tpl.stock) return toast('福袋库存不能大于模板剩余库存（' + tpl.stock + '）', 'warning');
    if (!Demo.deductBagStock(tpl.id, qty)) return toast('预扣库存失败，请重试', 'warning');
    if (!sess.templates) sess.templates = [];
    var planId = Demo.nextBagPlanId();
    sess.templates.push({
      id: planId,
      planId: planId,
      activityId: planId,
      templateId: tpl.id,
      type: 'FORTUNE_BAG',
      typeName: '福袋',
      quotaTotal: qty,
      stock: qty,
      issuedQty: 0,
      roundCount: 0,
      deliveredCount: 0,
      released: false,
      releasedQty: null,
      activeWindowId: null
    });
    Demo.welfareWindowsOf(planId);
    welfareUi.planId = planId;
    closeDialog('addBagDialog');
    toast('已添加「' + tpl.name + '」，预扣库存 ' + qty);
    renderWelfareDrawer();
  }

  function filteredSignTemplates() {
    var kw = String(addSignUi.keyword || '').trim().toLowerCase();
    return (Demo.signTemplates || []).filter(function (tpl) {
      if (!kw) return true;
      return (
        String(tpl.name || '').toLowerCase().indexOf(kw) >= 0 ||
        String(tpl.id || '').toLowerCase().indexOf(kw) >= 0
      );
    });
  }

  function renderAddSignList() {
    var box = document.getElementById('addSignList');
    if (!box) return;
    var list = filteredSignTemplates();
    if (!list.length) {
      box.innerHTML = '<div class="add-coupon-empty">没有匹配的签到模板</div>';
      return;
    }
    box.innerHTML = list
      .map(function (tpl) {
        var selectable = tpl.status === 'enabled';
        var selected = selectable && addSignUi.templateId === tpl.id;
        return (
          '<div class="add-sign-card' +
          (selected ? ' add-sign-card--selected' : '') +
          (selectable ? '' : ' add-sign-card--disabled') +
          '" data-sign-tpl="' +
          escapeHtml(tpl.id) +
          '"' +
          (selectable ? '' : ' data-disabled="1"') +
          '><div class="add-sign-card__head"><span class="add-sign-card__name">' +
          escapeHtml(tpl.name) +
          '</span><em class="coupon-card__status coupon-card__status--' +
          (tpl.status === 'enabled' ? 'enabled' : 'disabled') +
          '">' +
          escapeHtml(Demo.signTemplateStatusLabel(tpl.status)) +
          '</em></div><div class="add-sign-card__meta">ID ' +
          escapeHtml(tpl.id) +
          ' · 签到次数 ' +
          escapeHtml(String(tpl.totalRounds || 0)) +
          '</div><div class="add-sign-card__rewards">奖励规则：' +
          escapeHtml(signRewardRulesText(tpl.rewards)) +
          '</div></div>'
        );
      })
      .join('');
  }

  function openAddSignDialog() {
    if (isEndedLocked()) return toastEndedLock('deliver');
    addSignUi.templateId = '';
    addSignUi.keyword = '';
    var kw = document.getElementById('addSignKeyword');
    if (kw) kw.value = '';
    renderAddSignList();
    openDialog('addSignDialog');
  }

  function confirmAddSign() {
    if (isEndedLocked()) return toastEndedLock('deliver');
    var sess = findSession(sessionId);
    if (!sess) return;
    var tpl = Demo.findSignTemplate ? Demo.findSignTemplate(addSignUi.templateId) : null;
    if (!tpl) return toast('请先选择签到活动', 'warning');
    if (tpl.status !== 'enabled') return toast('仅能添加启用中的签到模板', 'warning');
    if (!sess.templates) sess.templates = [];
    var planId = Demo.nextSignPlanId();
    sess.templates.push({
      id: planId,
      planId: planId,
      activityId: planId,
      templateId: tpl.id,
      type: 'SIGN_IN',
      typeName: '签到',
      deliveredCount: 0,
      roundsUsed: 0,
      interrupted: false,
      activeWindowId: null,
      stock: null
    });
    Demo.welfareWindowsOf(planId);
    welfareUi.planId = planId;
    closeDialog('addSignDialog');
    toast('已添加「' + tpl.name + '」');
    renderWelfareDrawer();
  }

  function filteredTaskTemplates() {
    var kw = String(addTaskUi.keyword || '').trim().toLowerCase();
    return (Demo.taskTemplates || []).filter(function (tpl) {
      if (!kw) return true;
      return (
        String(tpl.name || '').toLowerCase().indexOf(kw) >= 0 ||
        String(tpl.id || '').toLowerCase().indexOf(kw) >= 0
      );
    });
  }

  function renderAddTaskList() {
    var box = document.getElementById('addTaskList');
    if (!box) return;
    var list = filteredTaskTemplates();
    if (!list.length) {
      box.innerHTML = '<div class="add-coupon-empty">没有匹配的观看奖励模板</div>';
      return;
    }
    box.innerHTML = list
      .map(function (tpl) {
        var selectable = tpl.status === 'enabled';
        var selected = selectable && addTaskUi.templateId === tpl.id;
        return (
          '<div class="add-sign-card' +
          (selected ? ' add-sign-card--selected' : '') +
          (selectable ? '' : ' add-sign-card--disabled') +
          '" data-task-tpl="' +
          escapeHtml(tpl.id) +
          '"' +
          (selectable ? '' : ' data-disabled="1"') +
          '><div class="add-sign-card__head"><span class="add-sign-card__name">' +
          escapeHtml(tpl.name) +
          '</span><em class="coupon-card__status coupon-card__status--' +
          (tpl.status === 'enabled' ? 'enabled' : 'disabled') +
          '">' +
          escapeHtml(Demo.taskTemplateStatusLabel(tpl.status)) +
          '</em></div><div class="add-sign-card__meta">ID ' +
          escapeHtml(tpl.id) +
          ' · ' +
          escapeHtml(String((tpl.milestones || []).length)) +
          ' 档奖励</div><div class="add-sign-card__rewards">奖励规则：' +
          escapeHtml(taskRewardRulesText(tpl.milestones)) +
          '</div></div>'
        );
      })
      .join('');
  }

  function openAddTaskDialog() {
    if (isEndedLocked()) return toastEndedLock('deliver');
    addTaskUi.templateId = '';
    addTaskUi.keyword = '';
    var kw = document.getElementById('addTaskKeyword');
    if (kw) kw.value = '';
    renderAddTaskList();
    openDialog('addTaskDialog');
  }

  function confirmAddTask() {
    if (isEndedLocked()) return toastEndedLock('deliver');
    var sess = findSession(sessionId);
    if (!sess) return;
    var tpl = Demo.findTaskTemplate ? Demo.findTaskTemplate(addTaskUi.templateId) : null;
    if (!tpl) return toast('请先选择观看奖励活动', 'warning');
    if (tpl.status !== 'enabled') return toast('仅能添加启用中的观看奖励模板', 'warning');
    if (!sess.templates) sess.templates = [];
    var planId = Demo.nextTaskPlanId();
    sess.templates.push({
      id: planId,
      planId: planId,
      activityId: planId,
      templateId: tpl.id,
      type: 'TASK',
      typeName: '观看奖励',
      delivered: false,
      interrupted: false,
      deliveredCount: 0,
      activeWindowId: null,
      stock: null
    });
    Demo.welfareWindowsOf(planId);
    welfareUi.planId = planId;
    closeDialog('addTaskDialog');
    toast('已添加「' + tpl.name + '」');
    renderWelfareDrawer();
  }

  function closeActiveWindowsOfPlan(p, asInterrupted) {
    if (!p) return;
    var list = welfareWindowsOfPlan(welfarePlanIdOf(p));
    var i;
    for (i = 0; i < list.length; i++) {
      if (list[i].status === 'ACTIVE') {
        if (p.type === 'FORTUNE_BAG') settleBagRound(p, list[i]);
        list[i].status = 'CLOSED';
        list[i].endedAt = nowWelfareTs();
        if (asInterrupted) list[i].interrupted = true;
      }
    }
    p.activeWindowId = null;
  }

  function interruptWelfarePlan(p) {
    if (!p) return;
    p.interrupted = true;
    closeActiveWindowsOfPlan(p, true);
  }

  function incompleteTaskPlans(exceptPlanId) {
    return welfarePlans().filter(function (p) {
      if (welfarePlanIdOf(p) === exceptPlanId) return false;
      if (p.interrupted) return false;
      return !!(p.delivered && taskHasActiveWindow(p));
    });
  }

  function interruptTaskPlan(p) {
    interruptWelfarePlan(p);
  }

  function issueTaskActivity(plan) {
    var live = liveTaskFields(plan);
    var taskList = welfareWindowsOfPlan(welfarePlanIdOf(plan));
    var taskRoundIdx = nextRoundIndex(taskList);
    var taskWin = {
      id: Demo.nextWindowId(),
      roundIndex: taskRoundIdx,
      roundNo: taskRoundIdx + 1,
      startedAt: nowWelfareTs(),
      endedAt: tsAfterSec(TASK_DURATION_SEC),
      durationSec: TASK_DURATION_SEC,
      status: 'ACTIVE',
      participantCount: 0,
      participateTimes: 0
    };
    taskList.unshift(taskWin);
    plan.delivered = true;
    plan.activeWindowId = taskWin.id;
    publishActiveWatchReward(plan);
    toast('「' + live.name + '」发放成功，观众开始统计观看时长');
    welfareUi.tab = 'record';
    renderWelfareDrawer();
  }

  function incompleteSignPlans(exceptPlanId) {
    return welfarePlans().filter(function (p) {
      if (welfarePlanIdOf(p) === exceptPlanId) return false;
      if (p.interrupted) return false;
      var live = liveSignFields(p);
      var used = live.roundsUsed;
      return used > 0 && live.totalRounds > 0 && used < live.totalRounds;
    });
  }

  function interruptSignPlan(p) {
    interruptWelfarePlan(p);
  }

  function issueSignRound(plan) {
    var live = liveSignFields(plan);
    if (toastFillRequired()) return;
    var signDur = requiredPositiveInt(welfareUi.duration);
    var signMin = signDur.value;
    var signList = welfareWindowsOfPlan(welfarePlanIdOf(plan));
    var roundNo = live.roundsUsed + 1;
    var signWin = {
      id: Demo.nextWindowId(),
      roundIndex: nextRoundIndex(signList),
      roundNo: roundNo,
      startedAt: nowWelfareTs(),
      endedAt: tsAfterSec(signMin * 60),
      durationSec: signMin * 60,
      status: 'ACTIVE',
      participantCount: 0,
      participateTimes: 0
    };
    signList.unshift(signWin);
    plan.roundsUsed = roundNo;
    plan.activeWindowId = signWin.id;
    toast('「' + live.name + '」第 ' + roundNo + ' 次签到开闸成功');
    renderWelfareDrawer();
  }

  function nowWelfareTs() {
    return Demo.formatDemoTs ? Demo.formatDemoTs(new Date()) : formatWelfareTime(new Date().toISOString());
  }

  function tsAfterSec(sec) {
    return Demo.formatDemoTs
      ? Demo.formatDemoTs(new Date(Date.now() + sec * 1000))
      : formatWelfareTime(new Date(Date.now() + sec * 1000).toISOString());
  }

  function deliverWelfare() {
    if (isEndedLocked()) return toastEndedLock('deliver');
    var plan = selectedWelfarePlan();
    var kind = welfareUi.kind;
    if (kind === 'coupon') {
      if (!plan) return toast('请先选择优惠券活动', 'warning');
      var couponLock = couponLockedReason(plan);
      if (couponLock) return toast(couponLock, 'warning');
      if (plan.released) return toast('直播已结束，剩余库存已释放，不能再次发放', 'warning');
      var nextBlock = couponIssueBlockedReason(plan);
      if (nextBlock) return toast(nextBlock, 'warning');
      if (toastFillRequired()) return;
      var couponDur = requiredPositiveInt(welfareUi.duration);
      var couponQty = requiredPositiveInt(welfareUi.quantity);
      var durationMin = couponDur.value;
      var qty = couponQty.value;
      var remain = couponRemain(plan);
      if (qty > remain) return toast('本活动剩余发券库存不足（剩余 ' + remain + ' 张）', 'warning');
      var list = welfareWindowsOfPlan(welfarePlanIdOf(plan));
      list.unshift({
        id: Demo.nextWindowId(),
        roundIndex: nextRoundIndex(list),
        roundNo: nextRoundIndex(list) + 1,
        startedAt: nowWelfareTs(),
        endedAt: tsAfterSec(durationMin * 60),
        durationSec: durationMin * 60,
        status: 'ACTIVE',
        couponTotalStock: qty,
        couponClaimedCount: 0,
        couponUsedCount: 0,
        participantCount: 0,
        participateTimes: 0
      });
      plan.issuedQty = (plan.issuedQty || 0) + qty;
      plan.roundCount = (plan.roundCount || 0) + 1;
      plan.deliveredCount = plan.roundCount;
      plan.activeWindowId = list[0].id;
      toast('「' + liveCouponFields(plan).name + '」开闸成功');
      welfareUi.tab = 'record';
      renderWelfareDrawer();
      return;
    }
    if (kind === 'bag') {
      if (!plan) return toast('请先选择福袋活动', 'warning');
      if (plan.released) return toast('直播已结束，剩余库存已释放，不能再次发放', 'warning');
      if (planHasActiveWindow(plan)) return toast('上一轮福袋进行中，结束后可发放下一轮', 'warning');
      if (toastFillRequired()) return;
      var bagDur = requiredPositiveInt(welfareUi.duration);
      var bagWin = requiredPositiveInt(welfareUi.winnerCount);
      var bagMin = bagDur.value;
      var winners = bagWin.value;
      var bagRemain = couponRemain(plan);
      if (winners > bagRemain) return toast('本活动剩余福袋库存不足（剩余 ' + bagRemain + '）', 'warning');
      var drawType = welfareUi.drawType === 'ASSIGN' ? 'ASSIGN' : 'RANDOM';
      var assignUsers = welfareUi.assignUsers || [];
      if (drawType === 'ASSIGN' && assignUsers.length > winners) {
        return toast('指定中奖用户数量不得大于本轮福袋的中奖人数', 'warning');
      }
      var randomFill = drawType === 'ASSIGN' ? Math.max(0, winners - assignUsers.length) : 0;
      var live = liveBagFields(plan);
      var bagList = welfareWindowsOfPlan(welfarePlanIdOf(plan));
      var bagRoundIdx = nextRoundIndex(bagList);
      var bagWinRow = {
        id: Demo.nextWindowId(),
        roundIndex: bagRoundIdx,
        roundNo: bagRoundIdx + 1,
        startedAt: nowWelfareTs(),
        endedAt: tsAfterSec(bagMin * 60),
        durationSec: bagMin * 60,
        status: 'ACTIVE',
        participantCount: 0,
        participateTimes: 0,
        winnerCount: winners,
        winnerTotal: winners,
        randomFillCount: randomFill,
        drawType: drawType,
        assignedUserIds: drawType === 'ASSIGN' ? assignUsers.map(function (u) { return u.userId; }) : [],
        rewards:
          drawType === 'ASSIGN'
            ? assignUsers.map(function (u) {
                return { nickMasked: maskNick(u.nickname), prizeTitle: live.prizeTitle, userId: u.userId };
              })
            : []
      };
      bagList.unshift(bagWinRow);
      plan.issuedQty = (plan.issuedQty || 0) + winners;
      plan.roundCount = (plan.roundCount || 0) + 1;
      plan.deliveredCount = plan.roundCount;
      plan.activeWindowId = bagWinRow.id;
      welfareUi.assignUsers = [];
      toast(
        drawType === 'ASSIGN' && randomFill > 0
          ? '「' + live.name + '」开闸成功：指定 ' + assignUsers.length + ' 人中奖，其余 ' + randomFill + ' 人将从符合条件的参与人中随机抽取'
          : '「' + live.name + '」开闸成功'
      );
      welfareUi.tab = 'record';
      renderWelfareDrawer();
      return;
    }
    if (kind === 'sign') {
      if (!plan) return toast('请先选择签到活动', 'warning');
      if (plan.interrupted) return toast('该签到活动已中断，不能再次发放', 'warning');
      if (plan.activeWindowId) return toast('上一轮签到进行中，结束后可发放下一轮', 'warning');
      var liveSign = liveSignFields(plan);
      if (liveSign.totalRounds > 0 && liveSign.roundsUsed >= liveSign.totalRounds) {
        return toast('已完成全部轮次发放', 'warning');
      }
      if (toastFillRequired()) return;
      var others = incompleteSignPlans(welfarePlanIdOf(plan));
      if (liveSign.roundsUsed === 0 && others.length) {
        confirmDanmuAction(
          '确定要开启新的签到活动吗？',
          '当前有未发放完毕的签到活动，若开启新的活动，那么之前的活动将中断且无法再次发放。用户重新开始签到新的活动（之前签到活动已经领取的奖励正常有效）。',
          function () {
            others.forEach(interruptSignPlan);
            issueSignRound(plan);
          }
        );
        return;
      }
      issueSignRound(plan);
      return;
    }
    if (kind === 'task') {
      if (!plan) return toast('请先选择观看奖励活动', 'warning');
      if (plan.interrupted) return toast('该观看奖励活动已中断，不能再次发放', 'warning');
      if (plan.delivered) return toast('本活动已发放，不能重复发放', 'warning');
      var others = incompleteTaskPlans(welfarePlanIdOf(plan));
      if (others.length) {
        confirmDanmuAction(
          '确定要开启新的观看奖励活动吗？',
          '当前有未发放完毕的观看奖励活动，若开启新的活动，那么之前的活动将中断且无法再次发放。用户重新按照新的活动计算观看时间和奖励（之前活动已经领取的奖励正常有效）。',
          function () {
            others.forEach(interruptTaskPlan);
            issueTaskActivity(plan);
          }
        );
        return;
      }
      issueTaskActivity(plan);
      return;
    }
  }

  function unusedRoundStock(w, kind) {
    if (!w) return 0;
    if (kind === 'bag' || w.drawType || w.winnerTotal != null) {
      var planned = Number(w.winnerTotal != null ? w.winnerTotal : w.winnerCount) || 0;
      var granted = (w.rewards && w.rewards.length) || 0;
      return Math.max(0, planned - granted);
    }
    var stock = Number(w.couponTotalStock) || 0;
    var claimed = Number(w.couponClaimedCount) || 0;
    return Math.max(0, stock - claimed);
  }

  function rollbackWindowStock(plan, w, kind) {
    if (!plan || !w || w.stockRolledBack) return 0;
    var n = unusedRoundStock(w, kind);
    w.stockRolledBack = true;
    w.rolledBackQty = n;
    if (n > 0) {
      plan.issuedQty = Math.max(0, (Number(plan.issuedQty) || 0) - n);
    }
    return n;
  }

  function stopRoundWindow(plan, w, kind) {
    if (!w) return 0;
    if (kind === 'bag') settleBagRound(plan, w);
    w.status = 'CLOSED';
    w.endedAt = nowWelfareTs();
    w.interrupted = true;
    if (plan && String(plan.activeWindowId) === String(w.id)) plan.activeWindowId = null;
    return rollbackWindowStock(plan, w, kind);
  }

  function stopWelfareWindow(windowId, kind) {
    var roundOnly = kind === 'coupon' || kind === 'bag';
    var msg = roundOnly
      ? kind === 'bag'
        ? '确认提前停止此轮福袋？停止后本轮变为已中断，未领取的福袋库存回滚到本活动可发数量，该福袋仍可继续发放下一轮。'
        : '确认提前停止此轮发放？停止后本轮变为已中断，未领取的券库存回滚到本活动可发数量，该券仍可继续发放下一轮。'
      : kind === 'sign'
        ? '确认提前停止此轮签到？停止后该签到活动变为已中断，不能再次发放。'
        : kind === 'task'
          ? '确认提前停止该观看任务？停止后变为已中断，不能再次发放；已领取的奖励仍然有效。'
          : '确认提前停止此轮发放？';
    confirmDanmuAction('确认', msg, function () {
      var found = findWelfareWindowById(windowId);
      var plan = found ? found.plan : selectedWelfarePlan();
      var w = found ? found.window : null;
      var rolled = 0;
      if (roundOnly) rolled = stopRoundWindow(plan, w, kind);
      else interruptWelfarePlan(plan);
      if (kind === 'task' && plan) publishActiveWatchReward(plan);
      toast(
        roundOnly
          ? rolled > 0
            ? kind === 'bag'
              ? '已停止本轮，未领取 ' + rolled + ' 个已回滚到可发库存'
              : '已停止本轮，未领取 ' + rolled + ' 张已回滚到可发库存'
            : '已停止本轮'
          : '已停止，活动状态变为已中断'
      );
      renderWelfareDrawer();
    });
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
        var name = o.nickname || '匿名用户';
        var ch = String(name).charAt(0);
        var hue = 0;
        for (var i = 0; i < name.length; i++) hue += name.charCodeAt(i);
        hue = hue % 360;
        var level = o.level || 'Lv.0';
        var pay = orderPayDisplay(o);
        return (
          '<div class="lf-live-order-item">' +
          '<span class="lf-live-order-avatar" style="background:hsl(' +
          hue +
          ',58%,52%)">' +
          escapeHtml(ch) +
          '</span>' +
          '<div class="lf-live-order-item__mid">' +
          '<div class="lf-live-order-item__user">' +
          escapeHtml(name) +
          ' <em class="lf-live-order-lv">' +
          escapeHtml(level) +
          '</em></div>' +
          '<div class="lf-live-order-item__goods">' +
          escapeHtml(o.productName || '—') +
          (o.qty != null ? ' <span>x' + o.qty + '</span>' : '') +
          '</div>' +
          (o.spec
            ? '<div class="lf-live-order-item__spec">' + escapeHtml(o.spec) + '</div>'
            : '') +
          '</div>' +
          '<div class="lf-live-order-item__side">' +
          '<div class="lf-live-order-item__amount" title="' +
          escapeHtml(pay.title) +
          '">' +
          escapeHtml(pay.text) +
          '</div>' +
          '<span class="lf-live-order-status">' +
          escapeHtml(o.statusLabel || '—') +
          '</span>' +
          '<div class="lf-live-order-item__time">' +
          escapeHtml(o.time || '') +
          '</div></div></div>'
        );
      })
      .join('');
  }

  function chatItemHtml(m) {
    var cls = m.isAnchor ? ' is-anchor' : m.isSys ? ' is-sys' : '';
    if (m.blocked) cls += ' is-blocked';
    if (m.pinned) cls += ' is-pinned';
    var tags = '';
    if (m.pinned) tags += '<em class="lf-live-chat-item__tag lf-live-chat-item__tag--pin">已置顶</em>';
    if (m.blocked) tags += '<em class="lf-live-chat-item__tag">已屏蔽</em>';
    var pinAct =
      m.isSys || isEndedLocked()
        ? ''
        : '<button type="button" class="lf-live-chat-item__pin" data-chat-pin="' +
          (m.pinned ? 'off' : 'on') +
          '">' +
          (m.pinned ? '取消置顶' : '置顶') +
          '</button>';
    return (
      '<div class="lf-live-chat-item' +
      cls +
      '" data-chat-id="' +
      escapeHtml(m.id) +
      '">' +
      '<span class="lf-live-chat-item__user">' +
      escapeHtml(m.user) +
      '</span>' +
      '<span class="lf-live-chat-item__text">' +
      escapeHtml(m.text) +
      tags +
      '</span>' +
      '<span class="lf-live-chat-item__side">' +
      pinAct +
      '<span class="lf-live-chat-item__time">' +
      escapeHtml(formatChatTime(m.time)) +
      '</span></span></div>'
    );
  }

  function renderChatPager(filteredCount) {
    var el = document.getElementById('sidePaneChatPager');
    if (!el) return;
    var totalPages = Math.max(1, Math.ceil(filteredCount / chatPageSize) || 1);
    if (chatPage > totalPages) chatPage = totalPages;
    if (chatPage < 1) chatPage = 1;
    el.innerHTML =
      '<button type="button" data-chat-page="prev"' +
      (chatPage <= 1 ? ' disabled' : '') +
      '>上一页</button>' +
      '<span>' +
      chatPage +
      ' / ' +
      totalPages +
      '</span>' +
      '<button type="button" data-chat-page="next"' +
      (chatPage >= totalPages ? ' disabled' : '') +
      '>下一页</button>';
  }

  function renderChat(sess) {
    var box = document.getElementById('sidePaneChatList');
    var pinBox = document.getElementById('sidePaneChatPinned');
    var countEl = document.getElementById('sidePaneChatCount');
    if (!box) return;
    var all = (metricsOf(sess.id).chatMessages || []).slice();
    if (countEl) countEl.textContent = '弹幕总数 ' + all.length;
    var keyword = String(chatKeyword || '').trim().toLowerCase();
    function matchKw(m) {
      if (!keyword) return true;
      return (
        String(m.user || '').toLowerCase().indexOf(keyword) >= 0 ||
        String(m.text || '').toLowerCase().indexOf(keyword) >= 0
      );
    }
    var pinned = [];
    var others = [];
    all.forEach(function (m) {
      if (m && m.pinned) pinned.push(m);
      else others.push(m);
    });
    others = others.filter(matchKw).reverse();
    if (pinBox) {
      if (pinned.length) {
        pinBox.hidden = false;
        pinBox.innerHTML = pinned.map(chatItemHtml).join('');
      } else {
        pinBox.hidden = true;
        pinBox.innerHTML = '';
      }
    }
    if (!all.length) {
      box.innerHTML = '<div class="lf-live-empty-inline">暂无弹幕</div>';
      renderChatPager(0);
      return;
    }
    if (!others.length) {
      box.innerHTML = keyword
        ? '<div class="lf-live-empty-inline">没有符合条件的弹幕</div>'
        : '<div class="lf-live-empty-inline">暂无其他弹幕</div>';
      renderChatPager(0);
      return;
    }
    var totalPages = Math.max(1, Math.ceil(others.length / chatPageSize));
    if (chatPage > totalPages) chatPage = totalPages;
    if (chatPage < 1) chatPage = 1;
    var start = (chatPage - 1) * chatPageSize;
    var pageRows = others.slice(start, start + chatPageSize);
    box.innerHTML = pageRows.map(chatItemHtml).join('');
    renderChatPager(others.length);
  }

  function renderWatch(sess) {
    var box = document.getElementById('watchListBody');
    if (!box) return;
    var m = metricsOf(sess.id);
    var viewers = m.watchViewers || [];
    var visits = m.watchVisits || [];
    var onlineCount = viewers.filter(function (v) {
      return !!v.online;
    }).length;
    var onlineBtn = document.getElementById('watchTabOnline');
    var uniqueBtn = document.getElementById('watchTabUnique');
    var visitsBtn = document.getElementById('watchTabVisits');
    if (onlineBtn) onlineBtn.textContent = '当前在线(' + onlineCount + '人)';
    if (uniqueBtn) uniqueBtn.textContent = '累计观看(' + viewers.length + '人)';
    if (visitsBtn) visitsBtn.textContent = '观看人次(' + visits.length + '人次)';
    setActiveTab('watchSubTabs', 'data-watch-tab', watchTab);
    var sortBtn = document.getElementById('watchSortBtn');
    if (sortBtn) sortBtn.textContent = watchSortDesc ? '倒序' : '正序';
    var filterEl = document.getElementById('watchStatusFilter');
    if (filterEl) {
      filterEl.hidden = watchTab === 'visits';
      if (watchTab !== 'visits') filterEl.value = watchStatusFilter;
    }

    var rows;
    var emptyText;
    if (watchTab === 'visits') {
      rows = visits.slice();
      emptyText = '暂无观看人次';
      rows.sort(function (a, b) {
        var va = timeSortValue(a.enterTime);
        var vb = timeSortValue(b.enterTime);
        return watchSortDesc ? (va < vb ? 1 : va > vb ? -1 : 0) : va < vb ? -1 : va > vb ? 1 : 0;
      });
      if (!rows.length) {
        box.innerHTML = '<div class="lf-live-empty-inline">' + emptyText + '</div>';
        return;
      }
      box.innerHTML = rows
        .map(function (w) {
          return (
            '<div class="lf-live-watch-item">' +
            avatarHtml(w.nickname) +
            '<div class="lf-live-watch-item__body">' +
            '<div class="lf-live-watch-item__user">' +
            escapeHtml(w.nickname || '匿名用户') +
            '</div>' +
            '<div class="lf-live-watch-item__meta">进入 ' +
            escapeHtml(w.enterTime || '—') +
            ' · 离开 ' +
            escapeHtml(w.leaveTime ? w.leaveTime : '观看中') +
            '<br>停留 ' +
            escapeHtml(w.stayDuration || '—') +
            '</div></div></div>'
          );
        })
        .join('');
      return;
    }

    rows = viewers.filter(function (v) {
      if (watchTab === 'online' && !v.online) return false;
      var muted = isUserMuted(m, v.userId, v.nickname) || !!v.muted;
      if (watchStatusFilter === 'muted' && !muted) return false;
      if (watchStatusFilter === 'normal' && muted) return false;
      return true;
    });
    rows.sort(function (a, b) {
      var va = timeSortValue(a.lastEnterTime);
      var vb = timeSortValue(b.lastEnterTime);
      return watchSortDesc ? (va < vb ? 1 : va > vb ? -1 : 0) : va < vb ? -1 : va > vb ? 1 : 0;
    });
    emptyText = watchTab === 'online' ? '暂无在线观众' : '暂无累计观看';
    if (!rows.length) {
      box.innerHTML = '<div class="lf-live-empty-inline">' + emptyText + '</div>';
      return;
    }
    box.innerHTML = rows
      .map(function (w) {
        var muted = isUserMuted(m, w.userId, w.nickname) || !!w.muted;
        return (
          '<div class="lf-live-watch-item" data-user-id="' +
          escapeHtml(w.userId || '') +
          '" data-nickname="' +
          escapeHtml(w.nickname || '') +
          '">' +
          avatarHtml(w.nickname) +
          '<div class="lf-live-watch-item__body">' +
          '<div class="lf-live-watch-item__user">' +
          escapeHtml(w.nickname || '匿名用户') +
          (muted ? ' <span class="lf-live-badge lf-live-badge--danger">禁言</span>' : '') +
          '</div>' +
          '<div class="lf-live-watch-item__meta">最近进入 ' +
          escapeHtml(w.lastEnterTime || '—') +
          '<br>进入 ' +
          escapeHtml(String(w.enterCount || 1)) +
          '次 · 累计观看 ' +
          escapeHtml(w.totalDuration || '—') +
          '</div></div>' +
          '<div class="lf-live-watch-item__ops"><a href="#" data-watch-act="' +
          (muted ? 'unmute' : 'mute') +
          '"' +
          (isEndedLocked() ? ' aria-disabled="true" class="is-disabled"' : '') +
          '>' +
          (muted ? '恢复' : '禁言') +
          '</a></div></div>'
        );
      })
      .join('');
  }

  function readLikeReportQueue() {
    try {
      var raw = localStorage.getItem(LIKE_REPORT_KEY);
      var data = raw ? JSON.parse(raw) : null;
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  function writeLikeReportQueue(list) {
    try {
      localStorage.setItem(LIKE_REPORT_KEY, JSON.stringify(list || []));
    } catch (e) {}
  }

  function applyLikeReport(m, report) {
    var count = Math.max(0, Math.floor(Number(report && report.count) || 0));
    if (!count) return false;
    var userId = String((report && report.userId) || '');
    var nickname = String((report && (report.nickname || report.user)) || '匿名用户');
    var time = String((report && report.time) || nowDateTime());
    m.likes = Math.max(0, Math.floor(Number(m.likes) || 0)) + count;
    var users = m.likeUsers;
    var found = null;
    var i;
    for (i = 0; i < users.length; i++) {
      if ((userId && users[i].userId === userId) || (!userId && users[i].nickname === nickname)) {
        found = users[i];
        break;
      }
    }
    var total = (found ? Math.max(0, Math.floor(Number(found.totalCount) || 0)) : 0) + count;
    if (found) {
      found.totalCount = total;
      if (nickname) found.nickname = nickname;
    } else {
      users.unshift({
        userId: userId,
        nickname: nickname,
        totalCount: total
      });
    }
    m.likeDetails.unshift({
      id: (report && report.id) || 'ld-' + Date.now(),
      userId: userId,
      nickname: nickname,
      time: time,
      count: count,
      totalCount: total
    });
    return true;
  }

  function ingestLikeReports() {
    if (!sessionId) return false;
    var queue = readLikeReportQueue();
    if (!queue.length) return false;
    var keep = [];
    var changed = false;
    var m = metricsOf(sessionId);
    queue.forEach(function (r) {
      if (!r) return;
      if (r.sessionId && r.sessionId !== sessionId) {
        keep.push(r);
        return;
      }
      if (applyLikeReport(m, r)) changed = true;
    });
    if (keep.length !== queue.length) writeLikeReportQueue(keep);
    return changed;
  }

  function renderLikeRecords(sess) {
    var box = document.getElementById('likeListBody');
    if (!box) return;
    var m = metricsOf(sess.id);
    var details = m.likeDetails || [];
    var users = m.likeUsers || [];
    var detailBtn = document.getElementById('likeTabDetail');
    var userBtn = document.getElementById('likeTabUsers');
    if (detailBtn) detailBtn.textContent = '点赞明细(' + details.length + ')';
    if (userBtn) userBtn.textContent = '点赞人数(' + users.length + ')';
    setActiveTab('likeSubTabs', 'data-like-tab', likeTab);
    var sortBtn = document.getElementById('likeSortBtn');
    if (sortBtn) sortBtn.textContent = likeSortDesc ? '倒序' : '正序';
    var rows;
    var emptyText;
    if (likeTab === 'users') {
      rows = users.slice();
      emptyText = '暂无点赞人数';
      rows.sort(function (a, b) {
        var va = Math.max(0, Math.floor(Number(a.totalCount) || 0));
        var vb = Math.max(0, Math.floor(Number(b.totalCount) || 0));
        if (va === vb) return 0;
        return likeSortDesc ? (va < vb ? 1 : -1) : va < vb ? -1 : 1;
      });
      if (!rows.length) {
        box.innerHTML = '<div class="lf-live-empty-inline">' + emptyText + '</div>';
        return;
      }
      box.innerHTML = rows
        .map(function (u) {
          return (
            '<div class="lf-live-watch-item">' +
            avatarHtml(u.nickname) +
            '<div class="lf-live-watch-item__body">' +
            '<div class="lf-live-watch-item__user">' +
            escapeHtml(u.nickname || '匿名用户') +
            '</div>' +
            '<div class="lf-live-watch-item__meta">累计点赞次数 ' +
            escapeHtml(String(u.totalCount || 0)) +
            '</div></div></div>'
          );
        })
        .join('');
      return;
    }
    rows = details.slice();
    emptyText = '暂无点赞明细';
    rows.sort(function (a, b) {
      var va = timeSortValue(a.time);
      var vb = timeSortValue(b.time);
      return likeSortDesc ? (va < vb ? 1 : va > vb ? -1 : 0) : va < vb ? -1 : va > vb ? 1 : 0;
    });
    if (!rows.length) {
      box.innerHTML = '<div class="lf-live-empty-inline">' + emptyText + '</div>';
      return;
    }
    box.innerHTML = rows
      .map(function (r) {
        return (
          '<div class="lf-live-watch-item">' +
          avatarHtml(r.nickname) +
          '<div class="lf-live-watch-item__body">' +
          '<div class="lf-live-watch-item__user">' +
          escapeHtml(r.nickname || '匿名用户') +
          '</div>' +
          '<div class="lf-live-watch-item__meta">点赞时间 ' +
          escapeHtml(r.time || '—') +
          '<br>点赞次数 ' +
          escapeHtml(String(r.count || 0)) +
          ' · 累计点赞次数 ' +
          escapeHtml(String(r.totalCount || 0)) +
          '</div></div></div>'
        );
      })
      .join('');
  }

  function renderSidePanes(sess) {
    var metrics = document.getElementById('sidePaneMetrics');
    var chat = document.getElementById('sidePaneChat');
    var watch = document.getElementById('sidePaneWatch');
    var like = document.getElementById('sidePaneLike');
    var orderWrap = document.getElementById('monitorOrderWrap');
    if (metrics) metrics.hidden = sideTab !== 'metrics';
    if (chat) chat.hidden = sideTab !== 'chat';
    if (watch) watch.hidden = sideTab !== 'watch';
    if (like) like.hidden = sideTab !== 'like';
    if (orderWrap) orderWrap.hidden = sideTab !== 'metrics';
    setActiveTab('controlSideTabs', 'data-side-tab', sideTab);
    if (sideTab === 'metrics') renderMonitor(sess);
    if (sideTab === 'chat') renderChat(sess);
    if (sideTab === 'watch') renderWatch(sess);
    if (sideTab === 'like') renderLikeRecords(sess);
  }

  function refreshInteractUi() {
    var sess = findSession(sessionId);
    if (!sess) return;
    renderDanmuOverlay(sess);
    if (sideTab === 'chat') renderChat(sess);
    if (sideTab === 'watch') renderWatch(sess);
    if (sideTab === 'like') renderLikeRecords(sess);
    syncCState();
    syncEndedLock();
  }

  function pickHandleHtml() {
    return '<span class="lf-live-pick__handle" title="拖拽排序"></span>';
  }

  function moveItemById(list, fromId, toId) {
    var from = -1;
    var to = -1;
    list.forEach(function (it, i) {
      if (it.id === fromId) from = i;
      if (it.id === toId) to = i;
    });
    if (from < 0 || to < 0 || from === to) return list;
    var item = list.splice(from, 1)[0];
    list.splice(to, 0, item);
    return list;
  }

  function bindSortableList(listEl, idAttr, onMove) {
    if (!listEl || listEl.getAttribute('data-sortable') === '1') return;
    listEl.setAttribute('data-sortable', '1');
    var dragId = '';
    listEl.addEventListener('mousedown', function (ev) {
      var item = ev.target.closest('.lf-live-pick__item');
      if (!item) return;
      item.draggable = !!ev.target.closest('.lf-live-pick__handle');
    });
    listEl.addEventListener('dragstart', function (ev) {
      var item = ev.target.closest('.lf-live-pick__item');
      if (!item || !item.draggable) {
        ev.preventDefault();
        return;
      }
      dragId = item.getAttribute(idAttr) || '';
      item.classList.add('is-dragging');
      ev.dataTransfer.effectAllowed = 'move';
      try {
        ev.dataTransfer.setData('text/plain', dragId);
      } catch (e) {}
    });
    listEl.addEventListener('dragend', function () {
      listEl.querySelectorAll('.is-dragging, .is-dragover').forEach(function (el) {
        el.classList.remove('is-dragging', 'is-dragover');
        el.draggable = false;
      });
      dragId = '';
    });
    listEl.addEventListener('dragover', function (ev) {
      ev.preventDefault();
      var over = ev.target.closest('.lf-live-pick__item');
      listEl.querySelectorAll('.is-dragover').forEach(function (el) {
        if (el !== over) el.classList.remove('is-dragover');
      });
      if (over && over.getAttribute(idAttr) !== dragId) over.classList.add('is-dragover');
    });
    listEl.addEventListener('drop', function (ev) {
      ev.preventDefault();
      var over = ev.target.closest('.lf-live-pick__item');
      var fromId = dragId || (ev.dataTransfer && ev.dataTransfer.getData('text/plain'));
      var toId = over && over.getAttribute(idAttr);
      listEl.querySelectorAll('.is-dragover').forEach(function (el) {
        el.classList.remove('is-dragover');
      });
      if (!fromId || !toId || fromId === toId) return;
      onMove(fromId, toId);
    });
  }

  function closePickPanels() {
    var replyBox = document.getElementById('quickReplyBox');
    var commentBox = document.getElementById('quickCommentBox');
    var replyBtn = document.getElementById('btnQuickReply');
    var commentBtn = document.getElementById('btnQuickComment');
    if (replyBox) replyBox.hidden = true;
    if (commentBox) commentBox.hidden = true;
    if (replyBtn) replyBtn.classList.remove('is-open');
    if (commentBtn) commentBtn.classList.remove('is-open');
  }

  function togglePickPanel(boxId, btnId) {
    var box = document.getElementById(boxId);
    var btn = document.getElementById(btnId);
    if (!box || !btn) return;
    var willOpen = box.hidden;
    closePickPanels();
    if (!willOpen) return;
    box.hidden = false;
    btn.classList.add('is-open');
  }

  function readJsonMap(key) {
    try {
      var raw = localStorage.getItem(key);
      var data = raw ? JSON.parse(raw) : null;
      if (data && typeof data === 'object' && !Array.isArray(data)) return data;
    } catch (e) {}
    return {};
  }

  function writeJsonMap(key, map) {
    try {
      localStorage.setItem(key, JSON.stringify(map || {}));
    } catch (e) {}
  }

  function defaultQuickReplies() {
    return QUICK_REPLIES.map(function (text, i) {
      return { id: 'qr-' + (i + 1), text: text };
    });
  }

  function normalizeReplyList(list) {
    return (list || [])
      .filter(function (it) {
        return it && String(it.text || it).trim();
      })
      .slice(0, QUICK_REPLY_MAX)
      .map(function (it, i) {
        return {
          id: String((it && it.id) || 'qr-' + (i + 1)),
          text: String((it && it.text) || it)
            .trim()
            .slice(0, QUICK_REPLY_MAX_LEN)
        };
      });
  }

  function readQuickReplies() {
    if (!sessionId) return defaultQuickReplies();
    var map = readJsonMap(QUICK_REPLY_KEY);
    var list = map[sessionId];
    if (Array.isArray(list) && list.length) return normalizeReplyList(list);
    return defaultQuickReplies();
  }

  function writeQuickReplies(list) {
    if (!sessionId) return;
    var map = readJsonMap(QUICK_REPLY_KEY);
    map[sessionId] = (list || []).map(function (it) {
      return { id: it.id, text: it.text };
    });
    writeJsonMap(QUICK_REPLY_KEY, map);
  }

  function updateQuickReplyLen() {
    var input = document.getElementById('quickReplyInput');
    var el = document.getElementById('quickReplyLen');
    var n = ((input && input.value) || '').length;
    if (el) el.textContent = n + '/' + QUICK_REPLY_MAX_LEN;
  }

  function renderQuickReplies() {
    var listEl = document.getElementById('quickReplyList');
    if (!listEl) return;
    var items = readQuickReplies();
    if (!items.length) {
      listEl.innerHTML = '<div class="lf-live-pick__empty">暂无快捷回复，请在下方新增</div>';
      return;
    }
    listEl.innerHTML = items
      .map(function (it) {
        return (
          '<div class="lf-live-pick__item" data-reply-id="' +
          escapeHtml(it.id) +
          '">' +
          pickHandleHtml() +
          '<button type="button" class="lf-live-pick__text" data-reply="' +
          escapeHtml(it.text) +
          '">' +
          escapeHtml(it.text) +
          '</button>' +
          '<button type="button" class="lf-live-pick__x" data-reply-del="' +
          escapeHtml(it.id) +
          '" aria-label="删除">×</button>' +
          '</div>'
        );
      })
      .join('');
    updateQuickReplyLen();
  }

  function addQuickReplyFromInput() {
    var input = document.getElementById('quickReplyInput');
    var text = ((input && input.value) || '').trim();
    if (!text) return toast('请输入回复内容', 'warning');
    if (text.length > QUICK_REPLY_MAX_LEN) return toast('回复最多30个字', 'warning');
    if (rejectSensitive(text)) return;
    var items = readQuickReplies();
    if (items.length >= QUICK_REPLY_MAX) return toast('最多添加10条快捷回复', 'warning');
    var dup = items.some(function (it) {
      return it.text === text;
    });
    if (dup) return toast('该回复语已存在', 'warning');
    items.push({ id: 'qr-' + Date.now(), text: text });
    writeQuickReplies(items);
    if (input) input.value = '';
    renderQuickReplies();
    scrollPickListToBottom('quickReplyList');
    toast('已新增快捷回复');
  }

  function cloneQuickCommentState(state) {
    return {
      items: ((state && state.items) || []).map(function (it) {
        return { id: it.id, text: it.text };
      }),
      selectedIds: ((state && state.selectedIds) || []).slice()
    };
  }

  function defaultQuickCommentState() {
    return {
      items: DEFAULT_QUICK_COMMENTS.map(function (it) {
        return { id: it.id, text: it.text };
      }),
      selectedIds: DEFAULT_QUICK_COMMENTS.map(function (it) {
        return it.id;
      })
    };
  }

  function parseQuickCommentState(data) {
    if (!data || !Array.isArray(data.items)) return null;
    var items = data.items
      .filter(function (it) {
        return it && String(it.text || '').trim();
      })
      .slice(0, QUICK_COMMENT_MAX)
      .map(function (it, i) {
        return {
          id: String(it.id || 'qc-' + (i + 1)),
          text: String(it.text || '')
            .trim()
            .slice(0, QUICK_COMMENT_MAX_LEN)
        };
      });
    var idMap = {};
    items.forEach(function (it) {
      idMap[it.id] = true;
    });
    var selectedIds = (Array.isArray(data.selectedIds) ? data.selectedIds : [])
      .map(String)
      .filter(function (id) {
        return !!idMap[id];
      });
    return { items: items, selectedIds: selectedIds };
  }

  function readQuickCommentState() {
    if (!sessionId) return defaultQuickCommentState();
    var parsed = parseQuickCommentState(readJsonMap(QUICK_COMMENT_KEY)[sessionId]);
    return parsed || defaultQuickCommentState();
  }

  function writeQuickCommentState(state) {
    if (!sessionId) return;
    var map = readJsonMap(QUICK_COMMENT_KEY);
    map[sessionId] = cloneQuickCommentState(state);
    writeJsonMap(QUICK_COMMENT_KEY, map);
  }

  function hasSavedQuickComments() {
    if (!sessionId) return false;
    var data = readJsonMap(QUICK_COMMENT_KEY)[sessionId];
    return !!(data && Array.isArray(data.items));
  }

  function selectedQuickCommentTexts(state) {
    var src = state || readQuickCommentState();
    var selected = {};
    (src.selectedIds || []).forEach(function (id) {
      selected[id] = true;
    });
    return (src.items || [])
      .filter(function (it) {
        return it && selected[it.id];
      })
      .map(function (it) {
        return it.text;
      })
      .filter(Boolean);
  }

  function selectedQuickCommentTextsForSync() {
    if (!hasSavedQuickComments()) return [];
    return selectedQuickCommentTexts();
  }

  function updateQuickCommentBtn() {
    var btn = document.getElementById('btnQuickComment');
    if (!btn) return;
    var n = selectedQuickCommentTextsForSync().length;
    btn.textContent = n ? '一键评论(' + n + ')' : '一键评论';
  }

  function persistQuickComments(state) {
    writeQuickCommentState(state);
    updateQuickCommentBtn();
    syncCState();
  }

  function updateQuickCommentLen() {
    var input = document.getElementById('quickCommentInput');
    var el = document.getElementById('quickCommentLen');
    var n = ((input && input.value) || '').length;
    if (el) el.textContent = n + '/' + QUICK_COMMENT_MAX_LEN;
  }

  function renderQuickCommentPanel() {
    var list = document.getElementById('quickCommentList');
    if (!list) return;
    var state = readQuickCommentState();
    if (!state.items.length) {
      list.innerHTML = '<div class="lf-live-pick__empty">暂无一键评论，请在下方新增</div>';
    } else {
      list.innerHTML = state.items
        .map(function (it) {
          var on = state.selectedIds.indexOf(it.id) >= 0;
          return (
            '<div class="lf-live-pick__item' +
            (on ? ' is-on' : '') +
            '" data-qc-id="' +
            escapeHtml(it.id) +
            '">' +
            pickHandleHtml() +
            '<button type="button" class="lf-live-pick__text" data-qc-toggle="' +
            escapeHtml(it.id) +
            '">' +
            escapeHtml(it.text) +
            '</button>' +
            PICK_CHECK +
            '<button type="button" class="lf-live-pick__x" data-qc-del="' +
            escapeHtml(it.id) +
            '" aria-label="删除">×</button>' +
            '</div>'
          );
        })
        .join('');
    }
    updateQuickCommentLen();
  }

  function scrollPickListToBottom(listId) {
    var list = document.getElementById(listId);
    if (!list) return;
    list.scrollTop = list.scrollHeight;
  }

  function addQuickCommentFromInput() {
    var input = document.getElementById('quickCommentInput');
    var text = ((input && input.value) || '').trim();
    if (!text) return toast('请输入评论内容', 'warning');
    if (text.length > QUICK_COMMENT_MAX_LEN) return toast('评论最多20个字', 'warning');
    if (rejectSensitive(text)) return;
    var state = readQuickCommentState();
    if (state.items.length >= QUICK_COMMENT_MAX) {
      return toast('最多添加10个一键评论', 'warning');
    }
    var dup = state.items.some(function (it) {
      return it.text === text;
    });
    if (dup) return toast('该评论语已存在', 'warning');
    var id = 'qc-' + Date.now();
    state.items.push({ id: id, text: text });
    state.selectedIds.push(id);
    persistQuickComments(state);
    if (input) input.value = '';
    renderQuickCommentPanel();
    scrollPickListToBottom('quickCommentList');
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
    processScheduled();
    ingestLikeReports();
    renderHeader(sess);
    renderBroadcast(sess);
    renderMainTabs();
    renderProductPanes();
    renderSidePanes(sess);
    updateQuickCommentBtn();
    syncCState();
    syncEndedLock();
  }

  function pushChat(text, extra) {
    var m = metricsOf(sessionId);
    var item = {
      id: 'c-' + Date.now(),
      user: virtualUser || '主播小丰',
      userId: virtualUser ? 'u-virtual' : 'u-anchor',
      text: text,
      time: nowTime(),
      isAnchor: !virtualUser
    };
    if (extra) {
      Object.keys(extra).forEach(function (k) {
        item[k] = extra[k];
      });
    }
    m.chatMessages = m.chatMessages || [];
    m.chatMessages.push(item);
  }

  function copyText(val, input) {
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
      return;
    }
    if (input) input.select();
    try {
      document.execCommand('copy');
      toast('推流地址已复制');
    } catch (e) {
      toast('复制失败，请手动选择', 'warning');
    }
  }

  function parseAutoCloseAt(val) {
    var raw = String(val == null ? '' : val).trim();
    if (!raw) return null;
    var ts = parseSessionTs(raw);
    return isFinite(ts) ? ts : null;
  }

  function setSwitchOn(el, on) {
    if (!el) return;
    el.classList.toggle('is-on', !!on);
    el.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  function isSwitchOn(el) {
    return !!(el && el.classList.contains('is-on'));
  }

  function syncDlgAutoCloseExtra() {
    var extra = document.getElementById('dlgAutoCloseExtra');
    if (extra) extra.hidden = !isSwitchOn(document.getElementById('dlgAutoCloseEnabled'));
  }

  function getRadioValue(name, fallback) {
    var el = document.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : fallback;
  }

  function setRadioValue(name, value) {
    document.querySelectorAll('input[name="' + name + '"]').forEach(function (el) {
      el.checked = el.value === value;
    });
  }

  function readCViewerFromDialog() {
    var clamp = Demo.clampInt || function (v, min, max, fb) {
      var n = Math.floor(Number(v));
      if (!isFinite(n)) return fb;
      if (n < min) return min;
      if (n > max) return max;
      return n;
    };
    var initialMax = Demo.C_VIEWER_INITIAL_MAX || 999999;
    var extraMax = Demo.C_VIEWER_EXTRA_MAX || 100;
    var display = getRadioValue('dlgCViewerDisplay', 'online');
    if (display !== 'unique' && display !== 'visits') display = 'online';
    var extraMin = clamp((document.getElementById('dlgCViewerExtraMin') || {}).value, 0, extraMax, 0);
    var extraMaxVal = clamp((document.getElementById('dlgCViewerExtraMax') || {}).value, 0, extraMax, 0);
    return {
      display: display,
      initial: clamp((document.getElementById('dlgCViewerInitial') || {}).value, 0, initialMax, 0),
      extraMin: extraMin,
      extraMax: extraMaxVal
    };
  }

  function readCLikeFromDialog() {
    var clamp = Demo.clampInt || function (v, min, max, fb) {
      var n = Math.floor(Number(v));
      if (!isFinite(n)) return fb;
      if (n < min) return min;
      if (n > max) return max;
      return n;
    };
    var likeMax = Demo.C_LIKE_VALUE_MAX || 999999;
    var extraMin = clamp((document.getElementById('dlgCLikeExtraMin') || {}).value, 0, likeMax, 0);
    var extraMaxVal = clamp((document.getElementById('dlgCLikeExtraMax') || {}).value, 0, likeMax, 0);
    return {
      initial: clamp((document.getElementById('dlgCLikeInitial') || {}).value, 0, likeMax, 0),
      intervalMin: clamp((document.getElementById('dlgCLikeInterval') || {}).value, 0, likeMax, 0),
      extraMin: extraMin,
      extraMax: extraMaxVal
    };
  }

  function fillCloseSettingsDialog(sess) {
    var atEl = document.getElementById('dlgAutoCloseAt');
    var enabledSw = document.getElementById('dlgAutoCloseEnabled');
    var cfg = typeof Demo.normalizeCViewerConfig === 'function' ? Demo.normalizeCViewerConfig(sess) : {
      display: 'online',
      initial: 0,
      extraMin: 0,
      extraMax: 0
    };
    var likeCfg = typeof Demo.normalizeCLikeConfig === 'function' ? Demo.normalizeCLikeConfig(sess) : {
      initial: 0,
      intervalMin: 0,
      extraMin: 0,
      extraMax: 0
    };
    setSwitchOn(enabledSw, !!(sess && sess.autoCloseEnabled));
    if (atEl) {
      var ts = sess && sess.autoCloseAt ? parseSessionTs(sess.autoCloseAt) : NaN;
      atEl.value = isFinite(ts) ? toLocalInput(ts) : '';
    }
    setRadioValue('dlgCViewerDisplay', cfg.display);
    var initialEl = document.getElementById('dlgCViewerInitial');
    var extraMinEl = document.getElementById('dlgCViewerExtraMin');
    var extraMaxEl = document.getElementById('dlgCViewerExtraMax');
    if (initialEl) initialEl.value = cfg.initial;
    if (extraMinEl) extraMinEl.value = cfg.extraMin;
    if (extraMaxEl) extraMaxEl.value = cfg.extraMax;
    var likeInitialEl = document.getElementById('dlgCLikeInitial');
    var likeIntervalEl = document.getElementById('dlgCLikeInterval');
    var likeExtraMinEl = document.getElementById('dlgCLikeExtraMin');
    var likeExtraMaxEl = document.getElementById('dlgCLikeExtraMax');
    if (likeInitialEl) likeInitialEl.value = likeCfg.initial;
    if (likeIntervalEl) likeIntervalEl.value = likeCfg.intervalMin;
    if (likeExtraMinEl) likeExtraMinEl.value = likeCfg.extraMin;
    if (likeExtraMaxEl) likeExtraMaxEl.value = likeCfg.extraMax;
    syncDlgAutoCloseExtra();
  }

  function openDialog(id) {
    var el = document.getElementById(id);
    if (el) el.hidden = false;
  }

  function closeDialog(id) {
    var el = document.getElementById(id);
    if (el) el.hidden = true;
    if (id === 'danmuConfirmDialog') pendingConfirm = null;
  }

  function confirmDanmuAction(title, hint, onOk) {
    var titleEl = document.getElementById('danmuConfirmTitle');
    var hintEl = document.getElementById('danmuConfirmHint');
    if (titleEl) titleEl.textContent = title || '确认';
    if (hintEl) hintEl.textContent = hint || '';
    pendingConfirm = onOk;
    openDialog('danmuConfirmDialog');
  }

  function eligibleSchedIds(ids) {
    return (ids || []).filter(function (id) {
      var found = findProduct(id);
      return found && !found.item.inCart && normalizeSchedStatus(found.item.status) === 'enabled';
    });
  }

  function openAddCartDialog(ids) {
    pendingAddIds = eligibleSchedIds(ids);
    if (!pendingAddIds.length) return toast('请先勾选要添加的选品', 'warning');
    var title = document.getElementById('addCartTitle');
    var hint = document.getElementById('addCartHint');
    var batch = pendingAddIds.length > 1;
    if (title) title.textContent = batch ? '批量添加到直播商品' : '添加到直播商品';
    if (hint) {
      hint.textContent = batch
        ? '将添加已选的 ' + pendingAddIds.length + ' 件商品，请选择状态。'
        : '请选择加入直播商品后的状态。';
    }
    setRadioValue('addCartSaleMode', 'selling');
    openDialog('addCartDialog');
  }

  function applyAddToCart(ids, saleMode) {
    var mode = normalizeSaleMode(saleMode);
    var n = 0;
    eligibleSchedIds(ids).forEach(function (id) {
      var found = findProduct(id);
      if (!found) return;
      addToCart(found.item, mode);
      delete selectedSched[id];
      n += 1;
    });
    return n;
  }

  function moveCart(p, dir) {
    compactCartSort();
    return insertCartAt(p, p.cartSort + dir);
  }

  function handleCartAct(act, card, btn) {
    var endedOk = { expand: 1, select: 1, 'sale-mode': 1, remove: 1, 'sku-toggle': 1 };
    if (isEndedLocked() && !endedOk[act]) {
      toastEndedLock();
      return;
    }
    var found = findProduct(card.getAttribute('data-id'));
    if (!found) return;
    var p = found.item;
    ensureControlFields(p, found.index);

    if (act === 'select') {
      selectedCart[p.id] = !selectedCart[p.id];
      renderCart();
      return;
    }
    if (act === 'expand') {
      expandedIds[p.id] = !expandedIds[p.id];
      render();
      return;
    }
    if (act === 'seq-save') {
      var seqInput = card.querySelector('[data-seq-input]');
      var raw = seqInput ? seqInput.value : '';
      if (raw === '' || !isFinite(Number(raw))) {
        if (seqInput) seqInput.value = String(p.cartSort || 1);
        return toast('请输入有效序号', 'warning');
      }
      if (!insertCartAt(p, raw)) {
        if (seqInput) seqInput.value = String(p.cartSort || 1);
        return;
      }
      toast('已调整到序号 ' + p.cartSort);
      productsOf(sessionId).forEach(syncLiveStatus);
      render();
      return;
    }
    if (act === 'sale-mode') {
      var mode = btn.getAttribute('data-mode') || 'selling';
      p.saleMode = mode === 'preview' ? 'preview' : 'selling';
      syncLiveStatus(p);
      toast(p.saleMode === 'preview' ? '已设为预告，C 端仅展示暂不可购买' : '已设为上架，C 端可正常下单');
    } else if (act === 'preview-price') {
      p.previewPriceMode = btn.getAttribute('data-mode') || 'sale';
      toast(
        p.previewPriceMode === 'question'
          ? '预告价展示为问号'
          : p.previewPriceMode === 'market'
            ? '预告价展示为划线价'
            : '预告价展示为售价'
      );
    } else if (act === 'pin') {
      if (p.saleMode === 'selling' && p.liveStatus === 'sold_out') {
        return toast('商品已售罄，暂不支持置顶', 'warning');
      }
      if (p.pinned) {
        p.pinned = false;
        toast('已取消置顶，回到原序号 ' + p.cartSort);
      } else {
        clearPinExcept(p.id);
        p.pinned = true;
        toast('已临时置顶，原序号 ' + p.cartSort + ' 不变');
      }
    } else if (act === 'explain') {
      if (p.saleMode === 'selling' && p.liveStatus === 'sold_out') {
        return toast('商品已售罄，暂不支持讲解', 'warning');
      }
      if (p.explaining) {
        p.explaining = false;
        toast('已取消讲解，回到原序号 ' + p.cartSort);
      } else {
        clearExplainExcept(p.id);
        p.explaining = true;
        toast('已设为讲解中，C 端展示讲解卡片，原序号不变');
      }
      syncLiveStatus(p);
    } else if (act === 'remove') {
      removeFromCart(p);
      toast('已下架，不再展示于直播商品（C 端小黄车）');
    } else if (act === 'sku-toggle') {
      var skuRow = btn.closest('[data-sku-id]');
      var sku = skuRow ? findSku(p, skuRow.getAttribute('data-sku-id')) : null;
      if (!sku) return;
      sku.enabled = sku.enabled === false;
      syncLiveStatus(p);
      toast(sku.enabled !== false ? 'SKU 已上架' : 'SKU 已下架');
    } else if (act === 'sku-save') {
      var saveRow = btn.closest('[data-sku-id]');
      var saveSku = saveRow ? findSku(p, saveRow.getAttribute('data-sku-id')) : null;
      var saveInput = saveRow ? saveRow.querySelector('[data-stock-input]') : null;
      if (!saveSku || !saveInput) return;
      var n = Math.floor(Number(saveInput.value));
      if (isNaN(n) || n < 0) return toast('请输入有效库存', 'warning');
      saveSku.stock = n;
      if (pendingStock[p.id]) delete pendingStock[p.id][saveSku.id];
      syncLiveStatus(p);
      toast('库存已保存');
    } else {
      return;
    }
    productsOf(sessionId).forEach(syncLiveStatus);
    render();
  }

  function bindEvents() {
    document.addEventListener(
      'click',
      function (ev) {
        if (!isEndedLocked()) return;
        if (ev.target.closest('#sidebar-container, #header-container, #controlPicker, #controlBackBtn')) {
          return;
        }
        if (!ev.target.closest('#controlWorkspace, .lf-live-dialog, #danmuActMenu, #welfareDrawer')) {
          return;
        }
        var el = ev.target.closest(
          'button, a, [data-act], [data-watch-act], [data-chat-pin], [data-pin-close], [data-danmu-act], [data-send-mode], .lf-live-switch, .lf-live-pick__item, .lf-live-pick__add-btn, .lf-live-sched-add'
        );
        if (!el) return;
        if (isEndedViewOnlyEl(el)) return;
        ev.preventDefault();
        ev.stopPropagation();
        toastEndedLock();
      },
      true
    );

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
        if (sess.status === 'ended') return toastEndedLock();
        sess.status = 'live';
        stampActualStart(sess);
        processScheduled();
        toast('已开始直播');
        render();
      });
    }
    if (stopBtn) {
      stopBtn.addEventListener('click', function () {
        var sess = findSession(sessionId);
        if (!sess) return;
        if (isEndedLocked()) return toastEndedLock();
        sess.status = 'ended';
        stampActualEnd(sess);
        var rel = releaseEndedWelfareStock(sess);
        toast(rel.any ? endedStockToast('已关闭直播', rel) : '已关闭直播');
        render();
      });
    }

    var pushBtn = document.getElementById('btnPushUrl');
    if (pushBtn) {
      pushBtn.addEventListener('click', function () {
        openDialog('pushUrlDialog');
      });
    }
    document.querySelectorAll('[data-close-dialog]').forEach(function (el) {
      el.addEventListener('click', function () {
        closeDialog(el.getAttribute('data-close-dialog'));
      });
    });
    var copyBtn = document.getElementById('btnCopyPush');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var input = document.getElementById('broadcastPushUrl');
        copyText((input && input.value) || '', input);
      });
    }

    var mainTabs = document.getElementById('controlMainTabs');
    if (mainTabs) {
      mainTabs.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-main-tab]');
        if (!btn) return;
        var tab = btn.getAttribute('data-main-tab');
        mainTab = tab;
        if (tab === 'product') closeWelfareDrawer();
        else openWelfareDrawer(tab);
        renderMainTabs();
      });
    }
    var subTabs = document.getElementById('controlProductSubTabs');
    if (subTabs) {
      subTabs.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-product-tab]');
        if (!btn) return;
        productTab = btn.getAttribute('data-product-tab');
        render();
      });
    }
    var goSched = document.getElementById('btnGoSched');
    if (goSched) {
      goSched.addEventListener('click', function () {
        productTab = 'sched';
        render();
      });
    }
    var settingsBtn = document.getElementById('btnCartSettings');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', function () {
        var sess = findSession(sessionId);
        if (!sess) return;
        fillCloseSettingsDialog(sess);
        openDialog('cartSettingsDialog');
      });
    }
    var settingsEnabledSw = document.getElementById('dlgAutoCloseEnabled');
    if (settingsEnabledSw) {
      settingsEnabledSw.addEventListener('click', function () {
        setSwitchOn(settingsEnabledSw, !isSwitchOn(settingsEnabledSw));
        syncDlgAutoCloseExtra();
      });
    }
    var settingsConfirm = document.getElementById('cartSettingsConfirm');
    if (settingsConfirm) {
      settingsConfirm.addEventListener('click', function () {
        var sess = findSession(sessionId);
        if (!sess) return;
        var enabled = isSwitchOn(document.getElementById('dlgAutoCloseEnabled'));
        var closeAtRaw = ((document.getElementById('dlgAutoCloseAt') || {}).value || '').trim();
        var closeTs = parseAutoCloseAt(closeAtRaw);
        if (enabled) {
          if (closeTs == null) return toast('请选择关播时间', 'warning');
          if (closeTs <= Date.now()) return toast('关播时间必须大于当前时间', 'warning');
        }
        var viewer = readCViewerFromDialog();
        if (viewer.extraMin > viewer.extraMax) {
          return toast('额外跟随人数下限不能大于上限', 'warning');
        }
        var likeCfg = readCLikeFromDialog();
        if (likeCfg.extraMin > likeCfg.extraMax) {
          return toast('点赞增长下限不能大于上限', 'warning');
        }
        sess.autoCloseEnabled = enabled;
        if (enabled || closeTs != null) {
          sess.autoCloseAt = closeTs != null ? fromLocalInput(closeAtRaw) : '';
        }
        sess.cViewerDisplay = viewer.display;
        sess.cViewerInitial = viewer.initial;
        sess.cViewerExtraMin = viewer.extraMin;
        sess.cViewerExtraMax = viewer.extraMax;
        sess.cLikeInitial = likeCfg.initial;
        sess.cLikeIntervalMin = likeCfg.intervalMin;
        sess.cLikeExtraMin = likeCfg.extraMin;
        sess.cLikeExtraMax = likeCfg.extraMax;
        closeDialog('cartSettingsDialog');
        toast('设置已保存');
        render();
      });
    }
    var sideTabs = document.getElementById('controlSideTabs');
    if (sideTabs) {
      sideTabs.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-side-tab]');
        if (!btn) return;
        sideTab = btn.getAttribute('data-side-tab');
        closeDanmuMenu();
        render();
      });
    }

    var watchSubTabs = document.getElementById('watchSubTabs');
    if (watchSubTabs) {
      watchSubTabs.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-watch-tab]');
        if (!btn) return;
        watchTab = btn.getAttribute('data-watch-tab');
        var sess = findSession(sessionId);
        if (sess) renderWatch(sess);
      });
    }
    var watchSortBtn = document.getElementById('watchSortBtn');
    if (watchSortBtn) {
      watchSortBtn.addEventListener('click', function () {
        watchSortDesc = !watchSortDesc;
        var sess = findSession(sessionId);
        if (sess) renderWatch(sess);
      });
    }
    var watchFilter = document.getElementById('watchStatusFilter');
    if (watchFilter) {
      watchFilter.addEventListener('change', function () {
        watchStatusFilter = watchFilter.value || '';
        var sess = findSession(sessionId);
        if (sess) renderWatch(sess);
      });
    }
    var likeSubTabs = document.getElementById('likeSubTabs');
    if (likeSubTabs) {
      likeSubTabs.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-like-tab]');
        if (!btn) return;
        likeTab = btn.getAttribute('data-like-tab');
        var sess = findSession(sessionId);
        if (sess) renderLikeRecords(sess);
      });
    }
    var likeSortBtn = document.getElementById('likeSortBtn');
    if (likeSortBtn) {
      likeSortBtn.addEventListener('click', function () {
        likeSortDesc = !likeSortDesc;
        var sess = findSession(sessionId);
        if (sess) renderLikeRecords(sess);
      });
    }
    var watchBody = document.getElementById('watchListBody');
    if (watchBody) {
      watchBody.addEventListener('click', function (ev) {
        var actEl = ev.target.closest('[data-watch-act]');
        if (!actEl) return;
        ev.preventDefault();
        if (isEndedLocked()) return toastEndedLock('interact');
        var row = actEl.closest('.lf-live-watch-item');
        if (!row) return;
        var userId = row.getAttribute('data-user-id') || '';
        var nickname = row.getAttribute('data-nickname') || '';
        var on = actEl.getAttribute('data-watch-act') === 'mute';
        confirmDanmuAction(
          on ? '确认禁言' : '确认取消禁言',
          on
            ? '禁言后「' + (nickname || '该用户') + '」本场将无法发言。'
            : '恢复后「' + (nickname || '该用户') + '」可在本场继续发言。',
          function () {
            setUserMuted(userId, nickname, on);
            toast(on ? '已对该用户本场禁言' : '已恢复该用户本场发言');
            refreshInteractUi();
          }
        );
      });
    }

    var overlay = document.getElementById('broadcastDanmu');
    if (overlay) {
      overlay.addEventListener('click', function (ev) {
        var item = ev.target.closest('[data-chat-id]');
        if (!item) return;
        var msg = findChatById(item.getAttribute('data-chat-id'));
        openDanmuMenu(ev, msg);
      });
    }
    var pinBox = document.getElementById('broadcastDanmuPin');
    if (pinBox) {
      pinBox.addEventListener('click', function (ev) {
        var closeBtn = ev.target.closest('[data-pin-close]');
        var item = ev.target.closest('[data-chat-id]');
        if (!item) return;
        ev.preventDefault();
        ev.stopPropagation();
        var msg = findChatById(item.getAttribute('data-chat-id'));
        if (!msg || !msg.pinned) return;
        if (closeBtn) {
          if (isEndedLocked()) return toastEndedLock('interact');
          confirmDanmuAction('确认取消置顶', '取消后观众端左上角将不再展示该评论。', function () {
            setChatPinned(msg, false);
            closeDanmuMenu();
            toast('已取消置顶');
            refreshInteractUi();
          });
          return;
        }
        openDanmuMenu(ev, msg);
      });
    }
    var chatList = document.getElementById('sidePaneChat');
    if (chatList) {
      chatList.addEventListener('click', function (ev) {
        var pinBtn = ev.target.closest('[data-chat-pin]');
        if (pinBtn) {
          ev.preventDefault();
          ev.stopPropagation();
          if (isEndedLocked()) return toastEndedLock('interact');
          var row = pinBtn.closest('[data-chat-id]');
          var msg = findChatById(row && row.getAttribute('data-chat-id'));
          if (!msg || msg.isSys) return;
          var willPin = pinBtn.getAttribute('data-chat-pin') === 'on';
          confirmDanmuAction(
            willPin ? '确认置顶' : '确认取消置顶',
            willPin
              ? '置顶后该评论将展示在观众端左上角，原置顶会被替换。'
              : '取消后观众端左上角将不再展示该评论。',
            function () {
              setChatPinned(msg, willPin);
              closeDanmuMenu();
              toast(willPin ? '已置顶，C 端左上角同步展示' : '已取消置顶');
              refreshInteractUi();
            }
          );
          return;
        }
        var item = ev.target.closest('[data-chat-id]');
        if (!item) return;
        var menuMsg = findChatById(item.getAttribute('data-chat-id'));
        openDanmuMenu(ev, menuMsg);
      });
    }
    var danmuMenu = document.getElementById('danmuActMenu');
    if (danmuMenu) {
      danmuMenu.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-danmu-act]');
        if (!btn) return;
        ev.stopPropagation();
        if (isEndedLocked()) {
          closeDanmuMenu();
          return toastEndedLock('interact');
        }
        var msg = danmuMenuTarget;
        var act = btn.getAttribute('data-danmu-act');
        closeDanmuMenu();
        if (!msg) return;
        if (act === 'pin') {
          if (msg.isSys) return;
          var willPin = !msg.pinned;
          confirmDanmuAction(
            willPin ? '确认置顶' : '确认取消置顶',
            willPin
              ? '置顶后该评论将展示在观众端左上角，原置顶会被替换。'
              : '取消后观众端左上角将不再展示该评论。',
            function () {
              setChatPinned(msg, willPin);
              toast(willPin ? '已置顶，C 端左上角同步展示' : '已取消置顶');
              refreshInteractUi();
            }
          );
          return;
        }
        if (act === 'mute') {
          if (msg.isAnchor || msg.isSys) return;
          var muted = isUserMuted(metricsOf(sessionId), msg.userId, msg.user);
          confirmDanmuAction(
            muted ? '确认取消禁言' : '确认禁言',
            muted
              ? '恢复后「' + (msg.user || '该用户') + '」可在本场继续发言。'
              : '禁言后「' + (msg.user || '该用户') + '」本场将无法发言。',
            function () {
              setUserMuted(msg.userId, msg.user, !muted);
              toast(muted ? '已恢复该用户本场发言' : '已对该用户本场禁言');
              refreshInteractUi();
            }
          );
          return;
        }
        if (act === 'block') {
          msg.blocked = !msg.blocked;
          if (msg.blocked) msg.pinned = false;
          toast(msg.blocked ? '该弹幕已屏蔽，C 端不再展示' : '已取消屏蔽');
          refreshInteractUi();
          return;
        }
        if (act === 'reply') {
          var input = document.getElementById('danmuReplyText');
          if (input) {
            input.value = '@' + (msg.user || '') + ' ';
          }
          openDialog('danmuReplyDialog');
          window.setTimeout(function () {
            if (!input) return;
            input.focus();
            input.selectionStart = input.selectionEnd = input.value.length;
          }, 0);
        }
      });
    }
    document.addEventListener('click', function (ev) {
      var menu = document.getElementById('danmuActMenu');
      if (!menu || menu.hidden) return;
      if (ev.target.closest('#danmuActMenu') || ev.target.closest('[data-chat-id]')) return;
      closeDanmuMenu();
    });
    var replySend = document.getElementById('danmuReplySend');
    var replySendPin = document.getElementById('danmuReplySendPin');
    function sendReplyDanmu(pin) {
      if (isEndedLocked()) return toastEndedLock('interact');
      var input = document.getElementById('danmuReplyText');
      var text = ((input && input.value) || '').trim();
      if (!text) return toast('请输入消息内容', 'warning');
      if (rejectSensitive(text)) return;
      function doSend() {
        pushChat(text);
        if (pin) {
          var msgs = metricsOf(sessionId).chatMessages || [];
          setChatPinned(msgs[msgs.length - 1], true);
        }
        if (input) input.value = '';
        closeDialog('danmuReplyDialog');
        toast(pin ? '已置顶发送' : '消息已发送');
        refreshInteractUi();
      }
      doSend();
    }
    if (replySend) {
      replySend.addEventListener('click', function () {
        sendReplyDanmu(false);
      });
    }
    if (replySendPin) {
      replySendPin.addEventListener('click', function () {
        sendReplyDanmu(true);
      });
    }

    var queryBtn = document.getElementById('schedFilterQuery');
    var resetBtn = document.getElementById('schedFilterReset');
    if (queryBtn) {
      queryBtn.addEventListener('click', function () {
        schedFilter = {
          name: ((document.getElementById('schedFilterName') || {}).value || '').trim(),
          sku: ((document.getElementById('schedFilterSku') || {}).value || '').trim(),
          category: (document.getElementById('schedFilterCategory') || {}).value || ''
        };
        renderSched();
      });
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        var name = document.getElementById('schedFilterName');
        var sku = document.getElementById('schedFilterSku');
        var cat = document.getElementById('schedFilterCategory');
        if (name) name.value = '';
        if (sku) sku.value = '';
        if (cat) cat.value = '';
        schedFilter = { name: '', sku: '', category: '' };
        renderSched();
      });
    }

    var cartQueryBtn = document.getElementById('cartFilterQuery');
    var cartResetBtn = document.getElementById('cartFilterReset');
    if (cartQueryBtn) {
      cartQueryBtn.addEventListener('click', function () {
        cartFilter = {
          name: ((document.getElementById('cartFilterName') || {}).value || '').trim(),
          sku: ((document.getElementById('cartFilterSku') || {}).value || '').trim()
        };
        renderCart();
      });
    }
    if (cartResetBtn) {
      cartResetBtn.addEventListener('click', function () {
        var name = document.getElementById('cartFilterName');
        var sku = document.getElementById('cartFilterSku');
        if (name) name.value = '';
        if (sku) sku.value = '';
        cartFilter = { name: '', sku: '' };
        renderCart();
      });
    }

    var cartList = document.getElementById('controlCartList');
    if (cartList) {
      cartList.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-act]');
        if (!btn || btn.matches('input[type="checkbox"]')) return;
        var card = btn.closest('[data-id]');
        if (!card) return;
        handleCartAct(btn.getAttribute('data-act'), card, btn);
      });
      cartList.addEventListener('input', function (ev) {
        var input = ev.target.closest('[data-stock-input]');
        if (!input) return;
        var card = input.closest('[data-id]');
        var skuRow = input.closest('[data-sku-id]');
        if (!card || !skuRow) return;
        var pid = card.getAttribute('data-id');
        var skuId = skuRow.getAttribute('data-sku-id');
        if (!pendingStock[pid]) pendingStock[pid] = {};
        pendingStock[pid][skuId] = input.value;
      });
      cartList.addEventListener('change', function (ev) {
        var check = ev.target.closest('[data-act="select"]');
        if (check) {
          var card = check.closest('[data-id]');
          if (!card) return;
          selectedCart[card.getAttribute('data-id')] = !!check.checked;
          renderCart();
        }
      });
      cartList.addEventListener('keydown', function (ev) {
        if (ev.key !== 'Enter') return;
        var seq = ev.target.closest('[data-seq-input]');
        if (!seq) return;
        ev.preventDefault();
        var card = seq.closest('[data-id]');
        if (card) handleCartAct('seq-save', card, seq);
      });
    }

    var cartSelectAll = document.getElementById('cartSelectAll');
    if (cartSelectAll) {
      cartSelectAll.addEventListener('change', function () {
        var on = !!cartSelectAll.checked;
        cartProducts().forEach(function (p) {
          selectedCart[p.id] = on;
        });
        renderCart();
      });
    }
    var btnCartBatchRemove = document.getElementById('btnCartBatchRemove');
    if (btnCartBatchRemove) {
      btnCartBatchRemove.addEventListener('click', function () {
        var ids = selectedCartIds();
        if (!ids.length) return toast('请先勾选要下架的商品', 'warning');
        ids.forEach(function (id) {
          var found = findProduct(id);
          if (found) removeFromCart(found.item);
        });
        toast('已批量下架 ' + ids.length + ' 件商品');
        render();
      });
    }
    var btnCartTimedRemove = document.getElementById('btnCartTimedRemove');
    if (btnCartTimedRemove) {
      btnCartTimedRemove.addEventListener('click', function () {
        var ids = selectedCartIds();
        if (!ids.length) return toast('请先勾选要定时下架的商品', 'warning');
        var hint = document.getElementById('timedRemoveHint');
        var input = document.getElementById('timedRemoveAt');
        if (hint) hint.textContent = '将定时下架已选的 ' + ids.length + ' 件商品。';
        if (input) input.value = toLocalInput(Date.now() + 5 * 60 * 1000);
        openDialog('timedRemoveDialog');
      });
    }
    var timedRemoveConfirm = document.getElementById('timedRemoveConfirm');
    if (timedRemoveConfirm) {
      timedRemoveConfirm.addEventListener('click', function () {
        var ids = selectedCartIds();
        var input = document.getElementById('timedRemoveAt');
        var ts = input && input.value ? new Date(input.value).getTime() : NaN;
        if (!ids.length) return toast('请先勾选商品', 'warning');
        if (isNaN(ts)) return toast('请选择下架时间', 'warning');
        ids.forEach(function (id) {
          var found = findProduct(id);
          if (found) found.item.removeAt = ts;
        });
        closeDialog('timedRemoveDialog');
        toast('已设置定时下架');
        render();
      });
    }

    var schedList = document.getElementById('controlSchedList');
    if (schedList) {
      schedList.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-act]');
        if (!btn || btn.matches('input[type="checkbox"]')) return;
        var card = btn.closest('[data-id]');
        if (!card) return;
        var act = btn.getAttribute('data-act');
        var found = findProduct(card.getAttribute('data-id'));
        if (!found) return;
        var p = found.item;
        if (act === 'add') {
          if (normalizeSchedStatus(p.status) !== 'enabled') {
            return toast('仅上架排品可添加到直播商品', 'warning');
          }
          openAddCartDialog([p.id]);
        }
      });
      schedList.addEventListener('change', function (ev) {
        var check = ev.target.closest('[data-act="select"]');
        if (!check) return;
        var card = check.closest('[data-id]');
        if (!card) return;
        selectedSched[card.getAttribute('data-id')] = !!check.checked;
        renderSched();
      });
    }
    var schedSelectAll = document.getElementById('schedSelectAll');
    if (schedSelectAll) {
      schedSelectAll.addEventListener('change', function () {
        var on = !!schedSelectAll.checked;
        schedProducts().forEach(function (p) {
          selectedSched[p.id] = on;
        });
        renderSched();
      });
    }
    var btnSchedBatchAdd = document.getElementById('btnSchedBatchAdd');
    if (btnSchedBatchAdd) {
      btnSchedBatchAdd.addEventListener('click', function () {
        var ids = selectedSchedIds();
        if (!ids.length) return toast('请先勾选要添加的选品', 'warning');
        openAddCartDialog(ids);
      });
    }
    var addCartConfirm = document.getElementById('addCartConfirm');
    if (addCartConfirm) {
      addCartConfirm.addEventListener('click', function () {
        if (!pendingAddIds.length) return toast('请先勾选要添加的选品', 'warning');
        var saleMode = normalizeSaleMode(getRadioValue('addCartSaleMode', 'selling'));
        var n = applyAddToCart(pendingAddIds, saleMode);
        closeDialog('addCartDialog');
        pendingAddIds = [];
        if (!n) return toast('没有可添加的商品', 'warning');
        toast(
          (n > 1 ? '已批量添加 ' + n + ' 件商品，状态为' : '已添加到直播商品，状态为') + saleModeLabel(saleMode)
        );
        productTab = 'cart';
        render();
      });
    }
    var btnSchedTimedAdd = document.getElementById('btnSchedTimedAdd');
    if (btnSchedTimedAdd) {
      btnSchedTimedAdd.addEventListener('click', function () {
        var ids = selectedSchedIds();
        if (!ids.length) return toast('请先勾选要定时添加的选品', 'warning');
        var hint = document.getElementById('timedAddHint');
        var input = document.getElementById('timedAddAt');
        if (hint) hint.textContent = '将为已选的 ' + ids.length + ' 件选品设置添加时间，请同时选择状态。';
        if (input) input.value = toLocalInput(Date.now() + 5 * 60 * 1000);
        var radios = document.querySelectorAll('input[name="timedAddMode"]');
        radios.forEach(function (r) {
          r.checked = r.value === 'at';
        });
        setRadioValue('timedAddSaleMode', 'selling');
        openDialog('timedAddDialog');
      });
    }
    var timedAddConfirm = document.getElementById('timedAddConfirm');
    if (timedAddConfirm) {
      timedAddConfirm.addEventListener('click', function () {
        var ids = selectedSchedIds();
        if (!ids.length) return toast('请先勾选选品', 'warning');
        var modeEl = document.querySelector('input[name="timedAddMode"]:checked');
        var mode = modeEl ? modeEl.value : 'at';
        var sess = findSession(sessionId);
        var ts = NaN;
        if (mode !== 'on_live_start') {
          var input = document.getElementById('timedAddAt');
          ts = input && input.value ? new Date(input.value).getTime() : NaN;
          if (isNaN(ts)) return toast('请选择添加时间', 'warning');
        }
        var saleMode = normalizeSaleMode(getRadioValue('timedAddSaleMode', 'selling'));
        ids.forEach(function (id) {
          var found = findProduct(id);
          if (!found || found.item.inCart) return;
          if (mode === 'on_live_start') {
            if (sess && sess.status === 'live') {
              addToCart(found.item, saleMode);
            } else {
              found.item.pendingAdd = { type: 'on_live_start', saleMode: saleMode };
            }
          } else {
            found.item.pendingAdd = { type: 'at', at: ts, saleMode: saleMode };
          }
        });
        closeDialog('timedAddDialog');
        toast(mode === 'on_live_start' ? '已设置为开播后自动添加（' + saleModeLabel(saleMode) + '）' : '已设置定时添加（' + saleModeLabel(saleMode) + '）');
        render();
      });
    }

    var muteBtn = document.getElementById('btnMuteChat');
    if (muteBtn) {
      muteBtn.addEventListener('click', function () {
        if (isEndedLocked()) return toastEndedLock('interact');
        var m = metricsOf(sessionId);
        var next = !m.muted;
        confirmDanmuAction(
          next ? '确认开启全场禁言' : '确认取消全场禁言',
          next ? '开启后观众将无法发送弹幕。' : '关闭后观众可继续发送弹幕。',
          function () {
            m.muted = next;
            toast(next ? '已开启禁言' : '已关闭禁言');
            render();
          }
        );
      });
    }

    var virtualBtn = document.getElementById('btnVirtualAccount');
    if (virtualBtn) {
      virtualBtn.addEventListener('click', function () {
        var next = window.prompt('请输入虚拟互动账号昵称', virtualUser || '场控小助手');
        if (next == null) return;
        virtualUser = String(next).trim();
        toast(virtualUser ? '当前虚拟账号：' + virtualUser : '已切回主播身份');
      });
    }

    var quickBtn = document.getElementById('btnQuickReply');
    var quickBox = document.getElementById('quickReplyBox');
    var quickList = document.getElementById('quickReplyList');
    if (quickBtn && quickBox) {
      quickBtn.addEventListener('click', function (ev) {
        ev.stopPropagation();
        if (quickBox.hidden) renderQuickReplies();
        togglePickPanel('quickReplyBox', 'btnQuickReply');
      });
    }
    if (quickList) {
      quickList.addEventListener('click', function (ev) {
        ev.stopPropagation();
        var del = ev.target.closest('[data-reply-del]');
        if (del) {
          ev.preventDefault();
          var delId = del.getAttribute('data-reply-del');
          writeQuickReplies(
            readQuickReplies().filter(function (it) {
              return it.id !== delId;
            })
          );
          renderQuickReplies();
          return;
        }
        var useBtn = ev.target.closest('[data-reply]');
        if (!useBtn) return;
        var input = document.getElementById('controlDanmuInput');
        if (input) input.value = useBtn.getAttribute('data-reply') || '';
        closePickPanels();
      });
      bindSortableList(quickList, 'data-reply-id', function (fromId, toId) {
        writeQuickReplies(moveItemById(readQuickReplies(), fromId, toId));
        renderQuickReplies();
      });
    }
    var qrAddBtn = document.getElementById('quickReplyAddBtn');
    if (qrAddBtn) qrAddBtn.addEventListener('click', addQuickReplyFromInput);
    var qrInput = document.getElementById('quickReplyInput');
    if (qrInput) {
      qrInput.addEventListener('input', updateQuickReplyLen);
      qrInput.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') {
          ev.preventDefault();
          addQuickReplyFromInput();
        }
      });
    }

    var qcBtn = document.getElementById('btnQuickComment');
    var qcBox = document.getElementById('quickCommentBox');
    if (qcBtn && qcBox) {
      qcBtn.addEventListener('click', function (ev) {
        ev.stopPropagation();
        if (qcBox.hidden) renderQuickCommentPanel();
        togglePickPanel('quickCommentBox', 'btnQuickComment');
      });
    }
    var qcList = document.getElementById('quickCommentList');
    if (qcList) {
      qcList.addEventListener('click', function (ev) {
        ev.stopPropagation();
        var del = ev.target.closest('[data-qc-del]');
        if (del) {
          ev.preventDefault();
          var delId = del.getAttribute('data-qc-del');
          var afterDel = readQuickCommentState();
          afterDel.items = afterDel.items.filter(function (it) {
            return it.id !== delId;
          });
          afterDel.selectedIds = afterDel.selectedIds.filter(function (sid) {
            return sid !== delId;
          });
          persistQuickComments(afterDel);
          renderQuickCommentPanel();
          return;
        }
        var item = ev.target.closest('[data-qc-id]');
        if (!item || ev.target.closest('.lf-live-pick__handle')) return;
        var id = item.getAttribute('data-qc-id');
        var state = readQuickCommentState();
        var idx = state.selectedIds.indexOf(id);
        if (idx >= 0) state.selectedIds.splice(idx, 1);
        else state.selectedIds.push(id);
        persistQuickComments(state);
        renderQuickCommentPanel();
      });
      bindSortableList(qcList, 'data-qc-id', function (fromId, toId) {
        var state = readQuickCommentState();
        state.items = moveItemById(state.items, fromId, toId);
        persistQuickComments(state);
        renderQuickCommentPanel();
      });
    }
    var qcAddBtn = document.getElementById('quickCommentAddBtn');
    if (qcAddBtn) {
      qcAddBtn.addEventListener('click', addQuickCommentFromInput);
    }
    var qcInput = document.getElementById('quickCommentInput');
    if (qcInput) {
      qcInput.addEventListener('input', updateQuickCommentLen);
      qcInput.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') {
          ev.preventDefault();
          addQuickCommentFromInput();
        }
      });
    }
    if (qcBox) {
      qcBox.addEventListener('click', function (ev) {
        ev.stopPropagation();
      });
    }
    if (quickBox) {
      quickBox.addEventListener('click', function (ev) {
        ev.stopPropagation();
      });
    }
    document.addEventListener('click', function (ev) {
      if (!ev.target || !document.body.contains(ev.target)) return;
      if (ev.target.closest('#quickReplyBox, #btnQuickReply, #quickCommentBox, #btnQuickComment')) return;
      closePickPanels();
    });

    var sendBtn = document.getElementById('btnSendDanmu');
    var sendMenu = document.getElementById('danmuSendMenu');
    var danmuInput = document.getElementById('controlDanmuInput');
    function closeSendMenu() {
      if (sendMenu) sendMenu.hidden = true;
    }
    function openSendMenu() {
      var text = ((danmuInput && danmuInput.value) || '').trim();
      if (!text) return toast('请输入弹幕内容', 'warning');
      if (rejectSensitive(text)) return;
      if (!sendMenu || !sendBtn) return;
      sendMenu.hidden = false;
      var rect = sendBtn.getBoundingClientRect();
      var mw = sendMenu.offsetWidth || 108;
      var mh = sendMenu.offsetHeight || 72;
      var x = rect.right - mw;
      var y = rect.top - mh - 6;
      if (y < 8) y = rect.bottom + 6;
      if (x < 8) x = 8;
      if (x + mw > window.innerWidth - 8) x = window.innerWidth - mw - 8;
      sendMenu.style.left = x + 'px';
      sendMenu.style.top = y + 'px';
    }
    function sendDanmu(pin) {
      if (isEndedLocked()) return toastEndedLock('danmu');
      var text = ((danmuInput && danmuInput.value) || '').trim();
      if (!text) return toast('请输入弹幕内容', 'warning');
      if (rejectSensitive(text)) return;
      closeSendMenu();
      function doSend() {
        pushChat(text);
        if (pin) {
          var msgs = metricsOf(sessionId).chatMessages || [];
          setChatPinned(msgs[msgs.length - 1], true);
        }
        if (danmuInput) danmuInput.value = '';
        toast(pin ? '已置顶发送' : '弹幕已发送');
        refreshInteractUi();
      }
      doSend();
    }
    if (sendBtn) {
      sendBtn.addEventListener('click', function (ev) {
        ev.stopPropagation();
        if (isEndedLocked()) return toastEndedLock('danmu');
        if (sendMenu && !sendMenu.hidden) {
          closeSendMenu();
          return;
        }
        openSendMenu();
      });
    }
    if (sendMenu) {
      sendMenu.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-send-mode]');
        if (!btn) return;
        ev.stopPropagation();
        sendDanmu(btn.getAttribute('data-send-mode') === 'pin');
      });
    }
    if (danmuInput) {
      danmuInput.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' && !ev.shiftKey) {
          ev.preventDefault();
          openSendMenu();
        }
      });
    }
    document.addEventListener('click', function (ev) {
      if (!sendMenu || sendMenu.hidden) return;
      if (ev.target.closest('#danmuSendMenu') || ev.target.closest('#btnSendDanmu')) return;
      closeSendMenu();
    });

    var chatKw = document.getElementById('chatKeywordInput');
    var chatQuery = document.getElementById('chatKeywordQuery');
    function applyChatQuery() {
      chatKeyword = ((chatKw && chatKw.value) || '').trim();
      chatPage = 1;
      var sess = findSession(sessionId);
      if (sess) renderChat(sess);
    }
    if (chatQuery) chatQuery.addEventListener('click', applyChatQuery);
    if (chatKw) {
      chatKw.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') {
          ev.preventDefault();
          applyChatQuery();
        }
      });
    }
    var chatPager = document.getElementById('sidePaneChatPager');
    if (chatPager) {
      chatPager.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-chat-page]');
        if (!btn || btn.disabled) return;
        var act = btn.getAttribute('data-chat-page');
        if (act === 'prev') chatPage -= 1;
        else if (act === 'next') chatPage += 1;
        var sess = findSession(sessionId);
        if (sess) renderChat(sess);
      });
    }

    var confirmOk = document.getElementById('danmuConfirmOk');
    if (confirmOk) {
      confirmOk.addEventListener('click', function () {
        var fn = pendingConfirm;
        pendingConfirm = null;
        closeDialog('danmuConfirmDialog');
        if (typeof fn === 'function') fn();
      });
    }

    var welfareDrawer = document.getElementById('welfareDrawer');
    if (welfareDrawer) {
      welfareDrawer.addEventListener('click', function (ev) {
        if (ev.target.closest('#welfareDrawerClose') || ev.target.closest('#welfareDrawerCancel')) {
          closeWelfareDrawer();
          return;
        }
        var innerTab = ev.target.closest('[data-welfare-tab]');
        if (innerTab) {
          welfareUi.tab = innerTab.getAttribute('data-welfare-tab') || 'issue';
          renderWelfareDrawer();
          return;
        }
        if (ev.target.closest('#btnAddCoupon')) {
          if (isEndedLocked()) return toastEndedLock('deliver');
          openAddCouponDialog();
          return;
        }
        if (ev.target.closest('#btnAddBag')) {
          if (isEndedLocked()) return toastEndedLock('deliver');
          openAddBagDialog();
          return;
        }
        if (ev.target.closest('#btnAddSign')) {
          if (isEndedLocked()) return toastEndedLock('deliver');
          openAddSignDialog();
          return;
        }
        if (ev.target.closest('#btnAddTask')) {
          if (isEndedLocked()) return toastEndedLock('deliver');
          openAddTaskDialog();
          return;
        }
        if (ev.target.closest('#btnSaveBagWin')) {
          saveBagWinRule();
          return;
        }
        if (ev.target.closest('#assignUserSearchBtn')) {
          if (isEndedLocked()) return toastEndedLock('deliver');
          searchAssignUsers();
          return;
        }
        var addUser = ev.target.closest('[data-assign-add]');
        if (addUser) {
          if (isEndedLocked()) return toastEndedLock('deliver');
          addAssignUser(addUser.getAttribute('data-assign-add'));
          return;
        }
        var rmUser = ev.target.closest('[data-assign-remove]');
        if (rmUser) {
          if (isEndedLocked()) return toastEndedLock('deliver');
          removeAssignUser(rmUser.getAttribute('data-assign-remove'));
          return;
        }
        var card = ev.target.closest('[data-plan-id]');
        if (card) {
          if (card.getAttribute('data-locked') && card.getAttribute('data-plan-id') !== welfareUi.planId) {
            toast(card.getAttribute('data-lock-reason') || '无法选择该活动', 'warning');
            return;
          }
          welfareUi.planId = card.getAttribute('data-plan-id') || '';
          renderWelfareDrawer();
          return;
        }
        if (ev.target.closest('#welfareDrawerRefresh')) {
          renderWelfareDrawer();
          return;
        }
        var stopBtn = ev.target.closest('[data-welfare-stop]');
        if (stopBtn) {
          if (isEndedLocked()) return toastEndedLock('deliver');
          stopWelfareWindow(stopBtn.getAttribute('data-welfare-stop'), stopBtn.getAttribute('data-welfare-stop-kind'));
          return;
        }
        if (ev.target.closest('#welfareDrawerPrimary')) {
          deliverWelfare();
        }
      });
      welfareDrawer.addEventListener('input', function (ev) {
        var el = ev.target;
        if (el.id === 'welfareDuration') welfareUi.duration = el.value;
        if (el.id === 'welfareQuantity') welfareUi.quantity = el.value;
        if (el.id === 'welfareWinnerCount') welfareUi.winnerCount = el.value;
        if (el.id === 'assignUserKeyword') welfareUi.assignKeyword = el.value;
        applyWelfarePrimary();
      });
      welfareDrawer.addEventListener('keydown', function (ev) {
        if (ev.target.id === 'assignUserKeyword' && ev.key === 'Enter') {
          ev.preventDefault();
          searchAssignUsers();
        }
      });
      welfareDrawer.addEventListener('change', function (ev) {
        if (ev.target.name === 'welfareDrawType') {
          welfareUi.drawType = ev.target.value;
          renderWelfareDrawer();
          return;
        }
        if (ev.target.name === 'bagWinRule') {
          welfareUi.bagWinDraft = ev.target.value;
        }
      });
    }

    var addBagList = document.getElementById('addBagList');
    if (addBagList) {
      addBagList.addEventListener('click', function (ev) {
        var row = ev.target.closest('[data-bag-tpl]');
        if (!row || row.getAttribute('data-disabled')) return;
        addBagUi.templateId = row.getAttribute('data-bag-tpl') || '';
        renderAddBagList();
      });
    }
    var addBagKw = document.getElementById('addBagKeyword');
    if (addBagKw) {
      addBagKw.addEventListener('input', function () {
        addBagUi.keyword = addBagKw.value || '';
        renderAddBagList();
      });
    }
    var addBagStock = document.getElementById('addBagStock');
    if (addBagStock) {
      addBagStock.addEventListener('input', function () {
        addBagUi.stock = addBagStock.value || '';
      });
    }
    var addBagConfirm = document.getElementById('addBagConfirm');
    if (addBagConfirm) {
      addBagConfirm.addEventListener('click', confirmAddBag);
    }
    var addSignList = document.getElementById('addSignList');
    if (addSignList) {
      addSignList.addEventListener('click', function (ev) {
        var row = ev.target.closest('[data-sign-tpl]');
        if (!row || row.getAttribute('data-disabled')) return;
        addSignUi.templateId = row.getAttribute('data-sign-tpl') || '';
        renderAddSignList();
      });
    }
    var addSignKw = document.getElementById('addSignKeyword');
    if (addSignKw) {
      addSignKw.addEventListener('input', function () {
        addSignUi.keyword = addSignKw.value || '';
        renderAddSignList();
      });
    }
    var addSignConfirm = document.getElementById('addSignConfirm');
    if (addSignConfirm) {
      addSignConfirm.addEventListener('click', confirmAddSign);
    }
    var addTaskList = document.getElementById('addTaskList');
    if (addTaskList) {
      addTaskList.addEventListener('click', function (ev) {
        var row = ev.target.closest('[data-task-tpl]');
        if (!row || row.getAttribute('data-disabled')) return;
        addTaskUi.templateId = row.getAttribute('data-task-tpl') || '';
        renderAddTaskList();
      });
    }
    var addTaskKw = document.getElementById('addTaskKeyword');
    if (addTaskKw) {
      addTaskKw.addEventListener('input', function () {
        addTaskUi.keyword = addTaskKw.value || '';
        renderAddTaskList();
      });
    }
    var addTaskConfirm = document.getElementById('addTaskConfirm');
    if (addTaskConfirm) {
      addTaskConfirm.addEventListener('click', confirmAddTask);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    sessionId = qs('sessionId');
    fillSessionSelect(sessionId);
    fillCategoryFilter();
    renderQuickReplies();
    bindEvents();
    render();
    startWelfareTick();
    window.setInterval(function () {
      if (!sessionId) return;
      if (processScheduled()) {
        render();
        if (welfareUi.open) renderWelfareDrawer();
      } else {
        var sess = findSession(sessionId);
        if (sess) {
          renderBroadcastStats(sess);
          syncCState();
        }
      }
    }, 5000);
    window.setInterval(function () {
      if (!sessionId) return;
      if (!ingestLikeReports()) return;
      var sess = findSession(sessionId);
      if (!sess) return;
      renderBroadcastStats(sess);
      if (sideTab === 'metrics') renderMonitor(sess);
      if (sideTab === 'like') renderLikeRecords(sess);
      syncCState();
    }, 1000);
  });
})();
