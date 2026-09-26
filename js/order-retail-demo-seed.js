/**
 * 零售订单列表演示数据
 * 默认「近7天」会滤掉更早的静态行，所以把已有行拨进近7天，并补到 100 条。
 * 新行覆盖待支付 / 待接单 / 待发货 / 待收货 / 待提货 / 待核销 / 交易成功 / 交易失败，
 * 以及自提、快递、直播、商城、售后中与禁核销等操作场景。
 */
(function () {
  var TARGET = 100;
  var PRODUCTS = [
    { name: '有机上海青 500g', img: 'order-product-1.svg' },
    { name: '微辣萝卜干 500g', img: 'order-product-2.svg' },
    { name: '冷鲜鸡腿 1kg', img: 'order-product-3.svg' },
    { name: '赣南脐橙 2.5kg', img: 'order-product-4.svg' },
    { name: '小龙虾', img: 'order-product-1.svg' },
    { name: '东北珍珠米 5kg', img: 'order-product-2.svg' }
  ];
  var NAMES = ['赵金芝', '刘十九', '杜建锋', '周敏', '陈浩', '孙丽', '吴凯', '郑晓'];
  var STORES = [
    { name: '华强北', storeId: 'ONS303445581210', orgId: '冷丰演示门店' },
    { name: '悠悠生鲜超市', storeId: 'ONS303445581211', orgId: '五角场体验店' },
    { name: '德清乾元天恩冷丰店', storeId: 'ONS303445581212', orgId: '张江快闪店' }
  ];
  var SCENARIOS = [
    { status: '待支付', tag: 'order-tag--pending-pay', mode: 'pickup', pay: '', payLabel: '-', scene: '商城', as: '', demo: '', skip: false, sale: '普通售卖' },
    { status: '待支付', tag: 'order-tag--pending-pay', mode: 'express', pay: '', payLabel: '-', scene: '直播', as: '', demo: '', skip: false, sale: '拉新赠品' },
    { status: '待接单', tag: 'order-tag--pending-accept', mode: 'pickup', pay: 'wechat', payLabel: '微信', scene: '商城', as: '', demo: '', skip: false, sale: '普通售卖' },
    { status: '待接单', tag: 'order-tag--pending-accept', mode: 'express', pay: 'alipay', payLabel: '支付宝', scene: '直播', as: '', demo: '', skip: false, sale: '普通售卖' },
    { status: '待发货', tag: 'order-tag--pending-ship', mode: 'express', pay: 'wechat', payLabel: '微信', scene: '商城', as: '', demo: '', skip: false, sale: '普通售卖' },
    { status: '待发货', tag: 'order-tag--pending-ship', mode: 'pickup', pay: 'wechat', payLabel: '微信', scene: '直播', as: '', demo: '', skip: false, sale: '普通售卖' },
    { status: '待发货', tag: 'order-tag--pending-ship', mode: 'express', pay: 'wechat', payLabel: '微信', scene: '商城', as: '待审核', demo: '', skip: false, sale: '普通售卖' },
    { status: '待收货', tag: 'order-tag--receipt', mode: 'express', pay: 'wechat', payLabel: '微信', scene: '商城', as: '', demo: '', skip: false, sale: '普通售卖' },
    { status: '待收货', tag: 'order-tag--receipt', mode: 'pickup', pay: 'alipay', payLabel: '支付宝', scene: '直播', as: '', demo: '', skip: false, sale: '普通售卖' },
    { status: '待收货', tag: 'order-tag--receipt', mode: 'express', pay: 'wechat', payLabel: '微信', scene: '直播', as: '退款中', demo: '', skip: false, sale: '普通售卖' },
    { status: '待提货', tag: 'order-tag--pickup', mode: 'pickup', pay: 'wechat', payLabel: '微信', scene: '商城', as: '', demo: '', skip: false, sale: '普通售卖' },
    { status: '待核销', tag: 'order-tag--pickup', mode: 'pickup', pay: 'wechat', payLabel: '微信', scene: '商城', as: '', demo: '', skip: true, sale: '普通售卖' },
    { status: '待提货', tag: 'order-tag--pickup', mode: 'pickup', pay: 'alipay', payLabel: '支付宝', scene: '直播', as: '', demo: '待退货·禁核销', skip: false, sale: '普通售卖' },
    { status: '待提货', tag: 'order-tag--pickup', mode: 'pickup', pay: 'wechat', payLabel: '微信', scene: '商城', as: '', demo: '待审批·可核销', skip: false, sale: '普通售卖' },
    { status: '待核销', tag: 'order-tag--pickup', mode: 'pickup', pay: 'wechat', payLabel: '微信', scene: '直播', as: '', demo: '仅补货·可核销', skip: true, sale: '普通售卖' },
    { status: '交易成功', tag: 'order-tag--success', mode: 'pickup', pay: 'wechat', payLabel: '微信', scene: '商城', as: '', demo: '', skip: false, sale: '普通售卖' },
    { status: '交易成功', tag: 'order-tag--success', mode: 'express', pay: 'alipay', payLabel: '支付宝', scene: '直播', as: '', demo: '', skip: false, sale: '普通售卖' },
    { status: '交易失败', tag: 'order-tag--failed', mode: 'pickup', pay: 'wechat', payLabel: '微信', scene: '商城', as: '', demo: '', skip: false, sale: '普通售卖' },
    { status: '交易失败', tag: 'order-tag--failed', mode: 'express', pay: '', payLabel: '-', scene: '直播', as: '', demo: '', skip: false, sale: '拉新赠品' },
    { status: '待提货', tag: 'order-tag--pickup', mode: 'pickup', pay: 'wechat', payLabel: '微信', scene: '商城', as: '退货中', demo: '', skip: false, sale: '普通售卖' },
    { status: '待发货', tag: 'order-tag--pending-ship', mode: 'express', pay: 'alipay', payLabel: '支付宝', scene: '商城', as: '退款成功', demo: '', skip: false, sale: '普通售卖' }
  ];

  function pad(n) {
    n = String(n);
    return n.length < 2 ? '0' + n : n;
  }

  function atDaysAgo(daysAgo, hour, minute) {
    var d = new Date();
    d.setHours(hour, minute, 0, 0);
    d.setDate(d.getDate() - daysAgo);
    return d;
  }

  function atLastMonth(day, hour, minute) {
    var now = new Date();
    return new Date(now.getFullYear(), now.getMonth() - 1, day, hour, minute, 0, 0);
  }

  function dateText(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function dateTimeText(d) {
    return dateText(d) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function esc(text) {
    return String(text == null ? '' : text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function daysAgoForNew(index) {
    if (index < 45) return index % 7;
    if (index < 57) return 8 + (index % 6);
    if (index < 65) return 16 + (index % 10);
    return null;
  }

  function shiftExisting(rows) {
    rows.forEach(function (row, index) {
      var when = atDaysAgo(index % 7, 8 + (index % 12), (index * 5) % 60);
      row.setAttribute('data-ordered-at', dateText(when));
      var timeCell = row.children[1];
      if (timeCell) timeCell.textContent = dateTimeText(when);
    });
  }

  function buildRow(index) {
    var spec = SCENARIOS[index % SCENARIOS.length];
    var product = PRODUCTS[index % PRODUCTS.length];
    var nick = NAMES[index % NAMES.length];
    var receiver = NAMES[(index + 3) % NAMES.length];
    var store = STORES[index % STORES.length];
    var when = daysAgoForNew(index) == null
      ? atLastMonth(6 + (index % 18), 10 + (index % 8), (index * 3) % 60)
      : atDaysAgo(daysAgoForNew(index), 9 + (index % 10), (index * 7) % 60);
    var id = 'ORD-RT100' + pad(index + 1);
    var phone = '138' + pad(10000000 + index).slice(-8);
    var payable = (12 + (index % 40) + (index % 3) * 0.5).toFixed(2);
    var paid = spec.status === '待支付' || spec.status === '交易失败' && !spec.pay ? '0.00' : payable;
    if (spec.status === '交易失败' && spec.pay) paid = payable;
    if (spec.status === '待支付') paid = '0.00';
    var payNo = spec.pay ? (spec.pay === 'wechat' ? '42000093' : '20260923') + pad(1000 + index) : '';
    var modeLabel = spec.mode === 'express' ? '快递' : '自提';
    var live = spec.scene === '直播' ? '美物甄选-近场' + ((index % 4) + 1) : '';
    var qty = 1 + (index % 3);
    var attrs =
      ' data-order-id="' + id + '"' +
      ' data-delivery-mode="' + spec.mode + '"' +
      ' data-pay-channel="' + spec.pay + '"' +
      ' data-store="' + esc(store.name) + '"' +
      ' data-store-id="' + esc(store.storeId) + '"' +
      ' data-org-id="' + esc(store.orgId) + '"' +
      ' data-pay-no="' + payNo + '"' +
      ' data-ordered-at="' + dateText(when) + '"' +
      (live ? ' data-live-session="' + esc(live) + '"' : '') +
      (spec.as ? ' data-as-status="' + esc(spec.as) + '"' : '') +
      (spec.demo ? ' data-demo-as="' + esc(spec.demo) + '"' : '') +
      (spec.skip ? ' data-skip-po="1" data-cutoff-source="after_pay"' : '');
    return (
      '<tr' + attrs + '>' +
      '<td><a href="#" class="order-live-table__link js-order-view" data-order-id="' + id + '">' + id + '</a></td>' +
      '<td>' + dateTimeText(when) + '</td>' +
      '<td>' + esc(nick) + '</td>' +
      '<td>' + esc(receiver) + '</td>' +
      '<td>' + phone + '</td>' +
      '<td><div class="order-product-cell">' +
      '<img class="order-product-cell__thumb" src="../user-app/assets/' + product.img + '" alt="">' +
      '<span class="order-product-cell__name">' + esc(product.name) + '</span></div></td>' +
      '<td>× ' + qty + '</td>' +
      '<td><span class="order-tag order-tag--sale">' + spec.sale + '</span></td>' +
      '<td>¥' + payable + '</td>' +
      '<td>¥0.00</td>' +
      '<td>¥0.00</td>' +
      '<td>-</td>' +
      '<td>¥0.00</td>' +
      '<td>¥' + paid + '</td>' +
      '<td><span class="order-scene">' + spec.scene + '</span></td>' +
      '<td><span class="order-tag order-tag--scene order-delivery-mode">' + modeLabel + '</span></td>' +
      '<td>' + spec.payLabel + '</td>' +
      '<td>' + esc(store.name) + '</td>' +
      '<td>' + esc(store.storeId) + '</td>' +
      '<td>' + esc(store.orgId) + '</td>' +
      '<td class="order-pay-no">' + (payNo || '-') + '</td>' +
      '<td class="order-status-cell"><span class="order-tag ' + spec.tag + '">' + spec.status + '</span></td>' +
      '<td class="order-live-table__sticky-col"><a href="#" class="order-live-table__link js-order-view" data-order-id="' + id + '">查看</a></td>' +
      '</tr>'
    );
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!document.body || document.body.getAttribute('data-order-page') !== 'retail') return;
    var tbody = document.querySelector('.order-live-table tbody');
    if (!tbody) return;
    var rows = Array.prototype.slice.call(tbody.querySelectorAll('tr[data-order-id]'));
    shiftExisting(rows);
    var need = TARGET - rows.length;
    if (need <= 0) return;
    var html = '';
    var i = 0;
    for (i = 0; i < need; i++) html += buildRow(i);
    tbody.insertAdjacentHTML('beforeend', html);
  });
})();
