(function(global) {
  'use strict';
  function read(key) {try{return JSON.parse(localStorage.getItem(key)||'{}')||{};}catch(e){return {};}}
  function storeOff(order) {
    var store = order.store || {};
    var id = order.storeId || store.id || store.storeId || '';
    var name = order.storeName || store.name || '';
    var map = read('lferp_store_disabled_v1');
    return !!((map[id]&&map[id].disabled)||(map[name]&&map[name].disabled));
  }
  function warehouseOff(order) {
    var id = order.warehouseId || order.warehouse || '';
    var map = read('lferp_warehouse_disabled_v1');
    return !!(map[id]&&map[id].disabled) || read('mdm_archive_status_v1')['warehouse:'+id] === '停用';
  }
  function type(order) {return order.fulfillType || order.splitKind || order.delivery || '';}
  function decision(order) {
    if (!order) return {allowed:true};
    if (order.status === 'closed') return {allowed:false,message:'订单已关闭，请重新选购'};
    if (!storeOff(order)) return {allowed:true};
    if (type(order) === 'express' && order.requiresStoreWork !== true && !warehouseOff(order) && order.fulfillmentValid !== false) return {allowed:true};
    return {allowed:false,message:'订单已关闭，请重新选购',reason:'store_service_disabled'};
  }
  function closePending(order) {
    var d = decision(order);
    if (order && order.status === 'unpaid' && !d.allowed && d.reason) {
      order.status='closed'; order.closedReason='system'; order.internalClosedReason='自提门店停用';
      order.reservationsReleased=true;
    }
    return order;
  }
  function callback(order) {
    var id = order.orderNo;
    var key='lf_service_payment_callbacks_v1'; var ledger=read(key);
    if (ledger[id]) return ledger[id];
    var result;
    if (decision(order).allowed) result={mode:'fulfilled',message:'支付成功，订单继续履约'};
    else result={mode:'refund_pending',message:'本订单无法继续履约，正在为你办理退款'};
    ledger[id]=result; localStorage.setItem(key,JSON.stringify(ledger));
    return result;
  }
  global.LfStoreServiceRules={decision:decision,closePending:closePending,callback:callback,storeOff:storeOff};
})(window);
