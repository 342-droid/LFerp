/* Existing logistics pages share native rate rows and fixed fulfillment snapshots. Local prototype only. */
(function(){
'use strict';
const C=window.LogisticsFeeCore, RATE='lf_native_freight_rates_v1', SNAP='lf_native_freight_snapshots_v1', $=s=>document.querySelector(s);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cash=n=>'¥'+(Number(n||0)/100).toFixed(2), copy=C.copy;
const parse=(s,f)=>{try{return JSON.parse(s)||f;}catch(_){return f;}};
function defaultRules(){return ['retail','proxy'].map(channel=>({...C.defaults().rules.find(r=>r.channel===channel&&r.temp==='ambient'),id:channel==='retail'?'FREIGHT-RETAIL':'FREIGHT-PROXY',warehouse:'W001 南京仓',nativeOrigin:'W001 南京仓',nativeProvince:'全国',nativeCity:'',nativeDistrict:'',carrier:'LFPT 冷丰平台',fulfill:'平台配送'}));}
function readRows(){return Array.from(document.querySelectorAll('#tableBody tr')).filter(r=>r.cells.length>=23).map((row,i)=>{
 const text=n=>row.cells[n].textContent.trim(), scheme=({重量计费:'WEIGHT',金额计费:'AMOUNT',按件计费:'PIECE'})[text(5)];
 if(!scheme)return null;
 if(!row.dataset.nativeFeeId)row.dataset.nativeFeeId='NATIVE-RATE-'+i+'-'+Date.now();
 const r=copy(C.defaults().rules[0]),cfg=parse(row.dataset.tiers,'');const tierRows=cfg?.tiers||[];
 Object.assign(r,{id:row.dataset.nativeFeeId,version:Number(row.dataset.feeVersion||1),name:text(1)+' · '+text(3)+' · '+text(6),channel:text(3)==='零售订单'?'retail':'proxy',warehouse:text(1),nativeOrigin:text(1),region:'全国',nativeProvince:text(7),nativeCity:text(8),nativeDistrict:text(9),carrier:text(2),fulfill:text(4),scheme,temp:text(6)==='冷链'?'cold':text(6)==='常温'?'ambient':'ALL',enabled:text(17)==='启用',customerCharge:text(3)!=='零售订单',customerDiscount:Number(text(15))||1,settleDiscount:Number(text(16))||1});
 r.tiers=tierRows.map(t=>({min:Number(t.start),max:t.end==='∞'||t.end===''?null:Number(t.end),firstKg:Number(t.firstWeight)||0,first:Math.round(Number(t.firstPrice||t.price||0)*100),extra:Math.round(Number(t.cont||0)*100),price:Math.round(Number(t.price||0)*100)}));
 const ratio=text(11).split(':').map(Number);r.ratioA=ratio[0]||0;r.ratioB=ratio[1]||0;
 const extras=parse(row.dataset.extras,[]);r.delivery=0;r.insureMin=0;r.insurePercent=0;
 if(row.dataset.extra==='是')extras.forEach(x=>{if(x.name==='派送费')r.delivery=Math.round(Number(x.amount||0)*100);if(x.name==='保价费'){r.insureMin=Math.round(Number(x.min||0)*100);r.insurePercent=Number(x.rate)||0;}});
 const u=parse(row.dataset.upstairsConfig,{});r.upstairs=row.dataset.upstairs==='是';r.freeKg=Number(u.freeWeight)||0;const up=u.withElevator||{},no=u.withoutElevator||{};r.upBase=Math.round(Number(up.base||0)*100);r.upKg=Math.round(Number(up.weightRate||0)*100);r.upFloor=Math.round(Number(up.floorRate||0)*100);r.upQty=Math.round(Number(up.pieceRate||0)*100);r.noElevator={base:Math.round(Number(no.base||0)*100),kg:Math.round(Number(no.weightRate||0)*100),floor:Math.round(Number(no.floorRate||0)*100),qty:Math.round(Number(no.pieceRate||0)*100)};
 return r;
 }).filter(Boolean);}
function rateData(){return parse(localStorage.getItem(RATE),null);}
function rules(){return rateData()?.rules||defaultRules();}
function restoreRates(){const saved=rateData();if(saved?.html&&$('#tableBody'))$('#tableBody').innerHTML=saved.html;}
let timer;
function captureRates(){if(!$('#rateModal'))return;const rs=readRows();localStorage.setItem(RATE,JSON.stringify({rules:rs,html:$('#tableBody').innerHTML}));}
function basis(){
 const channel=$('#orderChannel')?.value,method=$('#fulfillMethod')?.value,free=channel==='零售订单'&&method==='平台配送';
 const box=$('#feeCustomerBasis');if(box)box.textContent=free?'客户收货：门店自提；用户应收运费固定为 0。基础费用、增值及上楼服务仅按配置计算平台应结。':channel==='代采订单'?'客户收货：门店进货；客户应收、平台应结分别按运费折扣和结算折扣计算。':'快递直发沿用对应渠道计费配置；零售上楼费不向用户收取。';
 const input=$('#freightDiscount');if(input){input.disabled=free;if(free)input.title='零售自提不按此折扣向用户收费';else input.title='';}
}
function annotate(){
 const head=$('#tableBody')?.closest('table')?.querySelector('thead tr');if(!head)return;
 if(!head.querySelector('[data-native-col]'))['客户收费口径','计费单位','费率版本'].forEach(t=>{const th=document.createElement('th');th.dataset.nativeCol='1';th.textContent=t;head.append(th);});
 Array.from($('#tableBody').rows).forEach(row=>{if(row.cells.length<23)return;const pickup=row.cells[3].textContent.trim()==='零售订单'&&row.cells[4].textContent.trim()==='平台配送';
 const values=[pickup?'用户自提免费':row.cells[3].textContent.trim()==='零售订单'?'按快递配置（无上楼费）':'按代采配置','履约订单','V'+(row.dataset.feeVersion||1)];
 values.forEach((v,i)=>{let td=row.cells[23+i];if(!td){td=document.createElement('td');row.append(td);}if(td.textContent!==v)td.textContent=v;});});
}
function initRates(){document.body.classList.add('lf-native-rates');$('#tableBody').closest('table').classList.add('no-last-column-freeze');annotate();captureRates();new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(()=>{annotate();captureRates();basis();},50);}).observe($('#tableBody'),{childList:true,subtree:true,characterData:true});
 document.addEventListener('change',e=>{if(['orderChannel','fulfillMethod'].includes(e.target.id))basis();});
 $('#rateModal')&&new MutationObserver(basis).observe($('#rateModal'),{attributes:true,attributeFilter:['class','style']});
}
function selectRules(main){
 const all=rules().filter(r=>r.enabled&&r.channel===main.channel&&r.warehouse===main.warehouse&&r.fulfill==='平台配送');
 const score=r=>r.nativeDistrict?(r.nativeDistrict===main.dest.district&&r.nativeCity===main.dest.city&&r.nativeProvince===main.dest.province?4:0):r.nativeCity?(r.nativeCity===main.dest.city&&r.nativeProvince===main.dest.province?3:0):r.nativeProvince&&r.nativeProvince!=='全国'?(r.nativeProvince===main.dest.province?2:0):1;
 const pick=rs=>{const sorted=rs.map(r=>({r,s:score(r)})).filter(x=>x.s).sort((a,b)=>b.s-a.s);if(sorted.length>1&&sorted[0].s===sorted[1].s)throw Error('同范围存在多条启用费率，请先处理策略冲突');return sorted[0]?.r;};
 const whole=pick(all.filter(r=>r.scheme!=='WEIGHT'));const weight=pick(all.filter(r=>r.scheme==='WEIGHT'&&r.temp==='ambient'));
 const r=whole&&(!weight||score(whole)>score(weight))?whole:weight;
 if(!r)throw Error('未命中该渠道、仓店路线及温层的物流费率');
 return [r];
}
function calculate(main){return C.quote({rules:selectRules(main)},[main])[0];}
function seeds(){return ['retail','retail','proxy'].map((channel,i)=>{
 const m=C.sample({channel})[0];m.id=(channel==='retail'?'RO':'PO')+'-FREIGHT-DEMO-'+(i+1);m.warehouse='W001 南京仓';m.store='南京玄武示例门店';m.region='南京市';m.dest={province:'江苏省',city:'南京市',district:'玄武区'};m.batch='OUT-DEMO-01';
 ['常温面包','精品大米','食用油','常温牛奶','常温饮品','早餐饼干'].forEach((name,j)=>{m.goods[j].name=name;m.goods[j].id=m.id+'-ITEM-'+(j+1);m.goods[j].supplierOrder=m.id+'-S'+(Math.floor(j/2)+1);});
 const g=calculate(m);g.id='FO-FREIGHT-DEMO-'+(i+1);g.state='ARRIVED';g.paid=true;g.provided=true;return g;
 });}
function snapshots(){let rows=parse(localStorage.getItem(SNAP),null);if(!rows){rows=seeds();localStorage.setItem(SNAP,JSON.stringify(rows));}return rows;}
function reportRows(){return snapshots().map(g=>{const r=g.results[0],rule=r.rule;return {orderTime:'2026-11-13 10:00:00',storeCode:'STORE-DEMO',storeName:g.main.store,orderNo:g.main.id,channel:g.main.channel==='retail'?'零售订单':'代采订单',fulfill:'平台配送',receiptMode:g.main.channel==='retail'?'门店自提':'配送到店',warehouse:g.main.warehouse,province:g.main.dest.province,city:g.main.dest.city,district:g.main.dest.district,type:rule.temp==='ALL'?'不区分':rule.temp==='cold'?'冷链':'常温',carrier:rule.carrier,feeScheme:({WEIGHT:'重量计费',PIECE:'按件计费',AMOUNT:'金额计费'})[rule.scheme],payableAmount:600+g.customer/100,paidAmount:600+g.customer/100,inWeight:r.kg,cbm:r.volume,billWeight:r.chargeKg,billAmount:r.goods/100,throwRatio:rule.ratioA?rule.ratioA+':'+rule.ratioB:'',tier:rule.scheme==='WEIGHT'?'首重'+r.tier.firstKg+'KG '+cash(r.tier.first)+'，续价'+cash(r.tier.extra)+'/KG':rule.scheme==='PIECE'?cash(r.tier.price)+'/件':cash(r.tier.price),insure:r.components.insure/100,deliver:r.components.delivery/100,upstairs:r.components.upstairs/100,elevator:'有电梯',floor:1,freightDisc:rule.customerDiscount.toFixed(2),settleDisc:rule.settleDiscount.toFixed(2),fulfillmentId:g.id,rateVersion:rule.id+' / V'+rule.version,snapshot:g};});}
function table(head,rows){return '<div class="lf-fee-table-wrap"><table class="table lf-fee-table"><thead><tr>'+head.map(x=>'<th>'+x+'</th>').join('')+'</tr></thead><tbody>'+rows.map(xs=>'<tr>'+xs.map(x=>'<td>'+x+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';}
function clearingHtml(g){const buyer=g.customer-g.buyerRefunded,payable=g.payable-g.payableReduced,difference=buyer-payable;return '<h3>订单运费 · '+esc(g.id)+'</h3><div class="lf-fee-note">客户应收 '+cash(buyer)+'　平台应结 '+cash(payable)+'　平台运费差额 '+cash(difference)+'（'+(difference<0?'平台承担':'平台差额')+'）</div>'+table(['收款主体','角色 / 分账项','原始金额','费用调减','当前金额','结算状态'],[['冷丰平台','承运商角色 · 运费',cash(g.payable),cash(g.payableReduced),cash(payable),'已清分 · 待按原策略结算'],['冷丰平台','平台 · 运费差额',cash(g.customer-g.payable),'随费用调整重算',cash(difference),difference<0?'平台承担，不生成负数付款':'按现有清分逻辑处理']])+'<p class="lf-fee-note">运费独立结算，按履约明细追溯。客户运费退款与平台应结调整分别留账；到店服务已提供，用户未核销不撤销已履约运费。</p>'+table(['来源供应商子订单','履约明细','商品','基础单位','数量','单位重量 / 温层','客户应收分摊','平台应结分摊'],g.items.map(x=>[esc(x.supplierOrder),esc(x.id),esc(x.name),esc(x.unit),x.qty,x.weight+'kg / 常温',cash(x.customer),cash(x.payable)]))+'<p>原始快照：'+g.results.map(x=>esc(x.rule.id)+' / V'+x.rule.version).join('、')+'；分摊合计 '+cash(g.payable)+'。金额为原始分摊，费用调整单独记录。</p>';}
function detail(id){const g=snapshots().find(g=>g.main.id===id);if(!g)return;let dlg=$('#nativeFreightDialog');if(!dlg){dlg=document.createElement('dialog');dlg.id='nativeFreightDialog';dlg.className='lf-fee-dialog';document.body.append(dlg);}let current;try{current=calculate(g.main);}catch(e){current={error:e.message};}
 dlg.innerHTML='<header><h2>运费明细 · '+esc(id)+'</h2><button data-native-close aria-label="关闭">×</button></header><div class="lf-fee-dialog-body"><p>1 主订单 → 3 家供应商子订单 → 6 个商品明细 → 1 笔计费履约订单。出库批次 '+esc(g.main.batch)+'。</p>'+clearingHtml(g)+'<h3>按当前费率复核</h3><p>'+(current.error?esc(current.error):'客户应收 '+cash(current.customer)+'，平台应结 '+cash(current.payable)+'；当前版本 '+current.results.map(x=>esc(x.rule.id)+' / V'+x.rule.version).join('、'))+'。原始订单快照保持不变。</p><div class="lf-fee-actions"><a class="btn btn-secondary" href="logistics_rate.html">查看物流费率表</a><a class="btn btn-primary" href="../MDM/'+(g.main.channel==='retail'?'mdm_order_retail.html':'mdm_order_proxy.html')+'?orderId='+encodeURIComponent(id)+'">查看订单清分明细</a><a class="btn btn-secondary" href="../MDM/mdm_settle_index.html?view=carrier&detail=CF_'+g.id+'">查看承运商结算</a></div></div>';dlg.showModal();}
function decorateOrder(detail,id){const g=(parse(localStorage.getItem(SNAP),[])||[]).find(x=>x.main.id===id);if(!g)return detail;detail=copy(detail);detail.displayId=id;detail.freightSnapshot=g;detail.progress={completedSteps:4,status:g.main.channel==='retail'?'待自提':'待收货',submitTime:'2026-11-13 10:00',payTime:'2026-11-13 10:01'};detail.goods=g.items.map(x=>({id:x.id,name:x.name,spec:x.unit,img:'',spu:x.id,sku:x.id,weight:x.weight+'kg',price:'¥100.00',qty:'1',subtotal:'¥100.00',tempLayer:'常温',marketing:'普通售卖',supplierName:x.supplier}));detail.amounts={goods:'¥600.00',discount:'¥0.00',shipping:cash(g.customer),payable:cash(60000+g.customer),paid:cash(60000+g.customer),merchant:cash(60000+g.customer),refund:'¥0.00'};detail.freight={original:g.customer/100,refunded:0};detail.delivery={type:g.main.channel==='retail'?'SELF_PICKUP':'DELIVERY',deliveryMode:g.main.channel==='retail'?'自提':'配送',store:g.main.store,address:'江苏省南京市玄武区（示例）',name:'演示客户',phone:'—'};detail.customer={nickname:'演示客户',phone:'—',userId:'DEMO'};detail.tags={channel:g.main.channel==='retail'?'APP':'STORE_APP',orderScene:g.main.channel==='retail'?'商城':'代采',payChannel:'演示',settleStatus:'待结算',commissionStatus:'已清分'};detail.logs=[{time:'2026-11-13 10:00',title:'演示订单',desc:'3 家供应商子订单，同履约流程归集为 1 笔履约订单；配送到店服务已提供。'}];detail.aftersales=[];detail.payments=[{flowNo:'PAY-DEMO-'+g.id,direction:'收款',channel:'演示',status:'成功',amount:cash(60000+g.customer),payTime:'2026-11-13 10:01'}];detail.clearingEmpty=true;detail.clearingEmptyReason='商品清分按现有规则，本示例仅展示独立运费清分';return detail;}
document.addEventListener('click',e=>{const b=e.target.closest('[data-freight-detail]');if(b)detail(b.dataset.freightDetail);if(e.target.closest('[data-native-close]'))$('#nativeFreightDialog').close();});
window.LfNativeFreight={captureRates,restoreRates,initRates,reportRows,snapshots,clearingHtml,decorateOrder,calculate};
})();
