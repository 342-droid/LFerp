/* Shared demo cohort only; production must supply authorized API records. */
(function(g){
 var d=new Date(),pad=function(n){return String(n).padStart(2,'0');};
 function at(offset,hm){var x=new Date(d.getFullYear(),d.getMonth(),d.getDate()+offset);return x.getFullYear()+'-'+pad(x.getMonth()+1)+'-'+pad(x.getDate())+' '+hm;}
 var rows=[
 {id:'LINK-R1',biz:'retail',channel:'mall',offset:-1,paid:100,qty:10,cost:70,bd:5,store:6.4,platform:13.6,refund:20,refundQty:2,costRefund:14,bdRefund:1},
 {id:'LINK-P1',biz:'proxy',channel:'proxy',offset:-1,paid:200,qty:20,cost:140,bd:12,store:0,platform:48,freight:10},
 {id:'LINK-R2',biz:'retail',channel:'live',offset:-2,paid:60,qty:6,cost:42,bd:3,store:5,platform:0,refund:10,refundQty:0,costRefund:0},
 {id:'LINK-P2',biz:'proxy',channel:'proxy',offset:-3,paid:120,qty:12,cost:84,bd:7,store:0,platform:29},
 {id:'LINK-R0',biz:'retail',channel:'mall',offset:-40,paid:80,qty:8,cost:56,bd:4,store:6,platform:14},
 {id:'LINK-P0',biz:'proxy',channel:'proxy',offset:-40,paid:100,qty:10,cost:70,bd:6,store:0,platform:24}
 ].map(function(r){return Object.assign(r,{sku:'LINK-SKU',name:'联调鸡蛋',unit:'盒',supplierId:'sup-ss',storeId:'S-CN',storeName:'城南生鲜店',pay:at(r.offset,'10:00:00'),settleAt:at(r.offset,'12:00:00'),refundAt:r.refund?at(r.offset,'15:00:00'):'',supplierBill:'SUP-'+r.id,bdBill:'BD-'+r.id});});
 g.BusinessReportFixtures={rows:rows,at:at,asOf:at(0,'21:30:00')};
})(window);
