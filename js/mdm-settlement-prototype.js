/* LFerp 结算工作台静态原型。数据为 Dev 页面观察到的代表性记录，不连接业务接口。 */
(function () {
    'use strict';
    var app = document.getElementById('settlement-app');
    var overlay = document.getElementById('settlement-overlay');
    if (!app) return;
    var names = {summary:'清分汇总', policy:'策略管理', supplier:'供应商结算', commission:'佣金清算', compensation:'补偿结款'};
    var params = new URLSearchParams(location.search);
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
        policyType: '',
        policyStore: '',
        policyMenu: '',
        policyMode: params.get('mode') || '',
        policyEditing: params.get('id') || '',
        policyDraft: null,
        ruleEditing: -1
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
    ].map(function(x){return {seq:x[0],id:x[1],supplier:x[2],goods:Number(x[3]).toFixed(2),payable:Number(x[4]).toFixed(2),net:Number(x[5]).toFixed(2),orders:x[6],status:'待提交',created:x[7],cycle:x[8],blocked:true};});
    var supplierStatements = [
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
    var commissions = [
        {seq:182,id:'ST_358643444144418816',supplier:'南京马群枢纽供应商',payee:'上海冷丰科技有限公司',type:'平台',amount:'0.02',orders:'2',status:'待生成',posting:'',related:'ST_358643443066482688',created:'2026-09-17 00:01'},
        {seq:181,id:'ST_357556280904126464',supplier:'斯斯供应商商家',payee:'上海冷丰科技有限公司',type:'平台',amount:'0.24',orders:'1',status:'待生成',posting:'已到账',related:'ST_357556279620669440',created:'2026-09-14 00:01'},
        {seq:180,id:'ST_357556280438558720',supplier:'斯斯供应商商家',payee:'斯斯门店商家2',type:'门店',amount:'0.25',orders:'1',status:'待生成',posting:'已到账',related:'ST_357556279620669440',created:'2026-09-14 00:01'}
    ];
    var summaryDay = [
        {seq:123,period:'2026-09-17',payee:'上海冷丰科技有限公司',type:'平台',id:'1',total:'0.02',settled:'0.00',pending:'0.00',blocked:'0.02',statements:'1',lines:'2'},
        {seq:122,period:'2026-09-14',payee:'斯斯门店商家2',type:'门店',id:'330159456409100288',total:'0.25',settled:'0.00',pending:'0.25',blocked:'0.00',statements:'1',lines:'1'},
        {seq:121,period:'2026-09-14',payee:'上海冷丰科技有限公司',type:'平台',id:'1',total:'0.24',settled:'0.00',pending:'0.24',blocked:'0.00',statements:'1',lines:'1'}
    ];
    var summaryMonth = [
        {seq:26,period:'2026-09',payee:'上海冷丰科技有限公司',type:'扶商BD',id:'1',total:'0.01',settled:'0.00',pending:'0.00',blocked:'0.01',statements:'1',lines:'1'},
        {seq:25,period:'2026-09',payee:'斯斯门店商家2',type:'门店',id:'330159456409100288',total:'0.25',settled:'0.00',pending:'0.25',blocked:'0.00',statements:'1',lines:'1'},
        {seq:24,period:'2026-09',payee:'野子文化',type:'门店',id:'328707092338712576',total:'0.01',settled:'0.00',pending:'0.00',blocked:'0.01',statements:'1',lines:'1'},
        {seq:23,period:'2026-09',payee:'上海冷丰科技有限公司',type:'平台',id:'1',total:'1.87',settled:'0.29',pending:'0.24',blocked:'1.34',statements:'11',lines:'14'}
    ];
    var compensations = [
        [7,'CST_2076953749068009474','ST_2076928530167214082','0.05','斯斯门店商家2','门店商家','6666000218330779','2026-07-14 16:55','待结款','—'],
        [6,'CST_2076953686182809601','ST_2076934074286321666','0.10','斯斯门店商家2','门店商家','6666000218330779','2026-07-14 16:55','待结款','—'],
        [5,'CST_2076854158091579393','ST_2076513812718309378','0.02','斯斯门店商家2','门店商家','6666000218330779','2026-07-14 10:19','已结款','2026-07-14T10:26:06'],
        [4,'CST_2076853411425775618','ST_2076850972752830466','0.02','上海冷丰科技有限公司','BD扶商','6666000202016395','2026-07-14 10:16','已结款','2026-07-14T10:24:32'],
        [3,'CST_2076851237383794689','ST_2076850972752830466','0.10','斯斯门店商家2','门店商家','6666000218330779','2026-07-14 10:08','已结款','2026-07-14T10:09:38'],
        [2,'CST_2076584293992595457','ST_2076562090022502401','0.01','上海冷丰科技有限公司','BD扶商','6666000202016395','2026-07-13 16:27','已结款','2026-07-14T10:36:43'],
        [1,'CST_2076577250279784449','ST_2076562090022502401','0.05','斯斯门店商家2','门店商家','6666000218330779','2026-07-13 15:59','已结款','2026-07-14T10:45:14']
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
    var config = {master:true, exclude:false, min:'0.00', basis:'实付金额', rounding:'四舍五入（HALF_UP）', trigger:'履约确认后', cycle:'1', generate:'00:01:00', autoBill:true};
    function h(v) { return String(v == null ? '' : v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
    function cash(v) { return v === '—' ? '—' : '¥' + h(v); }
    function button(label, act, id, kind) { return '<button type="button" class="settle-btn ' + (kind || 'link') + '" data-act="' + h(act) + '"' + (id ? ' data-id="' + h(id) + '"' : '') + '>' + h(label) + '</button>'; }
    function tag(v) { var cls = /已结款|已销账|已到账|启用|成功/.test(v) ? 'green' : /异常|失败|阻断/.test(v) ? 'red' : /待|部分/.test(v) ? 'orange' : ''; return '<span class="settle-tag ' + cls + '">' + h(v) + '</span>'; }
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
            '<label class="settle-field"><span>关键词</span><input class="settle-input" id="settle-query" value="' + h(state.query) + '" placeholder="' + h(opts.placeholder || '编号 / 名称') + '"></label>' +
            (opts.statuses ? '<label class="settle-field"><span>状态</span><select class="settle-select" id="settle-status"><option value="">全部状态</option>' + opts.statuses.map(function(x){return '<option value="' + h(x) + '"' + (state.status === x ? ' selected' : '') + '>' + h(x) + '</option>';}).join('') + '</select></label>' : '') +
            '<div class="settle-actions">' + button('查询','search','','primary') + button('重置','reset','','') + '</div></div></div>';
    }
    function filtered(rows, fields) { var q=state.query.trim().toLowerCase(); return rows.filter(function(row){return (!q || fields.some(function(f){return String(row[f] || '').toLowerCase().includes(q);})) && (!state.status || row.status === state.status || (state.status==='异常' && row.blocked));}); }
    function note(text) { return '<div class="settle-note">' + h(text) + '</div>'; }
    function renderSummary() {
        if (!state.tab) state.tab='day';
        var rows=(state.tab === 'month' ? summaryMonth : summaryDay).filter(function(x){return (!state.query||x.payee.includes(state.query)||x.id.includes(state.query))&&(!state.summaryType||x.type===state.summaryType)&&(!state.summaryFrom||x.period>=state.summaryFrom.slice(0,7))&&(!state.summaryTo||x.period<=state.summaryTo);});
        var tr=rows.map(function(x){return '<tr><td>'+h(x.seq||'')+'</td><td>'+h(x.period)+'</td><td>'+h(x.type)+'</td><td>'+h(x.payee)+'</td><td>'+h(x.id)+'</td><td class="money">'+cash(x.total)+'</td><td class="money">'+cash(x.settled)+'</td><td class="money">'+cash(x.pending)+'</td><td class="money">'+cash(x.blocked)+'</td><td>'+h(x.statements)+'</td><td>'+h(x.lines)+'</td></tr>';});
        var filterHtml='<div class="settle-card-body"><div class="settle-filter"><label class="settle-field"><span>统计时间</span><input type="date" class="settle-input" id="summary-from" value="'+h(state.summaryFrom||'')+'"></label><span>至</span><label class="settle-field"><span>&nbsp;</span><input type="date" class="settle-input" id="summary-to" value="'+h(state.summaryTo||'')+'"></label>'+
            '<label class="settle-field"><span>收款方类型</span><select class="settle-select" id="summary-type"><option value="">全部</option>'+['供应商','门店','BD扶商','直播运营商','商户','平台'].map(function(v){return '<option'+(state.summaryType===v?' selected':'')+'>'+v+'</option>';}).join('')+'</select></label>'+
            '<label class="settle-field"><span>收款方名称</span><input class="settle-input" id="settle-query" value="'+h(state.query)+'" placeholder="请输入收款方名称/ID"></label><div class="settle-actions">'+button('查询','search','','primary')+button('重置','reset')+'</div></div></div>';
        return '<div class="settle-card-body">'+note('当前按佣金清算单（供应商 → 分佣方）统计：应收佣金为单据总金额；已结款、待处理、异常金额按单据状态与预检结果归类。账户余额、提现和退款流水不在本页口径内。')+'</div>'+tabs([['day','日汇总'],['month','月汇总']])+
            '<section class="settle-card">'+filterHtml+'<div class="settle-toolbar">'+button('导出列表','export-summary')+'</div>'+
            table(['序号',state.tab==='month'?'统计月份':'统计日期','收款方类型','收款方名称','收款方ID','应收佣金（元）','已结款金额（元）','待处理金额（元）','异常金额（元）','佣金单数','子订单数'],tr,'共 '+(state.tab==='month'?'26':'123')+' 条')+'</section>';
    }
    function renderSupplier() {
        if (!['pending','statement'].includes(state.tab)) state.tab='pending';
        var pending=state.tab==='pending', all=pending?supplierPending:supplierStatements;
        var rows=filtered(all,['id','supplier']).filter(function(x){return (!state.supplierDateFrom || x.created.slice(0,10)>=state.supplierDateFrom) && (!state.supplierDateTo || x.created.slice(0,10)<=state.supplierDateTo) && (state.status!=='异常'||x.blocked);});
        var pages=Math.max(1,Math.ceil(rows.length/20));state.supplierPage=Math.min(state.supplierPage,pages);
        var visibleRows=rows.slice((state.supplierPage-1)*20,state.supplierPage*20);
        var selected=state.supplierSelection;
        var tr=visibleRows.map(function(x){return '<tr>'+(pending?'<td><input aria-label="选择 '+h(x.id)+'" type="checkbox" data-select-supplier="'+h(x.id)+'"'+(selected.includes(x.id)?' checked':'')+'></td>':'')+
            '<td>'+h(x.seq)+'</td><td>'+button(x.id,'detail',x.id)+'</td><td>'+h(x.supplier)+'</td><td class="money">'+cash(x.goods)+'</td><td class="money">'+cash(x.payable)+'</td><td class="money">'+cash(x.net)+'</td><td>'+h(x.orders)+'</td><td>'+tag(x.status)+'</td><td>'+h(x.created)+'</td><td>'+h(x.cycle)+'</td><td class="settle-actions">'+button('查看详情','detail',x.id)+(pending?(x.blocked?button('重新执行','retry',x.id):button('加入结款单','submit',x.id)):'')+'</td></tr>';});
        var search='<div class="settle-card-body"><div class="settle-filter">'+
            '<label class="settle-field"><span>结算单号</span><input class="settle-input" id="settle-query" value="'+h(state.query)+'" placeholder="请输入结算单号"></label>'+
            '<label class="settle-field"><span>结算状态</span><select class="settle-select" id="settle-status"><option value="">全部</option>'+['待提交','异常','待结款','部分结款','已结款'].map(function(x){return '<option'+(state.status===x?' selected':'')+'>'+x+'</option>';}).join('')+'</select></label>'+
            '<label class="settle-field"><span>创建时间</span><input aria-label="创建时间开始" type="date" class="settle-input" id="supplier-date-from" value="'+h(state.supplierDateFrom)+'"></label><span>至</span><label class="settle-field"><span>&nbsp;</span><input aria-label="创建时间结束" type="date" class="settle-input" id="supplier-date-to" value="'+h(state.supplierDateTo)+'"></label>'+
            '<div class="settle-actions">'+button('查询','search','','primary')+button('重置','reset')+'</div></div></div>';
        var head=(pending?['□']:[]).concat(['序号','结算单号','供应商名称','货款合计（应收）','应付合计（服务费+佣金）','应付供应商净额','订单数','结算状态','创建时间','结算周期','操作']);
        var footer='<span>共 '+rows.length+' 条</span><span>20条/页</span>'+
            '<button class="settle-btn" data-act="supplier-page" data-id="'+(state.supplierPage-1)+'"'+(state.supplierPage===1?' disabled':'')+'>上一页</button>'+
            Array.from({length:pages},function(_,i){return '<button class="settle-btn'+(state.supplierPage===i+1?' primary':'')+'" data-act="supplier-page" data-id="'+(i+1)+'" aria-label="第 '+(i+1)+' 页">'+(i+1)+'</button>';}).join('')+
            '<button class="settle-btn" data-act="supplier-page" data-id="'+(state.supplierPage+1)+'"'+(state.supplierPage===pages?' disabled':'')+'>下一页</button>';
        return tabs([['pending','待处理单据'],['statement','结款单据']])+
            '<section class="settle-card">'+search+(pending?'<div class="settle-toolbar"><button type="button" class="settle-btn primary" data-act="batch-submit"'+(selected.some(function(id){var row=supplierPending.find(function(x){return x.id===id;});return row&&!row.blocked;})?'':' disabled')+'>批量加入结款单</button></div>':'')+
            table(head,tr,footer).replace('<th>□</th>','<th><input type="checkbox" aria-label="选择所有行" data-select-supplier-all></th>')+'</section>';
    }
    function renderCommission() {
        var rows=commissions.filter(function(x){return (!state.query||x.id.includes(state.query))&&(!state.status||x.status===state.status)&&(!state.commissionType||x.type===state.commissionType)&&(!state.commissionRelated||x.related.includes(state.commissionRelated));});
        var tr=rows.map(function(x){return '<tr><td>'+h(x.seq)+'</td><td>'+button(x.id,'detail',x.id)+'</td><td>'+h(x.supplier)+'</td><td>'+h(x.payee)+'</td><td>'+h(x.type)+'</td><td class="money">'+cash(x.amount)+'</td><td>'+h(x.orders)+'</td><td>'+tag(x.status)+'</td><td>'+h(x.posting)+'</td><td>'+h(x.related)+'</td><td>'+h(x.created)+'</td><td>'+button('查看详情','detail',x.id)+'</td></tr>';});
        var filters='<div class="settle-card-body"><div class="settle-filter">'+
            '<label class="settle-field"><span>结款单号</span><input class="settle-input" id="settle-query" value="'+h(state.query)+'" placeholder="请输入结款单号"></label>'+
            '<label class="settle-field"><span>收款方类型</span><select class="settle-select" id="commission-type"><option value="">请选择</option>'+['门店','BD扶商','直播运营商','商户','平台'].map(function(v){return '<option'+(state.commissionType===v?' selected':'')+'>'+v+'</option>';}).join('')+'</select></label>'+
            '<label class="settle-field"><span>清算状态</span><select class="settle-select" id="settle-status"><option value="">请选择</option>'+['待生成','待结款','已结款','部分结款'].map(function(v){return '<option'+(state.status===v?' selected':'')+'>'+v+'</option>';}).join('')+'</select></label>'+
            '<label class="settle-field"><span>关联供应商结款单</span><input class="settle-input" id="commission-related" value="'+h(state.commissionRelated||'')+'" placeholder="请输入供应商结款单"></label>'+
            '<div class="settle-actions">'+button('查询','search','','primary')+button('重置','reset')+'</div></div></div>';
        return '<section class="settle-card">'+filters+table(['序号','结款单号','供应商名称','收款方名称','收款方类型','应收佣金（元）','子订单数量','清算状态','入账状态','关联供应商结款单','创建时间','操作'],tr,'共 182 条')+'</section>';
    }
    function renderCompensation() {
        var rows=compensations.filter(function(x){return (!state.query||x.id.includes(state.query))&&(!state.compensationRelated||x.related.includes(state.compensationRelated))&&(!state.compensationPayee||x.payee.includes(state.compensationPayee))&&(!state.compensationType||x.payeeType===state.compensationType)&&(!state.status||x.status===state.status);});
        var tr=rows.map(function(x){return '<tr><td>'+h(x.seq)+'</td><td>'+button(x.id,'detail',x.id)+'</td><td>'+h(x.type)+'</td><td>'+h(x.related)+'</td><td class="money">'+cash(x.amount)+'</td><td>'+h(x.payer)+'</td><td>'+h(x.payerAccount)+'</td><td>'+h(x.payee)+'</td><td>'+h(x.payeeType)+'</td><td>'+h(x.payeeAccount)+'</td><td>'+h(x.created)+'</td><td>'+tag(x.status)+'</td><td>'+h(x.time)+'</td><td class="settle-actions">'+button('查看详情','detail',x.id)+(x.status==='待结款'?button('人工结款','manual',x.id):'')+'</td></tr>';});
        var filters='<div class="settle-card-body"><div class="settle-filter">'+
            '<label class="settle-field"><span>结款单号</span><input class="settle-input" id="settle-query" value="'+h(state.query)+'" placeholder="请输入结款单号"></label>'+
            '<label class="settle-field"><span>关联异常单号</span><input class="settle-input" id="compensation-related" value="'+h(state.compensationRelated||'')+'" placeholder="请输入关联异常单号"></label>'+
            '<label class="settle-field"><span>收款方名称</span><input class="settle-input" id="compensation-payee" value="'+h(state.compensationPayee||'')+'" placeholder="请输入收款方名称"></label>'+
            '<label class="settle-field"><span>收款方类型</span><select class="settle-select" id="compensation-type"><option value="">全部</option>'+['门店','BD扶商','主播运营商','门店商家'].map(function(v){return '<option'+(state.compensationType===v?' selected':'')+'>'+v+'</option>';}).join('')+'</select></label>'+
            (state.compensationExpanded?'<label class="settle-field"><span>结款状态</span><select class="settle-select" id="settle-status"><option value="">全部</option>'+['待结款','结款中','已结款','结款失败'].map(function(v){return '<option'+(state.status===v?' selected':'')+'>'+v+'</option>';}).join('')+'</select></label><label class="settle-field"><span>创建时间</span><input type="date" class="settle-input" id="compensation-from"></label>':'')+
            '<div class="settle-actions">'+button('查询','search','','primary')+button('重置','reset')+button(state.compensationExpanded?'收起':'展开','expand-compensation')+'</div></div></div>';
        return '<section class="settle-card">'+filters+'<div class="settle-toolbar">'+button('导出列表','export-compensation')+'</div>'+
            table(['序号','结款单号','补偿类型','关联异常单号','补偿金额（元）','付款方名称','付款账户','收款方名称','收款方类型','收款账号','创建时间','结款状态','完成时间','操作'],tr,'共 7 条')+'</section>';
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
    function configLine(label, value) {return '<div class="settle-config-item"><span>' + h(label) + '</span>' + value + '</div>';}
    function renderConfig() {
        var body='<div class="settle-card-body"><h3 class="settle-section-title">分佣控制</h3><div class="settle-config-grid">' +
            configLine('分佣总开关',switcher('master')) +
            configLine('排除订单类型',switcher('exclude')) +
            configLine('最低支付金额（元）','<input class="settle-input" type="number" min="0" step="0.01" data-config="min" value="' + h(config.min) + '">') +
            configLine('分佣基数','<input class="settle-input" disabled value="' + h(config.basis) + '">') +
            configLine('金额进位规则','<input class="settle-input" disabled value="' + h(config.rounding) + '">') +
            '</div><h3 class="settle-section-title" style="margin-top:28px">结算生成</h3><div class="settle-config-grid">' +
            configLine('结算触发节点','<input class="settle-input" disabled value="' + h(config.trigger) + '">') +
            configLine('结算周期（天）','<input class="settle-input" disabled value="' + h(config.cycle) + '">') +
            configLine('结算单生成时间','<input class="settle-input" type="time" step="1" data-config="generate" value="' + h(config.generate) + '">') +
            configLine('自动生成结款单',switcher('autoBill')) +
            configLine('执行小时数','<input class="settle-input" disabled value="1">') +
            '</div><div class="settle-actions" style="margin-top:26px">' + button('保存配置','save-config','','primary') + '</div></div>';
        return card('结算通用配置',body,button('操作日志','general-log','',''));
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
            policyField('扣除项规则','<div class="settle-deduction">承运商、仓储服务商：不参与分佣，平台线下结算<br>供应商：不参与分佣，按采购金额结算</div>')+
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
        var body='<div class="settle-filter"><label class="settle-field"><span>'+(cat?'商品分类ID / 名称':'搜索')+'</span><input class="settle-input" id="picker-query" value="'+h(state.pickerQuery)+'" placeholder="'+(cat?'商品分类ID / 名称':'商品ID / 名称')+'"></label>'+button('查询','picker-search','','primary')+'</div>'+note(cat?'已经参与分佣策略的商品，不支持重复参与；零售价少于1元的商品，不参与分佣':'已经参与分佣策略的商品，不支持重复参与')+
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
            (state.bindingMode==='指定门店'?'<div class="settle-filter"><label class="settle-field"><span>门店名称 / ID</span><input class="settle-input" id="binding-query" placeholder="输入门店名称 / ID 搜索"></label>'+button('搜索','binding-search','','primary')+'</div>'+
            table(['选择所有行','门店ID','门店名称','手机号码'],[],'已选 '+(row.name==='乐事'?state.bindingSelected.length:row.stores)+' 个门店')+
            (state.bindingSelected.length?'<div class="settle-selected-tags">'+state.bindingSelected.map(function(x){return '<span>'+h(x)+'</span>';}).join('')+'</div>':''):'')+'</div>';
        overlay.innerHTML='<div class="settle-overlay" data-overlay="1"><div class="settle-drawer settle-binding-drawer" role="dialog" aria-modal="true"><div class="settle-dialog-head"><strong>绑定门店 - '+h(row.name)+'</strong>'+button('✕','close')+'</div><div class="settle-dialog-body">'+body+'</div><div class="settle-dialog-foot">'+button('取消','close')+button('保存','save-binding','','primary')+'</div></div></div>';
    }
    function detailTitle() {
        if(state.view==='supplier') return '供应商结算单详情';
        if(state.view==='commission') return '佣金清算单详情';
        if(state.view==='compensation') return '补偿结款单详情';
        return '策略详情';
    }
    function renderDetail() {
        var id=state.detail;
        var back='<div class="settle-back">' + button('← 返回列表','back','','') + '</div>';
        if (state.view==='supplier') {
            var x=supplierPending.concat(supplierStatements).find(function(r){return r.id===id;}) || supplierStatements[0];
            var known=id==='ST_353846837167284224', first=id==='ST_358643443066482688';
            if(!state.tab || !['current','payments'].includes(state.tab)) state.tab='current';
            var money=function(v){return v==='—'?'—':cash(v);};
            var fields=[['结款单号',h(x.id)],['供应商名称',h(x.supplier)],['供应商编码',known?'330158197295816704':first?'319838916817453056':'—'],['单据类型','供应商销售结算单'],
                ['供应商应收金额',money(x.goods)],['实收金额',money(x.goods)],['待结款金额',known?'¥0.04':first?'¥0.02':'—'],['单据来源','销售订单'],
                ['结款状态',tag(first?'待生成':x.status)],['付款账户',known||first?'6666000202016395':'—'],['收款户',known?'6666000202016395':'—'],['收款时间',known?'2026-09-06 15:07':'—'],
                ['订单数',h(x.orders)],['结算周期',h(x.cycle)],['审核时间',known?'2026-09-03 18:21':first?'2026-09-17 00:01':'—'],['审核人',known||first?'系统':'—'],
                ['创建时间',h(x.created)],['应付供应商净额',money(x.net)],['异常原因',first?'未配置供应商结算账户或结算主体':'—']];
            var basic='<div class="settle-description">'+fields.map(function(f){return '<div class="settle-description-item"><span>'+h(f[0])+'</span><strong>'+f[1]+'</strong></div>';}).join('')+'</div>';
            var currentRows=known?[
                '<tr><td>ORD-2609033597216-1</td><td>火龙果</td><td class="money">1</td><td class="money">¥0.03</td><td class="money">¥0.00</td><td class="money">¥0.00</td><td class="money">¥0.03</td></tr>',
                '<tr><td>ORD-2609033597216-1</td><td>白芭乐-快递-ss</td><td class="money">1</td><td class="money">¥0.01</td><td class="money">¥0.00</td><td class="money">¥0.00</td><td class="money">¥0.01</td></tr>'
            ]:first?[
                '<tr><td>ORD-2609104841852-3</td><td>低糖养乐多</td><td class="money">1</td><td class="money">¥0.02</td><td class="money">¥0.01</td><td class="money">¥0.00</td><td class="money">¥0.01</td></tr>',
                '<tr><td>ORD-2609112085695</td><td>马群-莲藕-快递配送</td><td class="money">1</td><td class="money">¥0.02</td><td class="money">¥0.01</td><td class="money">¥0.00</td><td class="money">¥0.01</td></tr>'
            ]:[];
            var current='<div class="settle-table-wrap"><table class="settle-table settle-grouped"><thead><tr><th rowspan="2">销售订单号</th><th rowspan="2">商品</th><th rowspan="2">数量</th><th colspan="1">应收（供应商收）</th><th colspan="2">应付（供应商付）</th><th rowspan="2">净额</th></tr><tr><th>货款(销售额)</th><th>平台服务费</th><th>分销佣金</th></tr></thead><tbody>'+(currentRows.length?currentRows.join(''):'<tr><td colspan="7" class="settle-empty">当前快照未收录该单明细</td></tr>')+'</tbody></table></div>'+
                (known||first?'<div class="settle-totals"><b>累计（共 2 单）</b><span>货款合计 <b>¥0.04</b></span><span>减·平台服务费 <b>¥'+(first?'0.02':'0.00')+'</b></span><span>减·分销佣金 <b>¥0.00</b></span><span>应付供应商净额 <b>¥'+(first?'0.02':'0.04')+'</b></span></div>':'');
            var payoutHead=['序号','销售主订单号','销售子订单号','商品编码','商品名称','规格/单位','数量','结算金额','供应商应收金额','实收金额','分配金额·平台服务费','分配金额·分销佣金','实分金额·平台服务费','实分金额·分销佣金','供应商预计净收','供应商留存','结算状态','入账状态','创建时间','结算时间','入账时间','付款流水号','异常'];
            var payoutRows=known?[
                ['1','ORD-2609033597216','ORD-2609033597216-1','SPU00196','火龙果','口味: 白心 / 袋','1','0.03','0.03','0.03','0.00','0.00','0.00','0.00','0.03','0.03','部分结款','—','2026-09-03 18:21','—','—','—','—'],
                ['2','ORD-2609033597216','ORD-2609033597216-1','SPU00184','白芭乐-快递-ss','重量: 100g / L','1','0.01','0.01','0.01','0.00','0.00','0.00','0.00','0.01','0.01','部分结款','—','2026-09-03 18:21','—','—','—','—']
            ]:first?[
                ['1','ORD-2609104841852-3','353852301770752223','SPU00204','低糖养乐多','口味: 低糖芒果味养乐多 / 箱','1','0.02','0.02','0.02','0.01','0.00','0.01','0.00','0.01','0.01','—','—','2026-09-17 00:01','—','—','--','查看异常'],
                ['2','ORD-2609112085695','353852301770752375','SPU00142','马群-莲藕-快递配送','口味: 粉糯莲藕 / 包','1','0.02','0.02','0.02','0.01','0.00','0.01','0.00','0.01','0.01','—','—','2026-09-17 00:01','—','—','--','查看异常']
            ]:[];
            var payoutFirst=payoutHead.slice(0,10).map(function(v){return '<th rowspan="2">'+h(v)+'</th>';}).join('')+'<th colspan="2">分配金额</th><th colspan="2">实分金额</th>'+payoutHead.slice(14).map(function(v){return '<th rowspan="2">'+h(v)+'</th>';}).join('');
            var payoutSecond='<th>平台服务费</th><th>分销佣金</th><th>平台服务费</th><th>分销佣金</th>';
            var payoutBody=payoutRows.map(function(r){return '<tr>'+r.map(function(v,i){return '<td'+([7,8,9,10,11,12,13,14,15].includes(i)?' class="money"':'')+'>'+(i===22&&v==='查看异常'?button('查看异常','supplier-exception',id):[7,8,9,10,11,12,13,14,15].includes(i)?cash(v):h(v))+'</td>';}).join('')+'</tr>';}).join('');
            var summaryValues=first?['0.04','0.04','0.04','0.02','0.00','0.02','0.00','0.02','0.02']:['0.04','0.04','0.04','0.00','0.00','0.00','0.00','0.04','0.04'];
            var payout='<div class="settle-table-wrap"><table class="settle-table settle-grouped"><thead><tr>'+payoutFirst+'</tr><tr>'+payoutSecond+'</tr></thead><tbody>'+
                (payoutBody||'<tr><td colspan="23" class="settle-empty">暂无数据</td></tr>')+
                (payoutRows.length?'<tr class="settle-summary-row"><td>累计</td>'+Array(6).fill('<td></td>').join('')+summaryValues.map(function(v){return '<td class="money">'+cash(v)+'</td>';}).join('')+Array(7).fill('<td></td>').join('')+'</tr>':'')+'</tbody></table></div>';
            var voucherRows=known?[
                ['1','收款','平台','斯斯供应商商家','ORD-2609033597216-1','0.01','待修复','订单关键数据缺失（SKU、门店归属、采购价等），无法计算分佣','2026-09-04 02:30'],
                ['2','收款','平台','斯斯供应商商家','ORD-2609033597216-1','0.02','已到账','—','2026-09-04 02:30'],
                ['3','收款','平台','斯斯供应商商家','ORD-2609033597216-1','0.01','待修复','订单关键数据缺失（SKU、门店归属、采购价等），无法计算分佣','2026-09-04 02:30']
            ]:[];
            var voucher=table(['序号','方向','付款方','收款方','关联订单','金额','状态','异常原因','时间'],voucherRows.map(function(r){return '<tr>'+r.map(function(v,i){return '<td>'+(i===5?cash(v):i===6?tag(v):h(v))+'</td>';}).join('')+'</tr>';}));
            return back+'<div class="settle-detail-header"><h2>供应商结算单详情</h2>'+tabs([['current','当前版'],['payments','付款清单']])+'</div>'+card('基础信息',basic)+
                card(state.tab==='current'?'订单明细':'明细列表',state.tab==='current'?current:payout)+card(state.tab==='current'?'收付款记录':'付款流水',voucher);
        }
        if (state.view==='commission') {
            var c=commissions.find(function(r){return r.id===id;}) || commissions[0];
            var firstClearing=c.id==='ST_358643444144418816';
            var lines=firstClearing?['<tr><td>2</td><td>ORD-2609104841852-3</td><td>低糖养乐多</td><td class="money">¥0.01</td></tr>',
                '<tr><td>1</td><td>ORD-2609112085695</td><td>马群-莲藕-快递配送</td><td class="money">¥0.01</td></tr>']:[];
            return back+'<div class="settle-detail-header"><h2>佣金结算单详情</h2></div>'+
                card('基础信息',description([['结款单号',h(c.id)],['收款方名称',h(firstClearing?'平台':c.payee)],['收款方类型',h(c.type)],['结算状态',tag(c.status)],
                    ['应收佣金合计',cash(c.amount)],['资金来源供应商',h(c.supplier)],['关联供应商结款单',h(c.related)],['创建时间',h(firstClearing?'2026-09-17T00:01:00':c.created)]]))+
                card('应收佣金明细',table(['序号','销售订单号','商品','应收佣金'],lines,firstClearing?'累计（共 2 单） · 应收佣金合计 ¥0.02':''))+
                card('收付款记录',table(['序号','方向','付款方','关联订单','金额','状态','异常原因','时间'],[]));
        }
        if (state.view==='compensation') {
            var p=compensations.find(function(r){return r.id===id;}) || compensations[0];
            var firstComp=p.id==='CST_2076953749068009474',actual=p.status==='已结款'?cash(p.amount):'¥0.00';
            return back+'<div class="settle-detail-header"><h2>补偿结款单详情</h2></div>'+
                card('基本信息',description([['结款单号',h(p.id)],['关联异常订单号',h(p.related)],['子订单号',firstComp?'333160760836358280':'—'],['补偿原因',h(p.type)],
                    ['应补偿金额',cash(p.amount)],['实补金额',actual],['补偿状态',tag(p.status)],['创建人',firstComp?'1':'—'],
                    ['收款方名称',h(p.payee)],['收款方类型',h(p.payeeType)],['收款帐户',h(p.payeeAccount)],['创建时间',h(p.created)]]))+
                card('付款账户信息',description([['付款方名称',h(p.payer)],['付款账户',h(p.payerAccount)],['帐户类型','异常佣金清算账户'],['创建时可用余额','—']]))+
                card('付款信息',description([['付款单号',firstComp?'CI_2076953749177061377':'—'],['付款流水号','--'],['应付金额',cash(p.amount)],['实付金额',actual],
                    ['状态',tag(p.status)],['创建时间',h(p.created)],['入账时间',h(p.time)],['备注','—']]));
        }
        var policy=policies.find(function(r){return r.id===id;}) || policies[0];
        return back + card('基本信息','<div class="settle-card-body">'+kv([['策略名称',h(policy.name)],['策略状态',tag(policy.status)],['订单业务类型',h(policy.kind)],['订单渠道',h(policy.channel)],['策略类型','按商品分佣'],['分佣基数',h(policy.basis)],['结算节点',h(policy.trigger)],['绑定门店',h(policy.stores)],['创建时间',h(policy.time)]])+'</div>',button('操作日志','policy-log',policy.id)) +
            card('扣减规则','<div class="settle-card-body">'+kv([['运费及仓储费','不参与分佣'],['供应商采购款','优先结算给供应商']])+'</div>') +
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
        app.innerHTML=state.view==='policy'&&state.policyMode?renderPolicyForm():state.detail?renderDetail():({summary:renderSummary,policy:renderPolicy,supplier:renderSupplier,commission:renderCommission,compensation:renderCompensation}[state.view])();
    }
    function openModal(title,body,wide,footer) {
        overlay.innerHTML='<div class="settle-overlay" data-overlay="1"><div class="settle-dialog'+(wide?' wide':'')+'" role="dialog" aria-modal="true"><div class="settle-dialog-head"><strong>'+h(title)+'</strong>'+button('✕','close')+'</div><div class="settle-dialog-body">'+body+'</div><div class="settle-dialog-foot">'+(footer||button('关闭','close','',''))+'</div></div></div>';
    }
    function openLogs(kind,id) {
        state.logKind=kind; state.logFilter=''; state.logResult='';state.policyLogId=id||'';
        var rows=kind==='general'?generalLogs:id==='POLICY_354560079879471104'?policyLogs:[];
        var title=kind==='general'?'结算通用配置 · 操作日志':'操作日志 · '+((policies.find(function(x){return x.id===id;})||policies[0]).name);
        overlay.innerHTML='<div class="settle-overlay" data-overlay="1"><div class="settle-drawer" role="dialog" aria-modal="true"><div class="settle-dialog-head"><strong>'+h(title)+'</strong>'+button('✕','close')+'</div><div class="settle-dialog-body"><div class="settle-filter" style="margin-bottom:16px"><label class="settle-field"><span>操作内容</span><input class="settle-input" id="log-query" placeholder="输入操作内容"></label><label class="settle-field"><span>操作结果</span><select class="settle-select" id="log-result"><option value="">全部</option><option>成功</option><option>失败</option></select></label>'+button('查询','log-search','','primary')+button('重置','log-reset','','')+'</div><div id="log-table">'+logTable(rows,kind)+'</div></div></div></div>';
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
        var data=[['统计日期/月份','收款方类型','收款方名称','收款方ID','应收佣金（元）','已结款金额（元）','待处理金额（元）','异常金额（元）','佣金单数','子订单数']].concat(rows.map(function(x){return [x.period,x.type,x.payee,x.id,x.total,x.settled,x.pending,x.blocked,x.statements,x.lines];}));
        var csv='\uFEFF'+data.map(function(row){return row.join(',');}).join('\r\n');
        var a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='分佣汇总-'+(state.tab==='month'?'MONTHLY':'DAILY')+'-'+new Date().toISOString().slice(0,10)+'.csv';a.click();setTimeout(function(){URL.revokeObjectURL(a.href);},1000);
    }
    app.addEventListener('click',function(e){
        var b=e.target.closest('[data-act]'); if(!b)return;
        var act=b.dataset.act,id=b.dataset.id||'';
        if(act==='tab'){state.tab=id;state.query='';state.status='';state.supplierSelection=[];state.supplierPage=1;state.policyMenu='';render();return;}
        if(act==='search'){state.query=(document.getElementById('settle-query')||{}).value||'';state.status=(document.getElementById('settle-status')||{}).value||'';if(state.view==='supplier'){state.supplierDateFrom=(document.getElementById('supplier-date-from')||{}).value||'';state.supplierDateTo=(document.getElementById('supplier-date-to')||{}).value||'';state.supplierPage=1;}if(state.view==='policy'){state.policyType=(document.getElementById('policy-type')||{}).value||'';state.policyStore=(document.getElementById('policy-store')||{}).value||'';}if(state.view==='summary'){state.summaryType=(document.getElementById('summary-type')||{}).value||'';state.summaryFrom=(document.getElementById('summary-from')||{}).value||'';state.summaryTo=(document.getElementById('summary-to')||{}).value||'';}if(state.view==='commission'){state.commissionType=(document.getElementById('commission-type')||{}).value||'';state.commissionRelated=(document.getElementById('commission-related')||{}).value||'';}if(state.view==='compensation'){state.compensationRelated=(document.getElementById('compensation-related')||{}).value||'';state.compensationPayee=(document.getElementById('compensation-payee')||{}).value||'';state.compensationType=(document.getElementById('compensation-type')||{}).value||'';}render();return;}
        if(act==='reset'){state.query='';state.status='';state.supplierPage=1;state.supplierDateFrom='';state.supplierDateTo='';state.policyType='';state.policyStore='';state.summaryType='';state.summaryFrom='';state.summaryTo='';state.commissionType='';state.commissionRelated='';state.compensationRelated='';state.compensationPayee='';state.compensationType='';render();return;}
        if(act==='supplier-page'){state.supplierPage=Number(id);render();return;}
        if(act==='detail'){state.view==='policy'?openPolicyPage('detail',id):navigate(id);return;}
        if(act==='back'){navigate('');return;}
        if(act==='supplier-exception'){openModal('异常详情',note('未配置供应商结算账户或结算主体'));return;}
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
        if(act==='save-config'){openModal('保存通用配置','确认保存当前结算通用配置？',false,button('取消','close','','')+button('确认保存','confirm-save','','primary'));return;}
        if(act==='export-summary'){exportSummary();return;}
        if(act==='manual'){var x=compensations.find(function(r){return r.id===id;})||compensations[0];openModal('人工结款','<div class="settle-policy-form">'+policyField('结款金额','<b>'+cash(x.amount)+'</b> <small>（默认清分待结算金额，不支持修改）</small>')+policyField('上传凭证','<input type="file" accept=".jpg,.jpeg,.png" multiple aria-label="上传凭证"><small>支持 JPG/JPEG/PNG，最多 3 张，单张 ≤ 10MB</small>')+policyField('备注','<textarea class="settle-input settle-textarea" maxlength="100" placeholder="选填，≤100 字"></textarea>')+'</div>',false,button('取消','close')+button('确定','confirm-demo','','primary'));return;}
        if(act==='retry'){openModal('重新执行','确认对单据 '+h(id)+' 重新执行？将重新校验供应商进件/账户，通过后即可加入结款单。',false,button('取消','close')+button('确认','confirm-demo','','primary'));return;}
        if(act==='submit'||act==='batch-submit'){var picked=act==='submit'?[id]:state.supplierSelection;var sum=picked.reduce(function(s,key){var row=supplierPending.find(function(x){return x.id===key;});return s+(row?Number(row.net):0);},0);openModal('新建结款单','共选择 '+picked.length+' 组数据（应付供应商净额合计 ¥'+sum.toFixed(2)+'），确认新建结款单？',false,button('取消','close')+button('确认','confirm-demo','','primary'));return;}
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
        if(act==='confirm-save'||act==='confirm-demo'){overlay.innerHTML='';return;}
    });
    app.addEventListener('input',function(e){if(e.target.dataset.policy && state.policyDraft && e.target.type!=='checkbox')state.policyDraft[e.target.dataset.policy]=e.target.value;});
    app.addEventListener('change',function(e){
        if(e.target.dataset.config)config[e.target.dataset.config]=e.target.value;
        if(e.target.dataset.selectSupplier){state.supplierSelection=e.target.checked?state.supplierSelection.concat(e.target.dataset.selectSupplier):state.supplierSelection.filter(function(id){return id!==e.target.dataset.selectSupplier;});render();}
        if(e.target.dataset.selectSupplierAll!==undefined){var list=state.tab==='pending'?supplierPending:[];var visible=list.slice((state.supplierPage-1)*20,state.supplierPage*20).map(function(x){return x.id;});state.supplierSelection=e.target.checked?Array.from(new Set(state.supplierSelection.concat(visible))):state.supplierSelection.filter(function(id){return !visible.includes(id);});render();}
        if(e.target.dataset.policy && state.policyDraft){state.policyDraft[e.target.dataset.policy]=e.target.type==='checkbox'?e.target.checked:e.target.value;}
        if(e.target.name==='orderType'||e.target.name==='channel'){state.policyDraft[e.target.name]=e.target.value;render();}
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
