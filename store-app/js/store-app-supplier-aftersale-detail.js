/* 丰银宝 · 供应商售后详情：商品主图 + 可查看物流；快递退货收货/补货发货 */
(function () {
  if (!window.FybOrg || !window.FybOrg.ensureSupplierModeOrRedirect()) return;
  if (!window.FybSupplierAftersale) return;

  var AS = window.FybSupplierAftersale;
  var org = window.FybOrg.current();
  var params = new URLSearchParams(window.location.search || '');
  var ticket = AS.findTicket(params.get('id'), org.name);

  var body = document.getElementById('saSupAsDetailBody');
  var footer = document.getElementById('saSupAsDetailFooter');

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

  function kv(label, value) {
    return (
      '<div class="sa-sup-od-kv"><span>' +
      label +
      '</span><strong>' +
      (value == null || value === '' ? '—' : escapeHtml(value)) +
      '</strong></div>'
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

  function logisticsCardHtml() {
    if (!ticket) return '';
    if (AS.hasTrackableLogistics(ticket)) {
      return (
        '<button type="button" class="sa-as-logistics" id="saSupAsLogisticsBtn">' +
        '<span class="sa-as-logistics__icon" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 7h11v10H3V7zm11 3h4l3 3v4h-7V10z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/></svg>' +
        '</span>' +
        '<span class="sa-as-logistics__info">' +
        '<div class="sa-as-logistics__status">' +
        escapeHtml(ticket.logisticsStatus || '运输中') +
        '</div>' +
        '<div class="sa-as-logistics__text">' +
        escapeHtml(
          (ticket.courier ? ticket.courier + ' ' : '') +
            (ticket.logisticsText || ticket.trackingNo || '')
        ) +
        '</div></span>' +
        '<span class="sa-as-logistics__link">查看物流</span></button>'
      );
    }
    if (ticket.fulfill !== '快递') {
      return (
        '<div class="sa-as-logistics is-disabled">' +
        '<span class="sa-as-logistics__icon" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 7h11v10H3V7zm11 3h4l3 3v4h-7V10z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/></svg>' +
        '</span>' +
        '<span class="sa-as-logistics__info">' +
        '<div class="sa-as-logistics__status">无需快递物流</div>' +
        '<div class="sa-as-logistics__text">' +
        escapeHtml(ticket.tip || '配送/自提由门店或仓库处理') +
        '</div></span></div>'
      );
    }
    return (
      '<div class="sa-as-logistics is-disabled">' +
      '<span class="sa-as-logistics__icon" aria-hidden="true">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 7h11v10H3V7zm11 3h4l3 3v4h-7V10z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/></svg>' +
      '</span>' +
      '<span class="sa-as-logistics__info">' +
      '<div class="sa-as-logistics__status">暂无物流信息</div>' +
      '<div class="sa-as-logistics__text">' +
      escapeHtml(ticket.tip || '寄出后可查看物流轨迹') +
      '</div></span></div>'
    );
  }

  function render() {
    if (!body) return;
    if (!ticket) {
      body.innerHTML = '<div class="sa-as-empty">未找到售后单，或无权查看</div>';
      if (footer) {
        footer.hidden = true;
        footer.innerHTML = '';
      }
      return;
    }

    var canOps = AS.canOperate(ticket);

    body.innerHTML =
      '<article class="sa-sup-card">' +
      '<div class="sa-sup-card__row"><div class="sa-sup-card__no">' +
      escapeHtml(ticket.id) +
      '</div><span class="sa-sup-tag is-wait">' +
      escapeHtml(ticket.type + ' · ' + ticket.status) +
      '</span></div>' +
      '<div class="sa-sup-od-grid">' +
      kv('订单号', ticket.orderNo) +
      kv('订单来源', ticket.orderSource) +
      kv('履约方式', ticket.fulfill) +
      kv('申请时间', ticket.applyTime) +
      kv('售后原因', ticket.reason) +
      '</div></article>' +
      '<article class="sa-sup-card">' +
      '<h3 class="sa-sup-card__name">商品</h3>' +
      '<div class="sa-as-detail-product" style="margin-top:8px">' +
      '<img class="sa-as-detail-product__img" src="' +
      productImg(ticket.productImg) +
      '" alt="">' +
      '<div style="flex:1;min-width:0">' +
      '<div class="sa-as-card__name">' +
      escapeHtml(ticket.product) +
      '</div>' +
      '<div class="sa-as-card__spec">' +
      escapeHtml(ticket.spec || '') +
      ' ×' +
      escapeHtml(ticket.qty) +
      '</div>' +
      '<div class="sa-as-card__amount" style="margin-top:6px">¥ ' +
      escapeHtml(ticket.amount) +
      '</div></div></div></article>' +
      '<article class="sa-sup-card">' +
      '<h3 class="sa-sup-card__name">物流信息</h3>' +
      '<div style="margin-top:8px">' +
      logisticsCardHtml() +
      '</div></article>' +
      (ticket.refundId
        ? '<article class="sa-sup-card"><h3 class="sa-sup-card__name">关联退款</h3>' +
          '<div class="sa-sup-card__meta" style="margin-top:6px">' +
          escapeHtml(ticket.refundId) +
          '</div></article>'
        : '');

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
        '<button type="button" class="sa-sup-od-btn" data-as="reject">拒收</button>' +
        '<button type="button" class="sa-sup-od-btn sa-sup-od-btn--primary" data-as="receive">确认收货</button>';
    } else if (ticket.type === '补货' && (ticket.status === '待寄出' || ticket.status === '待发货')) {
      footer.innerHTML =
        '<button type="button" class="sa-sup-od-btn sa-sup-od-btn--primary" data-as="restock">上传补货快递单</button>';
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
