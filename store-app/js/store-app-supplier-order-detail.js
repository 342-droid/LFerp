/* 丰银宝 · 供应商客户订单详情：字段不变，排版对齐用户 APP 订单详情 */
(function () {
  if (!window.FybOrg || !window.FybOrg.ensureSupplierModeOrRedirect()) return;
  if (!window.FybSupplierOrders) return;

  var org = window.FybOrg.current();
  var params = new URLSearchParams(location.search);
  var orderNo = params.get('orderNo') || '';
  var from = params.get('from') || '';
  var order = window.FybSupplierOrders.find(orderNo, org.name);
  var body = document.getElementById('saSupOdBody');
  var footer = document.getElementById('saSupOdFooter');
  var back = document.getElementById('saSupOdBack');
  if (back) {
    if (from === 'settle') back.setAttribute('href', 'supplier-settle.html?tab=ledger');
    else back.setAttribute('href', 'supplier-orders.html');
  }

  var PIN_SVG =
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg>';
  var TRUCK_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="8" width="13" height="9" rx="1"/><path d="M15 10h4l3 4v3h-7V10z"/><circle cx="7" cy="18" r="1.5"/><circle cx="18" cy="18" r="1.5"/></svg>';
  var SHOP_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 10l8-6 8 6v10a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1V10z"/></svg>';
  var CHEV_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>';

  function toast(msg, type) {
    if (window.LFToast && window.LFToast.show) window.LFToast.show(msg);
    else if (typeof showToast === 'function') showToast(msg, type || 'info');
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function infoRow(label, value) {
    return (
      '<div class="sa-ua-info__row"><span class="sa-ua-info__label">' +
      escapeHtml(label) +
      '</span><span class="sa-ua-info__value">' +
      escapeHtml(value == null || value === '' ? '—' : value) +
      '</span></div>'
    );
  }

  function aftersaleLead(as) {
    if (!as) return '';
    if (as.type === '补货') return '待补货发货';
    if (/门店已寄回/.test(as.tip || '')) return '门店已寄回';
    if (/用户已寄回/.test(as.tip || '')) return '用户已寄回';
    if (as.tip) return String(as.tip).split(/[，,]/)[0];
    return as.type || '售后处理';
  }

  function aftersaleLatestExpress(as) {
    if (!as) return '';
    return (
      as.logisticsText ||
      (as.courier && as.trackingNo
        ? as.courier + ' ' + as.trackingNo
        : as.trackingNo || as.logisticsStatus || '')
    );
  }

  function bannerSub(o) {
    if (o.aftersale) {
      var lead = aftersaleLead(o.aftersale);
      var latest = aftersaleLatestExpress(o.aftersale);
      return latest ? lead + ' ' + latest : lead;
    }
    if (o.expressNo) {
      return (o.courier ? o.courier + ' ' : '物流单号 ') + o.expressNo;
    }
    return (o.type || '') + ' · ' + (o.fulfill || '');
  }

  function render() {
    if (!order) {
      body.innerHTML = '<div class="sa-ua-empty">未找到订单，或无权查看</div>';
      footer.hidden = true;
      return;
    }

    var as = order.aftersale;
    var img = order.productImg || '../../user-app/assets/order-product-1.svg';
    var logisticsHtml = '';
    if (order.expressNo) {
      logisticsHtml =
        '<section class="sa-ua-card">' +
        '<div class="sa-ua-logistics is-static">' +
        '<span class="sa-ua-logistics__icon" aria-hidden="true">' +
        TRUCK_SVG +
        '</span>' +
        '<span class="sa-ua-logistics__info">' +
        '<div class="sa-ua-logistics__status">' +
        escapeHtml(order.courier || '物流单号') +
        '</div>' +
        '<div class="sa-ua-logistics__text">' +
        escapeHtml(order.expressNo) +
        '</div></span></div></section>';
    }

    var asHtml = '';
    if (as) {
      var asLead = aftersaleLead(as);
      var asLatest = aftersaleLatestExpress(as);
      asHtml =
        '<button type="button" class="sa-ua-as-panel" id="saSupOdAsPanel" data-as-detail="' +
        escapeHtml(as.id || '') +
        '">' +
        '<div class="sa-ua-as-panel__head">' +
        '<h3 class="sa-ua-as-panel__title">售后处理</h3>' +
        '<span class="sa-ua-as-panel__tag">' +
        escapeHtml(as.type + ' · ' + as.status) +
        '</span>' +
        '<span class="sa-ua-as-panel__chev" aria-hidden="true">' +
        CHEV_SVG +
        '</span></div>' +
        '<p class="sa-ua-as-panel__tip"><strong class="sa-ua-as-panel__lead">' +
        escapeHtml(asLead) +
        '</strong>' +
        (asLatest
          ? '<span class="sa-ua-as-panel__express"> ' + escapeHtml(asLatest) + '</span>'
          : '') +
        '</p></button>';
    }

    body.innerHTML =
      '<div class="sa-ua-detail__body">' +
      '<section class="sa-ua-banner">' +
      '<h2 class="sa-ua-banner__title">' +
      escapeHtml(order.status) +
      '</h2>' +
      '<p class="sa-ua-banner__sub">' +
      escapeHtml(bannerSub(order)) +
      '</p></section>' +
      '<section class="sa-ua-card">' +
      '<div class="sa-ua-addr">' +
      '<span class="sa-ua-addr__icon" aria-hidden="true">' +
      PIN_SVG +
      '</span>' +
      '<div class="sa-ua-addr__body">' +
      '<div class="sa-ua-addr__user"><span>' +
      escapeHtml(order.buyer) +
      '</span><span>' +
      escapeHtml(order.phone) +
      '</span></div>' +
      '<div class="sa-ua-addr__text">' +
      escapeHtml(order.address) +
      '</div></div></div></section>' +
      logisticsHtml +
      '<section class="sa-ua-card">' +
      '<div class="sa-ua-shop__head">' +
      '<span class="sa-ua-shop__icon" aria-hidden="true">' +
      SHOP_SVG +
      '</span>' +
      '<span class="sa-ua-shop__name">' +
      escapeHtml((order.channel || '') + (order.type ? ' · ' + order.type : '')) +
      '</span></div>' +
      '<article class="sa-ua-item">' +
      '<img class="sa-ua-item__img" src="' +
      escapeHtml(img) +
      '" alt="">' +
      '<div class="sa-ua-item__body">' +
      '<div class="sa-ua-item__name">' +
      escapeHtml(order.product) +
      '</div>' +
      '<div class="sa-ua-item__spec">' +
      escapeHtml(order.spec || '') +
      '</div>' +
      '<div class="sa-ua-item__meta">' +
      '<div class="sa-ua-item__prices">' +
      '<span class="sa-ua-item__sale"><em>采购款</em>¥' +
      escapeHtml(order.purchase) +
      '</span>' +
      '<span class="sa-ua-item__paid"><em>金额</em>¥' +
      escapeHtml(order.amount) +
      '</span></div>' +
      '<span class="sa-ua-item__qty">×' +
      escapeHtml(order.qty) +
      '</span></div>' +
      '<div class="sa-ua-item__extra">编码 ' +
      escapeHtml(order.code) +
      ' · 条码 ' +
      escapeHtml(order.barcode) +
      '</div></div></article>' +
      asHtml +
      '</section>' +
      '<section class="sa-ua-card">' +
      '<div class="sa-ua-info">' +
      '<h3 class="sa-ua-info__title">订单信息</h3>' +
      infoRow('订单号', order.orderNo) +
      infoRow('订单类型', (order.type || '') + ' · ' + (order.channel || '')) +
      infoRow('履约方式', order.fulfill) +
      infoRow('下单时间', order.time) +
      infoRow('结算状态', order.settleStatus) +
      '</div></section></div>';

    var asPanel = document.getElementById('saSupOdAsPanel');
    if (asPanel) {
      asPanel.addEventListener('click', function () {
        var tid = asPanel.getAttribute('data-as-detail') || (as && as.id) || '';
        if (!tid) return;
        window.location.href =
          'supplier-aftersale-detail.html?id=' + encodeURIComponent(tid);
      });
    }

    var actions = [];
    if (window.FybSupplierOrders.canShip(order)) {
      actions.push(
        '<button type="button" class="sa-ua-footer__btn sa-ua-footer__btn--primary sa-ua-footer__btn--single" data-act="ship">发货 · 上传快递单</button>'
      );
    }
    if (!actions.length) {
      footer.hidden = true;
      footer.innerHTML = '';
    } else {
      footer.hidden = false;
      footer.innerHTML = actions.join('');
      footer.onclick = onFooterClick;
    }
  }

  function onFooterClick(e) {
    var btn = e.target.closest('[data-act]');
    if (!btn) return;
    var act = btn.getAttribute('data-act');
    if (act === 'ship') {
      if (!window.FybSupplierShip || typeof window.FybSupplierShip.open !== 'function') {
        toast('发货组件未加载');
        return;
      }
      window.FybSupplierShip.open(order, {
        onSaved: function () {
          render();
        }
      });
    }
  }

  render();
})();
