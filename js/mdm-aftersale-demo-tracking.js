(function () {
  'use strict';

  function forTicket(id, type, status, fulfillment) {
    if (fulfillment !== '快递') return {};
    var suffix = String(id).slice(-12);
    var shipments = {};
    if (type === '退货退款' && ['退款中', '待收货', '已完成', '退款异常'].indexOf(status) >= 0) {
      shipments.returnShip = 'SF' + suffix;
    }
    if (type === '换货' && (status === '待收货' || status === '已完成')) {
      shipments.returnShip = 'ZT' + suffix;
      if (status === '已完成') shipments.exchangeOutShip = 'YT' + suffix;
    }
    if (type === '补货' && status === '已完成') shipments.restockShip = 'STO' + suffix.slice(-11);
    return shipments;
  }

  window.MdmAftersaleDemoTracking = { forTicket: forTicket };
})();
