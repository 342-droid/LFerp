/* 丰银宝 · 供应商售后管理（卡片样式对齐用户 APP 退款/售后列表） */
(function () {
  if (!window.FybOrg || !window.FybOrg.ensureSupplierModeOrRedirect()) return;
  if (!window.FybSupplierAftersale || !window.FybSupplierFilters) return;

  var F = window.FybSupplierFilters;
  var AS = window.FybSupplierAftersale;
  var org = window.FybOrg.current();
  var state = { tab: 'ticket', status: '全部', time: 'all' };

  var params = new URLSearchParams(window.location.search || '');
  if (params.get('tab') === 'refund') state.tab = 'refund';

  var TICKET_STATUSES = ['全部', '待处理', '进行中', '已完结'];
  var REFUND_STATUSES = ['全部', '待退款', '退款执行中', '退款成功', '退款失败'];
  var CHEV =
    '<svg class="sa-as-bar__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>';

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function matchTicketStatus(t, status) {
    if (!status || status === '全部') return true;
    if (status === '待处理') return AS.isPendingBucket(t);
    if (status === '已完结') return AS.isDoneBucket(t);
    if (status === '进行中') return !AS.isPendingBucket(t) && !AS.isDoneBucket(t);
    return t.status === status;
  }

  function matchRefundStatus(r, status) {
    if (!status || status === '全部') return true;
    return r.status === status;
  }

  function ticketRows() {
    return AS.listTickets(org.name).filter(function (t) {
      if (!matchTicketStatus(t, state.status)) return false;
      return F.matchTime(t.applyTime, state.time);
    });
  }

  function refundRows() {
    return AS.listRefunds(org.name).filter(function (r) {
      if (!matchRefundStatus(r, state.status)) return false;
      return F.matchTime(r.createdAt, state.time);
    });
  }

  function progressView(t) {
    if (AS.canOperate(t)) {
      if (t.type === '退货退款') {
        return { title: '待商家收货', desc: t.tip || '用户已寄回，请确认收货' };
      }
      return { title: '待商家发货', desc: t.tip || '请上传补货快递单' };
    }
    if (t.type === '补货' && t.status === '待收货' && t.trackingNo) {
      return { title: '补货在途', desc: t.logisticsText || t.tip || '待用户签收' };
    }
    if (t.fulfill !== '快递' && (t.type === '退货退款' || t.type === '补货')) {
      return { title: t.status, desc: t.tip || '由门店或仓库处理' };
    }
    if (AS.isDoneBucket(t)) {
      return { title: t.status, desc: t.tip || '售后已完结' };
    }
    return { title: t.status, desc: t.tip || t.reason || '' };
  }

  function renderTabs() {
    var host = document.getElementById('saSupAsTabs');
    if (!host) return;
    host.querySelectorAll('[data-tab]').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-tab') === state.tab);
    });
  }

  function renderFilter() {
    var host = document.getElementById('saSupAsFilter');
    if (!host) return;
    var statuses = state.tab === 'refund' ? REFUND_STATUSES : TICKET_STATUSES;
    if (statuses.indexOf(state.status) < 0) state.status = '全部';
    host.innerHTML =
      '<div class="sa-sup-filter__l2" role="tablist" aria-label="状态筛选">' +
      statuses
        .map(function (s) {
          return F.chip(s, state.status === s, 'data-status');
        })
        .join('') +
      '</div>' +
      F.timeRowHtml(state.time);
  }

  function productImg(src) {
    return escapeHtml(src || AS.defaultImg || '../../user-app/assets/order-product-1.svg');
  }

  function ticketActions(t) {
    var btns = [];
    if (AS.hasTrackableLogistics(t)) {
      btns.push(
        '<button type="button" class="sa-as-card__btn" data-act="logistics">查看物流</button>'
      );
    }
    if (AS.canOperate(t)) {
      btns.push(
        '<button type="button" class="sa-as-card__btn sa-as-card__btn--primary" data-act="handle">处理售后</button>'
      );
    } else {
      btns.push(
        '<button type="button" class="sa-as-card__btn sa-as-card__btn--primary" data-act="detail">查看详情</button>'
      );
    }
    return '<div class="sa-as-card__actions">' + btns.join('') + '</div>';
  }

  function renderTicketList() {
    var host = document.getElementById('saSupAsList');
    if (!host) return;
    var list = ticketRows();
    if (!list.length) {
      host.innerHTML = '<div class="sa-as-empty">暂无售后单</div>';
      return;
    }
    host.innerHTML = list
      .map(function (t) {
        var view = progressView(t);
        return (
          '<article class="sa-as-card" data-ticket-id="' +
          escapeHtml(t.id) +
          '">' +
          '<div class="sa-as-card__head">' +
          '<span class="sa-as-card__shop">' +
          escapeHtml(t.orderSource + ' · ' + t.fulfill + ' · ' + t.orderNo) +
          '</span>' +
          '<span class="sa-as-card__type">' +
          escapeHtml(t.type) +
          '</span></div>' +
          '<button type="button" class="sa-as-card__product" data-act="detail">' +
          '<img class="sa-as-card__img" src="' +
          productImg(t.productImg) +
          '" alt="">' +
          '<span class="sa-as-card__info">' +
          '<span class="sa-as-card__name">' +
          escapeHtml(t.product) +
          '</span>' +
          '<span class="sa-as-card__spec">' +
          escapeHtml(t.spec || '') +
          ' ×' +
          escapeHtml(t.qty) +
          '</span>' +
          '<div class="sa-as-card__amount">金额: ¥ ' +
          escapeHtml(t.amount) +
          '</div></span></button>' +
          '<button type="button" class="sa-as-bar" data-act="detail">' +
          '<span class="sa-as-bar__title">' +
          escapeHtml(view.title) +
          '</span>' +
          (view.desc
            ? '<span class="sa-as-bar__desc">' + escapeHtml(view.desc) + '</span>'
            : '') +
          CHEV +
          '</button>' +
          ticketActions(t) +
          '</article>'
        );
      })
      .join('');
  }

  function renderRefundList() {
    var host = document.getElementById('saSupAsList');
    if (!host) return;
    var list = refundRows();
    if (!list.length) {
      host.innerHTML = '<div class="sa-as-empty">暂无退款单</div>';
      return;
    }
    host.innerHTML = list
      .map(function (r) {
        return (
          '<article class="sa-as-card" data-refund-id="' +
          escapeHtml(r.id) +
          '">' +
          '<div class="sa-as-card__head">' +
          '<span class="sa-as-card__shop">' +
          escapeHtml(r.source + ' · ' + r.orderNo) +
          '</span>' +
          '<span class="sa-as-card__type">' +
          escapeHtml(r.status) +
          '</span></div>' +
          '<button type="button" class="sa-as-card__product" data-act="refund">' +
          '<img class="sa-as-card__img" src="' +
          productImg(r.productImg) +
          '" alt="">' +
          '<span class="sa-as-card__info">' +
          '<span class="sa-as-card__name">' +
          escapeHtml(r.product || '退款') +
          '</span>' +
          '<span class="sa-as-card__spec">' +
          escapeHtml(r.method || '') +
          (r.aftersaleId ? ' · 售后 ' + r.aftersaleId : '') +
          '</span>' +
          '<div class="sa-as-card__amount">退款: ¥ ' +
          escapeHtml(r.amount) +
          '</div></span></button>' +
          '<button type="button" class="sa-as-bar" data-act="refund">' +
          '<span class="sa-as-bar__title">' +
          escapeHtml(r.status) +
          '</span>' +
          '<span class="sa-as-bar__desc">' +
          escapeHtml(r.createdAt) +
          '</span>' +
          CHEV +
          '</button>' +
          '<div class="sa-as-card__actions">' +
          (r.aftersaleId
            ? '<button type="button" class="sa-as-card__btn" data-act="as">查看售后单</button>'
            : '') +
          '<button type="button" class="sa-as-card__btn sa-as-card__btn--primary" data-act="refund">查看详情</button>' +
          '</div></article>'
        );
      })
      .join('');
  }

  function render() {
    renderTabs();
    renderFilter();
    if (state.tab === 'refund') renderRefundList();
    else renderTicketList();
  }

  function goTicketDetail(id) {
    window.location.href =
      'supplier-aftersale-detail.html?id=' + encodeURIComponent(id || '');
  }

  function goLogistics(ticket) {
    var payload = AS.buildLogisticsPayload(ticket);
    if (!payload) return;
    try {
      sessionStorage.setItem('pendingExpressOrder', JSON.stringify(payload));
      sessionStorage.setItem(
        'saSupAsLogisticsBack',
        'supplier-aftersale.html' + (state.tab === 'refund' ? '?tab=refund' : '')
      );
    } catch (e) {}
    window.location.href =
      'supplier-aftersale-logistics.html?id=' + encodeURIComponent(ticket.id);
  }

  function showRefundSheet(r) {
    var exist = document.getElementById('saSupRefundSheet');
    if (exist) exist.remove();
    var shell = document.querySelector('.sa-shell') || document.body;
    var mask = document.createElement('div');
    mask.id = 'saSupRefundSheet';
    mask.className = 'sa-sup-confirm-mask is-open';
    mask.innerHTML =
      '<div class="sa-sup-confirm sa-sup-refund-sheet" role="dialog" aria-modal="true">' +
      '<h3 class="sa-sup-confirm__title">退款单详情</h3>' +
      '<div class="sa-as-detail-product" style="margin:12px 0;text-align:left">' +
      '<img class="sa-as-detail-product__img" src="' +
      productImg(r.productImg) +
      '" alt="">' +
      '<div><div class="sa-as-card__name">' +
      escapeHtml(r.product || '退款') +
      '</div>' +
      '<div class="sa-as-card__spec">' +
      escapeHtml(r.method || '') +
      '</div>' +
      '<div class="sa-as-card__amount">¥ ' +
      escapeHtml(r.amount) +
      '</div></div></div>' +
      '<div class="sa-sup-od-grid" style="text-align:left;margin:12px 0">' +
      '<div class="sa-sup-od-kv"><span>退款单号</span><strong>' +
      escapeHtml(r.id) +
      '</strong></div>' +
      '<div class="sa-sup-od-kv"><span>状态</span><strong>' +
      escapeHtml(r.status) +
      '</strong></div>' +
      '<div class="sa-sup-od-kv"><span>来源</span><strong>' +
      escapeHtml(r.source) +
      '</strong></div>' +
      '<div class="sa-sup-od-kv"><span>订单号</span><strong>' +
      escapeHtml(r.orderNo) +
      '</strong></div>' +
      '<div class="sa-sup-od-kv"><span>售后单</span><strong>' +
      escapeHtml(r.aftersaleId || '—') +
      '</strong></div>' +
      '<div class="sa-sup-od-kv"><span>创建时间</span><strong>' +
      escapeHtml(r.createdAt) +
      '</strong></div></div>' +
      '<div class="sa-sup-confirm__actions">' +
      (r.aftersaleId
        ? '<button type="button" class="sa-sup-confirm__btn" data-c="as">查看售后单</button>'
        : '') +
      '<button type="button" class="sa-sup-confirm__btn sa-sup-confirm__btn--primary" data-c="ok">知道了</button>' +
      '</div></div>';
    shell.appendChild(mask);
    function close() {
      mask.remove();
    }
    mask.addEventListener('click', function (ev) {
      if (ev.target === mask) close();
    });
    var asBtn = mask.querySelector('[data-c="as"]');
    if (asBtn) {
      asBtn.addEventListener('click', function () {
        close();
        goTicketDetail(r.aftersaleId);
      });
    }
    mask.querySelector('[data-c="ok"]').addEventListener('click', close);
  }

  document.getElementById('saSupAsTabs').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-tab]');
    if (!btn) return;
    state.tab = btn.getAttribute('data-tab');
    state.status = '全部';
    render();
  });

  document.getElementById('saSupAsFilter').addEventListener('click', function (e) {
    var statusBtn = e.target.closest('[data-status]');
    if (statusBtn) {
      state.status = statusBtn.getAttribute('data-status');
      render();
      return;
    }
    var timeBtn = e.target.closest('[data-time]');
    if (!timeBtn) return;
    state.time = timeBtn.getAttribute('data-time');
    render();
  });

  document.getElementById('saSupAsList').addEventListener('click', function (e) {
    var ticketCard = e.target.closest('[data-ticket-id]');
    if (ticketCard) {
      var tid = ticketCard.getAttribute('data-ticket-id');
      var ticket = AS.findTicket(tid, org.name);
      var actBtn = e.target.closest('[data-act]');
      var act = actBtn ? actBtn.getAttribute('data-act') : 'detail';
      e.preventDefault();
      e.stopPropagation();
      if (act === 'handle') {
        goTicketDetail(tid);
        return;
      }
      if (act === 'logistics' && ticket) {
        goLogistics(ticket);
        return;
      }
      goTicketDetail(tid);
      return;
    }

    var refundCard = e.target.closest('[data-refund-id]');
    if (!refundCard) return;
    var rid = refundCard.getAttribute('data-refund-id');
    var refund = AS.findRefund(rid, org.name);
    var rActBtn = e.target.closest('[data-act]');
    var rAct = rActBtn ? rActBtn.getAttribute('data-act') : 'refund';
    e.preventDefault();
    e.stopPropagation();
    if (rAct === 'as' && refund && refund.aftersaleId) {
      goTicketDetail(refund.aftersaleId);
      return;
    }
    if (refund) showRefundSheet(refund);
  });

  render();
})();
