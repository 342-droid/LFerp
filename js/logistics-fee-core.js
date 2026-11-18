/* 物流费用评审原型：金额以分存储，独立本地演示，不调用业务接口。 */
(function(root){
'use strict';
const copy=x=>JSON.parse(JSON.stringify(x)), fail=s=>{throw Error(s);}, round=n=>Math.round(n), sum=(xs,fn)=>xs.reduce((a,x)=>a+fn(x),0);
const cap=t=>t.max==null?Infinity:t.max;
function allocate(total,weights){
  if(!Number.isInteger(total)||total<0||weights.some(w=>!Number.isFinite(w)||w<0))fail('分摊参数不正确');
  const all=sum(weights,x=>x);if(!total)return weights.map(()=>0);if(!all)fail('缺少有效分摊基数');
  const raw=weights.map(w=>total*w/all),res=raw.map(Math.floor),tail=total-sum(res,x=>x);
  raw.map((v,i)=>({i,r:v-res[i]})).sort((a,b)=>b.r-a.r||a.i-b.i).slice(0,tail).forEach(x=>res[x.i]++);return res;
}
function defaults(){
 const rules=[];['proxy','retail'].forEach(channel=>['ambient','cold'].forEach(temp=>rules.push({
 id:(channel==='proxy'?'LF-P-':'LF-R-')+(temp==='ambient'?'001':'002'),version:1,channel,temp,
 name:(channel==='proxy'?'代采':'零售')+'仓到店 · '+(temp==='ambient'?'常温':'冷链'),warehouse:'WH00001',region:'全国',scheme:'WEIGHT',enabled:true,
 tiers:[{min:0,max:null,firstKg:20,first:temp==='ambient'?3500:2000,extra:100,price:100}],
 customerCharge:channel==='proxy',customerDiscount:.8,settleDiscount:.7,ratioA:0,ratioB:0,
 delivery:0,insureMin:0,insurePercent:0,upstairs:false,freeKg:0,upBase:0,upKg:0,upFloor:0,upQty:0,noElevator:{base:0,kg:0,floor:0,qty:0}
 })));return {rules,cycleDays:1};
}
function goodsSeed(mainId){return [
 ['鲜肉小笼包','袋',1,1,1],['冷冻水饺','袋',2,1,2],['精品牛肉','盒',3,1,3],
 ['鲜虾仁','盒',4,1,4],['常温饮品','箱',2,1,2],['早餐点心','袋',3,1,3]
 ].map((x,i)=>({id:mainId+'-ITEM-'+(i+1),name:x[0],unit:x[1],weight:x[2],qty:x[3],factor:1,temp:'ambient',volume:.001,
 goods:10000, supplier:'供应商'+['A','B','C'][Math.floor(i/2)],supplierOrder:mainId+'-S'+(Math.floor(i/2)+1)}));}
function sample(opts={}){
 const count=opts.scene==='batch'?2:1;
 return Array.from({length:count},(_,i)=>{const id='MAIN-DEMO-'+String(i+1).padStart(2,'0');return {
 id,channel:opts.channel||'retail',warehouse:opts.warehouse||'WH00001',store:'STORE-DEMO-01',region:opts.region||'上海',floor:Number(opts.floor)||1,elevator:opts.elevator!==false,
 flow:'platform',selfSettled:!!opts.selfSettled,goods:goodsSeed(id).map((x,j)=>({...x,temp:opts.mixed&&j>3?'cold':'ambient',qty:Number(opts.qty)||1}))
 };});
}
function validateRule(rule,all){
 if(!rule.name.trim()||!['proxy','retail'].includes(rule.channel)||!rule.warehouse||!rule.region)fail('请完善策略名称、渠道、始发仓及目的区域');
 if(!['WEIGHT','PIECE','AMOUNT'].includes(rule.scheme))fail('请选择费用方案');
 if(rule.scheme==='WEIGHT'&&!['ambient','cold'].includes(rule.temp))fail('重量计费须区分常温与冷链');
 if(!rule.tiers.length||rule.tiers[0].min!==0||rule.tiers.at(-1).max!==null)fail('阶梯须从 0 开始，最后一档上限为 ∞');
 rule.tiers.forEach((t,i)=>{
  if(!Number.isFinite(t.min)||cap(t)<=t.min||!Number.isFinite(t.min+ t.firstKg+t.first+t.extra+t.price)||[t.min,t.firstKg,t.first,t.extra,t.price].some(v=>v<0))fail('请检查阶梯区间和金额');
  if(i&&rule.tiers[i-1].max!==t.min)fail('阶梯区间须连续，不可重叠或留空');
 });
 if(![rule.customerDiscount,rule.settleDiscount].every(n=>Number.isFinite(n)&&n>=.1&&n<=1))fail('对客、结算折扣须在 0.10～1.00 之间');
 if(![rule.delivery,rule.insureMin,rule.insurePercent,rule.freeKg,rule.upBase,rule.upKg,rule.upFloor,rule.upQty,rule.ratioA,rule.ratioB].every(n=>Number.isFinite(n)&&n>=0))fail('费用和参数不得为负数');
 if((rule.ratioA>0)!==(rule.ratioB>0))fail('重抛比 A、B 需同时填写');
 if(!Object.values(rule.noElevator).every(n=>Number.isFinite(n)&&n>=0))fail('无电梯上楼费参数不得为负数');
 if(rule.channel==='retail'&&rule.customerCharge)fail('零售自提客户固定不收费');
 if(rule.enabled&&all.some(r=>r.id!==rule.id&&r.enabled&&r.channel===rule.channel&&r.warehouse===rule.warehouse&&r.region===rule.region&&(r.scheme!=='WEIGHT'||rule.scheme!=='WEIGHT'||r.temp===rule.temp)))fail('同范围已有启用策略：重量同温层唯一，重量与整单计费互斥');
 return rule;
}
function saveRule(config,rule){rule=copy(rule);validateRule(rule,config.rules);const i=config.rules.findIndex(x=>x.id===rule.id);rule.version=i<0?1:config.rules[i].version+1;if(i<0)config.rules.push(rule);else config.rules[i]=rule;return rule;}
function matchRules(config,main){
 const source=config.rules.filter(r=>r.enabled&&r.channel===main.channel&&r.warehouse===main.warehouse&&(r.region==='全国'||r.region===main.region));
 const pick=rows=>rows.sort((a,b)=>(b.region!=='全国')-(a.region!=='全国'))[0];
 const exact=source.filter(x=>x.region===main.region),layer=exact.length?exact:source.filter(x=>x.region==='全国');
 const whole=layer.filter(x=>x.scheme!=='WEIGHT');
 if(whole.length>1)fail('同范围命中多条整单策略');
 if(whole.length)return [{rule:whole[0],items:main.goods}];
 return [...new Set(main.goods.map(x=>x.temp))].map(temp=>{
  const rule=pick(source.filter(x=>x.scheme==='WEIGHT'&&x.temp===temp));
  if(!rule)fail((main.channel==='retail'?'零售':'代采')+'平台配送未命中'+(temp==='cold'?'冷链':'常温')+'费率，请完善策略');
  return {rule,items:main.goods.filter(x=>x.temp===temp)};
 });
}
function calculate(rule,items,main){
 const qty=sum(items,x=>x.qty),kg=sum(items,x=>x.weight*x.factor*x.qty),volume=sum(items,x=>x.volume*x.factor*x.qty),goods=sum(items,x=>x.goods*x.qty);
 const volumeKg=rule.ratioA&&rule.ratioB?volume*1000*rule.ratioA/rule.ratioB:0,chargeKg=Math.max(kg,volumeKg);
 const basis=rule.scheme==='WEIGHT'?chargeKg:rule.scheme==='PIECE'?qty:goods/100;
 const tier=rule.tiers.find(t=>basis>=t.min&&basis<cap(t));if(!tier)fail('未命中计费阶梯');
 const base=rule.scheme==='WEIGHT'?round(tier.first+Math.max(0,chargeKg-tier.firstKg)*tier.extra):rule.scheme==='PIECE'?round(qty*tier.price):tier.price;
 const insure=rule.insurePercent>0?Math.max(rule.insureMin,round(goods*rule.insurePercent/100)):0;
 const up=main.elevator?{base:rule.upBase,kg:rule.upKg,floor:rule.upFloor,qty:rule.upQty}:rule.noElevator;
 const upstairs=rule.upstairs&&chargeKg>rule.freeKg&&main.floor>1?round(up.base+up.kg*chargeKg+up.floor*main.floor+up.qty*qty):0;
 const components={base,insure,delivery:rule.delivery,upstairs};
 const extras=insure+rule.delivery+upstairs;
 const customer=main.channel==='retail'||!rule.customerCharge?0:round(base*rule.customerDiscount)+extras;
 const payable=round(base*rule.settleDiscount)+extras;
 return {rule:copy(rule),items:copy(items),qty,kg,volume,chargeKg,basis,goods,tier:copy(tier),components,customer,payable,balance:customer-payable};
}
function distribute(result,main){
 const items=main.goods.map(x=>({...copy(x),customer:0,payable:0}));
 result.forEach(r=>{
  const indices=r.items.map(x=>items.findIndex(it=>it.id===x.id)),lineItems=indices.map(i=>items[i]);
  const baseWeights=lineItems.map(x=>r.rule.scheme==='PIECE'?x.qty:r.rule.scheme==='AMOUNT'?x.goods*x.qty:x.weight*x.factor*x.qty);
  const defs=[['base',baseWeights],['insure',lineItems.map(x=>x.goods*x.qty)],['delivery',lineItems.map(x=>x.qty)],['upstairs',lineItems.map(x=>x.weight*x.factor*x.qty)]];
  const buyerParts={base:main.channel==='retail'||!r.rule.customerCharge?0:round(r.components.base*r.rule.customerDiscount),insure:0,delivery:0,upstairs:0};
  if(main.channel!=='retail'&&r.rule.customerCharge)['insure','delivery','upstairs'].forEach(k=>buyerParts[k]=r.components[k]);
  defs.forEach(([k,w])=>{
   const fallback=sum(w,x=>x)>0?w:lineItems.map(x=>x.qty);
   const buyer=allocate(buyerParts[k],fallback),seller=allocate(k==='base'?round(r.components.base*r.rule.settleDiscount):r.components[k],fallback);
   indices.forEach((idx,i)=>{items[idx].customer+=buyer[i];items[idx].payable+=seller[i];});
  });
 });return items;
}
function quote(config,mains){
 return mains.map((main,i)=>{
  if(main.goods.some(x=>!Number.isFinite(x.qty)||x.qty<=0||!Number.isFinite(x.weight)||x.weight<=0))fail('商品数量与重量须有效');
  const results=main.selfSettled?[]:matchRules(config,main).map(x=>calculate(x.rule,x.items,main));
  const customer=sum(results,x=>x.customer),payable=sum(results,x=>x.payable);
  return {id:'FO-DEMO-'+String(i+1).padStart(2,'0'),main:copy(main),results,items:distribute(results,main),customer,payable,balance:customer-payable,excluded:main.selfSettled,
   snapshotAt:Date.now(),state:'PENDING',paid:false,provided:false,ready:false,picked:false,buyerRefunded:0,payableReduced:0,settled:0,recovered:0,flow:'',adjustments:[]};
 });
}
function prepare(quoted,cycleDays=1){return {id:'RUN-'+Date.now(),created:Date.now(),groups:copy(quoted),cycleDays,events:[]};}
function active(run,ids){const gs=run.groups.filter(x=>ids.includes(x.id));if(!gs.length)fail('请选择履约订单');return gs;}
function pay(run,ids){const gs=active(run,ids);if(gs.some(x=>x.state!=='PENDING'))fail('请选择待支付订单');gs.forEach(x=>{x.paid=true;x.state='WAIT_SHIP';});}
function ship(run,ids){const gs=active(run,ids);if(gs.some(x=>x.state!=='WAIT_SHIP'))fail('请选择已支付、待发货履约订单');gs.forEach(x=>x.state='SHIPPING');}
function receive(run,ids){const gs=active(run,ids);if(gs.some(x=>x.state!=='SHIPPING'))fail('请选择配送中的履约订单');gs.forEach(x=>{x.state='ARRIVED';x.provided=true;x.completedAt=Date.now();x.readyAt=x.completedAt+run.cycleDays*86400000;x.ready=run.cycleDays===0;});}
function mature(run,ids){const gs=active(run,ids);if(gs.some(x=>!x.provided||x.state==='CANCELLED'))fail('请先完成到店收货');gs.forEach(x=>x.ready=true);}
function netSettled(g){return g.settled-g.recovered;}
function due(g){return Math.max(0,g.payable-g.payableReduced-netSettled(g));}
function settle(run,ids){const gs=active(run,ids);if(gs.some(x=>x.excluded||!x.ready||x.adjustments.some(a=>a.status==='PENDING')||due(x)<=0))fail('请选择已到结算节点、无处理中调整且有应结金额的履约订单');gs.forEach(g=>{g.settled+=due(g);g.flow='DEMO-CLEAR-'+g.id;});}
function cancel(run,ids){const gs=active(run,ids);if(gs.some(g=>g.provided||g.state==='CANCELLED'||g.adjustments.some(a=>a.status==='PENDING')))fail('已提供配送服务或有处理中调整，不能按未履约取消');gs.forEach(g=>{g.state='CANCELLED';g.buyerRefunded=g.paid?g.customer:0;g.payableReduced=g.payable;});}
function requestAdjust(run,id,buyer,reduction,reason){
 const g=active(run,[id])[0];if(!g.paid||g.state==='CANCELLED'||g.excluded)fail('该履约订单不可申请费用调整');
 if(g.adjustments.some(a=>a.status==='SUCCESS'&&a.recover&&!a.recovered))fail('请先完成上笔已结费用调整的对账追回');
 const reservedBuyer=sum(g.adjustments.filter(a=>a.status==='PENDING'),a=>a.buyer),reservedPayable=sum(g.adjustments.filter(a=>a.status==='PENDING'),a=>a.reduction);
 if(!Number.isInteger(buyer)||!Number.isInteger(reduction)||buyer<0||reduction<0||buyer+reduction<=0)fail('调整金额须有效，至少填写一项正金额');
 if(buyer>g.customer-g.buyerRefunded-reservedBuyer)fail('客户退款超过剩余实收运费');
 if(reduction>g.payable-g.payableReduced-reservedPayable)fail('应结调减超过剩余应结运费');
 if(!reason.trim())fail('请填写调整依据');
 const a={id:'ADJ-'+Date.now()+'-'+g.adjustments.length,buyer,reduction,reason,status:'PENDING',recover:0,originalFlow:g.flow};g.adjustments.push(a);return a;
}
function finishAdjust(run,groupId,id,success){
 const g=active(run,[groupId])[0],a=g.adjustments.find(x=>x.id===id);if(!a||a.status!=='PENDING')fail('该调整已处理');
 a.status=success?'SUCCESS':'FAILED';if(success){g.buyerRefunded+=a.buyer;g.payableReduced+=a.reduction;a.recover=Math.max(0,netSettled(g)-(g.payable-g.payableReduced));a.originalFlow=g.flow;}
}
function recover(run,groupId,id){const g=active(run,[groupId])[0],a=g.adjustments.find(x=>x.id===id);if(!a||a.status!=='SUCCESS'||!a.recover||a.recovered)fail('没有待对账追回金额');g.recovered+=a.recover;a.recovered=true;a.reverseFlow='DEMO-REVERSE-'+a.id;}
function summary(groups){return {
 customer:sum(groups,g=>g.customer),payable:sum(groups,g=>g.payable),netCustomer:sum(groups,g=>g.paid?g.customer-g.buyerRefunded:0),
 currentPayable:sum(groups,g=>g.payable-g.payableReduced),netSettled:sum(groups,netSettled),refunds:sum(groups,g=>g.buyerRefunded),
 pendingRecovery:sum(groups,g=>sum(g.adjustments.filter(a=>a.status==='SUCCESS'&&!a.recovered),a=>a.recover)),
 balance:sum(groups,g=>(g.state==='CANCELLED'?0:g.customer-g.buyerRefunded)-(g.payable-g.payableReduced))
 };}
root.LogisticsFeeCore={copy,allocate,defaults,sample,saveRule,validateRule,quote,prepare,pay,ship,receive,mature,settle,cancel,requestAdjust,finishAdjust,recover,summary,due,netSettled};
})(typeof window!=='undefined'?window:globalThis);
