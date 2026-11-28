/* 丰银宝 · 供应商售后详情：字段不变，排版对齐用户 APP 退款/售后详情 */
(function () {
  if (!window.FybOrg || !window.FybOrg.ensureSupplierModeOrRedirect()) return;
  if (!window.FybSupplierAftersale) return;

  var AS = window.FybSupplierAftersale;
  var org = window.FybOrg.current();
  var params = new URLSearchParams(window.location.search || '');
  var ticket = AS.findTicket(params.get('id'), org.name);

  var body = document.getElementById('saSupAsDetailBody');
  var footer = document.getElementById('saSupAsDetailFooter');

  var TRUCK_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="8" width="13" height="9" rx="1"/><path d="M15 10h4l3 4v3h-7V10z"/><circle cx="7" cy="18" r="1.5"/><circle cx="18" cy="18" r="1.5"/></svg>';
  var CHEV_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>';

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function toast(msg) {
    if (window.StoreAppToast && typeof window.StoreAppToast.show === 'function') {
      window.StoreAppToast.show(msg);
      return;
    }
    alert(msg);
  }

  function promptText(title, defVal) {
    var v = window.prompt(title, defVal || '');
    return v == null ? '' : String(v).trim();
  }

  function productImg(src) {
    return escapeHtml(src || AS.defaultImg || '../../user-app/assets/order-product-1.svg');
  }

  function infoRow(label, value, strong) {
    return (
      '<div class="sa-ua-info__row"><span class="sa-ua-info__label">' +
      escapeHtml(label) +
      '</span><span class="sa-ua-info__value' +
      (strong ? ' sa-ua-info__value--strong' : '') +
      '">' +
      (value == null || value === '' ? '—' : escapeHtml(value)) +
      '</span></div>'
    );
  }

  function confirmAction(opts, onOk) {
    var exist = document.getElementById('saSupAsDetailConfirm');
    if (exist) exist.remove();
    var shell = document.querySelector('.sa-shell') || document.body;
    var mask = document.createElement('div');
    mask.id = 'saSupAsDetailConfirm';
    mask.className = 'sa-sup-confirm-mask';
    mask.innerHTML =
      '<div class="sa-sup-confirm" role="dialog" aria-modal="true">' +
      '<h3 class="sa-sup-confirm__title">' +
      escapeHtml(opts.title || '确认') +
      '</h3>' +
      '<p class="sa-sup-confirm__msg">' +
      escapeHtml(opts.message || '') +
      '</p>' +
      '<div class="sa-sup-confirm__actions">' +
      '<button type="button" class="sa-sup-confirm__btn" data-c="cancel">取消</button>' +
      '<button type="button" class="sa-sup-confirm__btn sa-sup-confirm__btn--primary" data-c="ok">' +
      escapeHtml(opts.okLabel || '确认') +
      '</button></div></div>';
    shell.appendChild(mask);
    requestAnimationFrame(function () {
      mask.classList.add('is-open');
    });
    function close() {
      mask.remove();
    }
    mask.addEventListener('click', function (ev) {
      if (ev.target === mask) close();
    });
    mask.querySelector('[data-c="cancel"]').addEventListener('click', close);
    mask.querySelector('[data-c="ok"]').addEventListener('click', function () {
      close();
      if (typeof onOk === 'function') onOk();
    });
  }

  function goLogistics() {
    if (!ticket || !AS.hasTrackableLogistics(ticket)) return;
    var payload = AS.buildLogisticsPayload(ticket);
    try {
      sessionStorage.setItem('pendingExpressOrder', JSON.stringify(payload));
      sessionStorage.setItem(
        'saSupAsLogisticsBack',
        'supplier-aftersale-detail.html?id=' + encodeURIComponent(ticket.id)
      );
    } catch (e) {}
    window.location.href =
      'supplier-aftersale-logistics.html?id=' + encodeURIComponent(ticket.id);
  }

  function logisticsHtml() {
    if (!ticket) return '';
    if (AS.hasTrackableLogistics(ticket)) {
      return (
        '<section class="sa-ua-card">' +
        '<button type="button" class="sa-ua-logistics" id="saSupAsLogisticsBtn">' +
        '<span class="sa-ua-logistics__icon" aria-hidden="true">' +
        TRUCK_SVG +
        '</span>' +
        '<span class="sa-ua-logistics__info">' +
        '<div class="sa-ua-logistics__status">' +
        escapeHtml(ticket.logisticsStatus || '运输中') +
        '</div>' +
        '<div class="sa-ua-logistics__text">' +
        escapeHtml(
          (ticket.courier ? ticket.courier + ' ' : '') +
            (ticket.logisticsText || ticket.trackingNo || '')
        ) +
        '</div></span>' +
        '<span class="sa-ua-logistics__link">查看物流</span>' +
        '<span class="sa-ua-logistics__chev" aria-hidden="true">' +
        CHEV_SVG +
        '</span></button></section>'
      );
    }
    var statusText =
      ticket.fulfill !== '快递' ? '无需快递物流' : '暂无物流信息';
    var subText =
      ticket.fulfill !== '快递'
        ? ticket.tip || '配送/自提由门店或仓库处理'
        : ticket.tip || '寄出后可查看物流轨迹';
    return (
      '<section class="sa-ua-card">' +
      '<div class="sa-ua-logistics is-static">' +
      '<span class="sa-ua-logistics__icon" aria-hidden="true">' +
      TRUCK_SVG +
      '</span>' +
      '<span class="sa-ua-logistics__info">' +
      '<div class="sa-ua-logistics__status">' +
      escapeHtml(statusText) +
      '</div>' +
      '<div class="sa-ua-logistics__text">' +
      escapeHtml(subText) +
      '</div></span></div></section>'
    );
  }

  function render() {
    if (!body) return;
    if (!ticket) {
      body.innerHTML = '<div class="sa-ua-empty">未找到售后单，或无权查看</div>';
      if (footer) {
        footer.hidden = true;
        footer.innerHTML = '';
      }
      return;
    }

    var canOps = AS.canOperate(ticket);

    body.innerHTML =
      '<div class="sa-ua-detail__body">' +
      '<section class="sa-ua-hero">' +
      '<h2 class="sa-ua-hero__title">' +
      escapeHtml(ticket.type + ' · ' + ticket.status) +
      '</h2>' +
      '<p class="sa-ua-hero__sub">' +
      escapeHtml(ticket.tip || ticket.reason || '') +
      '</p></section>' +
      logisticsHtml() +
      '<section class="sa-ua-card">' +
      '<div class="sa-ua-info">' +
      '<h3 class="sa-ua-info__title">售后信息</h3>' +
      '<div class="sa-ua-item" style="border-bottom:1px solid #f5f5f5">' +
      '<img class="sa-ua-item__img" src="' +
      productImg(ticket.productImg) +
      '" alt="">' +
      '<div class="sa-ua-item__body">' +
      '<div class="sa-ua-item__name">' +
      escapeHtml(ticket.product) +
      '</div>' +
      '<div class="sa-ua-item__spec">' +
      escapeHtml(ticket.spec || '') +
      ' ×' +
      escapeHtml(ticket.qty) +
      '</div>' +
      '<div class="sa-ua-item__meta">' +
      '<div class="sa-ua-item__prices">' +
      '<span class="sa-ua-item__paid"><em>金额</em>¥' +
      escapeHtml(ticket.amount) +
      '</span></div></div></div></div>' +
      infoRow('售后单号', ticket.id) +
      infoRow('订单号', ticket.orderNo) +
      infoRow('订单来源', ticket.orderSource) +
      infoRow('履约方式', ticket.fulfill) +
      infoRow('申请时间', ticket.applyTime) +
      infoRow('售后原因', ticket.reason) +
      (ticket.refundId ? infoRow('关联退款', ticket.refundId) : '') +
      infoRow('售后金额', '¥' + ticket.amount, true) +
      '</div></section></div>';

    var logisticsBtn = document.getElementById('saSupAsLogisticsBtn');
    if (logisticsBtn) {
      logisticsBtn.addEventListener('click', goLogistics);
    }

    if (!footer) return;
    if (!canOps) {
      footer.hidden = true;
      footer.innerHTML = '';
      return;
    }

    footer.hidden = false;
    if (ticket.type === '退货退款' && ticket.status === '待收货') {
      footer.innerHTML =
        '<button type="button" class="sa-ua-footer__btn" data-as="reject">拒收</button>' +
        '<button type="button" class="sa-ua-footer__btn sa-ua-footer__btn--primary" data-as="receive">确认收货</button>';
    } else if (ticket.type === '补货' && (ticket.status === '待寄出' || ticket.status === '待发货')) {
      footer.innerHTML =
        '<button type="button" class="sa-ua-footer__btn sa-ua-footer__btn--primary sa-ua-footer__btn--single" data-as="restock">上传补货快递单</button>';
    } else {
      footer.hidden = true;
      footer.innerHTML = '';
    }
  }

  if (footer) {
    footer.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-as]');
      if (!btn || !ticket) return;
      var act = btn.getAttribute('data-as');
      if (act === 'receive') {
        confirmAction(
          {
            title: '确认收货',
            message: '确认已收到用户退回商品？确认后将继续退款流程。',
            okLabel: '确认收货'
          },
          function () {
            ticket.status = '已完成';
            ticket.tip = '已确认收货，退款流程继续（演示）';
            ticket.logisticsStatus = '已签收';
            ticket.logisticsText = '快件已签收，签收人：前台';
            ticket.refundId = ticket.refundId || 'RF-' + String(ticket.id).slice(-8);
            toast('已确认收货');
            render();
          }
        );
        return;
      }
      if (act === 'reject') {
        confirmAction(
          {
            title: '确认拒收',
            message: '确认拒收该退货？拒收后需平台/客服介入处理。',
            okLabel: '确认拒收'
          },
          function () {
            ticket.status = '已拒收';
            ticket.tip = '已拒收，需平台/客服介入（演示）';
            toast('已拒收');
            render();
          }
        );
        return;
      }
      if (act === 'restock') {
        confirmAction(
          {
            title: '确认补货发货',
            message: '确认已备好补货商品并上传快递单？提交后待用户签收。',
            okLabel: '确认上传'
          },
          function () {
            var no = promptText('请输入补货快递单号', ticket.trackingNo || 'SF');
            if (!no) return;
            ticket.trackingNo = no;
            ticket.courier = ticket.courier || '顺丰速运';
            ticket.status = '待收货';
            ticket.logisticsStatus = '已揽收';
            ticket.logisticsText = '商家已交件，运单 ' + no;
            ticket.tip = '补货已寄出 ' + no + '，待用户签收';
            toast('补货快递单已上传');
            render();
          }
        );
      }
    });
  }

  render();
})();
