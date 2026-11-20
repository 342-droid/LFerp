/* Supplier reports: demo records scoped to current supplier; no customer GMV or store business data. */
(function(){
 'use strict';
 var K=window.StoreAppRoleDc,F=window.BusinessReportFixtures,api=K.createState('supplier_report_v2'),expanded='';
 var q=new URLSearchParams(location.search),tab=q.get('tab')||'overview',biz=q.get('biz')||'all';
 var org=window.FybOrg && window.FybOrg.current && window.FybOrg.current();
 if(window.FybOrg && window.FybOrg.ensureSupplierModeOrRedirect && !window.FybOrg.ensureSupplierModeOrRedirect('home.html')) return;
 var supplierId=org && org.id || 'sup-ss';
 api.load({range:'today'});
 var root=document.getElementById('saSupBizRoot');
 function e(x){return K.esc(x);} function m(x){return K.moneyFmt(x);}
 function getRows(bounds,settle){return F.rows.filter(function(r){return r.supplierId===supplierId && !K.isTestName(r.name) && (biz==='all'||r.biz===biz) && K.inBounds(settle?r.settleAt:r.pay,bounds);});}
 function metrics(rows){var a={cost:0,adjust:0,net:0,qty:{},count:rows.length};rows.forEach(function(r){a.cost=K.add(a.cost,r.cost);a.adjust=K.add(a.adjust,r.costRefund||0);a.net=K.add(a.net,r.cost-(r.costRefund||0));var key=r.sku+'|'+r.unit;if(!a.qty[key])a.qty[key]={name:r.name,sku:r.sku,unit:r.unit,qty:0,refund:0,net:0,cost:0,adjust:0};var v=a.qty[key];v.qty+=r.qty;v.refund+=r.refundQty||0;v.net+=r.qty-(r.refundQty||0);v.cost=K.add(v.cost,r.cost);v.adjust=K.add(v.adjust,r.costRefund||0);});return a;}
 function tabs(list,active,attr){return '<div class="sa-dc-mtabs">'+list.map(function(x){return '<button class="sa-dc-mtabs__btn '+(active===x[0]?'is-active':'')+'" data-'+attr+'="'+x[0]+'">'+x[1]+'</button>';}).join('')+'</div>';}
 function block(title,body){return '<section class="sa-dc-block"><h2 class="sa-dc-block__title">'+title+'</h2>'+body+'</section>';}
 function render(){
  var state=api.get(),bounds=K.resolveRange(state.range,{start:state.start,end:state.end}),prev=K.compareBounds(bounds),rows=getRows(bounds,false),a=metrics(rows),b=metrics(getRows(prev,false)),bills=getRows(bounds,true),bill=metrics(bills);
  var u=new URL(location.href);u.searchParams.set('tab',tab);u.searchParams.set('biz',biz);history.replaceState(null,'',u.pathname+u.search);
  root.innerHTML='<header class="sa-rpt-nav"><a class="sa-rpt-nav__back" href="home.html" aria-label="返回工作台">‹</a><h1 class="sa-rpt-nav__title">数据中心</h1><button class="sa-rpt-nav__link" data-help>ⓘ</button></header>'+tabs([['overview','总览'],['trade','交易分析'],['settle','货款结算']],tab,'tab')+'<div class="sa-rpt-scroll" id="supplierBody"><div class="sa-dc-ranges" id="supplierRanges"></div><p class="sa-dc-period">'+e(K.periodCaption(bounds,prev.label))+'</p><p class="sa-dc-asof">'+e(K.updatedCaption(F.asOf))+'</p>'+tabs([['all','合计'],['retail','零售'],['proxy','代采']],biz,'biz')+'<div id="supplierContent"></div></div>';
  api.renderRanges(document.getElementById('supplierRanges'),state.range);
  var body='';
  if(tab==='overview'){
   body=block('供货货款',K.grid([{t:'原供货货款（元）',v:m(a.cost),f:K.deltaHtml(K.deltaPack(a.cost,b.cost),prev.label)},{t:'退款货款调整（元）',v:m(a.adjust),f:K.deltaHtml(K.deltaPack(a.adjust,b.adjust),prev.label)},{t:'调整后货款（元）',v:m(a.net),f:K.deltaHtml(K.deltaPack(a.net,b.net),prev.label)}],3));
   body+=block('本期结算单',K.grid([{t:'应结货款（元）',v:m(bill.net)},{t:'已结货款（元）',v:m(bill.net)}],2));
   body+=block('货款趋势',K.chartBox('按支付日期 · 原供货货款（元）'));
  }else if(tab==='trade'){
   body=block('交易概况',K.grid([{t:'供货订单数（供应商子单）',v:String(a.count)},{t:'原供货货款（元）',v:m(a.cost),f:K.deltaHtml(K.deltaPack(a.cost,b.cost),prev.label)},{t:'调整后货款（元）',v:m(a.net),f:K.deltaHtml(K.deltaPack(a.net,b.net),prev.label)}],3));
   body+=block('商品供货排行',Object.keys(a.qty).map(function(key){var x=a.qty[key];return '<div class="sa-dc-list-row"><div><strong>'+e(x.name)+' · '+e(x.sku)+'</strong><p class="sa-dc-muted">供货 '+x.qty+e(x.unit)+' · 退货 '+x.refund+e(x.unit)+' · 剩余 '+x.net+e(x.unit)+'</p></div><div>货款 '+m(x.cost-x.adjust)+' 元</div></div>';}).join('')||'<p class="sa-dc-empty">本期暂无供货记录</p>');
   body+=block('供货明细',rows.map(function(r){return '<div class="sa-dc-list-row"><div><strong>'+e(r.id)+'</strong><p class="sa-dc-muted">'+(r.biz==='proxy'?'代采':'零售')+' · '+e(r.pay)+' · '+r.qty+e(r.unit)+'</p></div><span>'+m(r.cost)+' 元</span></div>';}).join('')||'<p class="sa-dc-empty">本期暂无供货记录</p>');
  }else{
   body=block('货款结算',K.grid([{t:'本期结算单应结（元）',v:m(bill.net)},{t:'本期结算单已结（元）',v:m(bill.net)}],2));
   body+=block('结算单',bills.map(function(r){var net=r.cost-(r.costRefund||0);return '<button class="sa-dc-list-row '+(expanded===r.id?'is-open':'')+'" data-bill="'+e(r.id)+'"><div class="sa-dc-list-row__main"><strong>'+e(r.supplierBill)+'</strong><p class="sa-dc-list-row__meta">已结算 · '+e(r.settleAt)+'</p></div><strong>'+m(net)+' 元</strong>'+(expanded===r.id?'<div class="sa-dc-list-row__detail">关联供货单 '+e(r.id)+'<br>结算周期 '+e(r.pay.slice(0,10))+'<br>原货款 '+m(r.cost)+' 元<br>退款货款调整 -'+m(r.costRefund||0)+' 元<br>应结／实结 '+m(net)+' 元</div>':'')+'</button>';}).join('')||'<p class="sa-dc-empty">本期暂无结算单</p>');
  }
  document.getElementById('supplierContent').innerHTML=body;
  if(tab==='overview')K.drawChart(K.buildTrend(bounds,function(slot){return rows.filter(function(r){return (!slot.day||r.pay.slice(0,10)===slot.day)&&(slot.hour==null||Number(r.pay.slice(11,13))===Number(slot.hour));}).reduce(function(sum,r){return K.add(sum,r.cost);},0);}));
 }
 root.addEventListener('click',function(ev){var t=ev.target.closest('[data-tab],[data-biz],[data-range],[data-bill],[data-help]');if(!t)return;if(t.hasAttribute('data-tab'))tab=t.dataset.tab;else if(t.hasAttribute('data-biz'))biz=t.dataset.biz;else if(t.hasAttribute('data-bill'))expanded=expanded===t.dataset.bill?'':t.dataset.bill;else if(t.hasAttribute('data-help')){document.getElementById('supplierHelp').hidden=false;return;}else if(t.dataset.range==='custom'){document.getElementById('supplierCustom').hidden=false;return;}else api.update({range:t.dataset.range});render();});
 document.getElementById('supplierApply').onclick=function(){var start=document.getElementById('supplierStart').value,end=document.getElementById('supplierEnd').value;if(!start||!end||start>end||end>K.DEMO_TODAY){document.getElementById('supplierErr').textContent='请选择有效日期，结束日期不能晚于今天';return;}api.update({range:'custom',start:start,end:end});document.getElementById('supplierCustom').hidden=true;render();};
 document.querySelectorAll('[data-close]').forEach(function(b){b.onclick=function(){document.getElementById(b.dataset.close).hidden=true;};});
 render();
})();
