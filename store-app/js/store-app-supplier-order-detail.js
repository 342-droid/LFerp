/* 丰银宝 · 供应商客户订单详情：发货 / 处理售后 */
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

  function toast(msg, type) {
    if (window.LFToast && window.LFToast.show) window.LFToast.show(msg);
    else if (typeof showToast === 'function') showToast(msg, type || 'info');
  }

  function tagClass(status) {
    if (/交易成功|已完成|已结款/.test(status) && !/部分|售后|退货/.test(status)) return 'is-ok';
    if (/异常|失败/.test(status)) return 'is-bad';
    return 'is-wait';
  }

  function kv(label, value) {
    return (
      '<div class="sa-sup-od-kv"><span>' +
      label +
      '</span><strong>' +
      (value || '—') +
      '</strong></div>'
    );
  }

  function promptText(title, placeholder) {
    var v = window.prompt(title, placeholder || '');
    return v == null ? null : String(v).trim();
  }

  /** 售后处理二次确认 */
  function confirmAftersale(opts, onOk) {
    opts = opts || {};
    var exist = document.getElementById('saSupAsConfirm');
    if (exist) exist.remove();
    var shell = document.querySelector('.sa-shell') || document.body;
    var mask = document.createElement('div');
    mask.id = 'saSupAsConfirm';
    mask.className = 'sa-sup-confirm-mask';
    mask.innerHTML =
      '<div class="sa-sup-confirm" role="dialog" aria-modal="true">' +
      '<h3 class="sa-sup-confirm__title">' +
      (opts.title || '确认操作') +
      '</h3>' +
      '<p class="sa-sup-confirm__msg">' +
      (opts.message || '确认继续处理该售后？') +
      '</p>' +
      '<div class="sa-sup-confirm__actions">' +
      '<button type="button" class="sa-sup-confirm__btn" data-c="cancel">取消</button>' +
      '<button type="button" class="sa-sup-confirm__btn sa-sup-confirm__btn--primary" data-c="ok">' +
      (opts.okLabel || '确认') +
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

  function render() {
    if (!order) {
      body.innerHTML = '<div class="sa-sup-empty">未找到订单，或无权查看</div>';
      footer.hidden = true;
      return;
    }

    var as = order.aftersale;
    var asHtml = '';
    if (as) {
      asHtml =
        '<article class="sa-sup-card sa-sup-od-as">' +
        '<div class="sa-sup-card__row"><h3 class="sa-sup-card__name" style="margin:0">售后处理</h3>' +
        '<span class="sa-sup-tag ' +
        tagClass(as.status) +
        '">' +
        as.type +
        ' · ' +
        as.status +
        '</span></div>' +
        '<div class="sa-sup-card__meta">' +
        (as.tip || '') +
        '<br>售后单 ' +
        as.id +
        ' · 金额 ¥' +
        as.amount +
        '</div>' +
        '<div class="sa-sup-od-as-actions" id="saSupOdAsActions"></div></article>';
    }

    body.innerHTML =
      '<article class="sa-sup-card">' +
      '<div class="sa-sup-card__row"><div class="sa-sup-card__no">' +
      order.orderNo +
      '</div><span class="sa-sup-tag ' +
      tagClass(order.status) +
      '">' +
      order.status +
      '</span></div>' +
      '<div class="sa-sup-od-grid">' +
      kv('订单类型', order.type + ' · ' + order.channel) +
      kv('履约方式', order.fulfill) +
      kv('下单时间', order.time) +
      kv('结算状态', order.settleStatus) +
      '</div></article>' +
      '<article class="sa-sup-card">' +
      '<h3 class="sa-sup-card__name">商品</h3>' +
      '<div class="sa-sup-od-goods" style="margin-top:10px">' +
      '<img class="sa-sup-od-goods__img" src="' +
      (order.productImg || '../../user-app/assets/order-product-1.svg') +
      '" alt="">' +
      '<div class="sa-sup-od-goods__info">' +
      '<div class="sa-sup-od-goods__name">' +
      order.product +
      '</div>' +
      '<div class="sa-sup-card__meta">' +
      (order.spec || '') +
      ' ×' +
      order.qty +
      '</div>' +
      '<div class="sa-sup-card__meta">编码 ' +
      order.code +
      ' · 条码 ' +
      order.barcode +
      '</div>' +
      '<div class="sa-sup-card__meta" style="margin-top:4px">采购款 ¥' +
      order.purchase +
      '</div></div>' +
      '<div class="sa-sup-card__amt">¥' +
      order.amount +
      '</div></div></article>' +
      '<article class="sa-sup-card">' +
      '<h3 class="sa-sup-card__name">收货信息</h3>' +
      '<div class="sa-sup-od-grid">' +
      kv('买家', order.buyer) +
      kv('手机', order.phone) +
      kv('地址', order.address) +
      kv('物流单号', order.expressNo || '—') +
      '</div></article>' +
      asHtml;

    var asHost = document.getElementById('saSupOdAsActions');
    if (asHost && as) {
      if (as.type === '退货退款' && as.status === '待收货') {
        asHost.innerHTML =
          '<button type="button" class="sa-sup-od-btn sa-sup-od-btn--primary" data-as="receive">确认收货</button>' +
          '<button type="button" class="sa-sup-od-btn" data-as="reject">拒收</button>';
      } else if (as.type === '补货' && (as.status === '待寄出' || as.status === '待发货')) {
        asHost.innerHTML =
          '<button type="button" class="sa-sup-od-btn sa-sup-od-btn--primary" data-as="restock">上传补货快递单</button>';
      } else {
        asHost.innerHTML = '<span class="sa-sup-card__meta">当前售后无需本商家操作</span>';
      }
      asHost.addEventListener('click', onAftersaleClick);
    }

    /* 售后确认收货/拒收已在「售后处理」区内展示，底栏不再重复「处理售后」 */
    var actions = [];
    if (window.FybSupplierOrders.canShip(order)) {
      actions.push(
        '<button type="button" class="sa-sup-od-btn sa-sup-od-btn--primary" data-act="ship">发货 · 上传快递单</button>'
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
      var no = promptText('请输入快递单号', order.expressNo || 'SF');
      if (!no) return;
      order.expressNo = no;
      order.status = '待收货';
      toast('已发货（演示）：' + no);
      render();
    }
  }

  function onAftersaleClick(e) {
    var btn = e.target.closest('[data-as]');
    if (!btn || !order.aftersale) return;
    var act = btn.getAttribute('data-as');
    if (act === 'receive') {
      confirmAftersale(
        {
          title: '确认收货',
          message: '确认已收到用户退回商品？确认后将继续退款流程，此操作不可撤销。',
          okLabel: '确认收货'
        },
        function () {
          order.aftersale.status = '已完成';
          order.status = '交易成功';
          order.aftersale.tip = '供应商已确认收货，退款流程继续（演示）';
          toast('已确认收货（演示）');
          render();
        }
      );
      return;
    }
    if (act === 'reject') {
      confirmAftersale(
        {
          title: '确认拒收',
          message: '确认拒收该退货？拒收后需平台/客服介入处理。',
          okLabel: '确认拒收'
        },
        function () {
          order.aftersale.status = '已拒收';
          order.aftersale.tip = '供应商已拒收，需平台/客服介入（演示）';
          toast('已拒收（演示）');
          render();
        }
      );
      return;
    }
    if (act === 'restock') {
      confirmAftersale(
        {
          title: '确认补货发货',
          message: '确认已备好补货商品并上传快递单？提交后售后状态将变为待用户收货。',
          okLabel: '确认上传'
        },
        function () {
          var no = promptText('请输入补货快递单号', 'SF');
          if (!no) return;
          order.aftersale.status = '待收货';
          order.aftersale.tip = '补货已寄出 ' + no + '，待用户签收';
          order.expressNo = no;
          toast('补货快递单已上传（演示）');
          render();
        }
      );
    }
  }

  render();
})();
