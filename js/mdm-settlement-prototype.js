/* LFerp 结算工作台静态原型。数据为 Dev 页面观察到的代表性记录，不连接业务接口。 */
(function () {
    'use strict';
    var app = document.getElementById('settlement-app');
    var overlay = document.getElementById('settlement-overlay');
    if (!app) return;
    /* 异常单已并入清分台账 Tab；旧链接 ?view=exception 自动跳到清分台账·异常单 */
    var names = {summary:'清分汇总', policy:'策略管理', ledger:'清分台账', supplier:'供应商结算', carrier:'承运商结算', commission:'佣金清算', compensation:'补偿结款'};
    var params = new URLSearchParams(location.search);
    if (params.get('view') === 'exception') {
        params.set('view', 'ledger');
        params.set('tab', 'exception');
        history.replaceState(null, '', location.pathname + '?' + params.toString());
    }
    var state = {
        view: names[params.get('view')] ? params.get('view') : 'summary',
        detail: params.get('detail') || '',
        tab: params.get('tab') || '',
        query: '',
        status: '',
        logKind: '',
        logFilter: '',
        supplierSelection: [],
        supplierDateFrom: '',
        supplierDateTo: '',
        supplierPage: 1,
        carrierSelection: [],
        carrierDateFrom: '',
        carrierDateTo: '',
        carrierAccountName: '',
        carrierAccountNo: '',
        carrierPage: 1,
        policyType: '',
        policyStore: '',
        policyMenu: '',
        policyMode: params.get('mode') || '',
        policyEditing: params.get('id') || '',
        policyDraft: null,
        ruleEditing: -1,
        multiOpen: '',
        exceptionPayee: '',
        exceptionStatus: '',
        exceptionPage: 1,
        exceptionPageSize: 20,
        ledgerCollapsed: false,
        ledgerPage: 1,
        ledgerPageSize: 20,
        ledgerOrderFrom: '',
        ledgerOrderTo: '',
        ledgerNo: '',
        ledgerStore: '',
        ledgerProduct: '',
        ledgerPayee: '',
        ledgerClearStatus: '',
        ledgerSettleStatus: '',
        ledgerAftersaleStatus: '',
        ledgerStrategy: '',
        ledgerOrderType: '',
        ledgerChannel: '',
        ledgerOrderStatus: '',
        ledgerPostingStatus: '',
        ledgerPayeeType: '',
        ledgerAccountName: '',
        ledgerAccountNo: '',
        ledgerFlowNo: '',
        supplierName: '',
        supplierAccountName: '',
        supplierAccountNo: '',
        supplierFlowNo: '',
        carrierFlowNo: '',
        commissionPayee: '',
        commissionAccountName: '',
        commissionAccountNo: '',
        commissionFlowNo: '',
        compensationAccountName: '',
        compensationAccountNo: '',
        compensationFlowNo: '',
        exceptionAccountName: '',
        exceptionAccountNo: '',
        exceptionFlowNo: '',
        pendingCarrierSubmit: [],
        pendingSupplierSubmit: []
    };
    // Dev 列表第一页的可见记录快照。交互只修改本地状态，不调用结算接口。
    var supplierPending = [
        [43,'ST_358643443066482688','南京马群枢纽供应商','.04','.02','.02',2,'2026-09-17 00:01','2026-09-10'],
        [42,'ST_355502748269043712','南京马群枢纽供应商','.02','.01','.01',1,'2026-09-08 08:01','2026-09-07'],
        [41,'ST_355246056960700416','南京马群枢纽供应商','.02','.01','.01',1,'2026-09-07 15:01','2026-08-26'],
        [40,'ST_354566234882179072','南京马群枢纽供应商','.30','.29','.01',1,'2026-09-05 17:59','2026-09-05'],
        [39,'ST_354564464923639808','南京马群枢纽供应商','.20','.18','.02',1,'2026-09-05 17:52','2026-09-05'],
        [38,'ST_353846841269313536','南京马群枢纽供应商','.60','.58','.02',1,'2026-09-03 18:21','2026-09-03'],
        [37,'ST_353846839465762816','杭州萧山供应商','.12','.10','.02',2,'2026-09-03 18:21','2026-09-03'],
        [36,'ST_353846838018727936','南京马群枢纽供应商','.22','.20','.02',2,'2026-09-03 18:21','2026-09-03'],
        [35,'ST_353484450023084032','南京马群枢纽供应商','.04','.02','.02',1,'2026-09-02 18:21','2026-09-02'],
        [34,'ST_352397292289933312','南京马群枢纽供应商','.05','.02','.03',1,'2026-08-30 18:21','2026-08-29'],
        [33,'ST_352397291505598464','南京马群枢纽供应商','.05','.00','.05',1,'2026-08-30 18:21','2026-08-29'],
        [32,'ST_352034898908823552','南京马群枢纽供应商','.10','.03','.07',1,'2026-08-29 18:21','2026-08-28'],
        [31,'ST_351672512095985664','南京马群枢纽供应商','3.50','1.50','2.00',1,'2026-08-28 18:21','2026-06-25'],
        [30,'ST_351672509994639360','南京马群枢纽供应商','3.00','2.70','.30',1,'2026-08-28 18:21','2026-06-25'],
        [29,'ST_351310176302673920','杭州萧山供应商','.04','.02','.02',1,'2026-08-27 18:21','2026-08-27'],
        [28,'ST_351310131578810368','南京马群枢纽供应商','.42','.14','.28',6,'2026-08-27 18:21','2026-08-27'],
        [27,'ST_350947734330552320','南京马群枢纽供应商','.04','.02','.02',2,'2026-08-26 18:21','2026-08-26'],
        [26,'ST_2090745983734255618','南京马群枢纽供应商','.02','.01','.01',1,'2026-08-21 18:21','2026-08-21'],
        [25,'ST_2090383596021837825','南京马群枢纽供应商','.06','.03','.03',3,'2026-08-20 18:21','2026-08-20'],
        [24,'ST_2090021204227108866','南京马群枢纽供应商','.02','.01','.01',1,'2026-08-19 18:21','2026-08-15']
    ].map(function(x,i){return {seq:x[0],id:x[1],supplier:x[2],goods:Number(x[3]).toFixed(2),payable:Number(x[4]).toFixed(2),net:Number(x[5]).toFixed(2),orders:x[6],status:'待提交',created:x[7],cycle:x[8],blocked:i>1};});
    var supplierStatements = [
        [51,'ST_360188301','.80','.40','.40',1,'待供应商结款','2026-09-18 10:00','2026-09-17'],
        [50,'ST_360188302','.16','.00','.16',1,'结款失败','2026-09-16 10:00','2026-09-15'],
        [49,'ST_357556279620669440','.50','.49','.01',1,'待结款','2026-09-14 00:01','2026-09-12'],
        [48,'ST_354657178541367296','.30','.29','.01',1,'已结款','2026-09-06 00:01','2026-09-05'],
        [47,'ST_354567698031575040','1.00','.00','1.00',1,'已结款','2026-09-05 18:05','2026-09-05'],
        [46,'ST_353846837167284224','.04','.00','.04',1,'部分结款','2026-09-03 18:21','2026-09-03'],
        [45,'ST_351310165011607552','1.00','.00','1.00',1,'已结款','2026-08-27 18:21','2026-08-27'],
        [44,'ST_350947735597232128','.01','.00','.01',1,'已结款','2026-08-26 18:21','2026-08-26'],
        [43,'ST_2091833149312925697','.03','.00','.03',1,'部分结款','2026-08-24 18:21','2026-08-24'],
        [42,'ST_2088571653134880770','.05','.03','.02',1,'待结款','2026-08-15 18:21','2026-07-28'],
        [41,'ST_2088198765544431618','.72','.48','.24',1,'已结款','2026-08-14 17:39','2026-08-14'],
        [40,'ST_2088149923778523137','.60','.54','.06',1,'已结款','2026-08-14 14:25','2026-08-14'],
        [39,'ST_2088149923279400962','.05','.00','.05',1,'已结款','2026-08-14 14:25','2026-07-31'],
        [38,'ST_2087484487729389570','.20','.17','.03',1,'部分结款','2026-08-12 18:21','2026-07-31'],
        [37,'ST_2087122102445105154','.20','.08','.12',1,'已结款','2026-08-11 18:21','2026-07-28'],
        [36,'ST_2086759712106688514','.06','.03','.03',1,'待结款','2026-08-10 18:21','2026-08-10'],
        [35,'ST_2086739974253129729','.03','.00','.03',1,'已结款','2026-08-10 17:02','2026-08-10'],
        [34,'ST_2085998556598640642','.12','.00','.12',1,'已结款','2026-08-08 15:56','2026-08-08'],
        [33,'ST_2085998555847860226','.04','.02','.02',1,'待结款','2026-08-08 15:56','2026-07-28'],
        [32,'ST_2085983399835213825','.20','.18','.02',1,'已结款','2026-08-08 14:56','2026-08-08'],
        [31,'ST_2085672553501843458','.16','.10','.06',1,'已结款','2026-08-07 18:21','2026-08-05'],
        [30,'ST_2083135835167277057','.02','.00','.02',1,'已结款','2026-07-31 18:21','2026-07-31']
    ].map(function(x){return {seq:x[0],id:x[1],supplier:'斯斯供应商商家',goods:Number(x[2]).toFixed(2),payable:Number(x[3]).toFixed(2),net:Number(x[4]).toFixed(2),orders:x[5],status:x[6],created:x[7],cycle:x[8]};});
    // Dev 列表第 2/3 页的可见记录；用紧凑文本保留原页面顺序与数值。
    var pendingRest=`23|ST_2088934039406645249|南京马群枢纽供应商|0.02|0.01|0.01|1|2026-08-16 18:21|2026-08-15
22|ST_2088934038953660418|南京马群枢纽供应商|0.05|0.00|0.05|1|2026-08-16 18:21|2026-08-15
21|ST_2086739807944781826|南京马群枢纽供应商|0.04|0.02|0.02|1|2026-08-10 17:01|2026-07-27
20|ST_2085672552050614274|南京马群枢纽供应商|0.06|0.05|0.01|1|2026-08-07 18:21|2026-08-05
19|ST_2084222996683702274|南京马群枢纽供应商|0.02|0.01|0.01|1|2026-08-03 18:21|2026-07-20
18|ST_2082773445718794241|南京马群枢纽供应商|0.02|0.01|0.01|1|2026-07-30 18:21|2026-07-29
17|ST_2082411057787584514|南京马群枢纽供应商|0.10|0.05|0.05|2|2026-07-29 18:21|2026-07-28
16|ST_2081920199668232194|南京马群枢纽供应商|30.07|0.04|30.03|3|2026-07-28 09:50|2026-07-20
15|ST_2079149567027929090|南京马群枢纽供应商|5.01|0.00|5.01|1|2026-07-20 18:21|2026-07-20
14|ST_2069120735495798785|杭州萧山供应商|2.62|1.76|0.86|7|2026-06-23 02:10|2026-06
13|ST_2069120734036180993|南京马群枢纽供应商|20.10|0.00|20.10|1|2026-06-23 02:10|2026-06
12|ST_2067671182720581633|南京马群枢纽供应商|487.80|1.20|486.60|17|2026-06-19 02:10|2026-06
11|ST_2067224697647230978|南京马群枢纽供应商|1.00|0.50|0.50|1|2026-06-17 20:35|2026-06
10|ST_2067224695822708737|南京马群枢纽供应商|53.00|0.00|53.00|2|2026-06-17 20:35|2026-06
9|ST_2067183952404242434|南京马群枢纽供应商|492.00|0.00|492.00|6|2026-06-17 17:53|2026-06
8|ST_2067167076877139970|野子文化|9.90|0.00|9.90|1|2026-06-17 16:46|2026-06
7|ST_2064409691618164738|南京马群枢纽供应商|5.01|2.01|3.00|1|2026-06-10 02:10|2026-06
6|ST_2064047303769219074|南京马群枢纽供应商|5.01|2.01|3.00|1|2026-06-09 02:10|2026-06
5|ST_2063684915895353345|南京马群枢纽供应商|5.01|2.01|3.00|1|2026-06-08 02:10|2026-06
4|ST_2063322528042336257|南京马群枢纽供应商|5.01|2.01|3.00|1|2026-06-07 02:10|2026-06
3|ST_2062960140221755394|南京马群枢纽供应商|5.01|2.01|3.00|1|2026-06-06 02:10|2026-06
2|ST_2062597752292737025|南京马群枢纽供应商|5.01|2.01|3.00|1|2026-06-05 02:10|2026-06
1|ST_2062182070501064706|南京马群枢纽供应商|5.01|2.01|3.00|1|2026-06-03 22:38|2026-06`;
    supplierPending.push.apply(supplierPending,pendingRest.split('\n').map(function(line){var x=line.split('|');return {seq:Number(x[0]),id:x[1],supplier:x[2],goods:x[3],payable:x[4],net:x[5],orders:Number(x[6]),status:'待提交',created:x[7],cycle:x[8],blocked:true};}));
    var statementRest=`29|ST_2082024861949886466|斯斯供应商商家|0.60|0.30|0.30|1|待结款|2026-07-28 16:46|2026-07-28
28|ST_2082020706987827201|斯斯供应商商家|1.50|1.15|0.35|1|待结款|2026-07-28 16:29|2026-07-28
27|ST_2082013250278678529|斯斯供应商商家|1.50|1.40|0.10|1|已结款|2026-07-28 16:00|2026-07-28
26|ST_2082010209823514626|斯斯供应商商家|1.50|1.20|0.30|1|已结款|2026-07-28 15:48|2026-07-28
25|ST_2082002783346909186|斯斯供应商商家|0.72|0.60|0.12|2|已结款|2026-07-28 15:18|2026-07-28
24|ST_2081920202654576641|斯斯供应商商家|1.82|1.61|0.21|3|部分结款|2026-07-28 09:50|2026-07-27
23|ST_2081663476148891649|斯斯供应商商家|2.50|1.50|1.00|1|待结款|2026-07-27 16:50|2026-07-27
22|ST_2080961505944887298|斯斯供应商商家|0.30|0.15|0.15|1|已作废|2026-07-25 18:21|2026-07-25
21|ST_2080609528699899906|斯斯供应商商家|2.50|1.50|1.00|1|已结款|2026-07-24 19:02|2026-07-24
20|ST_2080236730335952898|斯斯供应商商家|2.50|1.50|1.00|1|已作废|2026-07-23 18:21|2026-07-23
19|ST_2079863501181792258|斯斯供应商商家|2.50|1.50|1.00|1|已结款|2026-07-22 17:37|2026-07-22
18|ST_2079754239207641090|斯斯供应商商家|2.50|1.50|1.00|1|待结款|2026-07-22 10:23|2026-07-22
17|ST_2076978067715092481|南京马群枢纽供应商|2.75|1.75|1.00|1|已作废|2026-07-14 18:32|2026-07-14
16|ST_2076934074286321666|斯斯供应商商家|4.00|1.90|2.10|1|待结款|2026-07-14 15:37|2026-07-14
15|ST_2076928530167214082|斯斯供应商商家|12.00|1.00|11.00|1|部分结款|2026-07-14 15:15|2026-07-14
14|ST_2076924120494092291|斯斯供应商商家|3.37|1.39|1.98|1|部分结款|2026-07-14 14:57|2026-07-14
13|ST_2076874116908212225|斯斯供应商商家|1.80|0.39|1.41|1|部分结款|2026-07-14 11:39|2026-07-14
12|ST_2076850972752830466|斯斯供应商商家|5.00|2.00|3.00|1|部分结款|2026-07-14 10:07|2026-07-14
11|ST_2076844125526384641|南京马群枢纽供应商|2.75|1.75|1.00|1|已作废|2026-07-14 09:40|2026-07-14
10|ST_2076562090022502401|斯斯供应商商家|2.39|1.00|1.39|1|部分结款|2026-07-13 14:59|2026-07
9|ST_2076513812718309378|斯斯供应商商家|6.80|0.39|6.41|1|待结款|2026-07-13 11:47|2026-07
8|ST_2075940673399574530|南京马群枢纽供应商|0.04|0.00|0.04|1|已作废|2026-07-11 21:50|2026-07
7|ST_2075578285366968321|南京马群枢纽供应商|2.75|1.25|1.50|1|已作废|2026-07-10 21:50|2026-07
6|ST_2075578284343558146|斯斯供应商商家|11.25|0.00|11.25|1|待结款|2026-07-10 21:50|2026-07
5|ST_2075164308317143042|斯斯供应商商家|70.22|0.00|70.22|2|待结款|2026-07-09 18:25|2026-07
4|ST_2075164307973210114|南京马群枢纽供应商|0.02|0.00|0.02|1|已作废|2026-07-09 18:25|2026-07
3|ST_2075164306874302466|杭州萧山供应商|0.04|0.02|0.02|1|已作废|2026-07-09 18:25|2026-07
2|ST_2067671193382502402|张供应商|2.00|0.00|2.00|1|待结款|2026-06-19 02:10|2026-06
1|ST_2062235364436897793|南京马群枢纽供应商|5.01|2.01|3.00|1|待结款|2026-06-04 02:10|2026-06`;
    supplierStatements.push.apply(supplierStatements,statementRest.split('\n').map(function(line){var x=line.split('|');return {seq:Number(x[0]),id:x[1],supplier:x[2],goods:x[3],payable:x[4],net:x[5],orders:Number(x[6]),status:x[7],created:x[8],cycle:x[9]};}));
    /* 承运商运费：平台结算账户 → 承运商基本账户，与供应商结算、佣金清分无关。 */
    /* 承运商编码、名称与物流承运商 SCM/carrier.html 一致。 */
    var carrierPending = [
        {seq:6,id:'CF_360188201',carrier:'顺丰速运',carrierId:'SF',accountName:'顺丰速运有限公司',account:'6666000219001100',freight:'128.60',orders:6,status:'待提交',created:'2026-09-24 09:30',cycle:'2026-09-23',blocked:false,reason:''},
        {seq:5,id:'CF_360188202',carrier:'中通快递',carrierId:'ZTO',accountName:'',account:'',freight:'86.40',orders:4,status:'待提交',created:'2026-09-24 09:30',cycle:'2026-09-23',blocked:true,reason:'未配置承运商基本账户'},
        {seq:4,id:'CF_360188203',carrier:'圆通速递',carrierId:'YTO',accountName:'杭州圆通结算中心有限公司',account:'6666000219003300',freight:'36.00',orders:2,status:'待提交',created:'2026-09-23 09:30',cycle:'2026-09-22',blocked:true,reason:'承运商已停用，暂停结算'},
        {seq:3,id:'CF_360188204',carrier:'顺丰速运',carrierId:'SF',accountName:'顺丰速运有限公司',account:'6666000219001100',freight:'0.00',orders:1,status:'待提交',created:'2026-09-22 09:30',cycle:'2026-09-21',blocked:true,reason:'运费明细缺失，无法出账'}
    ];
    var carrierStatements = [
        {seq:6,id:'CF_360199301',carrier:'顺丰速运',carrierId:'SF',accountName:'顺丰速运有限公司',account:'6666000219001100',freight:'42.00',orders:2,status:'部分结款',created:'2026-09-21 09:30',cycle:'2026-09-20',posted:'',flow:'平台结算账户 → 承运商基本账户'},
        {seq:5,id:'CF_360199302',carrier:'圆通速递',carrierId:'YTO',accountName:'杭州圆通结算中心有限公司',account:'6666000219003300',freight:'28.50',orders:2,status:'待结款',created:'2026-09-19 09:30',cycle:'2026-09-18',posted:'',flow:'平台结算账户 → 承运商基本账户'},
        {seq:4,id:'CF_360199303',carrier:'中通快递',carrierId:'ZTO',accountName:'中通快递有限公司',account:'6666000219005500',freight:'18.00',orders:1,status:'已作废',created:'2026-09-17 09:30',cycle:'2026-09-16',posted:'',flow:'平台结算账户 → 承运商基本账户',reason:'结算单已作废'},
        {seq:3,id:'CF_360177020',carrier:'韵达快递',carrierId:'YD',accountName:'韵达快递有限公司',account:'6666000219004400',freight:'64.00',orders:3,status:'待结款',created:'2026-09-20 09:30',cycle:'2026-09-19',posted:'',flow:'平台结算账户 → 承运商基本账户'},
        {seq:2,id:'CF_360166011',carrier:'顺丰速运',carrierId:'SF',accountName:'顺丰速运有限公司',account:'6666000219001100',freight:'96.20',orders:5,status:'已结款',created:'2026-09-18 09:30',cycle:'2026-09-17',posted:'2026-09-18 11:06',flow:'平台结算账户 → 承运商基本账户'},
        {seq:1,id:'CF_360155008',carrier:'申通快递',carrierId:'STO',accountName:'申通快递有限公司',account:'6666000219002200',freight:'54.80',orders:3,status:'结款失败',created:'2026-09-16 09:30',cycle:'2026-09-15',posted:'',flow:'平台结算账户 → 承运商基本账户',reason:'收款账户校验失败'}
    ];
    var commissions = [
        {seq:182,id:'ST_358643444144418816',supplier:'南京马群枢纽供应商',payee:'上海冷丰科技有限公司',type:'平台',amount:'0.02',orders:'2',status:'待生成',posting:'',related:'ST_358643443066482688',created:'2026-09-17 00:01'},
        {seq:181,id:'ST_357556280904126464',supplier:'斯斯供应商商家',payee:'上海冷丰科技有限公司',type:'平台',amount:'0.24',orders:'1',status:'已结款',posting:'已到账',related:'ST_357556279620669440',created:'2026-09-14 00:01',time:'2026-09-14 10:20'},
        {seq:180,id:'ST_357556280438558720',supplier:'斯斯供应商商家',payee:'斯斯门店商家2',type:'门店',amount:'0.25',orders:'1',status:'已结款',posting:'已到账',related:'ST_357556279620669440',created:'2026-09-14 00:01',time:'2026-09-14 10:22'},
        {seq:179,id:'ST_357200111222333444',supplier:'斯斯供应商商家',payee:'野子文化',type:'门店',amount:'0.18',orders:'1',status:'结款失败',posting:'入账失败',related:'ST_357556279620669440',created:'2026-09-13 00:01',time:'2026-09-13 11:05'}
    ];
    /* 清分汇总含佣金分佣方与承运商运费收款；承运商行对齐承运商结算单金额口径。 */
    var summaryDay = [
        {seq:128,period:'2026-09-24',payee:'顺丰速运',type:'承运商',id:'SF',total:'128.60',settled:'0.00',pending:'128.60',blocked:'0.00',statements:'1',lines:'6'},
        {seq:127,period:'2026-09-24',payee:'中通快递',type:'承运商',id:'ZTO',total:'86.40',settled:'0.00',pending:'0.00',blocked:'86.40',statements:'1',lines:'4'},
        {seq:126,period:'2026-09-20',payee:'韵达快递',type:'承运商',id:'YD',total:'64.00',settled:'0.00',pending:'64.00',blocked:'0.00',statements:'1',lines:'3'},
        {seq:125,period:'2026-09-18',payee:'顺丰速运',type:'承运商',id:'SF',total:'96.20',settled:'96.20',pending:'0.00',blocked:'0.00',statements:'1',lines:'5'},
        {seq:124,period:'2026-09-16',payee:'申通快递',type:'承运商',id:'STO',total:'54.80',settled:'0.00',pending:'0.00',blocked:'54.80',statements:'1',lines:'3'},
        {seq:123,period:'2026-09-17',payee:'上海冷丰科技有限公司',type:'平台',id:'1',total:'0.02',settled:'0.00',pending:'0.00',blocked:'0.02',statements:'1',lines:'2'},
        {seq:122,period:'2026-09-14',payee:'斯斯门店商家2',type:'门店',id:'330159456409100288',total:'0.25',settled:'0.00',pending:'0.25',blocked:'0.00',statements:'1',lines:'1'},
        {seq:121,period:'2026-09-14',payee:'上海冷丰科技有限公司',type:'平台',id:'1',total:'0.24',settled:'0.00',pending:'0.24',blocked:'0.00',statements:'1',lines:'1'}
    ];
    var summaryMonth = [
        {seq:30,period:'2026-09',payee:'顺丰速运',type:'承运商',id:'SF',total:'266.80',settled:'96.20',pending:'170.60',blocked:'0.00',statements:'3',lines:'13'},
        {seq:29,period:'2026-09',payee:'中通快递',type:'承运商',id:'ZTO',total:'104.40',settled:'0.00',pending:'0.00',blocked:'104.40',statements:'2',lines:'5'},
        {seq:28,period:'2026-09',payee:'韵达快递',type:'承运商',id:'YD',total:'64.00',settled:'0.00',pending:'64.00',blocked:'0.00',statements:'1',lines:'3'},
        {seq:27,period:'2026-09',payee:'申通快递',type:'承运商',id:'STO',total:'54.80',settled:'0.00',pending:'0.00',blocked:'54.80',statements:'1',lines:'3'},
        {seq:26,period:'2026-09',payee:'上海冷丰科技有限公司',type:'BD扶商',id:'1',total:'0.01',settled:'0.00',pending:'0.00',blocked:'0.01',statements:'1',lines:'1'},
        {seq:25,period:'2026-09',payee:'斯斯门店商家2',type:'门店',id:'330159456409100288',total:'0.25',settled:'0.00',pending:'0.25',blocked:'0.00',statements:'1',lines:'1'},
        {seq:24,period:'2026-09',payee:'野子文化',type:'门店',id:'328707092338712576',total:'0.01',settled:'0.00',pending:'0.00',blocked:'0.01',statements:'1',lines:'1'},
        {seq:23,period:'2026-09',payee:'上海冷丰科技有限公司',type:'平台',id:'1',total:'1.87',settled:'0.29',pending:'0.24',blocked:'1.34',statements:'11',lines:'14'}
    ];
    /* related = 异常单号 EX_*，与异常单闭环；不以供应商结款单号充当关联异常单 */
    var compensations = [
        [9,'CST_374147882901274624','EX_2610282411003_1247','0.08','主播组','直播运营商','6666000219003300','2026-10-29 19:42','已结款','2026-10-29 19:42:18'],
        [8,'CST_374100112233445566','EX_2610252087662_1201','0.40','上海冷丰科技有限公司','平台','6666000202016395','2026-10-26 10:08','已结款','2026-10-26 10:08:55'],
        [7,'CST_2076953749068009474','EX_2076928530167214082','0.05','斯斯门店商家2','门店','6666000218330779','2026-07-14 16:55','待结款','—'],
        [6,'CST_2076953686182809601','EX_2076934074286321666','0.10','斯斯门店商家2','门店','6666000218330779','2026-07-14 16:55','待结款','—'],
        [5,'CST_2076854158091579393','EX_2076513812718309378','0.02','斯斯门店商家2','门店','6666000218330779','2026-07-14 10:19','已结款','2026-07-14T10:26:06'],
        [4,'CST_2076853411425775618','EX_2076850972752830466','0.02','上海冷丰科技有限公司','BD扶商','6666000202016395','2026-07-14 10:16','已结款','2026-07-14T10:24:32'],
        [3,'CST_2076851237383794689','EX_2076850972752830467','0.10','斯斯门店商家2','门店','6666000218330779','2026-07-14 10:08','已结款','2026-07-14T10:09:38'],
        [2,'CST_2076584293992595457','EX_2076562090022502401','0.01','上海冷丰科技有限公司','BD扶商','6666000202016395','2026-07-13 16:27','已结款','2026-07-14T10:36:43'],
        [1,'CST_2076577250279784449','EX_2076562090022502402','0.05','斯斯门店商家2','门店','6666000218330779','2026-07-13 15:59','已结款','2026-07-14T10:45:14']
    ].map(function(x){return {seq:x[0],id:x[1],type:'入账异常补偿',related:x[2],amount:x[3],payer:'平台二帐户',payerAccount:'6666000202016395',payee:x[4],payeeType:x[5],payeeAccount:x[6],created:x[7],status:x[8],time:x[9]};});
    var policies = [
        [15,'乐事','商城','乐事 毛利率≥1%，参与分佣：门店1%/BD扶商1%/直播运营0%/商户0%，平台按剩余金额结算','1','已启用','2026-09-05 17:35'],
        [14,'芒果干策略','商城','芒果干分佣规则 毛利率≥0%，参与分佣：门店0%/BD扶商0%/直播运营0%/商户0%，平台按剩余金额结算','22','已停用','2026-08-14 21:50'],
        [13,'芒果干','商城','芒果干 毛利率≥0%，参与分佣：门店0%/BD扶商0%/直播运营0%/商户0%，平台按剩余金额结算','1','已停用','2026-08-14 20:00'],
        [12,'芒果干-分佣策略','商城','11111 毛利率≥0%，参与分佣：门店0%/BD扶商0%/直播运营0%/商户0%，平台按剩余金额结算','61','已停用','2026-08-14 19:29'],
        [11,'666666','商城','分佣测试 毛利率≥6%，参与分佣：门店7%/BD扶商3%/直播运营0%/商户0%，平台按剩余金额结算；分佣 毛利率≥0%，参与分佣：门店0%/BD扶商0%/直播运营0%/商户0%，平台按剩余金额结算','30','已停用','2026-07-13 14:04'],
        [10,'分佣策略0711','直播','测试分佣规则 1 毛利率≥20%，参与分佣：门店20%/BD扶商20%/直播运营10%/商户0%，平台按剩余金额结算；新建分佣规则 2 毛利率≥0%，参与分佣：门店0%/BD扶商0%/直播运营0%/商户0%，平台按剩余金额结算；测试分佣规则 3 毛利率≥5%，参与分佣：门店5%/BD扶商5%/直播运营5%/商户0%，平台按剩余金额结算','0','已停用','2026-07-11 16:29'],
        [9,'复现bug2583-反了测试','直播','反了测试规则 毛利率≥0%，参与分佣：门店0%/BD扶商0%/直播运营0%/平台7%，商户按剩余金额结算','0','已停用','2026-07-11 11:28'],
        [8,'芒果干测试重复清分','商城','—','1','已停用','2026-07-10 22:04'],
        [7,'710分佣策略','商城','分佣规则测试 毛利率≥4%，参与分佣：门店2%/BD扶商2%/直播运营0%/商户3%，平台按剩余金额结算；毛利率≥10%，参与分佣：门店3%/BD扶商3%/直播运营0%/商户3%，平台按剩余金额结算；毛利率≥50%，参与分佣：门店4%/BD扶商4%/直播运营0%/商户5%，平台按剩余金额结算','1','已停用','2026-07-10 21:28'],
        [6,'710测试结算策略-牛牛','商城','710测试 毛利率≥4%，参与分佣：门店2%/BD扶商2%/直播运营0%/商户6%，平台按剩余金额结算；毛利率≥10%，参与分佣：门店3%/BD扶商3%/直播运营0%/商户6%，平台按剩余金额结算；毛利率≥50%，参与分佣：门店4%/BD扶商4%/直播运营0%/商户6%，平台按剩余金额结算','1','已停用','2026-07-10 21:00'],
        [5,'芒果干专用清分策略','商城','芒果干 毛利率≥50%，参与分佣：门店1%/BD扶商1%/直播运营0%/商户0.2%，平台按剩余金额结算','1','已停用','2026-07-10 20:31'],
        [4,'日用百货类目专用策略','商城','日用百货 毛利率≥50%，参与分佣：门店2%/BD扶商2%/直播运营0%/商户0.2%，平台按剩余金额结算','1','已停用','2026-07-10 20:26'],
        [3,'芒果干专用策略','商城','大枣专用 毛利率≥50%，参与分佣：门店1%/BD扶商1%/直播运营0%/商户0.2%，平台按剩余金额结算','1','已终止','2026-07-10 20:24'],
        [2,'直播默认结算策略','直播','直播默认策略一档 毛利率≥1%，参与分佣：门店1%/BD扶商1%/直播运营1%/商户10%，平台按剩余金额结算；补充规则 毛利率≥0%，参与分佣：门店0%/BD扶商0%/直播运营0%/商户0%，平台按剩余金额结算；毛利率≥10%，参与分佣：门店5%/BD扶商2%/直播运营2%/商户0%，平台按剩余金额结算','全部门店','已启用','2026-06-17 15:41'],
        [1,'商城默认分佣策略','商城','默认策略 毛利率≥5%，参与分佣：门店50%/BD扶商0%/直播运营0%/商户0%，平台按剩余金额结算','全部门店','已启用','2026-06-03 09:33']
    ].map(function(x){return {id:x[0]===15?'POLICY_354560079879471104':'policy-'+x[0],seq:x[0],name:x[1],kind:'零售订单',channel:x[2],basis:x[0]===8?'':'按实付金额分佣',trigger:'订单履约确认后',rule:x[3],stores:x[4],status:x[5],time:x[6]};});
    policies.push({id:'policy-consignment',seq:1,name:'代采商城结算策略',kind:'代采订单',channel:'',basis:'',trigger:'订单履约确认后',rule:'代采-分佣规则 毛利率≥3%，BD扶商2%，平台按剩余金额结算；毛利率≥6%，BD扶商5%，平台按剩余金额结算',stores:'',status:'已停用',time:'2026-07-27 15:44'});
    var generalLogs = [
        {time:'2026-09-12 23:09:53', content:'保存结算通用配置', operator:'superadmin', business:'平台', result:'成功', change:'结算单生成时间：08:01:00 → 00:01:00'}
    ];
    var policyLogs = [
        {time:'2026-09-05 17:35', content:'调整策略绑定门店', operator:'—', business:'乐事', result:'成功', change:'绑定门店发生调整'},
        {time:'2026-09-05 17:35', content:'创建佣金策略', operator:'—', business:'乐事', result:'成功', change:'创建零售订单策略'}
    ];
    var ORDER_TYPES = ['普通售卖', '拉新赠品', '福袋奖品', '积分兑换', '签到奖品', '观看奖励奖品'];
    var ROUND_MODES = [['one', '计1分'], ['ignore', '不计分'], ['round', '四舍五入']];
    var config = {master:true, exclude:false, excludeTypes:[], min:'0.00', roundMode:'round', cycle:'1', generate:'00:01', autoBill:true, payHours:'1'};
    function h(v) { return String(v == null ? '' : v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
    function cash(v) { return v === '—' ? '—' : '¥' + h(v); }
    /* 付款方、收款方是业务主体。汇付户名和商户号按实际收付款账户取，可以是本人进件，也可以是绑定的其他商户。 */
    var PLATFORM_PAYER_NAME = '上海冷丰科技有限公司';
    var PLATFORM_PAYER_NO = '6666000202016395';
    var BOUND_HUIFU = {
        /* 多数商户绑定他司进件：收款方 ≠ 收款账户名称；平台本人进件户名与主体一致 */
        '斯斯供应商商家': { name: '小牛供应链有限公司', no: '6666000218008801' },
        '斯斯门店商家2': { name: '斯斯商贸结算中心', no: '6666000218330779' },
        '南京马群枢纽供应商': { name: '南京冷链物流服务有限公司', no: '6666000219001108' },
        '杭州萧山供应商': { name: '萧山冷鲜供应链有限公司', no: '6666000218119900' },
        '野子文化': { name: '野子文化传播（上海）有限公司', no: '6666000218112200' },
        '张供应商': { name: '张氏生鲜贸易有限公司', no: '6666000218221100' },
        '上海恒业智汇贸易有限公司': { name: '恒业智汇结算专户', no: '6666000218008801' },
        '上海沁香有品供应链管理有限公司': { name: '沁香有品（上海）商贸有限公司', no: '6666000218445566' },
        '上海冷丰科技有限公司': { name: '上海冷丰科技有限公司', no: '6666000202016395' },
        '总部BDBD团队': { name: '上海冷丰科技有限公司', no: '6666000202016395' },
        '主播组': { name: '星火直播运营中心', no: '6666000219003300' },
        '申通快递': { name: '申通快递有限公司', no: '6666000219002200' },
        '圆通速递': { name: '杭州圆通结算中心有限公司', no: '6666000219003300' },
        '中通快递': { name: '中通快递股份有限公司', no: '6666000219004400' },
        '顺丰速运': { name: '顺丰速运有限公司', no: '6666000219001100' },
        '韵达快递': { name: '韵达快递有限公司', no: '6666000219004400' }
    };
    function huifuAccount(party, fallbackNo) {
        if (party && BOUND_HUIFU[party]) return BOUND_HUIFU[party];
        return { name: party || '—', no: fallbackNo || '—' };
    }
    /* 汇付按订单明细单笔划拨：通道流水号挂在明细/收付款记录上，不挂在结算单头。 */
    function hasChannelTransfer(status) {
        return /已结款|部分结款|结款失败|已到账|已入账|已结款\(人工\)|人工结款/.test(String(status || ''));
    }
    function channelFlowNo(seed, status, time) {
        if (!hasChannelTransfer(status)) return '—';
        var digits = String(seed || '').replace(/\D/g, '');
        if (digits.length < 12) digits = (digits + String((time || '').replace(/\D/g, '') + '003100TOP3B260914').slice(0, 24)).slice(0, 24);
        return '003100TOP3B' + digits.slice(-18);
    }
    function maskAccount(no) {
        var s = String(no || '');
        if (s.length < 8) return s || '—';
        return s.slice(0, 4) + '****' + s.slice(-4);
    }
    /* 演示：按结算单内订单笔数生成明细级通道流水，供列表反查与详情展示。 */
    function buildLineFlows(billId, status, time, orderCount, amountSeed) {
        if (!hasChannelTransfer(status)) return [];
        var n = Math.max(1, Number(orderCount) || 1);
        var lines = [];
        for (var i = 0; i < n; i++) {
            var ord = 'ORD-' + String(billId || '').replace(/\D/g, '').slice(-10) + String(100 + i);
            lines.push({
                orderNo: ord,
                lineNo: ord + '-1',
                amount: amountSeed != null ? String(amountSeed) : '0.01',
                flowNo: channelFlowNo(String(billId) + '-' + (i + 1), status, time),
                time: time || ''
            });
        }
        return lines;
    }
    function billMatchesFlow(bill, flowQ) {
        var q = String(flowQ || '').trim();
        if (!q) return true;
        var lines = bill.lineFlows || [];
        for (var i = 0; i < lines.length; i++) {
            if (String(lines[i].flowNo || '').indexOf(q) >= 0) return true;
        }
        return false;
    }
    /* 主体≠户名、明细挂通道流水号的规则由数据与字段体现，页面不展示说明文案。 */
    function accountNote() {
        return '';
    }
    function button(label, act, id, kind) { return '<button type="button" class="settle-btn ' + (kind || 'link') + '" data-act="' + h(act) + '"' + (id ? ' data-id="' + h(id) + '"' : '') + '>' + h(label) + '</button>'; }
    /* 跨表溯源：跳到目标单据详情（view:docId） */
    function linkDoc(label, view, docId) {
        if (!docId || docId === '—' || docId === '-') return h(label || '—');
        return button(label || docId, 'goto-doc', view + ':' + docId);
    }
    function resolveDocTarget(raw) {
        var parts = String(raw || '').split(':');
        var view = parts[0];
        var docId = parts.slice(1).join(':');
        if (!view || !docId) return null;
        if (view === 'exception') return { view: 'ledger', tab: 'exception', detail: docId };
        return { view: view, tab: '', detail: docId };
    }
    function enrichPayeeAccount(row, partyKey, fallbackNo) {
        var party = row[partyKey] || row.payee || row.supplier || row.carrier;
        var acc = huifuAccount(party, fallbackNo || row.payeeAccount || row.account || '');
        row.payeeAccountName = row.payeeAccountName || row.accountName || acc.name;
        row.payeeAccount = row.payeeAccount || row.accountNo || acc.no;
        if (!row.accountName) row.accountName = row.payeeAccountName;
        if (!row.account && row.payeeAccount) row.account = maskAccount(row.payeeAccount);
        /* 结算单不写整单 flowNo；明细级流水写入 lineFlows，供反查 */
        delete row.flowNo;
        var orderCount = row.orders != null ? row.orders : 1;
        var amountSeed = row.net || row.freight || row.amount;
        row.lineFlows = buildLineFlows(row.id, row.status || row.posting, row.time || row.posted || row.created, orderCount, amountSeed);
        return row;
    }
    [supplierPending, supplierStatements].forEach(function (list) {
        list.forEach(function (row) { enrichPayeeAccount(row, 'supplier'); });
    });
    [carrierPending, carrierStatements].forEach(function (list) {
        list.forEach(function (row) {
            enrichPayeeAccount(row, 'carrier', row.account);
            if (row.accountName) row.payeeAccountName = row.accountName;
        });
    });
    commissions.forEach(function (row) { enrichPayeeAccount(row, 'payee', row.type === '平台' ? PLATFORM_PAYER_NO : undefined); });
    compensations.forEach(function (row) { enrichPayeeAccount(row, 'payee', row.payeeAccount); });
    var SETTLEMENT_STATUSES = ['待提交', '待结款', '部分结款', '待供应商结款', '已结款', '结款失败', '已作废', '异常'];
    function statusOptions() {
        return '<option value="">全部</option>' + SETTLEMENT_STATUSES.map(function (x) {
            return '<option' + (state.status === x ? ' selected' : '') + '>' + x + '</option>';
        }).join('');
    }
    function tag(v) { var cls = /已结款|已销账|已到账|已出账|启用|成功/.test(v) ? 'green' : /异常|失败|阻断/.test(v) ? 'red' : /待|部分/.test(v) ? 'orange' : ''; return '<span class="settle-tag ' + cls + '">' + h(v) + '</span>'; }
    function table(head, rows, foot) {
        return '<div class="settle-table-wrap"><table class="settle-table"><thead><tr>' + head.map(function(x){return '<th>' + h(x) + '</th>';}).join('') +
            '</tr></thead><tbody>' + (rows.length ? rows.join('') : '<tr><td colspan="' + head.length + '" class="settle-empty">暂无数据</td></tr>') +
            '</tbody></table></div>' + (foot ? '<div class="settle-table-footer">' + foot + '</div>' : '');
    }
    function card(title, body, actions) { return '<section class="settle-card"><div class="settle-card-head"><h2>' + h(title) + '</h2><div class="settle-actions">' + (actions || '') + '</div></div>' + body + '</section>'; }
    function kv(items) { return '<dl class="settle-kv">' + items.map(function(x){return '<div class="settle-kv-item"><dt>' + h(x[0]) + '</dt><dd>' + x[1] + '</dd></div>';}).join('') + '</dl>'; }
    function description(items) {return '<div class="settle-description">'+items.map(function(x){return '<div class="settle-description-item"><span>'+h(x[0])+'</span><strong>'+x[1]+'</strong></div>';}).join('')+'</div>';}
    function tabs(items) { return '<div class="settle-tabs">' + items.map(function(x){return '<button type="button" class="settle-tab' + (state.tab === x[0] ? ' active' : '') + '" data-act="tab" data-id="' + h(x[0]) + '">' + h(x[1]) + '</button>';}).join('') + '</div>'; }
    function filter(opts) {
        return '<div class="settle-card-body"><div class="settle-filter">' +
            '<label class="settle-field"><span>关键词</span><input class="settle-input" id="settle-query" value="' + h(state.query) + '" placeholder="' + h(opts.placeholder || '请输入关键词') + '"></label>' +
            (opts.statuses ? '<label class="settle-field"><span>状态</span><select class="settle-select" id="settle-status"><option value="">全部状态</option>' + opts.statuses.map(function(x){return '<option value="' + h(x) + '"' + (state.status === x ? ' selected' : '') + '>' + h(x) + '</option>';}).join('') + '</select></label>' : '') +
            '<div class="settle-actions">' + button('查询','search','','primary') + button('重置','reset','','') + '</div></div></div>';
    }
    function filtered(rows, fields) { var q=state.query.trim().toLowerCase(); return rows.filter(function(row){return (!q || fields.some(function(f){return String(row[f] || '').toLowerCase().includes(q);})) && (!state.status || row.status === state.status || (state.status==='异常' && row.blocked));}); }
    function note(text) { return '<div class="settle-note">' + h(text) + '</div>'; }
    /* 清分台账：订单商品行级清分明细，对齐运营后台策略管理 · 清分台账列表。 */
    var LEDGER_CLEAR_STATUSES = ['待清分', '已清分', '清分异常'];
    var LEDGER_SETTLE_STATUSES = ['待结算', '待结款', '结款中', '已结款', '结款失败'];
    var LEDGER_AFTERSALE_STATUSES = ['无售后', '售后中', '售后完成', '售后关闭'];
    var LEDGER_ORDER_TYPES = ['零售', '代采'];
    var LEDGER_CHANNELS = ['商城', '直播', '代采'];
    var LEDGER_ORDER_STATUSES = ['待发货', '待收货', '交易成功', '交易关闭'];
    var LEDGER_POSTING_STATUSES = ['待入账', '已入账', '入账失败'];
    var LEDGER_PAYEE_TYPES = ['平台', '供应商', '门店', 'BD扶商', '直播运营商', '商户', '承运商'];
    var ledgerSeed = [
        {id:'1720', orderNo:'ORD-2610312477895', lineNo:'—', storeId:'325279987563245056', storeName:'德清乾元天恩冷鲜超市', orderType:'代采', channel:'代采', sku:'SKU00217', product:'运费验收-快递常温2.5kg', spec:'2.5kg', qty:1, orderStatus:'交易成功', aftersaleStatus:'—', reverseSettle:'是', purchase:'0.01', sales:'1.00', paid:'2.40', netPaid:'2.40', margin:'99.58%', payee:'上海冷丰科技有限公司', payeeType:'平台', account:'6666000202016395', accountNo:'6666000202016395', commissionMode:'按实付金额分佣', strategy:'未命中策略 (系统默认)', commissionable:'是', receivable:'1.40', received:'—', clearStatus:'已清分', settleStatus:'待结算', postingStatus:'待入账', exceptionType:'—', orderTime:'2026-10-31 18:17:16', clearTime:'—', settleTime:'—', postingTime:'—', remark:'—', billKind:'commission'},
        {id:'1721', orderNo:'ORD-2610312477895', lineNo:'—', storeId:'325279987563245056', storeName:'德清乾元天恩冷鲜超市', orderType:'代采', channel:'代采', sku:'SKU00217', product:'运费验收-快递常温2.5kg', spec:'2.5kg', qty:1, orderStatus:'交易成功', aftersaleStatus:'—', reverseSettle:'否', purchase:'0.01', sales:'1.00', paid:'2.40', netPaid:'2.40', margin:'99.58%', payee:'上海恒业智汇贸易有限公司', payeeType:'供应商', account:'6666000218008801', accountNo:'6666000218008801', commissionMode:'—', strategy:'—', commissionable:'否', receivable:'0.01', received:'0.00', clearStatus:'已清分', settleStatus:'待结算', postingStatus:'待入账', exceptionType:'—', orderTime:'2026-10-31 18:17:16', clearTime:'—', settleTime:'—', postingTime:'—', remark:'—', billKind:'non_commission'},
        /* 承运商运费清分：不参与商品分佣，平台结算账户 → 承运商基本账户 */
        {id:'1722', orderNo:'ORD-3212689201599201', lineNo:'—', storeId:'ONS303445581212', storeName:'德清乾元天恩冷丰店', orderType:'零售', channel:'商城', sku:'FREIGHT', product:'订单运费', spec:'快递', qty:1, orderStatus:'待提货', aftersaleStatus:'无售后', reverseSettle:'否', purchase:'0.00', sales:'6.00', paid:'6.00', netPaid:'6.00', margin:'—', payee:'顺丰速运', payeeType:'承运商', account:'6666000219001100', accountNo:'6666000219001100', commissionMode:'运费全额结算', strategy:'承运商运费结算', commissionable:'否', receivable:'6.00', received:'0.00', clearStatus:'已清分', settleStatus:'待结算', postingStatus:'待入账', exceptionType:'—', orderTime:'2026-08-07 15:21:00', clearTime:'2026-08-07 15:21:05', settleTime:'—', postingTime:'—', remark:'运费不参与分佣', billKind:'non_commission'},
        {id:'1719', orderNo:'ORD-2610312466502', lineNo:'ORD-2610312466502-1', storeId:'330159456409100288', storeName:'斯斯门店商家2', orderType:'零售', channel:'商城', sku:'SKU00196', product:'火龙果', spec:'白心 / 袋', qty:2, orderStatus:'交易成功', aftersaleStatus:'—', reverseSettle:'否', purchase:'0.02', sales:'0.06', paid:'0.06', netPaid:'0.06', margin:'66.67%', payee:'斯斯供应商商家', payeeType:'供应商', account:'6666000218008801', accountNo:'6666000218008801', commissionMode:'按实付金额分佣', strategy:'商城默认分佣策略', commissionable:'是', receivable:'0.04', received:'0.00', clearStatus:'已清分', settleStatus:'待结款', postingStatus:'待入账', exceptionType:'—', orderTime:'2026-10-31 13:58:02', clearTime:'2026-10-31 14:01:10', settleTime:'—', postingTime:'—', remark:'—', billKind:'commission'},
        {id:'1718', orderNo:'ORD-2610312466502', lineNo:'ORD-2610312466502-2', storeId:'330159456409100288', storeName:'斯斯门店商家2', orderType:'零售', channel:'商城', sku:'SKU00184', product:'白芭乐-快递-ss', spec:'100g / L', qty:1, orderStatus:'交易成功', aftersaleStatus:'售后中', reverseSettle:'是', purchase:'0.01', sales:'0.01', paid:'0.01', netPaid:'0.01', margin:'0.00%', payee:'上海冷丰科技有限公司', payeeType:'平台', account:'6666000202016395', accountNo:'6666000202016395', commissionMode:'按实付金额分佣', strategy:'商城默认分佣策略', commissionable:'是', receivable:'0.00', received:'0.00', clearStatus:'清分异常', settleStatus:'待结算', postingStatus:'待入账', exceptionType:'结算金额异常', orderTime:'2026-10-31 13:58:02', clearTime:'—', settleTime:'—', postingTime:'—', remark:'售后中，暂缓结款', billKind:'exception'},
        {id:'1717', orderNo:'ORD-2610308891201', lineNo:'—', storeId:'328707092338712576', storeName:'野子文化', orderType:'零售', channel:'直播', sku:'SPU00142', product:'马群-莲藕-快递配送', spec:'粉糯莲藕 / 包', qty:1, orderStatus:'待收货', aftersaleStatus:'无售后', reverseSettle:'否', purchase:'0.02', sales:'0.10', paid:'0.10', netPaid:'0.10', margin:'80.00%', payee:'总部BDBD团队', payeeType:'BD扶商', account:'6666000219002201', accountNo:'6666000219002201', commissionMode:'按实付金额分佣', strategy:'直播默认结算策略', commissionable:'是', receivable:'0.02', received:'0.00', clearStatus:'待清分', settleStatus:'待结算', postingStatus:'待入账', exceptionType:'—', orderTime:'2026-10-30 21:16:44', clearTime:'—', settleTime:'—', postingTime:'—', remark:'—', billKind:'commission'},
        {id:'1716', orderNo:'ORD-2610307754308', lineNo:'ORD-2610307754308-1', storeId:'319838916817453056', storeName:'南京马群枢纽供应商店', orderType:'代采', channel:'代采', sku:'SPU00204', product:'低糖养乐多', spec:'低糖芒果味 / 箱', qty:3, orderStatus:'交易成功', aftersaleStatus:'—', reverseSettle:'否', purchase:'1.50', sales:'3.00', paid:'3.00', netPaid:'2.90', margin:'48.28%', payee:'南京马群枢纽供应商', payeeType:'供应商', account:'6666000219001108', accountNo:'6666000219001108', commissionMode:'—', strategy:'—', commissionable:'否', receivable:'1.50', received:'1.50', clearStatus:'已清分', settleStatus:'已结款', postingStatus:'已入账', exceptionType:'—', orderTime:'2026-10-30 18:05:11', clearTime:'2026-10-30 18:10:00', settleTime:'2026-10-31 09:20:00', postingTime:'2026-10-31 09:21:05', remark:'—', billKind:'non_commission'}
    ];
    var ledgerOrders = (function () {
        var list = [];
        var stores = ['德清乾元天恩冷鲜超市', '斯斯门店商家2', '野子文化', '南京万达店', '杭州西湖店', '上海徐家汇店'];
        var products = [
            {sku:'SKU00217', name:'运费验收-快递常温2.5kg', spec:'2.5kg'},
            {sku:'SKU00196', name:'火龙果', spec:'白心 / 袋'},
            {sku:'SKU00184', name:'白芭乐-快递-ss', spec:'100g / L'},
            {sku:'SPU00142', name:'马群-莲藕-快递配送', spec:'粉糯莲藕 / 包'},
            {sku:'SPU00204', name:'低糖养乐多', spec:'低糖芒果味 / 箱'},
            {sku:'SPU00181', name:'海南贵妃芒礼盒', spec:'2.5kg / 盒'}
        ];
        var payees = [
            {name:'上海冷丰科技有限公司', type:'平台'},
            {name:'上海恒业智汇贸易有限公司', type:'供应商'},
            {name:'斯斯供应商商家', type:'供应商'},
            {name:'斯斯门店商家2', type:'门店'},
            {name:'总部BDBD团队', type:'BD扶商'},
            {name:'主播组', type:'直播运营商'},
            {name:'野子文化', type:'门店'},
            {name:'南京马群枢纽供应商', type:'供应商'}
        ];
        for (var i = 0; i < 334; i++) {
            var seq = 334 - i;
            /* 前几条完整沿用种子，避免 billKind 与分佣字段互相盖错 */
            if (i < ledgerSeed.length) {
                list.push(Object.assign({}, ledgerSeed[i], { seq: seq }));
                continue;
            }
            var product = products[i % products.length];
            var payee = payees[i % payees.length];
            var store = stores[i % stores.length];
            var kind = i % 11 === 0 ? 'exception' : (i % 3 === 0 ? 'non_commission' : 'commission');
            var clearStatus = kind === 'exception' ? '清分异常' : (i % 7 === 0 ? '待清分' : '已清分');
            var settleStatus = clearStatus === '待清分' || clearStatus === '清分异常'
                ? '待结算'
                : LEDGER_SETTLE_STATUSES[1 + (i % 4)];
            var day = String((i % 28) + 1).padStart ? String((i % 28) + 1).padStart(2, '0') : ('0' + ((i % 28) + 1)).slice(-2);
            var hour = String(10 + (i % 10)).length < 2 ? '0' + (10 + (i % 10)) : String(10 + (i % 10));
            var minute = ('0' + ((i * 3) % 60)).slice(-2);
            var second = ('0' + ((i * 7) % 60)).slice(-2);
            var orderTime = '2026-10-' + day + ' ' + hour + ':' + minute + ':' + second;
            var sales = (0.5 + (i % 20) * 0.15).toFixed(2);
            var purchase = (0.01 + (i % 8) * 0.05).toFixed(2);
            var paid = (Number(sales) + (i % 3 === 0 ? 1.4 : 0)).toFixed(2);
            var receivable = kind === 'non_commission' ? purchase : (Number(paid) * 0.5).toFixed(2);
            var margin = ((1 - Number(purchase) / Math.max(Number(paid), 0.01)) * 100).toFixed(2) + '%';
            var id = String(1720 - (i % 200));
            var acc = huifuAccount(payee.name);
            var settleTime = settleStatus === '已结款' || settleStatus === '结款失败' ? orderTime : '—';
            var postingStatus = settleStatus === '已结款' ? '已入账' : (settleStatus === '结款失败' ? '入账失败' : '待入账');
            list.push({
                seq: seq,
                id: id,
                orderNo: 'ORD-2610' + day + String(200000 + i),
                lineNo: i % 4 === 0 ? '—' : ('ORD-2610' + day + String(200000 + i) + '-' + ((i % 3) + 1)),
                storeId: String(325279987563245056 + (i % 97)),
                storeName: store,
                orderType: i % 5 === 0 ? '代采' : '零售',
                channel: i % 5 === 0 ? '代采' : (i % 2 === 0 ? '商城' : '直播'),
                sku: product.sku,
                product: product.name,
                spec: product.spec,
                qty: (i % 3) + 1,
                orderStatus: LEDGER_ORDER_STATUSES[i % LEDGER_ORDER_STATUSES.length],
                aftersaleStatus: i % 9 === 0 ? '售后中' : (i % 6 === 0 ? '无售后' : '—'),
                reverseSettle: i % 5 === 0 ? '是' : '否',
                purchase: purchase,
                sales: sales,
                paid: paid,
                netPaid: paid,
                margin: margin,
                payee: payee.name,
                payeeType: payee.type,
                accountName: acc.name,
                /* 清分台账「收款账户」展示完整商户号，中间段不打码 */
                account: acc.no,
                accountNo: acc.no,
                commissionMode: kind === 'non_commission' ? '—' : '按实付金额分佣',
                strategy: kind === 'non_commission' ? '—' : (i % 4 === 0 ? '未命中策略 (系统默认)' : (i % 2 === 0 ? '商城默认分佣策略' : '直播默认结算策略')),
                commissionable: kind === 'non_commission' ? '否' : '是',
                receivable: receivable,
                received: settleStatus === '已结款' ? receivable : (i % 3 === 0 ? '—' : '0.00'),
                clearStatus: clearStatus,
                settleStatus: settleStatus,
                postingStatus: postingStatus,
                exceptionType: kind === 'exception' ? '结算金额异常' : '—',
                orderTime: orderTime,
                clearTime: clearStatus === '已清分' ? orderTime : '—',
                settleTime: settleTime,
                postingTime: settleStatus === '已结款' ? orderTime : '—',
                flowNo: channelFlowNo(id, settleStatus, settleTime),
                relatedSettle: '—',
                remark: kind === 'exception' ? '清分异常，进入异常订单处理' : '—',
                billKind: kind
            });
        }
        var realSettleIds = supplierStatements.map(function (r) { return r.id; });
        list.forEach(function (row, idx) {
            var hintNo = (row.accountNo && String(row.accountNo).indexOf('*') < 0) ? row.accountNo
                : ((row.account && String(row.account).indexOf('*') < 0) ? row.account : '');
            var acc = huifuAccount(row.payee, hintNo);
            if (!row.accountName) row.accountName = acc.name;
            row.accountNo = acc.no;
            /* 清分台账「收款账户」展示完整商户号，中间段不打码 */
            row.account = acc.no;
            if (!row.flowNo) row.flowNo = channelFlowNo(row.id, row.settleStatus, row.settleTime || row.postingTime);
            /* 异常行走异常单 Tab，不挂供应商结款单；其余仅关联真实存在的结款单 */
            if (row.billKind === 'exception') {
                row.relatedSettle = '—';
            } else if (hasChannelTransfer(row.settleStatus) && realSettleIds.length && (row.payeeType === '供应商' || row.billKind === 'non_commission' || row.billKind === 'commission')) {
                row.relatedSettle = realSettleIds[idx % realSettleIds.length];
            } else {
                row.relatedSettle = '—';
            }
        });
        return list;
    })();
    function ledgerSelect(id, label, value, options) {
        return '<label class="settle-field"><span>' + h(label) + '</span><select class="settle-select" id="' + h(id) + '"><option value="">全部</option>' +
            options.map(function (x) { return '<option value="' + h(x) + '"' + (value === x ? ' selected' : '') + '>' + h(x) + '</option>'; }).join('') +
            '</select></label>';
    }
    function ledgerInput(id, label, value, placeholder) {
        return '<label class="settle-field"><span>' + h(label) + '</span><input class="settle-input" id="' + h(id) + '" value="' + h(value || '') + '" placeholder="' + h(placeholder) + '"></label>';
    }
    function ledgerRows() {
        var tab = state.tab || 'all';
        return ledgerOrders.filter(function (row) {
            if (tab === 'commission' && row.billKind !== 'commission') return false;
            if (tab === 'exception' && row.billKind !== 'exception') return false;
            if (tab === 'non_commission' && row.billKind !== 'non_commission') return false;
            if (state.ledgerOrderFrom && String(row.orderTime).slice(0, 10) < state.ledgerOrderFrom) return false;
            if (state.ledgerOrderTo && String(row.orderTime).slice(0, 10) > state.ledgerOrderTo) return false;
            if (state.ledgerNo) {
                var no = String(state.ledgerNo).trim();
                if (String(row.id).indexOf(no) < 0 && String(row.orderNo).indexOf(no) < 0 && String(row.lineNo).indexOf(no) < 0) return false;
            }
            if (state.ledgerStore && String(row.storeName).indexOf(state.ledgerStore) < 0) return false;
            if (state.ledgerProduct && String(row.product).indexOf(state.ledgerProduct) < 0 && String(row.sku).indexOf(state.ledgerProduct) < 0) return false;
            if (state.ledgerPayee && String(row.payee).indexOf(state.ledgerPayee) < 0) return false;
            if (state.ledgerAccountName && String(row.accountName || '').indexOf(state.ledgerAccountName) < 0) return false;
            if (state.ledgerAccountNo) {
                var accQ = String(state.ledgerAccountNo).trim();
                if (String(row.accountNo || '').indexOf(accQ) < 0 && String(row.account || '').indexOf(accQ) < 0) return false;
            }
            if (state.ledgerFlowNo && String(row.flowNo || '').indexOf(state.ledgerFlowNo) < 0) return false;
            if (state.ledgerClearStatus && row.clearStatus !== state.ledgerClearStatus) return false;
            if (state.ledgerSettleStatus && row.settleStatus !== state.ledgerSettleStatus) return false;
            if (state.ledgerAftersaleStatus && row.aftersaleStatus !== state.ledgerAftersaleStatus) return false;
            if (state.ledgerStrategy && String(row.strategy).indexOf(state.ledgerStrategy) < 0) return false;
            if (state.ledgerOrderType && row.orderType !== state.ledgerOrderType) return false;
            if (state.ledgerChannel && row.channel !== state.ledgerChannel) return false;
            if (state.ledgerOrderStatus && row.orderStatus !== state.ledgerOrderStatus) return false;
            if (state.ledgerPostingStatus && row.postingStatus !== state.ledgerPostingStatus) return false;
            if (state.ledgerPayeeType && row.payeeType !== state.ledgerPayeeType) return false;
            return true;
        });
    }
    function renderLedger() {
        if (!state.tab || ['all', 'commission', 'exception', 'non_commission'].indexOf(state.tab) < 0) state.tab = 'all';
        if (state.tab === 'exception') {
            return '<section class="settle-card settle-ledger settle-exception">' +
                tabs([['all', '全部'], ['commission', '分佣单'], ['exception', '异常单'], ['non_commission', '非分佣单']]) +
                renderLedgerExceptionBody() + '</section>';
        }
        var rows = ledgerRows();
        var size = state.ledgerPageSize || 20;
        var pages = Math.max(1, Math.ceil(rows.length / size));
        state.ledgerPage = Math.min(Math.max(1, state.ledgerPage || 1), pages);
        var visible = rows.slice((state.ledgerPage - 1) * size, state.ledgerPage * size);
        /* 对账字段：收款账户名称/收款账户与收款方可不一致；发生转账后展示通道流水号并可溯源结款单 */
        var head = ['序号', '编号', '主订单号', '子订单号', '门店ID', '门店名称', '订单类型', '订单渠道', '商品编码', '商品名称', '规格/单位', '商品数量', '订单状态', '售后状态', '是否反结算', '采购金额', '销售金额', '实付金额', '净实付金额', '毛利率', '收款方名称', '收款方类型', '收款账户名称', '收款账户', '分佣方式', '命中策略', '可分佣', '应收金额', '实收金额', '清分状态', '结算状态', '入账状态', '通道流水号', '关联结款单', '异常类型', '下单时间', '清分时间', '结算时间', '入账时间', '备注'];
        var tr = visible.map(function (x) {
            return '<tr>' +
                '<td class="settle-ledger-sticky settle-ledger-seq">' + h(x.seq) + '</td>' +
                '<td class="settle-ledger-sticky settle-ledger-id"><button type="button" class="settle-btn link" data-act="ledger-no" data-id="' + h(x.id) + '">' + h(x.id) + '</button></td>' +
                '<td class="settle-ledger-sticky settle-ledger-order"><button type="button" class="settle-btn link" data-act="ledger-order" data-id="' + h(x.orderNo) + '">' + h(x.orderNo) + '</button></td>' +
                '<td>' + h(x.lineNo) + '</td>' +
                '<td>' + h(x.storeId) + '</td>' +
                '<td title="' + h(x.storeName) + '">' + h(x.storeName) + '</td>' +
                '<td>' + h(x.orderType) + '</td>' +
                '<td>' + h(x.channel) + '</td>' +
                '<td>' + h(x.sku) + '</td>' +
                '<td title="' + h(x.product) + '">' + h(x.product) + '</td>' +
                '<td>' + h(x.spec) + '</td>' +
                '<td>' + h(x.qty) + '</td>' +
                '<td>' + h(x.orderStatus) + '</td>' +
                '<td>' + h(x.aftersaleStatus) + '</td>' +
                '<td>' + h(x.reverseSettle) + '</td>' +
                '<td class="money">' + cash(x.purchase) + '</td>' +
                '<td class="money">' + cash(x.sales) + '</td>' +
                '<td class="money">' + cash(x.paid) + '</td>' +
                '<td class="money">' + cash(x.netPaid) + '</td>' +
                '<td>' + h(x.margin) + '</td>' +
                '<td title="' + h(x.payee) + '">' + h(x.payee) + '</td>' +
                '<td>' + h(x.payeeType) + '</td>' +
                '<td title="' + h(x.accountName || '') + '">' + h(x.accountName || '—') + '</td>' +
                '<td title="' + h(x.accountNo || x.account || '') + '">' + h(x.accountNo || x.account || '—') + '</td>' +
                '<td>' + h(x.commissionMode) + '</td>' +
                '<td title="' + h(x.strategy) + '">' + h(x.strategy) + '</td>' +
                '<td>' + h(x.commissionable) + '</td>' +
                '<td class="money">' + cash(x.receivable) + '</td>' +
                '<td class="money">' + (x.received === '—' ? '—' : cash(x.received)) + '</td>' +
                '<td>' + h(x.clearStatus) + '</td>' +
                '<td>' + h(x.settleStatus) + '</td>' +
                '<td>' + h(x.postingStatus) + '</td>' +
                '<td title="' + h(x.flowNo || '—') + '">' + h(x.flowNo || '—') + '</td>' +
                '<td>' + (x.relatedSettle && x.relatedSettle !== '—' && supplierStatements.some(function (s) { return s.id === x.relatedSettle; }) ? linkDoc(x.relatedSettle, 'supplier', x.relatedSettle) : (x.relatedSettle && x.relatedSettle !== '—' ? h(x.relatedSettle) : '—')) + '</td>' +
                '<td>' + h(x.exceptionType) + '</td>' +
                '<td>' + h(x.orderTime) + '</td>' +
                '<td>' + h(x.clearTime) + '</td>' +
                '<td>' + h(x.settleTime) + '</td>' +
                '<td>' + h(x.postingTime) + '</td>' +
                '<td title="' + h(x.remark) + '">' + h(x.remark) + '</td>' +
                '</tr>';
        });
        var filters = '<div class="settle-card-body settle-ledger-filter-body' + (state.ledgerCollapsed ? ' is-collapsed' : '') + '"><div class="settle-filter settle-filter--ledger">' +
            '<label class="settle-field settle-field--range"><span>下单时间</span><span class="settle-range">' +
            '<input type="date" class="settle-input" id="ledger-order-from" aria-label="开始时间" value="' + h(state.ledgerOrderFrom || '') + '" placeholder="开始时间">' +
            '<span class="settle-range__sep">-</span>' +
            '<input type="date" class="settle-input" id="ledger-order-to" aria-label="结束时间" value="' + h(state.ledgerOrderTo || '') + '" placeholder="结束时间">' +
            '</span></label>' +
            ledgerInput('ledger-no', '编号', state.ledgerNo, '请输入编号') +
            ledgerInput('ledger-store', '门店名称', state.ledgerStore, '请输入门店名称') +
            ledgerInput('ledger-product', '商品名称', state.ledgerProduct, '请输入商品名称') +
            ledgerInput('ledger-payee', '收款方名称', state.ledgerPayee, '请输入收款方名称') +
            ledgerInput('ledger-account-name', '收款账户名称', state.ledgerAccountName, '请输入收款账户名称') +
            ledgerInput('ledger-account-no', '收款账户', state.ledgerAccountNo, '请输入收款账户') +
            ledgerInput('ledger-flow-no', '通道流水号', state.ledgerFlowNo, '请输入通道流水号') +
            ledgerSelect('ledger-clear-status', '清分状态', state.ledgerClearStatus, LEDGER_CLEAR_STATUSES) +
            ledgerSelect('ledger-settle-status', '结算状态', state.ledgerSettleStatus, LEDGER_SETTLE_STATUSES) +
            ledgerSelect('ledger-aftersale-status', '售后状态', state.ledgerAftersaleStatus, LEDGER_AFTERSALE_STATUSES) +
            ledgerInput('ledger-strategy', '命中策略', state.ledgerStrategy, '请输入命中策略') +
            ledgerSelect('ledger-order-type', '订单类型', state.ledgerOrderType, LEDGER_ORDER_TYPES) +
            ledgerSelect('ledger-channel', '订单渠道', state.ledgerChannel, LEDGER_CHANNELS) +
            ledgerSelect('ledger-order-status', '订单状态', state.ledgerOrderStatus, LEDGER_ORDER_STATUSES) +
            ledgerSelect('ledger-posting-status', '入账状态', state.ledgerPostingStatus, LEDGER_POSTING_STATUSES) +
            ledgerSelect('ledger-payee-type', '收款方类型', state.ledgerPayeeType, LEDGER_PAYEE_TYPES) +
            '<div class="settle-actions settle-filter-actions">' +
            button('查询', 'search', '', 'primary') + button('重置', 'reset', '', '') +
            '<button type="button" class="settle-btn link settle-ledger-collapse" data-act="ledger-collapse" aria-expanded="' + (state.ledgerCollapsed ? 'false' : 'true') + '">' +
            (state.ledgerCollapsed ? '展开' : '收起') +
            '<span class="settle-ledger-collapse-ico" aria-hidden="true">' + (state.ledgerCollapsed ? '▾' : '▴') + '</span></button></div></div></div>';
        var pageBtns = '';
        var maxBtn = Math.min(pages, 6);
        for (var i = 1; i <= maxBtn; i++) {
            pageBtns += '<button type="button" class="settle-page-btn' + (state.ledgerPage === i ? ' active' : '') + '" data-act="ledger-page" data-id="' + i + '">' + i + '</button>';
        }
        if (pages > 6) {
            pageBtns += '<span class="settle-page-gap">...</span><button type="button" class="settle-page-btn" data-act="ledger-page" data-id="' + pages + '">' + pages + '</button>';
        }
        var footer = '<div class="settle-pager settle-ledger-pager"><span class="settle-pager-total">共 ' + rows.length + ' 条</span>' +
            '<select class="settle-select settle-page-size" id="ledger-page-size" aria-label="每页条数">' +
            [20, 50, 100].map(function (n) { return '<option value="' + n + '"' + (size === n ? ' selected' : '') + '>' + n + '条/页</option>'; }).join('') +
            '</select>' +
            '<button type="button" class="settle-page-btn" data-act="ledger-page" data-id="' + (state.ledgerPage - 1) + '"' + (state.ledgerPage === 1 ? ' disabled' : '') + '>&lt;</button>' +
            pageBtns +
            '<button type="button" class="settle-page-btn" data-act="ledger-page" data-id="' + (state.ledgerPage + 1) + '"' + (state.ledgerPage === pages ? ' disabled' : '') + '>&gt;</button>' +
            '<span>前往</span><input class="settle-input settle-page-jump" id="ledger-jump" inputmode="numeric" aria-label="前往页码" value="' + h(state.ledgerPage) + '"><span>页</span></div>';
        return '<section class="settle-card settle-ledger">' +
            tabs([['all', '全部'], ['commission', '分佣单'], ['exception', '异常单'], ['non_commission', '非分佣单']]) +
            filters +
            '<div class="settle-toolbar">' + button('导出列表', 'export-ledger', '', '') + '</div>' +
            '<div class="settle-table-wrap settle-ledger-table-wrap"><table class="settle-table settle-ledger-table"><thead><tr>' +
            head.map(function (x, idx) {
                var cls = idx === 0 ? 'settle-ledger-sticky settle-ledger-seq' : (idx === 1 ? 'settle-ledger-sticky settle-ledger-id' : (idx === 2 ? 'settle-ledger-sticky settle-ledger-order' : ''));
                return '<th' + (cls ? ' class="' + cls + '"' : '') + '>' + h(x) + '</th>';
            }).join('') +
            '</tr></thead><tbody>' + (tr.length ? tr.join('') : '<tr><td colspan="' + head.length + '" class="settle-empty">暂无数据</td></tr>') +
            '</tbody></table></div>' + footer + '</section>';
    }
    function exportLedger() {
        var head = ['序号', '编号', '主订单号', '子订单号', '门店ID', '门店名称', '订单类型', '订单渠道', '商品编码', '商品名称', '规格/单位', '商品数量', '订单状态', '售后状态', '是否反结算', '采购金额', '销售金额', '实付金额', '净实付金额', '毛利率', '收款方名称', '收款方类型', '收款账户名称', '收款账户', '分佣方式', '命中策略', '可分佣', '应收金额', '实收金额', '清分状态', '结算状态', '入账状态', '通道流水号', '关联结款单', '异常类型', '下单时间', '清分时间', '结算时间', '入账时间', '备注'];
        var data = [head].concat(ledgerRows().map(function (x) {
            return [x.seq, x.id, x.orderNo, x.lineNo, x.storeId, x.storeName, x.orderType, x.channel, x.sku, x.product, x.spec, x.qty, x.orderStatus, x.aftersaleStatus, x.reverseSettle, x.purchase, x.sales, x.paid, x.netPaid, x.margin, x.payee, x.payeeType, x.accountName || '', x.accountNo || x.account, x.commissionMode, x.strategy, x.commissionable, x.receivable, x.received, x.clearStatus, x.settleStatus, x.postingStatus, x.flowNo || '—', x.relatedSettle || '—', x.exceptionType, x.orderTime, x.clearTime, x.settleTime, x.postingTime, x.remark];
        }));
        var csv = '\uFEFF' + data.map(function (row) {
            return row.map(function (cell) { return '"' + String(cell).replace(/"/g, '""') + '"'; }).join(',');
        }).join('\r\n');
        var a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        a.download = '清分台账-' + new Date().toISOString().slice(0, 10) + '.csv';
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    }
    function readLedgerFilters() {
        state.ledgerOrderFrom = (document.getElementById('ledger-order-from') || {}).value || '';
        state.ledgerOrderTo = (document.getElementById('ledger-order-to') || {}).value || '';
        state.ledgerNo = (document.getElementById('ledger-no') || {}).value || '';
        state.ledgerStore = (document.getElementById('ledger-store') || {}).value || '';
        state.ledgerProduct = (document.getElementById('ledger-product') || {}).value || '';
        state.ledgerPayee = (document.getElementById('ledger-payee') || {}).value || '';
        state.ledgerAccountName = (document.getElementById('ledger-account-name') || {}).value || '';
        state.ledgerAccountNo = (document.getElementById('ledger-account-no') || {}).value || '';
        state.ledgerFlowNo = (document.getElementById('ledger-flow-no') || {}).value || '';
        state.ledgerClearStatus = (document.getElementById('ledger-clear-status') || {}).value || '';
        state.ledgerSettleStatus = (document.getElementById('ledger-settle-status') || {}).value || '';
        state.ledgerAftersaleStatus = (document.getElementById('ledger-aftersale-status') || {}).value || '';
        state.ledgerStrategy = (document.getElementById('ledger-strategy') || {}).value || '';
        state.ledgerOrderType = (document.getElementById('ledger-order-type') || {}).value || '';
        state.ledgerChannel = (document.getElementById('ledger-channel') || {}).value || '';
        state.ledgerOrderStatus = (document.getElementById('ledger-order-status') || {}).value || '';
        state.ledgerPostingStatus = (document.getElementById('ledger-posting-status') || {}).value || '';
        state.ledgerPayeeType = (document.getElementById('ledger-payee-type') || {}).value || '';
        state.ledgerPage = 1;
    }
    function resetLedgerFilters() {
        state.ledgerOrderFrom = '';
        state.ledgerOrderTo = '';
        state.ledgerNo = '';
        state.ledgerStore = '';
        state.ledgerProduct = '';
        state.ledgerPayee = '';
        state.ledgerAccountName = '';
        state.ledgerAccountNo = '';
        state.ledgerFlowNo = '';
        state.ledgerClearStatus = '';
        state.ledgerSettleStatus = '';
        state.ledgerAftersaleStatus = '';
        state.ledgerStrategy = '';
        state.ledgerOrderType = '';
        state.ledgerChannel = '';
        state.ledgerOrderStatus = '';
        state.ledgerPostingStatus = '';
        state.ledgerPayeeType = '';
        state.ledgerPage = 1;
    }
    /* 清分台账·异常单（原独立「异常订单」页）：清分被拦住、阻塞分账的订单。 */
    var EXCEPTION_PAYEE_TYPES = ['门店', '供应商', '商户', 'BD扶商', '平台', '直播运营商'];
    var EXCEPTION_STATUSES = ['待处理', '处理中', '已结款', '已结款(人工)', '结款异常', '已关闭'];
    /* L2 双异常单：同单「结算失败·已关闭」+「代收待转·待处理」；仅代收待转可转结款单 */
    var exceptionOrders = [
        {seq:'10', id:'EX_2610292528875_1252', orderNo:'ORD-2610292528875', lineId:'1252', payee:'上海沁香有品供应链管理有限公司', payeeType:'BD扶商', amount:'0.02', strategy:'—', channel:'—', status:'待处理', reason:'代收待转', handleStatus:'待处理', handler:'—', handleTime:'—', remark:'—', relatedDoc:'—', exceptionTime:'2026-10-29 18:05:11'},
        {seq:'9', id:'EX_2610292528875_1251', orderNo:'ORD-2610292528875', lineId:'1251', payee:'上海沁香有品供应链管理有限公司', payeeType:'BD扶商', amount:'0.02', strategy:'—', channel:'—', status:'已关闭', reason:'结算失败', handleStatus:'已关闭', handler:'系统', handleTime:'2026-10-29 18:05:11', remark:'结算失败单仅查看，不转补偿', relatedDoc:'—', exceptionTime:'2026-10-29 18:05:11'},
        {seq:'8', id:'EX_2610282411003_1248', orderNo:'ORD-2610282411003', lineId:'1248', payee:'总部BDBD团队', payeeType:'BD扶商', amount:'0.16', strategy:'常规百货门店', channel:'直播', status:'处理中', reason:'佣金策略异常', handleStatus:'处理中', handler:'yanfa', handleTime:'2026-10-29 09:12:00', remark:'核对策略中', relatedDoc:'—', exceptionTime:'2026-10-28 21:16:44'},
        {seq:'7', id:'EX_2610282411003_1247', orderNo:'ORD-2610282411003', lineId:'1247', payee:'主播组', payeeType:'直播运营商', amount:'0.08', strategy:'常规百货门店', channel:'直播', status:'已结款', reason:'代收待转', handleStatus:'已结款', handler:'超级管理员', handleTime:'2026-10-29 19:42:18', remark:'—', relatedDoc:'CST_374147882901274624', exceptionTime:'2026-10-28 21:16:44'},
        {seq:'6', id:'EX_2610272309881_1230', orderNo:'ORD-2610272309881', lineId:'1230', payee:'斯斯门店商家2', payeeType:'门店', amount:'0.52', strategy:'商城默认分佣策略', channel:'商城', status:'已关闭', reason:'账户异常', handleStatus:'已关闭', handler:'超级管理员', handleTime:'2026-10-28 11:20:33', remark:'—', relatedDoc:'—', exceptionTime:'2026-10-27 15:58:45'},
        {seq:'5', id:'EX_2610262198770_1215', orderNo:'ORD-2610262198770', lineId:'1215', payee:'上海恒业智汇贸易有限公司', payeeType:'供应商', amount:'1.00', strategy:'—', channel:'代采', status:'结款异常', reason:'代收待转,收款账户异常', handleStatus:'结款异常', handler:'超级管理员', handleTime:'2026-10-27 16:10:00', remark:'代收待转出账失败', relatedDoc:'—', exceptionTime:'2026-10-26 14:22:18'},
        {seq:'4', id:'EX_2610252087662_1201', orderNo:'ORD-2610252087662', lineId:'1201', payee:'上海冷丰科技有限公司', payeeType:'平台', amount:'0.40', strategy:'未命中策略 (系统默认)', channel:'商城', status:'已结款(人工)', reason:'系统判定异常订单', handleStatus:'已结款(人工)', handler:'超级管理员', handleTime:'2026-10-26 10:08:55', remark:'人工结款完成', relatedDoc:'CST_374100112233445566', exceptionTime:'2026-10-25 16:40:00', voucher: true},
        {seq:'3', id:'EX_2610241976554_1190', orderNo:'ORD-2610241976554', lineId:'1190', payee:'南京马群枢纽供应商', payeeType:'供应商', amount:'1.50', strategy:'—', channel:'代采', status:'待处理', reason:'跨账期或入账时间异常', handleStatus:'待处理', handler:'—', handleTime:'—', remark:'—', relatedDoc:'—', exceptionTime:'2026-10-24 22:11:09'},
        {seq:'2', id:'EX_2610231865443_1178', orderNo:'ORD-2610231865443', lineId:'1178', payee:'野子文化', payeeType:'门店', amount:'0.10', strategy:'直播默认结算策略', channel:'直播', status:'已关闭', reason:'分佣对象不在策略范围', handleStatus:'已关闭', handler:'yanfa', handleTime:'2026-10-24 08:30:12', remark:'—', relatedDoc:'—', exceptionTime:'2026-10-23 19:05:40'},
        {seq:'1', id:'EX_2610128893011_119797', orderNo:'ORD-2610128893011', lineId:'119797', payee:'野子文化', payeeType:'门店', amount:'0.52', strategy:'常规百货门店', channel:'直播', status:'待处理', reason:'结算金额异常', handleStatus:'待处理', handler:'—', handleTime:'—', remark:'—', relatedDoc:'—', exceptionTime:'2026-10-12 15:58:45'}
    ];
    exceptionOrders.forEach(function (row) {
        var acc = huifuAccount(row.payee === '—' ? '' : row.payee);
        row.accountName = acc.name === '—' && !row.payee ? '—' : acc.name;
        row.accountNo = acc.no;
        /* 通道流水号挂明细划拨：仅已结款类有流水 */
        row.flowNo = channelFlowNo(row.id, row.handleStatus, row.handleTime);
    });
    function exceptionRows() {
        var q = String(state.query || '').trim().toLowerCase();
        return exceptionOrders.filter(function (row) {
            if (q && String(row.orderNo).toLowerCase().indexOf(q) < 0 && String(row.lineId).toLowerCase().indexOf(q) < 0 && String(row.id || '').toLowerCase().indexOf(q) < 0 && String(row.flowNo || '').toLowerCase().indexOf(q) < 0) return false;
            if (state.exceptionPayee && row.payeeType !== state.exceptionPayee) return false;
            if (state.exceptionStatus && row.status !== state.exceptionStatus && row.handleStatus !== state.exceptionStatus) return false;
            if (state.exceptionAccountName && String(row.accountName || '').indexOf(state.exceptionAccountName) < 0) return false;
            if (state.exceptionAccountNo && String(row.accountNo || '').indexOf(state.exceptionAccountNo) < 0) return false;
            if (state.exceptionFlowNo && String(row.flowNo || '').indexOf(state.exceptionFlowNo) < 0) return false;
            return true;
        });
    }
    function exceptionTip() {
        return '<div class="settle-exception-tip" role="note"><strong>异常原因说明（清分异常·阻塞订单分账）</strong>' +
            '<p class="settle-exception-tip-lead">本 Tab 是异常处理台（按异常单处理）；台账「全部」里的异常行是商品行快照，二者维度不同。</p><ol>' +
            '<li>账户异常：分佣政策中的账户被移除、禁用，订单不再分佣。</li>' +
            '<li>分佣对象不在策略范围：BD 离职、直播间停用等，订单无法分佣。</li>' +
            '<li>佣金策略异常：策略发生变动或已删除，订单无法匹配策略。</li>' +
            '<li>订单数据缺失：SKU、门店归属、采购价等关键数据缺失，无法计算分佣。</li>' +
            '<li>系统判定异常订单：风控、作弊订单等，阻止清分。</li>' +
            '<li>跨账期或入账时间异常：订单跨账期或入账时间异常，系统无法正常清分。</li>' +
            '<li>结算失败：供应商基本户转分佣方失败；钱改入平台基本户。结算失败单仅作凭证，已关闭后不可转补偿。</li>' +
            '<li>代收待转：与结算失败成对出现，平台已代收该分佣方应得；分佣方原因解决后，仅在本单上「转结款单」生成补偿结款。</li>' +
            '</ol></div>';
    }
    function canExceptionToBill(row) {
        return row && row.handleStatus === '待处理' && /代收待转/.test(String(row.reason || ''));
    }
    function exceptionReasonTags(reason) {
        return String(reason || '').split(/[,，]/).filter(Boolean).map(function (r) {
            var cls = /失败|关闭|忽略/.test(r) ? '' : 'orange';
            return '<span class="settle-tag ' + cls + '">' + h(r.trim()) + '</span>';
        }).join(' ');
    }
    function exceptionHandleTag(status) {
        var cls = /已结款/.test(status) ? 'green' : /待处理|处理中|结款异常/.test(status) ? 'orange' : '';
        return '<span class="settle-tag ' + cls + '">' + h(status) + '</span>';
    }
    /* 图四操作列：按处理状态切换；「转结款单」仅代收待转·待处理；结算失败已关闭仅查看 */
    function exceptionOps(row) {
        var s = row.handleStatus;
        var reason = String(row.reason || '');
        var items = [button('查看详情', 'exception-detail', row.seq)];
        if (/结算失败/.test(reason) && !/代收待转/.test(reason) && (s === '已关闭' || s === '待处理')) {
            /* 结算失败凭证单：不可转补偿 */
        } else if (s === '待处理') {
            if (canExceptionToBill(row)) items.push(button('转结款单', 'exception-to-bill', row.seq));
            items.push(button('人工结款', 'exception-manual-pay', row.seq));
            items.push(button('关闭', 'exception-close', row.seq));
        } else if (s === '结款异常') {
            items.push(button('重新执行', 'exception-retry', row.seq));
            items.push(button('人工结款', 'exception-manual-pay', row.seq));
            items.push(button('关闭', 'exception-close', row.seq));
        } else if (s === '已结款' || (s === '处理中' && row.relatedDoc && String(row.relatedDoc).indexOf('CST_') === 0)) {
            items.push(button('查看结款单', 'exception-settlement', row.seq));
        } else if (s === '已结款(人工)') {
            items.push(button('结款凭据', 'exception-voucher', row.seq));
        }
        /* 处理中（无结款单）、已关闭：仅查看详情 */
        var cls = 'settle-op settle-exception-ops';
        if (items.length === 1) cls += ' is-single';
        else if (items.length === 2) cls += ' is-pair';
        else cls += ' is-grid';
        return '<div class="' + cls + '">' + items.join('') + '</div>';
    }
    function renderLedgerExceptionBody() {
        var rows = exceptionRows();
        var size = state.exceptionPageSize || 20;
        var pages = Math.max(1, Math.ceil(rows.length / size));
        state.exceptionPage = Math.min(Math.max(1, state.exceptionPage || 1), pages);
        var visible = rows.slice((state.exceptionPage - 1) * size, state.exceptionPage * size);
        var tr = visible.map(function (x) {
            return '<tr>' +
                '<td>' + h(x.seq) + '</td>' +
                '<td>' + h(x.id) + '</td>' +
                '<td><button type="button" class="settle-btn link" data-act="exception-detail" data-id="' + h(x.seq) + '">' + h(x.orderNo) + '</button></td>' +
                '<td>' + h(x.lineId) + '</td>' +
                '<td title="' + h(x.payee) + '">' + h(x.payee) + '</td>' +
                '<td>' + h(x.payeeType) + '</td>' +
                '<td title="' + h(x.accountName || '') + '">' + h(x.accountName || '—') + '</td>' +
                '<td>' + h(x.accountNo || '—') + '</td>' +
                '<td class="money">' + h(x.amount) + '</td>' +
                '<td>' + h(x.strategy) + '</td>' +
                '<td>' + h(x.channel) + '</td>' +
                '<td>' + exceptionReasonTags(x.reason) + '</td>' +
                '<td>' + exceptionHandleTag(x.handleStatus) + '</td>' +
                '<td>' + h(x.handler) + '</td>' +
                '<td>' + h(x.handleTime) + '</td>' +
                '<td title="' + h(x.remark) + '">' + h(x.remark) + '</td>' +
                '<td>' + (x.relatedDoc && x.relatedDoc !== '—' ? (String(x.relatedDoc).indexOf('CST_') === 0 ? linkDoc(x.relatedDoc, 'compensation', x.relatedDoc) : h(x.relatedDoc)) : '—') + '</td>' +
                '<td title="' + h(x.flowNo || '—') + '">' + h(x.flowNo || '—') + '</td>' +
                '<td>' + h(x.exceptionTime) + '</td>' +
                '<td class="settle-op">' + exceptionOps(x) + '</td>' +
                '</tr>';
        });
        var pageBtns = '';
        var maxBtn = Math.min(pages, 6);
        for (var i = 1; i <= maxBtn; i++) {
            pageBtns += '<button type="button" class="settle-page-btn' + (state.exceptionPage === i ? ' active' : '') + '" data-act="exception-page" data-id="' + i + '">' + i + '</button>';
        }
        if (pages > 6) pageBtns += '<span class="settle-page-gap">...</span><button type="button" class="settle-page-btn" data-act="exception-page" data-id="' + pages + '">' + pages + '</button>';
        var filters = '<div class="settle-card-body"><div class="settle-filter settle-filter--exception">' +
            '<label class="settle-field"><span>订单号</span><input class="settle-input" id="settle-query" value="' + h(state.query) + '" placeholder="请输入订单号"></label>' +
            '<label class="settle-field"><span>收款方类型</span><select class="settle-select" id="exception-payee"><option value="">全部</option>' + EXCEPTION_PAYEE_TYPES.map(function (v) { return '<option value="' + h(v) + '"' + (state.exceptionPayee === v ? ' selected' : '') + '>' + h(v) + '</option>'; }).join('') + '</select></label>' +
            '<label class="settle-field"><span>处理状态</span><select class="settle-select" id="exception-status"><option value="">全部</option>' + EXCEPTION_STATUSES.map(function (v) { return '<option value="' + h(v) + '"' + (state.exceptionStatus === v ? ' selected' : '') + '>' + h(v) + '</option>'; }).join('') + '</select></label>' +
            '<label class="settle-field"><span>收款账户名称</span><input class="settle-input" id="exception-account-name" value="' + h(state.exceptionAccountName) + '" placeholder="请输入收款账户名称"></label>' +
            '<label class="settle-field"><span>收款账户</span><input class="settle-input" id="exception-account-no" value="' + h(state.exceptionAccountNo) + '" placeholder="请输入收款账户"></label>' +
            '<label class="settle-field"><span>通道流水号</span><input class="settle-input" id="exception-flow-no" value="' + h(state.exceptionFlowNo) + '" placeholder="请输入通道流水号"></label>' +
            '<div class="settle-actions settle-filter-actions">' + button('查询', 'search', '', 'primary') + button('重置', 'reset', '', '') + '</div></div></div>';
        var footer = '<div class="settle-pager settle-ledger-pager"><span class="settle-pager-total">共 ' + rows.length + ' 条</span>' +
            '<select class="settle-select settle-page-size" id="exception-page-size" aria-label="每页条数"><option value="20"' + (size === 20 ? ' selected' : '') + '>20条/页</option><option value="50"' + (size === 50 ? ' selected' : '') + '>50条/页</option><option value="100"' + (size === 100 ? ' selected' : '') + '>100条/页</option></select>' +
            '<button type="button" class="settle-page-btn" data-act="exception-page" data-id="' + (state.exceptionPage - 1) + '"' + (state.exceptionPage === 1 ? ' disabled' : '') + '>&lt;</button>' +
            pageBtns +
            '<button type="button" class="settle-page-btn" data-act="exception-page" data-id="' + (state.exceptionPage + 1) + '"' + (state.exceptionPage === pages ? ' disabled' : '') + '>&gt;</button>' +
            '<span>前往</span><input class="settle-input settle-page-jump" id="exception-jump" inputmode="numeric" aria-label="前往页码" value="' + h(state.exceptionPage) + '"><span>页</span></div>';
        var head = ['序号', '编号', '订单号', '订单行ID', '收款方名称', '收款方类型', '收款账户名称', '收款账户', '应付金额（元）', '命中策略', '结算渠道', '异常原因（全部）', '处理状态', '处理人', '处理时间', '处理备注', '关联处理单据', '通道流水号', '异常时间', '操作'];
        return exceptionTip() + filters +
            '<div class="settle-toolbar">' + button('导出列表', 'export-exception', '', '') + '</div>' +
            '<div class="settle-table-wrap"><table class="settle-table"><thead><tr>' +
            head.map(function (x) { return '<th>' + h(x) + '</th>'; }).join('') +
            '</tr></thead><tbody>' + (tr.length ? tr.join('') : '<tr><td colspan="' + head.length + '" class="settle-empty">暂无数据</td></tr>') +
            '</tbody></table></div>' + footer;
    }
    function exceptionNow() {
        return new Date().toISOString().slice(0, 19).replace('T', ' ');
    }
    function openExceptionManualPay(seq) {
        var row = exceptionOrders.filter(function (x) { return String(x.seq) === String(seq); })[0];
        if (!row) return;
        openModal('人工结款',
            '<div class="settle-policy-form">' +
            policyField('结款金额', '<b>' + cash(row.amount) + '</b> <small>（默认清分待结算金额，不支持修改）</small>') +
            policyField('上传凭证', '<input type="file" accept=".jpg,.jpeg,.png" multiple aria-label="上传凭证"><small>支持 JPG/JPEG/PNG，最多 3 张，单张 ≤ 10MB</small>') +
            policyField('备注', '<textarea class="settle-input settle-textarea" id="exception-manual-remark" maxlength="100" placeholder="选填，≤100 字"></textarea>') +
            '</div>',
            false,
            button('取消', 'close') + button('确定', 'confirm-exception-manual-pay', seq, 'primary')
        );
    }
    function openExceptionToBill(seq) {
        var row = exceptionOrders.filter(function (x) { return String(x.seq) === String(seq); })[0];
        if (!row) return;
        if (!canExceptionToBill(row)) {
            openModal('无法转结款单', note('仅「代收待转」且处理状态为「待处理」的异常单可转补偿结款。结算失败单仅作凭证，不可转补偿。'));
            return;
        }
        openModal('转结款单',
            note('确认将订单 ' + row.orderNo + ' / 行 ' + row.lineId + ' 转入补偿结款单？应付金额 ' + cash(row.amount) + '。确认后生成「待结款」补偿单，异常单进入处理中。'),
            false,
            button('取消', 'close') + button('确认', 'confirm-exception-to-bill', seq, 'primary')
        );
    }
    function openExceptionRetry(seq) {
        var row = exceptionOrders.filter(function (x) { return String(x.seq) === String(seq); })[0];
        if (!row) return;
        openModal('重新执行',
            note('确认对订单 ' + row.orderNo + ' / 行 ' + row.lineId + ' 重新执行？将重新校验账户与分佣数据。' + (row.reason ? '<br>当前异常：' + h(row.reason) : '')),
            false,
            button('取消', 'close') + button('确认', 'confirm-exception-retry', seq, 'primary')
        );
    }
    function openExceptionClose(seq) {
        var row = exceptionOrders.filter(function (x) { return String(x.seq) === String(seq); })[0];
        if (!row) return;
        openModal('关闭',
            note('确认关闭该异常单？关闭后处理状态变为「已关闭」，订单号：' + row.orderNo + ' / 行 ' + row.lineId + '。'),
            false,
            button('取消', 'close') + button('确认关闭', 'confirm-exception-close', seq, 'primary')
        );
    }
    function openExceptionSettlement(seq) {
        var row = exceptionOrders.filter(function (x) { return String(x.seq) === String(seq); })[0];
        if (!row) return;
        var cstId = row.relatedDoc;
        var exists = cstId && cstId !== '—' && compensations.some(function (c) { return c.id === cstId; });
        if (!exists) {
            openModal('查看结款单', note('未找到关联补偿结款单' + (cstId && cstId !== '—' ? '：' + h(cstId) : '。请先「转结款单」。')));
            return;
        }
        overlay.innerHTML = '';
        state.view = 'compensation';
        state.tab = '';
        state.detail = cstId;
        state.query = '';
        var q = new URLSearchParams({ view: 'compensation', detail: cstId });
        history.pushState(null, '', location.pathname + '?' + q.toString());
        render();
    }
    function openExceptionVoucher(seq) {
        var row = exceptionOrders.filter(function (x) { return String(x.seq) === String(seq); })[0];
        if (!row) return;
        openModal('结款凭据',
            kv([
                ['结款单号', h(row.relatedDoc)],
                ['订单号', h(row.orderNo)],
                ['订单行ID', h(row.lineId)],
                ['结款金额', cash(row.amount)],
                ['处理人', h(row.handler)],
                ['处理时间', h(row.handleTime)],
                ['备注', h(row.remark || '—')],
                ['凭证', '已上传（人工结款）']
            ]),
            false,
            button('关闭', 'close', '', '')
        );
    }
    function openExceptionDetail(seq) {
        var row = exceptionOrders.filter(function (x) { return String(x.seq) === String(seq); })[0];
        if (!row) return;
        var basic = description([
            ['编号', h(row.seq)], ['主订单号', h(row.orderNo)], ['子订单号', h(row.lineId)], ['门店ID', '—'], ['门店名称', '—'], ['BID', '—'], ['主播', '—'],
            ['订单类型', '—'], ['订单渠道', h(row.channel)], ['子订单状态', '—'], ['下单时间', '—'], ['自动核销时间', '—'], ['核销时间', '—'], ['售后截止时间', '—']
        ]);
        var goods = table(['商品图片', '商品名称', '商品编码', '规格/单位', '数量', '采购金额', '销售金额', '优惠金额', '退款金额', '实收金额', '净实收金额', '毛利率', '可分佣'],
            ['<tr><td colspan="13" class="settle-empty">当前异常记录未附带商品明细</td></tr>']);
        var clearing = table(['收款方ID', '收款方类型', '收款方名称', '收款账户', '分佣方式', '策略ID', '命中策略', '应收金额', '手续费', '营销费用承担', '实收金额'],
            ['<tr><td>—</td><td>' + h(row.payeeType) + '</td><td>' + h(row.payee) + '</td><td>—</td><td>—</td><td>—</td><td>' + h(row.strategy) + '</td><td class="money">' + h(row.amount) + '</td><td>—</td><td>—</td><td>—</td></tr>']);
        var settleInfo = description([
            ['清分状态', '清分异常'], ['清分时间', '—'], ['清分批次号', '—'], ['结算起算节点', '—'], ['结算方式', '—'], ['结算状态', h(row.status)], ['结算单号', h(row.relatedDoc)],
            ['入账状态', '—'], ['入账时间', '—']
        ]);
        var aftersale = description([
            ['售后状态', '无售后'], ['售后单号', '—'], ['售后申请时间', '—'], ['售后完成时间', '—'], ['售后金额', '—'], ['退款金额', '—'], ['退款类型', '—'],
            ['是否反结算', '—'], ['反结算金额', '—'], ['台账状态', '—']
        ]);
        var abnormal = description([
            ['异常阶段', '清分异常'], ['异常类型', h(row.reason)], ['异常原因', h(row.reason)], ['异常处理状态', h(row.handleStatus)], ['异常处理时间', h(row.handleTime)], ['备注', h(row.remark)],
            ['处理人', h(row.handler)], ['异常时间', h(row.exceptionTime)],
            ['收款账户名称', h(row.accountName || '—')], ['收款账户', h(row.accountNo || '—')],
            ['关联处理单据', row.relatedDoc && row.relatedDoc !== '—' ? (String(row.relatedDoc).indexOf('CST_') === 0 ? linkDoc(row.relatedDoc, 'compensation', row.relatedDoc) : h(row.relatedDoc)) : '—']
        ]);
        var payRec = table(['序号', '方向', '付款方', '收款方', '关联订单', '金额', '状态', '通道流水号', '时间'], [
            '<tr><td>1</td><td>付款</td><td>平台</td><td>' + h(row.payee) + '</td><td>' + h(row.orderNo) + '</td><td class="money">' + cash(row.amount) + '</td><td>' + tag(row.handleStatus) + '</td><td>' + h(row.flowNo || '—') + '</td><td>' + h(row.handleTime || '—') + '</td></tr>'
        ]);
        var system = description([
            ['是否已对账', '—'], ['对账时间', '—'], ['数据来源', '销售子订单'], ['创建时间', h(row.exceptionTime)], ['更新时间', '—']
        ]);
        overlay.innerHTML = '<div class="settle-overlay" data-overlay="1"><div class="settle-drawer settle-drawer--order" role="dialog" aria-modal="true" aria-label="订单详情">' +
            '<div class="settle-dialog-head"><strong>订单详情</strong>' + button('✕', 'close') + '</div>' +
            '<div class="settle-dialog-body settle-order-detail">' +
            '<p class="settle-order-crumb">订单 ' + h(row.orderNo) + ' · 订单行 ' + h(row.lineId) + ' · ' + h(row.payeeType) + ' ' + h(row.payee) + '</p>' +
            card('基本信息', basic) + card('商品信息', goods) + card('清分信息', clearing) + card('清分结算信息', settleInfo) +
            card('售后反结算信息', aftersale) + card('异常信息', abnormal) + card('收付款记录', payRec) + card('系统信息', system) +
            '</div></div></div>';
    }
    function exportException() {
        var head = ['序号', '编号', '订单号', '订单行ID', '收款方名称', '收款方类型', '收款账户名称', '收款账户', '应付金额（元）', '命中策略', '结算渠道', '异常原因（全部）', '处理状态', '处理人', '处理时间', '处理备注', '关联处理单据', '通道流水号', '异常时间'];
        var data = [head].concat(exceptionRows().map(function (x) {
            return [x.seq, x.id, x.orderNo, x.lineId, x.payee, x.payeeType, x.accountName, x.accountNo, x.amount, x.strategy, x.channel, x.reason, x.handleStatus, x.handler, x.handleTime, x.remark, x.relatedDoc, x.flowNo || '—', x.exceptionTime];
        }));
        var csv = '\uFEFF' + data.map(function (row) { return row.map(function (cell) { return '"' + String(cell).replace(/"/g, '""') + '"'; }).join(','); }).join('\r\n');
        var a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv;charset=utf-8'}));
        a.download = '清分台账-异常单-' + new Date().toISOString().slice(0, 10) + '.csv';
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    }
    function renderSummary() {
        if (!state.tab) state.tab='day';
        var rows=(state.tab === 'month' ? summaryMonth : summaryDay).filter(function(x){return (!state.query||x.payee.includes(state.query)||x.id.includes(state.query))&&(!state.summaryType||x.type===state.summaryType)&&(!state.summaryFrom||x.period>=state.summaryFrom.slice(0,7))&&(!state.summaryTo||x.period<=state.summaryTo);});
        var tr=rows.map(function(x){return '<tr><td>'+h(x.seq||'')+'</td><td>'+h(x.period)+'</td><td>'+h(x.type)+'</td><td>'+h(x.payee)+'</td><td>'+h(x.id)+'</td><td class="money">'+cash(x.total)+'</td><td class="money">'+cash(x.settled)+'</td><td class="money">'+cash(x.pending)+'</td><td class="money">'+cash(x.blocked)+'</td><td>'+h(x.statements)+'</td><td>'+h(x.lines)+'</td></tr>';});
        var filterHtml='<div class="settle-card-body"><div class="settle-filter"><label class="settle-field"><span>统计时间</span><input type="date" class="settle-input" id="summary-from" value="'+h(state.summaryFrom||'')+'"></label><span>至</span><label class="settle-field"><span>&nbsp;</span><input type="date" class="settle-input" id="summary-to" value="'+h(state.summaryTo||'')+'"></label>'+
            '<label class="settle-field"><span>收款方类型</span><select class="settle-select" id="summary-type"><option value="">全部</option>'+['供应商','承运商','门店','BD扶商','直播运营商','商户','平台'].map(function(v){return '<option'+(state.summaryType===v?' selected':'')+'>'+v+'</option>';}).join('')+'</select></label>'+
            '<label class="settle-field"><span>收款方名称</span><input class="settle-input" id="settle-query" value="'+h(state.query)+'" placeholder="请输入收款方名称"></label><div class="settle-actions">'+button('查询','search','','primary')+button('重置','reset')+'</div></div></div>';
        /* 汇总口径说明：按收款方结算单元归集；含佣金分佣与承运商运费。 */
        return '<div class="settle-card-body">'+note('当前按结算单元（收款方）统计：含佣金分佣方与承运商运费收款；应收金额为单据总金额；已结款、待处理、异常金额按单据状态与预检结果归类。账户余额、提现和退款流水不在本页口径内。')+'</div>'+tabs([['day','日汇总'],['month','月汇总']])+
            '<section class="settle-card">'+filterHtml+'<div class="settle-toolbar">'+button('导出列表','export-summary')+'</div>'+
            table(['序号',state.tab==='month'?'统计月份':'统计日期','收款方类型','收款方名称','收款方ID','应收金额（元）','已结款金额（元）','待处理金额（元）','异常金额（元）','单据数','明细数'],tr,'共 '+(state.tab==='month'?String(summaryMonth.length):String(summaryDay.length))+' 条')+'</section>';
    }
    function renderSupplier() {
        if (!['pending','statement'].includes(state.tab)) state.tab='pending';
        var pending=state.tab==='pending', all=pending?supplierPending:supplierStatements;
        var rows=filtered(all,['id']).filter(function(x){
            var sn=(state.supplierName||'').trim(), an=(state.supplierAccountName||'').trim(), ao=(state.supplierAccountNo||'').trim(), fn=(state.supplierFlowNo||'').trim();
            return (!state.supplierDateFrom || x.created.slice(0,10)>=state.supplierDateFrom) && (!state.supplierDateTo || x.created.slice(0,10)<=state.supplierDateTo) && (state.status!=='异常'||x.blocked) &&
                (!sn || String(x.supplier||'').indexOf(sn)>=0) &&
                (!an || String(x.payeeAccountName||'').indexOf(an)>=0) && (!ao || String(x.payeeAccount||'').indexOf(ao)>=0) && billMatchesFlow(x, fn);
        });
        var pages=Math.max(1,Math.ceil(rows.length/20));state.supplierPage=Math.min(state.supplierPage,pages);
        var visibleRows=rows.slice((state.supplierPage-1)*20,state.supplierPage*20);
        var selected=state.supplierSelection;
        var tr=visibleRows.map(function(x){
            var missing=x.id==='ST_358643443066482688';
            var payeeAcc=missing?{name:'—',no:'—'}:huifuAccount(x.supplier);
            return '<tr>'+(pending?'<td><input aria-label="选择 '+h(x.id)+'" type="checkbox" data-select-supplier="'+h(x.id)+'"'+(selected.includes(x.id)?' checked':'')+'></td>':'')+
            /* 付款账户固定为平台冻结账户，列表不展示；详情仍展示 */
            '<td>'+h(x.seq)+'</td><td>'+button(x.id,'detail',x.id)+'</td><td>'+h(x.supplier)+'</td><td>'+h(payeeAcc.name)+'</td><td>'+h(payeeAcc.no)+'</td><td class="money">'+cash(x.goods)+'</td><td class="money">'+cash(x.payable)+'</td><td class="money">'+cash(x.net)+'</td><td>'+h(x.orders)+'</td><td>'+tag(x.status)+'</td><td>'+h(x.created)+'</td><td>'+h(x.cycle)+'</td><td class="settle-actions">'+button('查看详情','detail',x.id)+(pending?(x.blocked?button('重新执行','retry',x.id):button('加入结款单','submit',x.id)):'')+'</td></tr>';});
        var search='<div class="settle-card-body"><div class="settle-filter">'+
            '<label class="settle-field"><span>结算单号</span><input class="settle-input" id="settle-query" value="'+h(state.query)+'" placeholder="请输入结算单号"></label>'+
            '<label class="settle-field"><span>供应商名称</span><input class="settle-input" id="supplier-name" value="'+h(state.supplierName||'')+'" placeholder="请输入供应商名称"></label>'+
            '<label class="settle-field"><span>收款账户名称</span><input class="settle-input" id="supplier-account-name" value="'+h(state.supplierAccountName||'')+'" placeholder="请输入收款账户名称"></label>'+
            '<label class="settle-field"><span>收款账户</span><input class="settle-input" id="supplier-account-no" value="'+h(state.supplierAccountNo||'')+'" placeholder="请输入收款账户"></label>'+
            '<label class="settle-field"><span>通道流水号</span><input class="settle-input" id="supplier-flow-no" value="'+h(state.supplierFlowNo||'')+'" placeholder="请输入通道流水号"></label>'+
            '<label class="settle-field"><span>结算状态</span><select class="settle-select" id="settle-status">'+statusOptions()+'</select></label>'+
            '<label class="settle-field"><span>创建时间</span><input aria-label="创建时间开始" type="date" class="settle-input" id="supplier-date-from" value="'+h(state.supplierDateFrom)+'"></label><span>至</span><label class="settle-field"><span>&nbsp;</span><input aria-label="创建时间结束" type="date" class="settle-input" id="supplier-date-to" value="'+h(state.supplierDateTo)+'"></label>'+
            '<div class="settle-actions">'+button('查询','search','','primary')+button('重置','reset')+'</div></div></div>';
        var head=(pending?['□']:[]).concat(['序号','结算单号','供应商名称','收款账户名称','收款账户','货款合计（应收）','应付合计（服务费+佣金）','应付供应商净额','订单数','结算状态','创建时间','结算周期','操作']);
        var footer='<span>共 '+rows.length+' 条</span><span>20条/页</span>'+
            '<button class="settle-btn" data-act="supplier-page" data-id="'+(state.supplierPage-1)+'"'+(state.supplierPage===1?' disabled':'')+'>上一页</button>'+
            Array.from({length:pages},function(_,i){return '<button class="settle-btn'+(state.supplierPage===i+1?' primary':'')+'" data-act="supplier-page" data-id="'+(i+1)+'" aria-label="第 '+(i+1)+' 页">'+(i+1)+'</button>';}).join('')+
            '<button class="settle-btn" data-act="supplier-page" data-id="'+(state.supplierPage+1)+'"'+(state.supplierPage===pages?' disabled':'')+'>下一页</button>';
        return accountNote()+tabs([['pending','待处理单据'],['statement','结款单据']])+
            '<section class="settle-card">'+search+(pending?'<div class="settle-toolbar"><button type="button" class="settle-btn primary" data-act="batch-submit"'+(selected.some(function(id){var row=supplierPending.find(function(x){return x.id===id;});return row&&!row.blocked;})?'':' disabled')+'>批量加入结款单</button></div>':'')+
            table(head,tr,footer).replace('<th>□</th>','<th><input type="checkbox" aria-label="选择所有行" data-select-supplier-all></th>')+'</section>';
    }
    function renderCarrier() {
        if (!['pending','statement'].includes(state.tab)) state.tab='pending';
        var pending=state.tab==='pending', all=pending?carrierPending:carrierStatements;
        var rows=filtered(all,['id','carrier']).filter(function(x){
            var name=(state.carrierName||'').trim();
            var accountName=(state.carrierAccountName||'').trim();
            var accountNo=(state.carrierAccountNo||'').trim();
            var flowNo=(state.carrierFlowNo||'').trim();
            if (state.status==='待提交' && x.blocked) return false;
            return (!name || String(x.carrier).indexOf(name)>=0) && (!accountName || String(x.accountName||'').indexOf(accountName)>=0) && (!accountNo || String(x.account||'').indexOf(accountNo)>=0) && billMatchesFlow(x, flowNo) && (!state.carrierDateFrom || x.created.slice(0,10)>=state.carrierDateFrom) && (!state.carrierDateTo || x.created.slice(0,10)<=state.carrierDateTo);
        });
        var pages=Math.max(1,Math.ceil(rows.length/20));state.carrierPage=Math.min(state.carrierPage,pages);
        var visibleRows=rows.slice((state.carrierPage-1)*20,state.carrierPage*20);
        var selected=state.carrierSelection;
        /* 付款账户固定为平台冻结账户，列表不展示；详情仍展示 */
        var tr=visibleRows.map(function(x){return '<tr>'+(pending?'<td><input aria-label="选择 '+h(x.id)+'" type="checkbox" data-select-carrier="'+h(x.id)+'"'+(selected.includes(x.id)?' checked':'')+'></td>':'')+
            '<td>'+h(x.seq)+'</td><td>'+button(x.id,'detail',x.id)+'</td><td>'+h(x.carrier)+'</td><td>'+h(x.carrierId)+'</td><td class="money">'+cash(x.freight)+'</td><td>'+h(x.orders)+'</td><td>'+h(x.accountName||'—')+'</td><td>'+h(x.account||'—')+'</td><td>'+tag(x.blocked?'异常':x.status)+'</td><td>'+h(x.created)+'</td><td>'+h(x.cycle)+'</td><td class="settle-actions">'+button('查看详情','detail',x.id)+(pending?(x.blocked?button('重新执行','carrier-retry',x.id):button('加入结款单','carrier-submit',x.id)):(x.status==='结款失败'?button('重新执行','carrier-retry',x.id):''))+'</td></tr>';});
        var search='<div class="settle-card-body"><div class="settle-filter">'+
            '<label class="settle-field"><span>结算单号</span><input class="settle-input" id="settle-query" value="'+h(state.query)+'" placeholder="请输入结算单号"></label>'+
            '<label class="settle-field"><span>承运商</span><input class="settle-input" id="carrier-name" value="'+h(state.carrierName||'')+'" placeholder="请输入承运商名称"></label>'+
            '<label class="settle-field"><span>收款账户名称</span><input class="settle-input" id="carrier-account-name" value="'+h(state.carrierAccountName||'')+'" placeholder="请输入收款账户名称"></label>'+
            '<label class="settle-field"><span>收款账户</span><input class="settle-input" id="carrier-account-no" value="'+h(state.carrierAccountNo||'')+'" placeholder="请输入收款账户"></label>'+
            '<label class="settle-field"><span>通道流水号</span><input class="settle-input" id="carrier-flow-no" value="'+h(state.carrierFlowNo||'')+'" placeholder="请输入通道流水号"></label>'+
            '<label class="settle-field"><span>结算状态</span><select class="settle-select" id="settle-status">'+statusOptions()+'</select></label>'+
            '<label class="settle-field"><span>创建时间</span><input aria-label="创建时间开始" type="date" class="settle-input" id="carrier-date-from" value="'+h(state.carrierDateFrom)+'"></label><span>至</span><label class="settle-field"><span>&nbsp;</span><input aria-label="创建时间结束" type="date" class="settle-input" id="carrier-date-to" value="'+h(state.carrierDateTo)+'"></label>'+
            '<div class="settle-actions">'+button('查询','search','','primary')+button('重置','reset')+'</div></div></div>';
        var head=(pending?['□']:[]).concat(['序号','结算单号','承运商','承运商编码','应付运费','运单数','收款账户名称','收款账户','结算状态','创建时间','结算周期','操作']);
        var footer='<span>共 '+rows.length+' 条</span>';
        return accountNote()+tabs([['pending','待处理单据'],['statement','结款单据']])+
            '<section class="settle-card">'+search+(pending?'<div class="settle-toolbar"><button type="button" class="settle-btn primary" data-act="carrier-batch"'+(selected.some(function(id){var row=carrierPending.find(function(x){return x.id===id;});return row&&!row.blocked;})?'':' disabled')+'>批量加入结款单</button></div>':'')+
            table(head,tr,footer).replace('<th>□</th>','<th><input type="checkbox" aria-label="选择所有行" data-select-carrier-all></th>')+'</section>';
    }
    function renderCommission() {
        var rows=commissions.filter(function(x){
            var payeeQ=(state.commissionPayee||'').trim(), an=(state.commissionAccountName||'').trim(), ao=(state.commissionAccountNo||'').trim(), fn=(state.commissionFlowNo||'').trim();
            return (!state.query||x.id.includes(state.query))&&(!state.status||x.status===state.status)&&(!state.commissionType||x.type===state.commissionType)&&(!state.commissionRelated||x.related.includes(state.commissionRelated))&&
                (!payeeQ||String(x.payee).indexOf(payeeQ)>=0)&&(!an||String(x.payeeAccountName||'').indexOf(an)>=0)&&(!ao||String(x.payeeAccount||'').indexOf(ao)>=0)&&billMatchesFlow(x,fn);
        });
        var tr=rows.map(function(x){
            var payerAcc=huifuAccount(x.supplier);
            var payeeAcc=huifuAccount(x.payee);
            return '<tr><td>'+h(x.seq)+'</td><td>'+button(x.id,'detail',x.id)+'</td><td>'+h(x.supplier)+'</td><td>'+h(x.payee)+'</td><td>'+h(x.type)+'</td><td>'+h(payerAcc.name)+'</td><td>'+h(payerAcc.no)+'</td><td>'+h(payeeAcc.name)+'</td><td>'+h(payeeAcc.no)+'</td><td class="money">'+cash(x.amount)+'</td><td>'+h(x.orders)+'</td><td>'+tag(x.status)+'</td><td>'+h(x.posting)+'</td><td>'+linkDoc(x.related,'supplier',x.related)+'</td><td>'+h(x.created)+'</td><td>'+button('查看详情','detail',x.id)+'</td></tr>';});
        var filters='<div class="settle-card-body"><div class="settle-filter">'+
            '<label class="settle-field"><span>结款单号</span><input class="settle-input" id="settle-query" value="'+h(state.query)+'" placeholder="请输入结款单号"></label>'+
            '<label class="settle-field"><span>收款方名称</span><input class="settle-input" id="commission-payee" value="'+h(state.commissionPayee||'')+'" placeholder="请输入收款方名称"></label>'+
            '<label class="settle-field"><span>收款方类型</span><select class="settle-select" id="commission-type"><option value="">请选择</option>'+['门店','BD扶商','直播运营商','商户','平台'].map(function(v){return '<option'+(state.commissionType===v?' selected':'')+'>'+v+'</option>';}).join('')+'</select></label>'+
            '<label class="settle-field"><span>收款账户名称</span><input class="settle-input" id="commission-account-name" value="'+h(state.commissionAccountName||'')+'" placeholder="请输入收款账户名称"></label>'+
            '<label class="settle-field"><span>收款账户</span><input class="settle-input" id="commission-account-no" value="'+h(state.commissionAccountNo||'')+'" placeholder="请输入收款账户"></label>'+
            '<label class="settle-field"><span>通道流水号</span><input class="settle-input" id="commission-flow-no" value="'+h(state.commissionFlowNo||'')+'" placeholder="请输入通道流水号"></label>'+
            '<label class="settle-field"><span>清算状态</span><select class="settle-select" id="settle-status"><option value="">请选择</option>'+['待生成','待结款','已结款','部分结款','结款失败'].map(function(v){return '<option'+(state.status===v?' selected':'')+'>'+v+'</option>';}).join('')+'</select></label>'+
            '<label class="settle-field"><span>关联供应商结款单</span><input class="settle-input" id="commission-related" value="'+h(state.commissionRelated||'')+'" placeholder="请输入关联供应商结款单"></label>'+
            '<div class="settle-actions">'+button('查询','search','','primary')+button('重置','reset')+'</div></div></div>';
        return accountNote()+'<section class="settle-card">'+filters+table(['序号','结款单号','供应商名称','收款方名称','收款方类型','付款账户名称','付款账户','收款账户名称','收款账户','应收佣金（元）','子订单数量','清算状态','入账状态','关联供应商结款单','创建时间','操作'],tr,'共 182 条')+'</section>';
    }
    function renderCompensation() {
        var rows=compensations.filter(function(x){
            var an=(state.compensationAccountName||'').trim(), ao=(state.compensationAccountNo||'').trim(), fn=(state.compensationFlowNo||'').trim();
            return (!state.query||x.id.includes(state.query))&&(!state.compensationRelated||x.related.includes(state.compensationRelated))&&(!state.compensationPayee||x.payee.includes(state.compensationPayee))&&(!state.compensationType||x.payeeType===state.compensationType)&&(!state.status||x.status===state.status)&&
                (!an||String(x.payeeAccountName||'').indexOf(an)>=0)&&(!ao||String(x.payeeAccount||'').indexOf(ao)>=0)&&billMatchesFlow(x,fn);
        });
        var tr=rows.map(function(x){
            var payeeAcc=huifuAccount(x.payee, x.payeeAccount);
            return '<tr><td>'+h(x.seq)+'</td><td>'+button(x.id,'detail',x.id)+'</td><td>'+h(x.type)+'</td><td>'+linkDoc(x.related,'exception',x.related)+'</td><td class="money">'+cash(x.amount)+'</td><td>'+h(x.payer)+'</td><td>'+h(PLATFORM_PAYER_NAME)+'</td><td>'+h(x.payerAccount)+'</td><td>'+h(x.payee)+'</td><td>'+h(x.payeeType)+'</td><td>'+h(payeeAcc.name)+'</td><td>'+h(payeeAcc.no)+'</td><td>'+h(x.created)+'</td><td>'+tag(x.status)+'</td><td>'+h(x.time)+'</td><td class="settle-actions">'+button('查看详情','detail',x.id)+(x.status==='待结款'?button('人工结款','manual',x.id):'')+'</td></tr>';});
        var filters='<div class="settle-card-body"><div class="settle-filter">'+
            '<label class="settle-field"><span>结款单号</span><input class="settle-input" id="settle-query" value="'+h(state.query)+'" placeholder="请输入结款单号"></label>'+
            '<label class="settle-field"><span>关联异常单号</span><input class="settle-input" id="compensation-related" value="'+h(state.compensationRelated||'')+'" placeholder="请输入关联异常单号"></label>'+
            '<label class="settle-field"><span>收款方名称</span><input class="settle-input" id="compensation-payee" value="'+h(state.compensationPayee||'')+'" placeholder="请输入收款方名称"></label>'+
            '<label class="settle-field"><span>收款方类型</span><select class="settle-select" id="compensation-type"><option value="">全部</option>'+['门店','供应商','商户','BD扶商','平台','直播运营商'].map(function(v){return '<option'+(state.compensationType===v?' selected':'')+'>'+v+'</option>';}).join('')+'</select></label>'+
            '<label class="settle-field"><span>收款账户名称</span><input class="settle-input" id="compensation-account-name" value="'+h(state.compensationAccountName||'')+'" placeholder="请输入收款账户名称"></label>'+
            '<label class="settle-field"><span>收款账户</span><input class="settle-input" id="compensation-account-no" value="'+h(state.compensationAccountNo||'')+'" placeholder="请输入收款账户"></label>'+
            '<label class="settle-field"><span>通道流水号</span><input class="settle-input" id="compensation-flow-no" value="'+h(state.compensationFlowNo||'')+'" placeholder="请输入通道流水号"></label>'+
            (state.compensationExpanded?'<label class="settle-field"><span>结款状态</span><select class="settle-select" id="settle-status"><option value="">全部</option>'+['待结款','结款中','已结款','结款失败'].map(function(v){return '<option'+(state.status===v?' selected':'')+'>'+v+'</option>';}).join('')+'</select></label><label class="settle-field"><span>创建时间</span><input type="date" class="settle-input" id="compensation-from"></label>':'')+
            '<div class="settle-actions">'+button('查询','search','','primary')+button('重置','reset')+button(state.compensationExpanded?'收起':'展开','expand-compensation')+'</div></div></div>';
        return accountNote()+'<section class="settle-card">'+filters+'<div class="settle-toolbar">'+button('导出列表','export-compensation')+'</div>'+
            table(['序号','结款单号','补偿类型','关联异常单号','补偿金额（元）','付款方名称','付款账户名称','付款账户','收款方名称','收款方类型','收款账户名称','收款账户','创建时间','结款状态','完成时间','操作'],tr,'共 7 条')+'</section>';
    }
    function renderPolicy() {
        if (!state.tab) state.tab='retail';
        if (state.tab==='config') return tabs([['retail','零售订单策略'],['procurement','代采订单策略'],['config','通用配置']]) + renderConfig();
        var retail=state.tab==='retail';
        var rows=policies.filter(function(x){return x.kind===(retail?'零售订单':'代采订单') && (!state.query||x.name.includes(state.query)) && (!state.status||x.status===state.status) && (!state.policyType||state.policyType==='商品分佣') && (!state.policyStore||x.stores.includes(state.policyStore));});
        var tr=rows.map(function(x){var enabled=x.status==='已启用', terminated=x.status==='已终止';return '<tr><td>'+h(x.seq)+'</td><td>'+button(x.name,'detail',x.id)+'</td><td>商品分佣</td>'+
            (retail?'<td>'+h(x.channel)+'</td><td>'+h(x.basis)+'</td>':'')+'<td>'+h(x.trigger)+'</td><td class="wrap">'+h(x.rule)+'</td>'+
            (retail?'<td>'+(x.stores==='全部门店'?h(x.stores):button(x.stores,'binding',x.id))+'</td>':'')+
            '<td>'+tag(x.status)+'</td><td>'+h(x.time)+'</td><td class="settle-actions">'+(retail&&!terminated?button('绑定门店','binding',x.id):'')+
            (!terminated?button(enabled?'停用':'启用','toggle-policy',x.id):'')+button('更多 ▾','policy-more',x.id)+
            (state.policyMenu===x.id?'<div class="settle-more">'+button('操作日志','policy-log',x.id)+
                '<button class="settle-btn link" data-act="edit-policy" data-id="'+h(x.id)+'"'+(enabled||terminated?' disabled title="请先停用策略后再修改"':'')+'>修改策略</button>'+
                '<button class="settle-btn link" data-act="terminate-policy" data-id="'+h(x.id)+'"'+(terminated?' disabled':'')+'>终止策略</button>'+
                '<button class="settle-btn link" data-act="delete-policy" data-id="'+h(x.id)+'"'+(x.status!=='草稿'?' disabled title="仅草稿策略可删除"':'')+'>删除</button></div>':'')+'</td></tr>';});
        var filters='<div class="settle-card-body"><div class="settle-filter">'+
            '<label class="settle-field"><span>策略名称</span><input class="settle-input" id="settle-query" value="'+h(state.query)+'" placeholder="请输入策略名称"></label>'+
            '<label class="settle-field"><span>策略类型</span><select class="settle-select" id="policy-type"><option value="">请选择</option><option'+(state.policyType?' selected':'')+'>商品分佣</option></select></label>'+
            '<label class="settle-field"><span>策略状态</span><select class="settle-select" id="settle-status"><option value="">请选择</option>'+['已启用','已停用','已终止','草稿'].map(function(s){return '<option'+(state.status===s?' selected':'')+'>'+s+'</option>';}).join('')+'</select></label>'+
            (retail?'<label class="settle-field"><span>绑定门店</span><input class="settle-input" id="policy-store" value="'+h(state.policyStore)+'" placeholder="请输入绑定门店"></label>':'')+
            '<div class="settle-actions">'+button('查询','search','','primary')+button('重置','reset')+'</div></div></div>';
        var head=retail?['序号','策略名称','策略类型','订单渠道','分佣基准','结算起算节点','策略详情','门店数量','策略状态','创建时间','操作']:
            ['序号','策略名称','策略类型','结算起算节点','策略详情','策略状态','创建时间','操作'];
        return tabs([['retail','零售订单策略'],['procurement','代采订单策略'],['config','通用配置']]) +
            '<section class="settle-card">'+filters+'<div class="settle-toolbar">'+button('创建策略','new-policy','','primary')+'</div>'+table(head,tr,'共 '+(retail?'15':'1')+' 条 · 20条/页')+'</section>';
    }
    function switcher(key) {return '<button type="button" role="switch" aria-checked="' + (config[key]?'true':'false') + '" class="settle-switch' + (config[key]?' on':'') + '" data-act="switch" data-id="' + h(key) + '"></button>';}
    function configLine(label, value, hint) {return '<div class="settle-config-item"><div class="settle-config-label">' + h(label) + '</div><div class="settle-config-control">' + value + (hint?'<p class="settle-config-hint">'+h(hint)+'</p>':'') + '</div></div>';}
    function orderTypeMulti() {
        var selected = ORDER_TYPES.filter(function (name) { return (config.excludeTypes || []).indexOf(name) >= 0; });
        var enabled = !!config.exclude;
        var open = state.multiOpen === 'excludeTypes' && enabled;
        var iconCheck = '<svg class="settle-multi__check" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.2 8.3 6.4 11.4 12.8 4.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        var iconClear = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.15" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M5.7 5.7 10.3 10.3M10.3 5.7 5.7 10.3" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>';
        var iconCaret = '<svg class="settle-multi__caret" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.2 5.8 8 10.4l4.8-4.6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        var tags = selected.map(function (name) {
            return '<span class="settle-multi__tag">' + h(name) +
                (enabled ? '<button type="button" class="settle-multi__tag-x" data-act="multi-remove" data-id="' + h(name) + '" aria-label="移除' + h(name) + '">×</button>' : '') +
                '</span>';
        }).join('');
        var suffix = selected.length && enabled
            ? '<button type="button" class="settle-multi__clear" data-act="multi-clear" aria-label="清空">' + iconClear + '</button>'
            : iconCaret;
        var options = ORDER_TYPES.map(function (name) {
            var on = selected.indexOf(name) >= 0;
            return '<button type="button" class="settle-multi__opt' + (on ? ' is-selected' : '') + '" data-act="multi-pick" data-id="' + h(name) + '"><span>' + h(name) + '</span>' + iconCheck + '</button>';
        }).join('');
        return '<span class="settle-multi' + (open ? ' is-open' : '') + (enabled ? '' : ' is-disabled') + '">' +
            '<div class="settle-multi__box" role="combobox" aria-expanded="' + (open ? 'true' : 'false') + '" aria-disabled="' + (enabled ? 'false' : 'true') + '"' +
            (enabled ? ' data-act="toggle-multi" data-id="excludeTypes" tabindex="0"' : '') + '>' +
            '<span class="settle-multi__tags">' + (tags || '<span class="settle-multi__placeholder">请选择</span>') + '</span>' + suffix + '</div>' +
            (open ? '<span class="settle-multi__panel" role="listbox" aria-label="不参与分佣的订单类型">' + options + '</span>' : '') +
            '</span>';
    }
    function roundModeRadios() {
        config.roundMode = 'round';
        return '<div class="settle-config-radios settle-config-radios--locked">' + ROUND_MODES.map(function (item) {
            var on = item[0] === 'round';
            return '<label><input type="radio" name="roundMode" value="' + h(item[0]) + '" disabled' + (on ? ' checked' : '') + '> ' + h(item[1]) + '</label>';
        }).join('') + '</div>';
    }
    function renderConfig() {
        var cards=function(options,selected){return '<div class="settle-config-cards">'+options.map(function(x){return '<label class="settle-config-card'+(x===selected?' selected':'')+'"><input type="radio" disabled'+(x===selected?' checked':'')+'>'+h(x)+'</label>';}).join('')+'</div>';};
        var body='<div class="settle-card-body"><h3 class="settle-section-title">佣金规则设置</h3><div class="settle-config-grid">' +
            configLine('分佣总开关',switcher('master'),'开启后按分佣策略执行佣金分配；关闭后仅平台保留收益，其余参与方不进行分佣。') +
            configLine('订单类型',switcher('exclude')+orderTypeMulti(),'开启后，所选类型的订单不参与分佣，资金归入平台；可多选。关闭后所有订单均参与分佣。') +
            configLine('订单实付金额低于','<input class="settle-input settle-config-short" type="number" min="0" step="0.01" data-config="min" value="'+h(config.min)+'"> 元，低于此值不分佣，资金归入平台（0=不限）','注：商品实际支付金额少于商品采购价，订单不分佣，平台补差结算。') +
            configLine('分佣基准',cards(['按实付金额分佣','按销售金额分佣'],'按实付金额分佣'),'分佣基准为全局默认展示，下期支持切换；实际算分以各分佣策略明细的基准为准（代销按毛利、平台按实付）。') +
            configLine('佣金金额不足1分计',roundModeRadios(),'佣金不足 1 分时固定按四舍五入处理，本期不可变更。') +
            '</div><h3 class="settle-section-title" style="margin-top:28px">结算规则设置</h3><div class="settle-config-grid">' +
            configLine('结算起算节点',cards(['订单履约确认后','售后期结束'],'订单履约确认后'),'分账触发节点，下期支持，当前固定按「订单履约确认后」起算：自提订单为全部核销完成，配送或直发订单为确认收货；「售后期结束」起算下期支持。') +
            configLine('结算周期','系统每 <select class="settle-select settle-config-short" data-config="cycle">'+[['1','1天'],['2','2天'],['3','3天'],['5','5天'],['7','7天'],['15','15天'],['30','30天'],['month','自然月1日']].map(function(x){return '<option value="'+x[0]+'"'+(config.cycle===x[0]?' selected':'')+'>'+x[1]+'</option>';}).join('')+'</select> 结算并出账一次','「N 天」自上次结算滚动；「自然月1日」每月固定 1 号结算。') +
            configLine('结算单生成时间','<input class="settle-input settle-config-short" type="time" data-config="generate" value="'+h(config.generate)+'">','每日结算单生成时刻（如 09:30）。') +
            configLine('自动生成结款单',switcher('autoBill'),'开启后，财务未在规定时间内审核时系统自动生成付款单；关闭则需财务手动生成。') +
            configLine('结款执行时间','生成结款单后 <input class="settle-input settle-config-short" type="number" min="0" step="1" data-config="payHours" value="'+h(config.payHours)+'"> 小时内执行打款','0 = 生成结款单后立即执行；仅「自动生成结款单」开启时生效。') +
            '</div><div class="settle-actions" style="margin-top:26px">' + button('保存','save-config','','primary') + '</div></div>';
        return card('通用配置',body,button('操作日志','general-log','',''));
    }
    function openPolicyPage(mode,id) {
        var row=policies.find(function(x){return x.id===id;});
        state.policyMode=mode;state.policyEditing=id||'';state.detail='';state.policyMenu='';
        state.policyDraft={name:row?row.name:'',enabled:row?row.status==='已启用':true,description:'',orderType:row?row.kind:(state.tab==='procurement'?'代采订单':'零售订单'),channel:row?row.channel:'直播',rules:row?[{name:row.name,method:'按实付金额分佣',summary:row.rule,dimension:'全部商品',tiers:[{margin:row.kind==='代采订单'?3:1,store:1,bd:row.kind==='代采订单'?2:1,live:0,merchant:0,residual:'平台'}]}]:[]};
        var q=new URLSearchParams({view:'policy',mode:mode});if(id)q.set('id',id);history.pushState(null,'',location.pathname+'?'+q.toString());render();
    }
    function policyField(label,body) {return '<div class="settle-form-row"><label>'+h(label)+'</label><div>'+body+'</div></div>';}
    function policyRadio(name,value,options,readonly) {return '<div class="settle-radio">'+options.map(function(x){return '<label><input type="radio" name="'+h(name)+'" value="'+h(x)+'"'+(value===x?' checked':'')+(readonly?' disabled':'')+'>'+h(x)+'</label>';}).join('')+'</div>';}
    function renderPolicyForm() {
        var draft=state.policyDraft||{}, readonly=state.policyMode==='detail', consign=draft.orderType==='代采订单';
        var input=function(name,value,placeholder,max){return '<input class="settle-input" data-policy="'+name+'" value="'+h(value||'')+'" placeholder="'+h(placeholder||'')+'"'+(max?' maxlength="'+max+'"':'')+(readonly?' disabled':'')+'>';};
        var basic='<div class="settle-card-body settle-policy-form">'+
            '<div class="settle-form-two">'+policyField('策略名称 *',input('name',draft.name,'请输入策略名称',64))+policyField('规则描述','<textarea class="settle-input settle-textarea" data-policy="description" maxlength="200" placeholder="选填，补充该策略的适用场景、计算口径等"'+(readonly?' disabled':'')+'>'+h(draft.description||'')+'</textarea>')+'</div>'+
            policyField('启用',readonly?h(draft.enabled?'启用':'停用'):'<label><input type="checkbox" data-policy="enabled"'+(draft.enabled?' checked':'')+'> 启用</label>')+
            policyField('订单业态 *',policyRadio('orderType',draft.orderType,['零售订单','代采订单'],readonly))+
            (!consign?policyField('适用渠道 *',policyRadio('channel',draft.channel,['商城','直播'],readonly)):'')+
            policyField('策略类型','<div class="settle-type-cards"><span class="selected">默认<br><b>商品分佣</b></span><span class="disabled">商品营销费用承担（二期）</span></div>')+
            policyField('扣除项规则','<div class="settle-deduction">承运商运费：不参与分佣，由平台结算到承运商基本账户<br>仓储服务商：不参与分佣，平台线下结算<br>供应商：不参与分佣，按采购金额结算</div>')+
            policyField('分佣基准',consign?'实付减进货成本（代采业态固定）':policyRadio('basis','按实付金额分佣',['按实付金额分佣'],true))+
            policyField('结算节点',policyRadio('trigger','订单履约确认后',['订单履约确认后','售后期结束'],true))+'</div>';
        var rules=draft.rules||[];
        var rows=rules.map(function(r,i){return '<tr><td>'+(i+1)+'</td><td>'+h(r.name)+'</td><td>'+h(r.method||'按实付金额分佣')+'</td><td class="wrap">'+h(r.summary||'—')+'</td><td>'+h(r.dimension||'全部商品')+' '+button('查看','rule-scope',String(i))+'</td><td class="settle-actions">'+(readonly?'—':button('编辑','edit-rule',String(i))+button('删除','remove-rule',String(i)))+'</td></tr>';});
        var ruleBody=(consign?'<div class="settle-card-body">'+note('代采策略：供应商按采购价结算（系统自动），按毛利率阶梯配置BD扶商比例，剩余归平台；规则配置参与商品范围与BD阶梯')+'</div>':'')+
            (readonly?'':'<div class="settle-toolbar">'+button('新建分佣规则','add-rule','','primary')+'</div>')+
            table(['序号','规则名称','分佣方式','结算规则','参与商品','操作'],rows);
        var logs=readonly?card('操作日志',state.policyEditing==='POLICY_354560079879471104'?logTable(policyLogs,'policy'):table(['操作时间','操作内容','操作人','操作方式','结果','操作'],[])):'';
        return '<div class="settle-back">'+button('← 返回','policy-back')+'</div>'+card('基本信息',basic)+card('策略配置',ruleBody)+logs+
            '<div class="settle-form-footer">'+button('返回','policy-back')+(readonly?'':button(state.policyMode==='edit'?'保存修改':'确定','save-policy','','primary'))+'</div>';
    }
    function emptyTier() {return {participate:true,margin:0,store:0,bd:0,live:0,merchant:0,residual:'平台',fixed:0};}
    function captureRuleDraft() {
        var r=state.ruleDraft;if(!r)return;
        var input=overlay.querySelector('[data-rule="name"]');if(input)r.name=input.value;
        overlay.querySelectorAll('[data-tier-index]').forEach(function(el){var t=r.tiers[Number(el.dataset.tierIndex)];if(t)t[el.dataset.tierKey]=el.type==='checkbox'?el.checked:el.value;});
    }
    function renderRuleDialog() {
        var r=state.ruleDraft, consign=state.policyDraft.orderType==='代采订单',live=state.policyDraft.channel==='直播';
        var tierHeads=['阶梯','毛利率阈值'].concat(consign?[]:['门店 %']).concat(['BD扶商 %']).concat(consign||!live?[]:['直播运营商 %']).concat(['平台']).concat(consign?[]:['商户']).concat(['操作']);
        var tierRows=r.tiers.map(function(t,i){var num=function(key){return '<input aria-label="'+tierHeads.join(' ')+' '+h(key)+'" type="number" min="0" max="100" step="0.01" class="settle-input settle-small" data-tier-index="'+i+'" data-tier-key="'+key+'" value="'+h(t[key])+'">';};
            return '<tr><td><b>T'+(i+1)+'</b><select class="settle-select" data-tier-index="'+i+'" data-tier-key="participate"><option value="true"'+(String(t.participate)==='true'?' selected':'')+'>参与</option><option value="false"'+(String(t.participate)==='false'?' selected':'')+'>不参与</option></select></td><td>≥ '+num('margin')+' %</td>'+
                (consign?'':'<td>'+num('store')+'</td>')+'<td>'+num('bd')+'</td>'+(consign||!live?'':'<td>'+num('live')+'</td>')+
                '<td>'+(consign?'剩余结算': '<select class="settle-select" data-tier-index="'+i+'" data-tier-key="residual"><option'+(t.residual==='平台'?' selected':'')+'>平台</option><option'+(t.residual==='商户'?' selected':'')+'>商户</option></select> 剩余金额')+'</td>'+
                (consign?'':'<td>'+num('merchant')+' %</td>')+'<td>'+button('复制','copy-tier',String(i))+(r.tiers.length>1?button('删除','remove-tier',String(i)):'')+'</td></tr>';});
        var dimension=policyRadio('dimension',r.dimension,['全部商品','部分品类','部分商品']);
        var chosen=r.dimension==='部分品类'?'<div>'+button('选择分类','choose-category','','primary')+' '+h((r.categories||[]).join('、'))+'</div>':r.dimension==='部分商品'?'<div>'+button('选择商品','choose-product','','primary')+' '+h((r.products||[]).join('、'))+'</div>':'';
        var body='<div class="settle-policy-form">'+policyField('分佣规则名称 *','<input class="settle-input" data-rule="name" maxlength="64" value="'+h(r.name)+'" placeholder="请输入分佣规则名称">')+
            (!consign?policyField('分佣方式',policyRadio('method','按实付金额分佣',['按实付金额分佣'],true)+'<span class="muted">按销售金额分佣（二期）</span>'):'')+
            policyField('结算规则','<div class="settle-note">'+r.tiers.length+' 档 · 按毛利率自上而下命中，单档生效'+(consign?'；供应商按采购价结算，平台按剩余金额结算':'')+'</div>')+
            table(tierHeads,tierRows)+'<div class="settle-toolbar">'+button('新增阶梯','add-tier')+'</div>'+
            policyField('商品维度',dimension+chosen)+'</div>';
        openModal((state.ruleEditing<0?'新建':'编辑')+'分佣规则 · '+(consign?'代采 · BD扶商+平台':'多阶梯 · 多角色'),body,true,button('取消','close')+button('保存','save-rule','','primary'));
    }
    var categories=[
        ['CAT-318568861735600128','新鲜蔬菜',43],['CAT-338572251781664768','zz测试',0],['CAT-318570755371581440','时令水果',102],
        ['CAT-318570903677976576','肉禽蛋',10],['CAT-318571213641236480','水产海鲜',11],['CAT-318571881810640896','休闲零食',14],
        ['CAT-318572119849975808','粮油调味',11],['CAT-318572335181348864','酒水饮料',9],['CAT-318572583630946304','乳饮面包',4],['CAT-318572832655163392','方便速食',8]
    ];
    var products=[
        ['359256758310408192','五蔬面','0.05','牛牛下单专用','已上架'],['358868660598611968','常温爽歪歪-运费专用','0.02','肉禽蛋品','已上架'],
        ['358492244468043776','每单限购1','0.01','肉禽蛋品','已上架'],['358086032891056128','大橘--积分商品','—','牛牛下单专用','已上架'],
        ['358086033025273856','能力--纯积分兑换','—','牛牛下单专用','已上架'],['358069300449251328','芝士麻薯','0.02','牛牛下单专用','已上架'],
        ['357049453917523968','0912测试商品','0.10','蔬菜水果、水产海鲜、日用百货、肉禽蛋品','已上架'],
        ['357829541122543616','德柱猫猫头','0.99','牛牛下单专用','已下架'],['353870904037486592','仙贝小饼干','0.01','肉禽蛋品','已上架'],
        ['353829402452168704','731','2.00','肉禽蛋品','已上架']
    ];
    function renderPicker() {
        var cat=state.picker==='category', list=(cat?categories:products).filter(function(x){return !state.pickerQuery||x[0].includes(state.pickerQuery)||x[1].includes(state.pickerQuery);});
        var rows=list.map(function(x){return '<tr><td><input type="checkbox" data-select-picker="'+h(x[0])+'"'+(state.pickerSelected.includes(x[0])?' checked':'')+' aria-label="选择 '+h(x[1])+'"></td><td>'+h(x[0])+'</td><td>'+h(x[1])+'</td>'+(cat?'<td>0</td><td>'+h(x[2])+'</td>':'<td>'+cash(x[2])+'</td><td>'+h(x[3])+'</td><td>0</td><td>'+h(x[4])+'</td><td>—</td>')+'</tr>';});
        var body='<div class="settle-filter"><label class="settle-field"><span>'+(cat?'商品分类ID / 名称':'搜索')+'</span><input class="settle-input" id="picker-query" value="'+h(state.pickerQuery)+'" placeholder="'+(cat?'请输入商品分类ID / 名称':'请输入商品ID / 名称')+'"></label>'+button('查询','picker-search','','primary')+'</div>'+note(cat?'已经参与分佣策略的商品，不支持重复参与；零售价少于1元的商品，不参与分佣':'已经参与分佣策略的商品，不支持重复参与')+
            table(cat?['选择','分类编码','分类名称','排序','商品数']:['选择','商品ID','商品名称','购买价','商品分类','库存数','状态','关联活动'],rows,'共 '+(cat?'15':'155')+' 条');
        openModal(cat?'选择商品分类':'选择商品',body,true,button('取消','picker-cancel')+button('确定','picker-confirm','','primary'));
    }
    function openPicker(type) {captureRuleDraft();state.picker=type;state.pickerQuery='';state.pickerSelected=[];renderPicker();}
    function openBinding(id) {
        var row=policies.find(function(x){return x.id===id;})||policies[0];state.bindingPolicy=id;state.bindingMode=row.stores==='全部门店'?'全部门店':'指定门店';state.bindingSelected=row.name==='乐事'?['南京万达店']:[];
        renderBinding();
    }
    function renderBinding() {
        var row=policies.find(function(x){return x.id===state.bindingPolicy;})||policies[0];
        var body='<div class="settle-card-body">'+policyField('参与门店 *',policyRadio('bindingMode',state.bindingMode,['全部门店','指定门店']))+
            note('分佣门店同时存在于不同类型配置时，规则优先级：指定门店 > 全部门店')+
            (state.bindingMode==='指定门店'?'<div class="settle-filter"><label class="settle-field"><span>门店名称 / ID</span><input class="settle-input" id="binding-query" placeholder="请输入门店名称 / ID"></label>'+button('搜索','binding-search','','primary')+'</div>'+
            table(['选择所有行','门店ID','门店名称','手机号码'],[],'已选 '+(row.name==='乐事'?state.bindingSelected.length:row.stores)+' 个门店')+
            (state.bindingSelected.length?'<div class="settle-selected-tags">'+state.bindingSelected.map(function(x){return '<span>'+h(x)+'</span>';}).join('')+'</div>':''):'')+'</div>';
        overlay.innerHTML='<div class="settle-overlay" data-overlay="1"><div class="settle-drawer settle-binding-drawer" role="dialog" aria-modal="true"><div class="settle-dialog-head"><strong>绑定门店 - '+h(row.name)+'</strong>'+button('✕','close')+'</div><div class="settle-dialog-body">'+body+'</div><div class="settle-dialog-foot">'+button('取消','close')+button('保存','save-binding','','primary')+'</div></div></div>';
    }
    function detailTitle() {
        if(state.view==='supplier') return '供应商结算单详情';
        if(state.view==='carrier') return '承运商结算单详情';
        if(state.view==='commission') return '佣金清算单详情';
        if(state.view==='compensation') return '补偿结款单详情';
        return '策略详情';
    }
    function renderDetail() {
        var id=state.detail;
        var back='<div class="settle-back">' + button('← 返回列表','back','','') + '</div>';
        if (state.view==='supplier') {
            var x=supplierPending.concat(supplierStatements).find(function(r){return r.id===id;});
            if(!x){return back+note('未找到供应商结算单：'+h(id));}
            var known=id==='ST_353846837167284224', first=id==='ST_358643443066482688';
            if(!state.tab || !['current','payments'].includes(state.tab)) state.tab='current';
            var money=function(v){return v==='—'?'—':cash(v);};
            var payeeAcc=first?{name:'—',no:'—'}:huifuAccount(x.supplier);
            var fields=[['结款单号',h(x.id)],['供应商名称',h(x.supplier)],['供应商编码',known?'330158197295816704':first?'319838916817453056':'—'],['单据类型','供应商销售结算单'],
                ['供应商应收金额',money(x.goods)],['实收金额',money(x.goods)],['待结款金额',known?'¥0.04':first?'¥0.02':'—'],['单据来源','销售订单'],
                ['结款状态',tag(first?'待生成':x.status)],['付款方','平台'],['付款账户名称',h(PLATFORM_PAYER_NAME)],['付款账户',h(PLATFORM_PAYER_NO)],
                ['收款方',h(x.supplier)],['收款账户名称',h(payeeAcc.name)],['收款账户',h(payeeAcc.no)],
                ['收款时间',known?'2026-09-06 15:07':'—'],['订单数',h(x.orders)],['结算周期',h(x.cycle)],['审核时间',known?'2026-09-03 18:21':first?'2026-09-17 00:01':'—'],['审核人',known||first?'系统':'—'],
                ['创建时间',h(x.created)],['应付供应商净额',money(x.net)],['异常原因',first?'未配置供应商结算账户或结算主体':'—']];
            var basic='<div class="settle-description">'+fields.map(function(f){return '<div class="settle-description-item"><span>'+h(f[0])+'</span><strong>'+f[1]+'</strong></div>';}).join('')+'</div>';
            var sLines=x.lineFlows&&x.lineFlows.length?x.lineFlows:buildLineFlows(x.id,x.status,x.created,x.orders,x.net);
            var currentRows=known?[
                '<tr><td>ORD-2609033597216-1</td><td>火龙果</td><td class="money">1</td><td class="money">¥0.03</td><td class="money">¥0.00</td><td class="money">¥0.00</td><td class="money">¥0.03</td><td>'+h((sLines[0]&&sLines[0].flowNo)||'—')+'</td></tr>',
                '<tr><td>ORD-2609033597216-1</td><td>白芭乐-快递-ss</td><td class="money">1</td><td class="money">¥0.01</td><td class="money">¥0.00</td><td class="money">¥0.00</td><td class="money">¥0.01</td><td>'+h((sLines[1]&&sLines[1].flowNo)||'—')+'</td></tr>'
            ]:first?[
                '<tr><td>ORD-2609104841852-3</td><td>低糖养乐多</td><td class="money">1</td><td class="money">¥0.02</td><td class="money">¥0.01</td><td class="money">¥0.00</td><td class="money">¥0.01</td><td>—</td></tr>',
                '<tr><td>ORD-2609112085695</td><td>马群-莲藕-快递配送</td><td class="money">1</td><td class="money">¥0.02</td><td class="money">¥0.01</td><td class="money">¥0.00</td><td class="money">¥0.01</td><td>—</td></tr>'
            ]:[];
            var current='<div class="settle-table-wrap"><table class="settle-table settle-grouped"><thead><tr><th rowspan="2">销售订单号</th><th rowspan="2">商品</th><th rowspan="2">数量</th><th colspan="1">应收（供应商收）</th><th colspan="2">应付（供应商付）</th><th rowspan="2">净额</th><th rowspan="2">通道流水号</th></tr><tr><th>货款(销售额)</th><th>平台服务费</th><th>分销佣金</th></tr></thead><tbody>'+(currentRows.length?currentRows.join(''):'<tr><td colspan="8" class="settle-empty">当前快照未收录该单明细</td></tr>')+'</tbody></table></div>'+
                (known||first?'<div class="settle-totals"><b>累计（共 2 单）</b><span>货款合计 <b>¥0.04</b></span><span>减·平台服务费 <b>¥'+(first?'0.02':'0.00')+'</b></span><span>减·分销佣金 <b>¥0.00</b></span><span>应付供应商净额 <b>¥'+(first?'0.02':'0.04')+'</b></span></div>':'');
            var payoutHead=['序号','销售主订单号','销售子订单号','商品编码','商品名称','规格/单位','数量','结算金额','供应商应收金额','实收金额','分配金额·平台服务费','分配金额·分销佣金','实分金额·平台服务费','实分金额·分销佣金','供应商预计净收','供应商留存','结算状态','入账状态','创建时间','结算时间','入账时间','通道流水号','异常'];
            var payoutRows=known?[
                ['1','ORD-2609033597216','ORD-2609033597216-1','SPU00196','火龙果','口味: 白心 / 袋','1','0.03','0.03','0.03','0.00','0.00','0.00','0.00','0.03','0.03','部分结款','—','2026-09-03 18:21','—','—',(sLines[0]&&sLines[0].flowNo)||'—','—'],
                ['2','ORD-2609033597216','ORD-2609033597216-1','SPU00184','白芭乐-快递-ss','重量: 100g / L','1','0.01','0.01','0.01','0.00','0.00','0.00','0.00','0.01','0.01','部分结款','—','2026-09-03 18:21','—','—',(sLines[1]&&sLines[1].flowNo)||'—','—']
            ]:first?[
                ['1','ORD-2609104841852-3','353852301770752223','SPU00204','低糖养乐多','口味: 低糖芒果味养乐多 / 箱','1','0.02','0.02','0.02','0.01','0.00','0.01','0.00','0.01','0.01','—','—','2026-09-17 00:01','—','—','—','查看异常'],
                ['2','ORD-2609112085695','353852301770752375','SPU00142','马群-莲藕-快递配送','口味: 粉糯莲藕 / 包','1','0.02','0.02','0.02','0.01','0.00','0.01','0.00','0.01','0.01','—','—','2026-09-17 00:01','—','—','—','查看异常']
            ]:[];
            var payoutFirst=payoutHead.slice(0,10).map(function(v){return '<th rowspan="2">'+h(v)+'</th>';}).join('')+'<th colspan="2">分配金额</th><th colspan="2">实分金额</th>'+payoutHead.slice(14).map(function(v){return '<th rowspan="2">'+h(v)+'</th>';}).join('');
            var payoutSecond='<th>平台服务费</th><th>分销佣金</th><th>平台服务费</th><th>分销佣金</th>';
            var payoutBody=payoutRows.map(function(r){return '<tr>'+r.map(function(v,i){return '<td'+([7,8,9,10,11,12,13,14,15].includes(i)?' class="money"':'')+'>'+(i===22&&v==='查看异常'?button('查看异常','supplier-exception',id):[7,8,9,10,11,12,13,14,15].includes(i)?cash(v):h(v))+'</td>';}).join('')+'</tr>';}).join('');
            var summaryValues=first?['0.04','0.04','0.04','0.02','0.00','0.02','0.00','0.02','0.02']:['0.04','0.04','0.04','0.00','0.00','0.00','0.00','0.04','0.04'];
            var payout='<div class="settle-table-wrap"><table class="settle-table settle-grouped"><thead><tr>'+payoutFirst+'</tr><tr>'+payoutSecond+'</tr></thead><tbody>'+
                (payoutBody||'<tr><td colspan="23" class="settle-empty">暂无数据</td></tr>')+
                (payoutRows.length?'<tr class="settle-summary-row"><td>累计</td>'+Array(6).fill('<td></td>').join('')+summaryValues.map(function(v){return '<td class="money">'+cash(v)+'</td>';}).join('')+Array(7).fill('<td></td>').join('')+'</tr>':'')+'</tbody></table></div>';
            var voucherRows=known?[
                ['1','收款','平台',PLATFORM_PAYER_NAME,'斯斯供应商商家','小牛供应链有限公司','ORD-2609033597216-1','0.01','待修复','订单关键数据缺失（SKU、门店归属、采购价等），无法计算分佣','—','2026-09-04 02:30'],
                ['2','收款','平台',PLATFORM_PAYER_NAME,'斯斯供应商商家','小牛供应链有限公司','ORD-2609033597216-1','0.02','已到账','—',(sLines[0]&&sLines[0].flowNo)||'—','2026-09-04 02:30'],
                ['3','收款','平台',PLATFORM_PAYER_NAME,'斯斯供应商商家','小牛供应链有限公司','ORD-2609033597216-1','0.01','待修复','订单关键数据缺失（SKU、门店归属、采购价等），无法计算分佣','—','2026-09-04 02:30']
            ]:(sLines.length?sLines.map(function(ln,i){
                return [String(i+1),'付款','平台',PLATFORM_PAYER_NAME,x.supplier,payeeAcc.name,ln.orderNo,ln.amount,x.status==='结款失败'?'结款失败':'已到账',x.status==='结款失败'?'收款账户校验失败':'—',ln.flowNo,ln.time||x.created];
            }):[]);
            var voucher=table(['序号','方向','付款方','付款账户名称','收款方','收款账户名称','关联订单','金额','状态','异常原因','通道流水号','时间'],voucherRows.map(function(r){return '<tr>'+r.map(function(v,i){return '<td>'+(i===7?cash(v):i===8?tag(v):h(v))+'</td>';}).join('')+'</tr>';}));
            return back+'<div class="settle-detail-header"><h2>供应商结算单详情</h2>'+tabs([['current','当前版'],['payments','付款清单']])+'</div>'+card('基础信息',basic)+
                card(state.tab==='current'?'订单明细':'明细列表',state.tab==='current'?current:payout)+card('收付款记录',voucher);
        }
        if (state.view==='carrier') {
            var cf=carrierPending.concat(carrierStatements).find(function(r){return r.id===id;});
            if(!cf){return back+note('未找到承运商结算单：'+h(id));}
            var prefix=cf.carrierId||'SF';
            var mode='快递';
            var bad=!!cf.blocked||cf.status==='结款失败';
            var cLines=cf.lineFlows&&cf.lineFlows.length?cf.lineFlows:buildLineFlows(cf.id,cf.status,cf.posted||cf.created,cf.orders,cf.freight);
            var lines=cLines.length?cLines.map(function(ln,i){
                return '<tr><td>'+h(ln.orderNo)+'</td><td>'+h(prefix+'1099288'+String(1000+i))+'</td><td>'+h(mode)+'</td><td>'+h(cf.carrier)+'</td><td class="money">'+cash(ln.amount)+'</td><td>'+tag(bad?'异常':(hasChannelTransfer(cf.status)?'已出账':cf.status))+'</td><td>'+h(ln.flowNo||'—')+'</td><td>'+h(cf.reason||'—')+'</td></tr>';
            }):['<tr><td>ORD-2609241001</td><td>'+prefix+'10992881001</td><td>'+h(mode)+'</td><td>'+h(cf.carrier)+'</td><td class="money">'+cash(cf.freight)+'</td><td>'+tag(bad?'异常':'已出账')+'</td><td>—</td><td>'+h(cf.reason||'—')+'</td></tr>'];
            var payRows=cLines.length
                ? cLines.map(function(ln,i){
                    return '<tr><td>'+(i+1)+'</td><td>付款</td><td>平台</td><td>'+h(PLATFORM_PAYER_NAME)+'</td><td>'+h(cf.carrier)+'</td><td>'+h(cf.accountName||'—')+'</td><td>'+h(ln.orderNo)+'</td><td class="money">'+cash(ln.amount)+'</td><td>'+tag(cf.status==='结款失败'?'结款失败':'已到账')+'</td><td>'+h(cf.status==='结款失败'?(cf.reason||'收款账户校验失败'):'运费结算')+'</td><td>'+h(ln.flowNo)+'</td><td>'+h(ln.time||cf.posted||cf.created)+'</td></tr>';
                })
                : ['<tr><td>1</td><td>付款</td><td>平台</td><td>'+h(PLATFORM_PAYER_NAME)+'</td><td>'+h(cf.carrier)+'</td><td>'+h(cf.accountName||'—')+'</td><td>—</td><td class="money">'+cash(cf.freight)+'</td><td>'+tag(cf.blocked?'异常':cf.status)+'</td><td>'+h(cf.reason||'尚未向汇付发起付款')+'</td><td>—</td><td>—</td></tr>'];
            return back+'<div class="settle-detail-header"><h2>承运商结算单详情</h2></div>'+
                card('基础信息',description([['结算单号',h(cf.id)],['承运商',h(cf.carrier)],['承运商编码',h(cf.carrierId)],['单据类型','承运商运费结算单'],
                    ['应付运费',cash(cf.freight)],['运单数',h(cf.orders)],['结算状态',tag(cf.blocked?'异常':cf.status)],['结算周期',h(cf.cycle)],
                    ['付款方','平台'],['付款账户名称',h(PLATFORM_PAYER_NAME)],['付款账户',h(PLATFORM_PAYER_NO)],['收款方',h(cf.carrier)],
                    ['收款账户名称',h(cf.accountName||'—')],['收款账户',h(cf.account||'—')],['收款时间',h(cf.status==='已结款'?(cf.received||cf.posted||'—'):'—')],['收款账户类型','承运商基本账户'],
                    ['资金流',h(cf.flow||'平台结算账户 → 承运商基本账户')],['异常原因',h(cf.reason||'—')],['创建时间',h(cf.created)],['入账时间',h(cf.posted||'—')]]))+
                card('运费明细',table(['销售订单号','运单号','履约方式','承运商','运费','出账状态','通道流水号','异常'],lines))+
                card('收付款记录',table(['序号','方向','付款方','付款账户名称','收款方','收款账户名称','关联订单','金额','状态','说明','通道流水号','时间'],payRows));
        }
        if (state.view==='commission') {
            var c=commissions.find(function(r){return r.id===id;});
            if(!c){return back+note('未找到佣金清算单：'+h(id));}
            var firstClearing=c.id==='ST_358643444144418816';
            var payerAcc=huifuAccount(c.supplier);
            var payeeAcc=huifuAccount(c.payee);
            var cLineFlows=c.lineFlows&&c.lineFlows.length?c.lineFlows:buildLineFlows(c.id,c.status,c.time||c.created,c.orders,c.amount);
            var lines=firstClearing?[
                '<tr><td>2</td><td>ORD-2609104841852-3</td><td>低糖养乐多</td><td class="money">¥0.01</td><td>—</td></tr>',
                '<tr><td>1</td><td>ORD-2609112085695</td><td>马群-莲藕-快递配送</td><td class="money">¥0.01</td><td>—</td></tr>'
            ]:cLineFlows.map(function(ln,i){
                return '<tr><td>'+(cLineFlows.length-i)+'</td><td>'+h(ln.orderNo)+'</td><td>—</td><td class="money">'+cash(ln.amount)+'</td><td>'+h(ln.flowNo||'—')+'</td></tr>';
            });
            var payRec=cLineFlows.map(function(ln,i){
                return '<tr><td>'+(i+1)+'</td><td>付款</td><td>'+h(c.supplier)+'</td><td>'+h(ln.orderNo)+'</td><td class="money">'+cash(ln.amount)+'</td><td>'+tag(c.status==='结款失败'?'结款失败':'已到账')+'</td><td>'+h(c.status==='结款失败'?'收款账户异常':'—')+'</td><td>'+h(ln.flowNo)+'</td><td>'+h(ln.time||c.time||c.created)+'</td></tr>';
            });
            return back+'<div class="settle-detail-header"><h2>佣金结算单详情</h2></div>'+
                card('基础信息',description([['结款单号',h(c.id)],['收款方名称',h(firstClearing?'平台':c.payee)],['收款方类型',h(c.type)],['结算状态',tag(c.status)],
                    ['付款账户名称',h(payerAcc.name)],['付款账户',h(payerAcc.no)],['收款账户名称',h(payeeAcc.name)],['收款账户',h(payeeAcc.no)],
                    ['应收佣金合计',cash(c.amount)],['资金来源供应商',h(c.supplier)],
                    ['关联供应商结款单',linkDoc(c.related,'supplier',c.related)],['创建时间',h(firstClearing?'2026-09-17T00:01:00':c.created)]]))+
                card('应收佣金明细',table(['序号','销售订单号','商品','应收佣金','通道流水号'],lines,firstClearing?'累计（共 2 单） · 应收佣金合计 ¥0.02':''))+
                card('收付款记录',table(['序号','方向','付款方','关联订单','金额','状态','异常原因','通道流水号','时间'],payRec));
        }
        if (state.view==='compensation') {
            var p=compensations.find(function(r){return r.id===id;});
            if(!p){return back+note('未找到补偿结款单：'+h(id));}
            var firstComp=p.id==='CST_2076953749068009474',actual=p.status==='已结款'?cash(p.amount):'¥0.00';
            var compPayee=huifuAccount(p.payee, p.payeeAccount);
            var pLines=p.lineFlows&&p.lineFlows.length?p.lineFlows:buildLineFlows(p.id,p.status,p.time||p.created,1,p.amount);
            var pFlow=(pLines[0]&&pLines[0].flowNo)||'—';
            var pOrder=(pLines[0]&&pLines[0].orderNo)||(firstComp?'333160760836358280':'—');
            var payNo=p.id==='CST_374147882901274624'?'CI_374147810523611136':(firstComp?'CI_2076953749177061377':(p.status==='已结款'?'CI_'+String(p.id).replace(/\D/g,'').slice(-18):'—'));
            /* 资金流水：线上现有板块（非走查增项）；汇付流水号→通道流水号，汇付备注→通道备注 */
            var fundFailReason='结算账户异常：收款账户不存在、被冻结、禁用，无法结算';
            var fundOrderNo=p.id==='CST_374147882901274624'?'ORD-2610282411003':(pOrder!=='—'?pOrder:'ORD-'+String(p.id).replace(/\D/g,'').slice(-13));
            var fundLineId=p.id==='CST_374147882901274624'?'1247':((p.related&&String(p.related).split('_').pop())||'1247');
            var fundCiBase=p.id==='CST_374147882901274624'?'CI_374146521806929920':payNo;
            var fundPayeeLabel=p.payeeType||p.payee||'收款方';
            var fundRowsDemo=p.status==='待结款'?[]:[
                {time:'2026-10-29 18:49:07',action:'作废',path:'供应商 → '+fundPayeeLabel,orderNo:fundOrderNo,lineId:fundLineId,amount:p.amount,ciNo:fundCiBase,status:'已作废',flowNo:'—',remark:'—',reason:fundFailReason},
                {time:'2026-10-29 18:49:28',action:'收回平台',path:'供应商 → 平台',orderNo:fundOrderNo,lineId:fundLineId,amount:p.amount,ciNo:fundCiBase,status:'成功',flowNo:channelFlowNo(p.id+'-r', '已结款', p.time||p.created),remark:fundOrderNo+'-'+fundLineId,reason:'—'},
                {time:p.time||p.created||'2026-10-29 19:42:18',action:'补偿付款',path:(p.payer||'平台')+' → '+fundPayeeLabel,orderNo:fundOrderNo,lineId:fundLineId,amount:p.amount,ciNo:payNo,status:'成功',flowNo:pFlow!=='—'?pFlow:channelFlowNo(p.id+'-p','已结款',p.time||p.created),remark:fundOrderNo+'-'+fundLineId,reason:'—'}
            ];
            var fundHead=['时间','资金动作','付款方 → 收款方','订单号','订单行ID','金额','收付款单号','状态','通道流水号','通道备注','失败原因 / 作废原因'];
            var fundTr=fundRowsDemo.map(function(r){
                return '<tr><td>'+h(r.time)+'</td><td>'+tag(r.action)+'</td><td>'+h(r.path)+'</td><td>'+h(r.orderNo)+'</td><td>'+h(r.lineId)+'</td><td class="money">'+cash(r.amount)+'</td><td>'+h(r.ciNo)+'</td><td>'+tag(r.status)+'</td><td title="'+h(r.flowNo)+'">'+h(r.flowNo)+'</td><td title="'+h(r.remark)+'">'+h(r.remark)+'</td><td title="'+h(r.reason)+'">'+h(r.reason)+'</td></tr>';
            });
            return back+'<div class="settle-detail-header"><h2>补偿结款单详情</h2></div>'+
                card('基本信息',description([['结款单号',h(p.id)],['关联异常订单号',linkDoc(p.related,'exception',p.related)],['子订单号',h(pOrder)],['补偿原因',h(p.type)],
                    ['应补偿金额',cash(p.amount)],['实补金额',actual],['补偿状态',tag(p.status)],['创建人',firstComp?'1':'—'],
                    ['收款方名称',h(p.payee)],['收款方类型',h(p.payeeType)],['收款账户名称',h(compPayee.name)],['收款账户',h(compPayee.no)],
                    ['创建时间',h(p.created)]]))+
                /* 创建时可用余额：线上系统字段（非走查修补项），付款账户信息区展示 */
                card('付款账户信息',description([['付款方名称',h(p.payer)],['付款账户名称',h(PLATFORM_PAYER_NAME)],['付款账户',h(p.payerAccount)],['帐户类型','异常佣金清算账户'],['创建时可用余额',p.availableBalance||'¥12,860.35']]))+
                /* 付款信息：线上字段口径——无「关联订单」；流水字段名用「付款流水号」（非走查修补项） */
                card('付款信息',description([['付款单号',h(payNo)],['付款流水号',h(pFlow)],['应付金额',cash(p.amount)],['实付金额',actual],
                    ['状态',tag(p.status)],['创建时间',h(p.created)],['入账时间',h(p.time)],['备注',p.status==='已结款'?'—':'单笔订单划拨，流水随订单明细']]))+
                card('资金流水',table(fundHead,fundTr));
        }
        var policy=policies.find(function(r){return r.id===id;});
        if(!policy){return back+note('未找到策略：'+h(id));}
        return back + card('基本信息','<div class="settle-card-body">'+kv([['策略名称',h(policy.name)],['策略状态',tag(policy.status)],['订单业务类型',h(policy.kind)],['订单渠道',h(policy.channel)],['策略类型','按商品分佣'],['分佣基数',h(policy.basis)],['结算节点',h(policy.trigger)],['绑定门店',h(policy.stores)],['创建时间',h(policy.time)]])+'</div>',button('操作日志','policy-log',policy.id)) +
            card('扣减规则','<div class="settle-card-body">'+kv([['承运商运费','不参与分佣，平台结算到承运商基本账户'],['仓储费','不参与分佣'],['供应商采购款','优先结算给供应商']])+'</div>') +
            card('策略配置',table(['规则名称','计算方式','结算规则','参与商品','操作'],['<tr><td>'+h(policy.name)+'</td><td>按毛利率阶梯</td><td class="wrap">'+h(policy.rule)+'</td><td>部分商品（1）</td><td>'+button('查看','rule',policy.id)+'</td></tr>']));
    }
    function navigate(detail) {
        state.detail=detail || ''; state.query=''; state.status=''; state.tab='';state.policyMode='';
        var q=new URLSearchParams({view:state.view});
        if(state.detail) q.set('detail',state.detail);
        history.pushState(null,'',location.pathname+'?'+q.toString());
        render();
    }
    function render() {
        if(state.view==='policy' && state.policyMode && !state.policyDraft){var p=policies.find(function(x){return x.id===state.policyEditing;});state.policyDraft={name:p?p.name:'',enabled:p?p.status==='已启用':true,description:'',orderType:p?p.kind:'零售订单',channel:p?p.channel:'直播',rules:p?[{name:p.name,method:'按实付金额分佣',summary:p.rule,dimension:'全部商品',tiers:[emptyTier()]}]:[]};}
        document.getElementById('settle-title').textContent='结算 / '+names[state.view]+(state.policyMode?' / '+(state.policyMode==='create'?'创建策略':state.policyMode==='edit'?'修改策略':'策略详情'):(state.detail?' / '+detailTitle():''));
        document.title='冷丰结算 - '+names[state.view];
        app.innerHTML=state.view==='policy'&&state.policyMode?renderPolicyForm():state.detail?renderDetail():({summary:renderSummary,policy:renderPolicy,ledger:renderLedger,supplier:renderSupplier,carrier:renderCarrier,commission:renderCommission,compensation:renderCompensation}[state.view])();
    }
    function openModal(title,body,wide,footer) {
        overlay.innerHTML='<div class="settle-overlay" data-overlay="1"><div class="settle-dialog'+(wide?' wide':'')+'" role="dialog" aria-modal="true"><div class="settle-dialog-head"><strong>'+h(title)+'</strong>'+button('✕','close')+'</div><div class="settle-dialog-body">'+body+'</div><div class="settle-dialog-foot">'+(footer||button('关闭','close','',''))+'</div></div></div>';
    }
    function openLogs(kind,id) {
        state.logKind=kind; state.logFilter=''; state.logResult='';state.policyLogId=id||'';
        var rows=kind==='general'?generalLogs:id==='POLICY_354560079879471104'?policyLogs:[];
        var title=kind==='general'?'结算通用配置 · 操作日志':'操作日志 · '+((policies.find(function(x){return x.id===id;})||policies[0]).name);
        overlay.innerHTML='<div class="settle-overlay" data-overlay="1"><div class="settle-drawer" role="dialog" aria-modal="true"><div class="settle-dialog-head"><strong>'+h(title)+'</strong>'+button('✕','close')+'</div><div class="settle-dialog-body"><div class="settle-filter" style="margin-bottom:16px"><label class="settle-field"><span>操作内容</span><input class="settle-input" id="log-query" placeholder="请输入操作内容"></label><label class="settle-field"><span>操作结果</span><select class="settle-select" id="log-result"><option value="">全部</option><option>成功</option><option>失败</option></select></label>'+button('查询','log-search','','primary')+button('重置','log-reset','','')+'</div><div id="log-table">'+logTable(rows,kind)+'</div></div></div></div>';
    }
    function logTable(rows,kind) {
        var q=(state.logFilter||'').toLowerCase(), result=state.logResult||'';
        var matched=rows.map(function(x,i){return {row:x,index:i};}).filter(function(o){return (!q||o.row.content.toLowerCase().includes(q))&&(!result||o.row.result===result);});
        var tr=matched.map(function(o){var x=o.row;return '<tr><td>'+h(x.time)+'</td><td>'+h(x.content)+'</td><td>'+h(x.operator)+'</td><td>'+h(kind==='general'?x.business:'—')+'</td><td>'+tag(x.result)+'</td><td>'+button('详情','log-detail',kind+':'+o.index)+'</td></tr>';});
        return table(['操作时间','操作内容','操作人',kind==='general'?'业务单号':'操作方式','结果','操作'],tr,'展示 '+matched.length+' 条样例'+(kind==='general'?' · 实际共 43 条':''));
    }
    function detailLog(id) {
        var parts=id.split(':'), kind=parts[0], row=(kind==='general'?generalLogs:policyLogs)[Number(parts[1])];
        if(!row)return;
        var parent=overlay.innerHTML;
        var technical = kind==='general'
            ? [['操作方式','保存'],['Trace ID','—'],['请求参数','—']]
            : [['操作方式','—'],['Trace ID','—'],['资源对象',h(row.business)],['客户端 IP','—'],['服务','—'],['耗时','—'],['请求参数','—']];
        openModal('操作日志详情','<div class="settle-card-body">'+kv([['操作内容',h(row.content)],['操作时间',h(row.time)],['操作人',h(row.operator)],['业务对象',h(row.business)],['操作结果',tag(row.result)]])+'</div><div class="settle-rule"><div><strong>变更详情</strong><small>'+h(row.change)+'</small></div></div><details class="settle-tech"><summary>技术信息</summary>'+kv(technical)+'</details>',false,button('返回日志','restore-log'));
        overlay.dataset.previous=parent;
    }
    function exportSummary() {
        var rows=state.tab==='month'?summaryMonth:summaryDay;
        var data=[['统计日期/月份','收款方类型','收款方名称','收款方ID','应收金额（元）','已结款金额（元）','待处理金额（元）','异常金额（元）','单据数','明细数']].concat(rows.map(function(x){return [x.period,x.type,x.payee,x.id,x.total,x.settled,x.pending,x.blocked,x.statements,x.lines];}));
        var csv='\uFEFF'+data.map(function(row){return row.join(',');}).join('\r\n');
        var a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='分佣汇总-'+(state.tab==='month'?'MONTHLY':'DAILY')+'-'+new Date().toISOString().slice(0,10)+'.csv';a.click();setTimeout(function(){URL.revokeObjectURL(a.href);},1000);
    }
    function readGeneralConfig() {
        app.querySelectorAll('[data-config]').forEach(function (el) {
            if (el.type === 'radio' && !el.checked) return;
            if (el.disabled) return;
            config[el.dataset.config] = el.value;
        });
    }
    app.addEventListener('click',function(e){
        var inMulti = e.target.closest('.settle-multi');
        var b=e.target.closest('[data-act]');
        if (state.multiOpen && !inMulti) {
            state.multiOpen = '';
            var openWrap = app.querySelector('.settle-multi.is-open');
            if (openWrap) {
                openWrap.classList.remove('is-open');
                var openBox = openWrap.querySelector('.settle-multi__box');
                if (openBox) openBox.setAttribute('aria-expanded', 'false');
            }
            var openPanel = app.querySelector('.settle-multi__panel');
            if (openPanel) openPanel.remove();
        }
        if(!b) return;
        var act=b.dataset.act,id=b.dataset.id||'';
        if(act==='toggle-multi'||act==='multi-pick'||act==='multi-remove'||act==='multi-clear'){
            if(!config.exclude) return;
            if(act==='toggle-multi') state.multiOpen = state.multiOpen === id ? '' : id;
            else {
                var picked=(config.excludeTypes||[]).slice();
                if(act==='multi-clear') picked=[];
                else if(picked.indexOf(id)>=0) picked=picked.filter(function(name){return name!==id;});
                else picked.push(id);
                config.excludeTypes=ORDER_TYPES.filter(function(name){return picked.indexOf(name)>=0;});
            }
            render();
            return;
        }
        if(act==='tab'){state.tab=id;state.query='';state.status='';state.supplierSelection=[];state.supplierPage=1;state.carrierSelection=[];state.carrierPage=1;state.policyMenu='';if(state.view==='ledger'){state.ledgerPage=1;state.exceptionPage=1;state.exceptionPayee='';state.exceptionStatus='';}render();return;}
        if(act==='goto-doc'){
            var target=resolveDocTarget(id);
            if(!target){openModal('关联单据',note('未找到关联单据：'+h(id)));return;}
            state.view=target.view;
            state.tab=target.tab||(target.view==='supplier'?'statement':'');
            /* 异常单走台账 Tab 列表筛选，不进结算详情页 */
            if(target.view==='ledger' && target.tab==='exception'){
                state.detail='';
                state.query=target.detail||'';
                state.exceptionPage=1;
            }else{
                state.detail=target.detail||'';
                state.query='';
            }
            var q=new URLSearchParams({view:state.view});
            if(state.tab) q.set('tab',state.tab);
            if(state.detail) q.set('detail',state.detail);
            history.pushState(null,'',location.pathname+'?'+q.toString());
            render();
            return;
        }
        if(act==='search'){
            state.query=(document.getElementById('settle-query')||{}).value||'';
            state.status=(document.getElementById('settle-status')||{}).value||'';
            if(state.view==='supplier'){
                state.supplierDateFrom=(document.getElementById('supplier-date-from')||{}).value||'';
                state.supplierDateTo=(document.getElementById('supplier-date-to')||{}).value||'';
                state.supplierName=(document.getElementById('supplier-name')||{}).value||'';
                state.supplierAccountName=(document.getElementById('supplier-account-name')||{}).value||'';
                state.supplierAccountNo=(document.getElementById('supplier-account-no')||{}).value||'';
                state.supplierFlowNo=(document.getElementById('supplier-flow-no')||{}).value||'';
                state.supplierPage=1;
            }
            if(state.view==='carrier'){
                state.carrierDateFrom=(document.getElementById('carrier-date-from')||{}).value||'';
                state.carrierDateTo=(document.getElementById('carrier-date-to')||{}).value||'';
                state.carrierName=(document.getElementById('carrier-name')||{}).value||'';
                state.carrierAccountName=(document.getElementById('carrier-account-name')||{}).value||'';
                state.carrierAccountNo=(document.getElementById('carrier-account-no')||{}).value||'';
                state.carrierFlowNo=(document.getElementById('carrier-flow-no')||{}).value||'';
                state.carrierPage=1;
            }
            if(state.view==='policy'){state.policyType=(document.getElementById('policy-type')||{}).value||'';state.policyStore=(document.getElementById('policy-store')||{}).value||'';}
            if(state.view==='summary'){state.summaryType=(document.getElementById('summary-type')||{}).value||'';state.summaryFrom=(document.getElementById('summary-from')||{}).value||'';state.summaryTo=(document.getElementById('summary-to')||{}).value||'';}
            if(state.view==='commission'){
                state.commissionType=(document.getElementById('commission-type')||{}).value||'';
                state.commissionRelated=(document.getElementById('commission-related')||{}).value||'';
                state.commissionPayee=(document.getElementById('commission-payee')||{}).value||'';
                state.commissionAccountName=(document.getElementById('commission-account-name')||{}).value||'';
                state.commissionAccountNo=(document.getElementById('commission-account-no')||{}).value||'';
                state.commissionFlowNo=(document.getElementById('commission-flow-no')||{}).value||'';
            }
            if(state.view==='compensation'){
                state.compensationRelated=(document.getElementById('compensation-related')||{}).value||'';
                state.compensationPayee=(document.getElementById('compensation-payee')||{}).value||'';
                state.compensationType=(document.getElementById('compensation-type')||{}).value||'';
                state.compensationAccountName=(document.getElementById('compensation-account-name')||{}).value||'';
                state.compensationAccountNo=(document.getElementById('compensation-account-no')||{}).value||'';
                state.compensationFlowNo=(document.getElementById('compensation-flow-no')||{}).value||'';
            }
            if(state.view==='ledger'&&state.tab==='exception'){
                state.exceptionPayee=(document.getElementById('exception-payee')||{}).value||'';
                state.exceptionStatus=(document.getElementById('exception-status')||{}).value||'';
                state.exceptionAccountName=(document.getElementById('exception-account-name')||{}).value||'';
                state.exceptionAccountNo=(document.getElementById('exception-account-no')||{}).value||'';
                state.exceptionFlowNo=(document.getElementById('exception-flow-no')||{}).value||'';
                state.exceptionPage=1;
            }else if(state.view==='ledger'){readLedgerFilters();}
            render();
            return;
        }
        if(act==='reset'){
            state.query='';state.status='';
            state.supplierPage=1;state.supplierDateFrom='';state.supplierDateTo='';state.supplierName='';state.supplierAccountName='';state.supplierAccountNo='';state.supplierFlowNo='';
            state.carrierPage=1;state.carrierDateFrom='';state.carrierDateTo='';state.carrierName='';state.carrierAccountName='';state.carrierAccountNo='';state.carrierFlowNo='';
            state.policyType='';state.policyStore='';state.summaryType='';state.summaryFrom='';state.summaryTo='';
            state.commissionType='';state.commissionRelated='';state.commissionPayee='';state.commissionAccountName='';state.commissionAccountNo='';state.commissionFlowNo='';
            state.compensationRelated='';state.compensationPayee='';state.compensationType='';state.compensationAccountName='';state.compensationAccountNo='';state.compensationFlowNo='';
            state.exceptionPayee='';state.exceptionStatus='';state.exceptionAccountName='';state.exceptionAccountNo='';state.exceptionFlowNo='';state.exceptionPage=1;
            if(state.view==='ledger'&&state.tab!=='exception')resetLedgerFilters();
            render();
            return;
        }
        if(act==='ledger-collapse'){state.ledgerCollapsed=!state.ledgerCollapsed;render();return;}
        if(act==='ledger-page'){var ledgerNext=Number(id);var ledgerTotal=Math.max(1,Math.ceil(ledgerRows().length/(state.ledgerPageSize||20)));if(ledgerNext>=1&&ledgerNext<=ledgerTotal){state.ledgerPage=ledgerNext;render();}return;}
        if(act==='ledger-jump'){var ledgerJump=parseInt((document.getElementById('ledger-jump')||{}).value,10);var ledgerJumpTotal=Math.max(1,Math.ceil(ledgerRows().length/(state.ledgerPageSize||20)));if(ledgerJump>=1&&ledgerJump<=ledgerJumpTotal)state.ledgerPage=ledgerJump;render();return;}
        if(act==='ledger-no'){openModal('清分台账编号',note('编号：'+id+'（演示，详情页待对接）'));return;}
        if(act==='ledger-order'){openModal('主订单号',note('主订单号：'+id+'（演示，订单详情待对接）'));return;}
        if(act==='export-ledger'){exportLedger();return;}
        if(act==='exception-page'){var next=Number(id);var total=Math.max(1,Math.ceil(exceptionRows().length/(state.exceptionPageSize||20)));if(next>=1&&next<=total){state.exceptionPage=next;render();}return;}
        if(act==='exception-jump'){var jump=parseInt((document.getElementById('exception-jump')||{}).value,10);var jumpTotal=Math.max(1,Math.ceil(exceptionRows().length/(state.exceptionPageSize||20)));if(jump>=1&&jump<=jumpTotal)state.exceptionPage=jump;render();return;}
        if(act==='exception-detail'){openExceptionDetail(id);return;}
        if(act==='exception-manual-pay'){openExceptionManualPay(id);return;}
        if(act==='exception-to-bill'){openExceptionToBill(id);return;}
        if(act==='exception-retry'){openExceptionRetry(id);return;}
        if(act==='exception-close'){openExceptionClose(id);return;}
        if(act==='exception-settlement'){openExceptionSettlement(id);return;}
        if(act==='exception-voucher'){openExceptionVoucher(id);return;}
        if(act==='export-exception'){exportException();return;}
        if(act==='supplier-page'){state.supplierPage=Number(id);render();return;}
        if(act==='detail'){state.view==='policy'?openPolicyPage('detail',id):navigate(id);return;}
        if(act==='back'){navigate('');return;}
        if(act==='supplier-exception'){openModal('异常详情',note('未配置供应商结算账户或结算主体'));return;}
        if(act==='carrier-retry'){var crow=carrierPending.concat(carrierStatements).find(function(x){return x.id===id;});openModal('重新执行','确认对单据 '+h(id)+' 重新执行？将重新校验承运商基本账户与运费明细。'+(crow&&crow.reason?'<br>当前异常：'+h(crow.reason):''),false,button('取消','close')+button('确认','confirm-carrier-retry',id,'primary'));return;}
        if(act==='carrier-submit'||act==='carrier-batch'){
            var cpicked=(act==='carrier-submit'?[id]:state.carrierSelection).filter(function(key){return carrierPending.some(function(x){return x.id===key&&!x.blocked;});});
            if(!cpicked.length){openModal('无法加入结款单',note('请选择可加入的单据；异常单据需先「重新执行」通过后再加入。'));return;}
            var csum=cpicked.reduce(function(s,key){var row=carrierPending.find(function(x){return x.id===key;});return s+(row?Number(row.freight):0);},0);
            state.pendingCarrierSubmit=cpicked.slice();
            openModal('新建承运商结款单',note('共选择 '+cpicked.length+' 组运费（应付运费合计 ¥'+csum.toFixed(2)+'）。确认后进入「结款单据」，由平台结算账户划入承运商基本账户。'),false,button('取消','close')+button('确认','confirm-carrier-submit','','primary'));
            return;
        }
        if(act==='expand-compensation'){state.compensationExpanded=!state.compensationExpanded;render();return;}
        if(act==='export-compensation'){openModal('导出列表',note('真实管理端当前提示：导出列表待对接。'));return;}
        if(act==='policy-back'){state.policyMode='';state.policyEditing='';state.policyDraft=null;history.pushState(null,'',location.pathname+'?view=policy');render();return;}
        if(act==='new-policy'){openPolicyPage('create');return;}
        if(act==='policy-more'){state.policyMenu=state.policyMenu===id?'':id;render();return;}
        if(act==='edit-policy'){openPolicyPage('edit',id);return;}
        if(act==='terminate-policy'){openModal('终止策略','确认终止策略 '+h((policies.find(function(x){return x.id===id;})||{}).name)+'？',false,button('取消','close')+button('确认终止','confirm-terminate',id,'primary'));return;}
        if(act==='delete-policy'){openModal('删除策略','确认删除草稿策略？',false,button('取消','close')+button('确认删除','confirm-delete',id,'primary'));return;}
        if(act==='save-policy'){
            var d=state.policyDraft;
            if(!d.name.trim()){openModal('请完善基本信息','请输入策略名称。');return;}
            if(!d.rules.length){openModal('请完善策略配置','请至少新建一条分佣规则。');return;}
            var summary=d.rules.map(function(r){return r.summary;}).join('；');
            var existing=policies.find(function(x){return x.id===state.policyEditing;});
            if(existing){existing.name=d.name;existing.kind=d.orderType;existing.channel=d.orderType==='代采订单'?'':d.channel;existing.rule=summary;existing.status=d.enabled?'已启用':'已停用';}
            else{policies.unshift({id:'local-policy-'+Date.now(),seq:policies.length+1,name:d.name,kind:d.orderType,channel:d.orderType==='代采订单'?'':d.channel,basis:'按实付金额分佣',trigger:'订单履约确认后',rule:summary,stores:d.orderType==='代采订单'?'':'0',status:d.enabled?'已启用':'已停用',time:'本地演示'});}
            state.tab=d.orderType==='代采订单'?'procurement':'retail';state.policyMode='';state.policyDraft=null;state.policyEditing='';history.pushState(null,'',location.pathname+'?view=policy');render();return;
        }
        if(act==='add-rule'||act==='edit-rule'){state.ruleEditing=act==='add-rule'?-1:Number(id);var old=state.ruleEditing<0?null:state.policyDraft.rules[state.ruleEditing];state.ruleDraft=old?{name:old.name,dimension:old.dimension,tiers:old.tiers.map(function(t){return Object.assign({},t);}),categories:(old.categories||[]).slice(),products:(old.products||[]).slice()}:{name:'',dimension:'全部商品',tiers:[emptyTier()],categories:[],products:[]};renderRuleDialog();return;}
        if(act==='remove-rule'){state.policyDraft.rules.splice(Number(id),1);render();return;}
        if(act==='rule-scope'){var rule=state.policyDraft.rules[Number(id)];openModal('参与商品',note(rule.dimension+(rule.categories||rule.products||[]).join('、')));return;}
        if(act==='general-log'){openLogs('general');return;}
        if(act==='policy-log'){openLogs('policy',id);return;}
        if(act==='switch'){config[id]=!config[id];render();return;}
        if(act==='save-config'){readGeneralConfig();openModal('保存通用配置','确认保存当前结算通用配置？',false,button('取消','close','','')+button('确认保存','confirm-save','','primary'));return;}
        if(act==='export-summary'){exportSummary();return;}
        if(act==='manual'){var x=compensations.find(function(r){return r.id===id;});if(!x){openModal('人工结款',note('未找到补偿结款单：'+h(id)));return;}openModal('人工结款','<div class="settle-policy-form">'+policyField('结款金额','<b>'+cash(x.amount)+'</b> <small>（默认清分待结算金额，不支持修改）</small>')+policyField('上传凭证','<input type="file" accept=".jpg,.jpeg,.png" multiple aria-label="上传凭证"><small>支持 JPG/JPEG/PNG，最多 3 张，单张 ≤ 10MB</small>')+policyField('备注','<textarea class="settle-input settle-textarea" id="compensation-manual-remark" maxlength="100" placeholder="选填，≤100 字"></textarea>')+'</div>',false,button('取消','close')+button('确定','confirm-compensation-manual',id,'primary'));return;}
        if(act==='retry'){openModal('重新执行','确认对单据 '+h(id)+' 重新执行？将重新校验供应商进件/账户，通过后即可加入结款单。',false,button('取消','close')+button('确认','confirm-supplier-retry',id,'primary'));return;}
        if(act==='submit'||act==='batch-submit'){
            var picked=(act==='submit'?[id]:state.supplierSelection).filter(function(key){return supplierPending.some(function(x){return x.id===key&&!x.blocked;});});
            if(!picked.length){openModal('无法加入结款单',note('请选择可加入的单据；异常单据需先「重新执行」通过后再加入。'));return;}
            var sum=picked.reduce(function(s,key){var row=supplierPending.find(function(x){return x.id===key;});return s+(row?Number(row.net):0);},0);
            state.pendingSupplierSubmit=picked.slice();
            openModal('新建结款单',note('共选择 '+picked.length+' 组数据（应付供应商净额合计 ¥'+sum.toFixed(2)+'），确认后进入「结款单据」。'),false,button('取消','close')+button('确认','confirm-supplier-submit','','primary'));
            return;
        }
        if(act==='toggle-policy'){var target=policies.find(function(r){return r.id===id;});if(target){openModal(target.status==='已启用'?'停用策略':'启用策略','确认'+(target.status==='已启用'?'停用':'启用')+'策略 '+h(target.name)+'？',false,button('取消','close')+button('确认','confirm-toggle',id,'primary'));}return;}
        if(act==='binding'){openBinding(id);return;}
        if(act==='rule'){var p=policies.find(function(r){return r.id===id;})||policies[0];openModal('结算规则',note(p.rule),false);return;}
    });
    overlay.addEventListener('click',function(e){
        var b=e.target.closest('[data-act]'); var act=b&&b.dataset.act, id=b&&b.dataset.id||'';
        if(e.target.dataset.overlay||act==='close'){overlay.innerHTML='';return;}
        if(act==='add-tier'){captureRuleDraft();state.ruleDraft.tiers.push(emptyTier());renderRuleDialog();return;}
        if(act==='copy-tier'){captureRuleDraft();state.ruleDraft.tiers.splice(Number(id)+1,0,Object.assign({},state.ruleDraft.tiers[Number(id)]));renderRuleDialog();return;}
        if(act==='remove-tier'){captureRuleDraft();state.ruleDraft.tiers.splice(Number(id),1);renderRuleDialog();return;}
        if(act==='choose-category'||act==='choose-product'){openPicker(act==='choose-category'?'category':'product');return;}
        if(act==='picker-search'){state.pickerQuery=(document.getElementById('picker-query')||{}).value||'';renderPicker();return;}
        if(act==='picker-cancel'){renderRuleDialog();return;}
        if(act==='picker-confirm'){var src=state.picker==='category'?categories:products;var selected=src.filter(function(x){return state.pickerSelected.includes(x[0]);}).map(function(x){return x[1];});state.ruleDraft[state.picker==='category'?'categories':'products']=selected;renderRuleDialog();return;}
        if(act==='save-rule'){
            captureRuleDraft();var r=state.ruleDraft;if(!r.name.trim()){openModal('请填写分佣规则名称','分佣规则名称不能为空。');return;}
            if(r.dimension==='部分品类'&&!r.categories.length||r.dimension==='部分商品'&&!r.products.length){openModal('请选择参与商品','当前商品维度需要先选择分类或商品。');return;}
            var consign=state.policyDraft.orderType==='代采订单';var summary=r.tiers.map(function(t){return '毛利率≥'+t.margin+'%，'+(consign?'BD扶商'+t.bd+'%':'参与分佣：门店'+t.store+'%/BD扶商'+t.bd+'%/直播运营'+t.live+'%/商户'+t.merchant+'%')+'，平台按剩余金额结算';}).join('；');
            var value={name:r.name,method:'按实付金额分佣',summary:summary,dimension:r.dimension,tiers:r.tiers,categories:r.categories,products:r.products};
            if(state.ruleEditing<0)state.policyDraft.rules.push(value);else state.policyDraft.rules[state.ruleEditing]=value;
            overlay.innerHTML='';render();return;
        }
        if(act==='binding-search'){return;}
        if(act==='save-binding'){var row=policies.find(function(x){return x.id===state.bindingPolicy;});if(row)row.stores=state.bindingMode==='全部门店'?'全部门店':String(state.bindingSelected.length);overlay.innerHTML='';render();return;}
        if(act==='confirm-toggle'){var target=policies.find(function(x){return x.id===id;});if(target)target.status=target.status==='已启用'?'已停用':'已启用';overlay.innerHTML='';render();return;}
        if(act==='confirm-terminate'){var stop=policies.find(function(x){return x.id===id;});if(stop)stop.status='已终止';overlay.innerHTML='';render();return;}
        if(act==='confirm-delete'){var index=policies.findIndex(function(x){return x.id===id;});if(index>=0&&policies[index].status==='草稿')policies.splice(index,1);overlay.innerHTML='';render();return;}
        if(act==='log-detail'){detailLog(id);return;}
        if(act==='restore-log'){overlay.innerHTML=overlay.dataset.previous||'';return;}
        if(act==='log-search'||act==='log-reset'){state.logFilter=act==='log-reset'?'':(document.getElementById('log-query')||{}).value||'';state.logResult=act==='log-reset'?'':(document.getElementById('log-result')||{}).value||'';if(act==='log-reset'){document.getElementById('log-query').value='';document.getElementById('log-result').value='';}document.getElementById('log-table').innerHTML=logTable(state.logKind==='general'?generalLogs:state.policyLogId==='POLICY_354560079879471104'?policyLogs:[],state.logKind);return;}
        if(act==='confirm-exception-manual-pay'){
            var rowM=exceptionOrders.filter(function(x){return String(x.seq)===String(id);})[0];
            if(rowM){
                var cstManual=rowM.relatedDoc&&String(rowM.relatedDoc).indexOf('CST_')===0?rowM.relatedDoc:('CST_'+String(Date.now()));
                var nowM=exceptionNow();
                rowM.handleStatus='已结款(人工)';
                rowM.status='已结款(人工)';
                rowM.handler='yanfa';
                rowM.handleTime=nowM;
                rowM.remark=(document.getElementById('exception-manual-remark')||{}).value||'人工结款';
                rowM.relatedDoc=cstManual;
                rowM.voucher=true;
                rowM.flowNo=channelFlowNo(cstManual,'已结款(人工)',nowM);
                if(!compensations.some(function(c){return c.id===cstManual;})){
                    compensations.unshift({
                        seq:compensations.length+1,id:cstManual,type:'入账异常补偿',related:rowM.id,
                        amount:rowM.amount,payer:'平台二帐户',payerAccount:PLATFORM_PAYER_NO,
                        payee:rowM.payee,payeeType:rowM.payeeType,payeeAccount:rowM.accountNo||'',
                        created:nowM,status:'已结款',time:nowM
                    });
                    enrichPayeeAccount(compensations[0],'payee',compensations[0].payeeAccount);
                }
                compensations.forEach(function(r,i){r.seq=compensations.length-i;});
            }
            overlay.innerHTML='';render();return;
        }
        if(act==='confirm-exception-to-bill'){
            var rowB=exceptionOrders.filter(function(x){return String(x.seq)===String(id);})[0];
            if(rowB&&canExceptionToBill(rowB)){
                var cstId='CST_'+String(Date.now());
                var nowB=exceptionNow();
                rowB.handleStatus='处理中';
                rowB.status='处理中';
                rowB.handler='yanfa';
                rowB.handleTime=nowB;
                rowB.relatedDoc=cstId;
                rowB.remark='已转补偿结款，待出账';
                compensations.unshift({
                    seq:compensations.length+1,id:cstId,type:'入账异常补偿',related:rowB.id,
                    amount:rowB.amount,payer:'平台二帐户',payerAccount:PLATFORM_PAYER_NO,
                    payee:rowB.payee,payeeType:rowB.payeeType,payeeAccount:rowB.accountNo||'',
                    created:nowB,status:'待结款',time:'—'
                });
                enrichPayeeAccount(compensations[0],'payee',compensations[0].payeeAccount);
                compensations.forEach(function(r,i){r.seq=compensations.length-i;});
            }
            overlay.innerHTML='';render();return;
        }
        if(act==='confirm-exception-retry'){
            var rowR=exceptionOrders.filter(function(x){return String(x.seq)===String(id);})[0];
            if(rowR){
                /* 代收待转结款异常：重新执行通过后回到待处理，可转结款单 */
                if(/代收待转/.test(String(rowR.reason||''))){
                    rowR.handleStatus='待处理';
                    rowR.status='待处理';
                    rowR.remark='重新执行通过，可转结款单';
                }else{
                    rowR.handleStatus='处理中';
                    rowR.status='处理中';
                    rowR.remark='重新执行中';
                }
                rowR.handler='yanfa';
                rowR.handleTime=exceptionNow();
            }
            overlay.innerHTML='';render();return;
        }
        if(act==='confirm-exception-close'){
            var rowC=exceptionOrders.filter(function(x){return String(x.seq)===String(id);})[0];
            if(rowC){
                rowC.handleStatus='已关闭';
                rowC.status='已关闭';
                rowC.handler='yanfa';
                rowC.handleTime=exceptionNow();
            }
            overlay.innerHTML='';render();return;
        }
        if(act==='confirm-compensation-manual'){
            var rowPay=compensations.find(function(r){return r.id===id;});
            if(rowPay){
                var nowP=exceptionNow();
                rowPay.status='已结款';
                rowPay.time=nowP;
                rowPay.lineFlows=buildLineFlows(rowPay.id,rowPay.status,nowP,1,rowPay.amount);
                exceptionOrders.forEach(function(ex){
                    if(ex.relatedDoc===rowPay.id){
                        ex.handleStatus='已结款';
                        ex.status='已结款';
                        ex.handler='yanfa';
                        ex.handleTime=nowP;
                        ex.flowNo=channelFlowNo(rowPay.id,'已结款',nowP);
                        ex.remark=(document.getElementById('compensation-manual-remark')||{}).value||'补偿结款完成';
                    }
                });
            }
            overlay.innerHTML='';render();return;
        }
        if(act==='confirm-carrier-submit'){
            var cIds=state.pendingCarrierSubmit||[];
            cIds.forEach(function(key){
                var idx=-1;
                for(var i=0;i<carrierPending.length;i++){if(carrierPending[i].id===key&&!carrierPending[i].blocked){idx=i;break;}}
                if(idx<0) return;
                var row=carrierPending.splice(idx,1)[0];
                row.status='待结款';
                row.blocked=false;
                row.reason='';
                row.posted='';
                row.flow=row.flow||'平台结算账户 → 承运商基本账户';
                delete row.flowNo;
                row.lineFlows=buildLineFlows(row.id, row.status, row.created, row.orders, row.freight);
                carrierStatements.unshift(row);
            });
            carrierPending.forEach(function(r,i){r.seq=carrierPending.length-i;});
            carrierStatements.forEach(function(r,i){r.seq=carrierStatements.length-i;});
            state.carrierSelection=[];
            state.pendingCarrierSubmit=[];
            state.tab='statement';
            overlay.innerHTML='';
            render();
            return;
        }
        if(act==='confirm-carrier-retry'){
            var cRetry=carrierPending.find(function(x){return x.id===id;})||carrierStatements.find(function(x){return x.id===id;});
            if(cRetry){
                /* 未配置账户：不自动补齐，避免掩盖缺户；其它原因清除后可再加入 */
                if(/未配置/.test(String(cRetry.reason||'')) && (!cRetry.accountName || !cRetry.account)){
                    openModal('重新执行失败', note('仍未配置承运商基本账户，请先维护进件资料后再执行。'));
                    return;
                }
                cRetry.blocked=false;
                cRetry.reason='';
                if(cRetry.status==='结款失败') cRetry.status='待结款';
            }
            overlay.innerHTML='';
            render();
            return;
        }
        if(act==='confirm-supplier-submit'){
            var sIds=state.pendingSupplierSubmit||[];
            sIds.forEach(function(key){
                var sidx=-1;
                for(var si=0;si<supplierPending.length;si++){if(supplierPending[si].id===key&&!supplierPending[si].blocked){sidx=si;break;}}
                if(sidx<0) return;
                var srow=supplierPending.splice(sidx,1)[0];
                srow.status='待结款';
                srow.blocked=false;
                delete srow.flowNo;
                srow.lineFlows=buildLineFlows(srow.id, srow.status, srow.created, srow.orders, srow.net);
                supplierStatements.unshift(srow);
            });
            supplierPending.forEach(function(r,i){r.seq=supplierPending.length-i;});
            supplierStatements.forEach(function(r,i){r.seq=supplierStatements.length-i;});
            state.supplierSelection=[];
            state.pendingSupplierSubmit=[];
            state.tab='statement';
            overlay.innerHTML='';
            render();
            return;
        }
        if(act==='confirm-supplier-retry'){
            var sRetry=supplierPending.find(function(x){return x.id===id;});
            if(sRetry){sRetry.blocked=false;}
            overlay.innerHTML='';
            render();
            return;
        }
        if(act==='confirm-save'||act==='confirm-demo'){overlay.innerHTML='';return;}
    });
    app.addEventListener('input',function(e){if(e.target.dataset.policy && state.policyDraft && e.target.type!=='checkbox')state.policyDraft[e.target.dataset.policy]=e.target.value;});
    app.addEventListener('change',function(e){
        if(e.target.dataset.config)config[e.target.dataset.config]=e.target.value;
        if(e.target.dataset.selectSupplier){state.supplierSelection=e.target.checked?state.supplierSelection.concat(e.target.dataset.selectSupplier):state.supplierSelection.filter(function(id){return id!==e.target.dataset.selectSupplier;});render();}
        if(e.target.dataset.selectSupplierAll!==undefined){var list=state.tab==='pending'?supplierPending:[];var visible=list.slice((state.supplierPage-1)*20,state.supplierPage*20).map(function(x){return x.id;});state.supplierSelection=e.target.checked?Array.from(new Set(state.supplierSelection.concat(visible))):state.supplierSelection.filter(function(id){return !visible.includes(id);});render();}
        if(e.target.dataset.selectCarrier){state.carrierSelection=e.target.checked?state.carrierSelection.concat(e.target.dataset.selectCarrier):state.carrierSelection.filter(function(id){return id!==e.target.dataset.selectCarrier;});render();}
        if(e.target.dataset.selectCarrierAll!==undefined){var clist=state.tab==='pending'?carrierPending:[];var cvisible=clist.slice((state.carrierPage-1)*20,state.carrierPage*20).map(function(x){return x.id;});state.carrierSelection=e.target.checked?Array.from(new Set(state.carrierSelection.concat(cvisible))):state.carrierSelection.filter(function(id){return !cvisible.includes(id);});render();}
        if(e.target.id==='exception-page-size'){state.exceptionPageSize=Number(e.target.value)||20;state.exceptionPage=1;render();}
        if(e.target.id==='ledger-page-size'){state.ledgerPageSize=Number(e.target.value)||20;state.ledgerPage=1;render();}
        if(e.target.dataset.policy && state.policyDraft){state.policyDraft[e.target.dataset.policy]=e.target.type==='checkbox'?e.target.checked:e.target.value;}
        if(e.target.name==='orderType'||e.target.name==='channel'){state.policyDraft[e.target.name]=e.target.value;render();}
    });
    app.addEventListener('keydown',function(e){
        if(e.key!=='Enter'||!e.target||e.target.id!=='ledger-jump')return;
        e.preventDefault();
        var ledgerJump=parseInt(e.target.value,10);
        var ledgerJumpTotal=Math.max(1,Math.ceil(ledgerRows().length/(state.ledgerPageSize||20)));
        if(ledgerJump>=1&&ledgerJump<=ledgerJumpTotal){state.ledgerPage=ledgerJump;render();}
    });
    overlay.addEventListener('change',function(e){
        if(e.target.name==='dimension'){captureRuleDraft();state.ruleDraft.dimension=e.target.value;renderRuleDialog();}
        if(e.target.dataset.selectPicker){state.pickerSelected=e.target.checked?state.pickerSelected.concat(e.target.dataset.selectPicker):state.pickerSelected.filter(function(x){return x!==e.target.dataset.selectPicker;});}
        if(e.target.name==='bindingMode'){state.bindingMode=e.target.value;renderBinding();}
        if(e.target.dataset.bindingStore){state.bindingSelected=e.target.checked?state.bindingSelected.concat(e.target.dataset.bindingStore):state.bindingSelected.filter(function(x){return x!==e.target.dataset.bindingStore;});renderBinding();}
    });
    window.addEventListener('popstate',function(){var p=new URLSearchParams(location.search);state.view=names[p.get('view')]?p.get('view'):'summary';state.detail=p.get('detail')||'';state.policyMode=p.get('mode')||'';state.policyEditing=p.get('id')||'';state.policyDraft=null;state.tab='';render();});
    render();
})();
