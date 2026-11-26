/** 经营报表进入门店订单：使用同门店、同口径数据，普通订单入口不受影响。 */
(function () {
  var q = new URLSearchParams(location.search);
  if (q.get('from') !== 'biz-report') return;
  window.StoreOrdersReportActive = true;
  var D = window.StoreAppBizDataCenter;
  var root = document.getElementById('order-list');
  var bounds = D.resolveRange(q.get('range') || 'today', {start:q.get('start') || '', end:q.get('end') || ''});
  var rows = q.get('store') && q.get('store') !== D.STORE.id ? [] : D.listRetailOrders(bounds, q.get('channel') || 'all', q.get('view'));
  var selected = q.get('order');
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  document.querySelectorAll('.order-tabs,.order-sub-tabs,.sa-orders-nav__actions,.sa-orders-batch-bar').forEach(function(el){el.hidden=true;el.style.display='none';});
  var back = document.getElementById('btn-orders-back');
  var ret = q.get('returnTo') || '';
  if (/^\/store-app\/h5\/biz-ops\.html(?:\?|$)/.test(ret)) back.href = ret;
  var summary = document.createElement('p');
  summary.style.cssText='padding:8px 16px;color:#666;font-size:13px';
  summary.textContent = bounds.startKey + ' 至 ' + bounds.endKey + ' · ' + (q.get('channel') === 'mall' ? '商城' : q.get('channel') === 'live' ? '直播' : '全部来源') + (q.get('view') === 'event' ? ' · 本期支付或退款订单' : ' · 按支付时间');
  root.before(summary);
  function render() {
    var keyword = document.getElementById('order-search-input').value.trim().toLowerCase();
    var filtered = rows.filter(function(o){return (o.id + ' ' + (o.goods || []).map(function(g){return g.name;}).join(' ')).toLowerCase().indexOf(keyword)>=0;});
    root.innerHTML = filtered.map(function(o){
      var goods=(o.goods||[]).filter(function(g){return !g.test;});
      var refund=Number(o.refundGoods)||0;
      var status=o.fulfillStatus || '—';
      var aftersale=refund>0 ? (refund>=Number(o.goodsPaid)?'全额退款':'部分退款') : '无退款';
      return '<details class="order-card" data-report-order="'+esc(o.id)+'" '+(selected===o.id?'open':'')+'><summary style="padding:16px;cursor:pointer"><strong>'+esc(goods[0] ? goods[0].name+(goods.length>1?' 等'+goods.length+'种商品':'') : o.id)+'</strong><p>'+esc(o.id)+' · '+(o.channel==='live'?'直播':'商城')+'</p><p>'+esc(status)+' · '+aftersale+'</p><p>实付 ¥'+D.money(o.goodsPaid)+'</p></summary><div style="padding:0 16px 16px;line-height:1.8">支付时间：'+esc(o.payTime)+'<br>商品：'+esc(goods.map(function(g){return g.name;}).join('、'))+'<br>商品实付：¥'+D.money(o.goodsPaid)+'<br>商品退款：¥'+D.money(refund)+(o.refundTime?'<br>退款时间：'+esc(o.refundTime):'')+'</div></details>';
    }).join('') || '<div class="order-list-empty">该时段暂无符合条件的订单</div>';
  }
  document.getElementById('order-search-input').addEventListener('input',render);
  render();
  if(selected) requestAnimationFrame(function(){var el=Array.from(root.querySelectorAll('details')).find(function(e){return e.getAttribute('data-report-order')===selected;});if(el)el.scrollIntoView({block:'center'});});
})();
