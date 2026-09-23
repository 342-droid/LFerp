/* LFerp 结算工作台静态原型。数据为 Dev 页面观察到的代表性记录，不连接业务接口。 */
(function () {
    'use strict';
    var app = document.getElementById('settlement-app');
    var overlay = document.getElementById('settlement-overlay');
    if (!app) return;
    var names = {summary:'清分汇总', policy:'佣金策略', supplier:'供应商结算', commission:'佣金清算', compensation:'补偿结款'};
    var params = new URLSearchParams(location.search);
    var state = {
        view: names[params.get('view')] ? params.get('view') : 'summary',
        detail: params.get('detail') || '',
        tab: params.get('tab') || '',
        query: '',
        status: '',
        logKind: '',
        logFilter: ''
    };
    var supplierPending = [
        {id:'ST_358643443066482688', supplier:'南京供应商', type:'—', goods:'0.04', payable:'0.02', net:'0.02', orders:'2', status:'待提交', created:'—'}
    ];
    var supplierStatements = [
        {id:'ST_357556279620669440', supplier:'斯斯', type:'—', goods:'0.50', payable:'0.49', net:'0.01', orders:'—', status:'待结款', created:'—'},
        {id:'ST_354657178541367296', supplier:'—', type:'—', goods:'—', payable:'—', net:'—', orders:'—', status:'已结款', created:'—'},
        {id:'ST_353846837167284224', supplier:'—', type:'—', goods:'0.04', payable:'—', net:'0.04', orders:'1', status:'部分结款', created:'—'}
    ];
    var commissions = [
        {id:'ST_354657179292147712', supplier:'—', payee:'平台', type:'平台', amount:'0.29', orders:'—', status:'已销账', posting:'已到账', related:'ST_354657178541367296', created:'2026-09-06 00:01:00'}
    ];
    var summaryDay = [
        {period:'2026-09-17', payee:'平台', type:'平台', id:'1', total:'0.02', settled:'—', pending:'—', blocked:'0.02', statements:'—', lines:'—'}
    ];
    var summaryMonth = [
        {period:'2026-09', payee:'平台', type:'平台', id:'1', total:'—', settled:'—', pending:'—', blocked:'—', statements:'—', lines:'—'}
    ];
    var compensations = [
        {id:'CST_2076953749068009474', type:'入账异常补偿', related:'ST_2076928530167214082', amount:'0.05', payer:'平台二级账户', payee:'斯斯门店商家2', status:'待结款', time:'—'}
    ];
    var policies = [
        {id:'POLICY_354560079879471104', name:'乐事', kind:'零售订单', channel:'商城', basis:'实付金额', trigger:'履约确认后', rule:'毛利率≥1%，门店1% / BD1% / 直播0% / 商家0%，平台拿剩余', stores:'1', status:'启用', time:'2026-09-05'},
        {id:'PROCUREMENT_SAMPLE', name:'代采商城结算策略', kind:'代采订单', channel:'商城', basis:'实付金额', trigger:'履约确认后', rule:'毛利率≥3%，BD2%；毛利率≥6%，BD5%', stores:'—', status:'停用', time:'—'}
    ];
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
            '</tr></thead><tbody>' + (rows.length ? rows.join('') : '<tr><td colspan="' + head.length + '" class="settle-empty">当前示例未收录记录</td></tr>') +
            '</tbody></table></div>' + (foot ? '<div class="settle-table-footer">' + foot + '</div>' : '');
    }
    function card(title, body, actions) { return '<section class="settle-card"><div class="settle-card-head"><h2>' + h(title) + '</h2><div class="settle-actions">' + (actions || '') + '</div></div>' + body + '</section>'; }
    function kv(items) { return '<dl class="settle-kv">' + items.map(function(x){return '<div class="settle-kv-item"><dt>' + h(x[0]) + '</dt><dd>' + x[1] + '</dd></div>';}).join('') + '</dl>'; }
    function tabs(items) { return '<div class="settle-tabs">' + items.map(function(x){return '<button type="button" class="settle-tab' + (state.tab === x[0] ? ' active' : '') + '" data-act="tab" data-id="' + h(x[0]) + '">' + h(x[1]) + '</button>';}).join('') + '</div>'; }
    function filter(opts) {
        return '<div class="settle-card-body"><div class="settle-filter">' +
            '<label class="settle-field"><span>关键词</span><input class="settle-input" id="settle-query" value="' + h(state.query) + '" placeholder="' + h(opts.placeholder || '编号 / 名称') + '"></label>' +
            (opts.statuses ? '<label class="settle-field"><span>状态</span><select class="settle-select" id="settle-status"><option value="">全部状态</option>' + opts.statuses.map(function(x){return '<option value="' + h(x) + '"' + (state.status === x ? ' selected' : '') + '>' + h(x) + '</option>';}).join('') + '</select></label>' : '') +
            '<div class="settle-actions">' + button('查询','search','','primary') + button('重置','reset','','') + '</div></div></div>';
    }
    function filtered(rows, fields) { var q=state.query.trim().toLowerCase(); return rows.filter(function(row){return (!q || fields.some(function(f){return String(row[f] || '').toLowerCase().includes(q);})) && (!state.status || row.status === state.status);}); }
    function note(text) { return '<div class="settle-note">' + h(text) + '</div>'; }
    function renderSummary() {
        if (!state.tab) state.tab='day';
        var rows = filtered(state.tab === 'month' ? summaryMonth : summaryDay,['period','payee','id']);
        var tr = rows.map(function(x){return '<tr><td>' + h(x.period) + '</td><td>' + h(x.type) + '</td><td>' + h(x.payee) + '</td><td>' + h(x.id) + '</td><td class="money">' + cash(x.total) + '</td><td class="money">' + cash(x.settled) + '</td><td class="money">' + cash(x.pending) + '</td><td class="money">' + cash(x.blocked) + '</td><td>' + h(x.statements) + '</td><td>' + h(x.lines) + '</td></tr>';});
        return tabs([['day','日汇总'],['month','月汇总']]) +
            card('清分汇总', '<div class="settle-card-body">' + note('按佣金清算单汇总供应商向收款方的佣金；不包含账户余额、提现和退款。') + '</div>' + filter({placeholder:'收款方 / ID'}) +
            table(['周期','收款方类型','收款方','收款方 ID','应收佣金','已结金额','待结金额','异常金额','清算单数','明细数'],tr,'展示 ' + rows.length + ' 条样例 · 实际共 ' + (state.tab==='month'?'26':'123') + ' 条'),button('导出 CSV','export-summary','',''));
    }
    function renderSupplier() {
        if (!state.tab) state.tab='pending';
        var pending=state.tab==='pending', rows=filtered(pending?supplierPending:supplierStatements,['id','supplier']);
        var tr=rows.map(function(x){return '<tr><td>' + button(x.id,'detail',x.id) + '</td><td>' + h(x.supplier) + '</td><td>' + h(x.type) + '</td><td class="money">' + cash(x.goods) + '</td><td class="money">' + cash(x.payable) + '</td><td class="money">' + cash(x.net) + '</td><td>' + h(x.orders) + '</td><td>' + tag(x.status) + '</td><td>' + h(x.created) + '</td><td class="settle-actions">' + button('查看详情','detail',x.id) + (pending ? button('加入结款单','submit',x.id) : '') + '</td></tr>';});
        return tabs([['pending','待处理'],['statement','结算单']]) +
            card(pending?'待处理供应商结算':'供应商结算单',filter({placeholder:'结算单号 / 供应商',statuses:pending?['待提交']:['待结款','部分结款','已结款']}) +
            table(['结算单号','供应商','类型','商品金额','应付金额','净额','订单数','状态','创建时间','操作'],tr,'展示 ' + rows.length + ' 条样例 · 实际共 ' + (pending?'43':'49') + ' 条'));
    }
    function renderCommission() {
        var rows=filtered(commissions,['id','supplier','payee','related']);
        var tr=rows.map(function(x){return '<tr><td>' + button(x.id,'detail',x.id) + '</td><td>' + h(x.supplier) + '</td><td>' + h(x.payee) + '</td><td>' + h(x.type) + '</td><td class="money">¥' + h(x.amount) + '</td><td>' + h(x.orders) + '</td><td>' + tag(x.status) + '</td><td>' + tag(x.posting) + '</td><td>' + h(x.related) + '</td><td>' + h(x.created) + '</td><td>' + button('查看详情','detail',x.id) + '</td></tr>';});
        return card('佣金清算单',filter({placeholder:'清算单号 / 收款方 / 关联结算单',statuses:['待销账','已销账']}) +
            table(['清算单号','供应商','收款方','收款方类型','应收佣金','子订单数','清算状态','入账状态','关联供应商结算单','创建时间','操作'],tr,'展示 ' + rows.length + ' 条样例 · 实际共 182 条'));
    }
    function renderCompensation() {
        var rows=filtered(compensations,['id','related','payee']);
        var tr=rows.map(function(x){return '<tr><td>' + button(x.id,'detail',x.id) + '</td><td>' + h(x.type) + '</td><td>' + h(x.related) + '</td><td class="money">¥' + h(x.amount) + '</td><td>' + h(x.payer) + '</td><td>' + h(x.payee) + '</td><td>' + tag(x.status) + '</td><td>' + h(x.time) + '</td><td class="settle-actions">' + button('查看详情','detail',x.id) + (x.status==='待结款'?button('人工结款','manual',x.id):'') + '</td></tr>';});
        return card('补偿结款单',filter({placeholder:'补偿单号 / 关联结算单',statuses:['待结款','已结款']}) +
            table(['补偿单号','类型','关联结算单','补偿金额','付款方','收款方','状态','完成时间','操作'],tr,'展示 ' + rows.length + ' 条样例 · 实际共 7 条'));
    }
    function renderPolicy() {
        if (!state.tab) state.tab='retail';
        if (state.tab==='config') return tabs([['retail','零售订单策略'],['procurement','代采订单策略'],['config','通用配置']]) + renderConfig();
        var rows=filtered(policies.filter(function(x){return x.kind===(state.tab==='retail'?'零售订单':'代采订单');}),['id','name','channel']);
        var tr=rows.map(function(x){return '<tr><td>' + button(x.name,'detail',x.id) + '</td><td>' + h(x.kind) + '</td><td>' + h(x.channel) + '</td><td>' + h(x.basis) + '</td><td>' + h(x.trigger) + '</td><td class="wrap">' + h(x.rule) + '</td><td>' + h(x.stores) + '</td><td>' + tag(x.status) + '</td><td>' + h(x.time) + '</td><td class="settle-actions">' + button('门店绑定','binding',x.id) + button(x.status==='启用'?'停用':'启用','toggle-policy',x.id) + button('操作日志','policy-log',x.id) + '</td></tr>';});
        return tabs([['retail','零售订单策略'],['procurement','代采订单策略'],['config','通用配置']]) +
            card('佣金策略',filter({placeholder:'策略名称 / 编号',statuses:['启用','停用']}) +
            table(['策略名称','订单业务类型','订单渠道','分佣基数','结算节点','规则摘要','绑定门店','状态','创建时间','操作'],tr,'展示 ' + rows.length + ' 条样例 · 实际共 ' + (state.tab==='retail'?'15':'1') + ' 条'),button('新建策略','new-policy','','primary'));
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
            var basic=kv([['结算单号',h(x.id)],['供应商',h(x.supplier)],['结算类型',h(x.type)],['结算状态',tag(x.status)],['商品金额',x.goods==='—'?'—':'¥'+h(x.goods)],['应付金额',x.payable==='—'?'—':'¥'+h(x.payable)],['净额',x.net==='—'?'—':'¥'+h(x.net)],['订单数',h(x.orders)],['来源','零售订单'],['结算周期','—'],['创建时间',h(x.created)],['付款账户','—']]);
            var current=table(['订单号','商品','数量','销售金额','平台服务费','分销佣金','供应商结算净额'],[
                '<tr><td>ORD-2609033597216-1</td><td>火龙果</td><td>1</td><td class="money">¥0.03</td><td class="money">¥0.00</td><td class="money">¥0.00</td><td class="money">¥0.03</td></tr>',
                '<tr><td>ORD-2609033597216-1</td><td>白芭乐</td><td>1</td><td class="money">¥0.01</td><td class="money">¥0.00</td><td class="money">¥0.00</td><td class="money">¥0.01</td></tr>'
            ],'1 个订单 · 2 条商品明细');
            if (id !== 'ST_353846837167284224') current='<div class="settle-empty">当前示例未收录该结算单的订单明细</div>';
            var payments=table(['主订单号','子订单号','商品名称','分摊佣金','实际佣金','留存金额','入账状态','支付流水号'],[
                '<tr><td>ORD-2609033597216</td><td>ORD-2609033597216-1</td><td>火龙果</td><td>¥0.00</td><td>¥0.00</td><td>¥0.03</td><td>' + tag('已入账') + '</td><td>—</td></tr>',
                '<tr><td>ORD-2609033597216</td><td>ORD-2609033597216-1</td><td>白芭乐</td><td>¥0.00</td><td>¥0.00</td><td>¥0.01</td><td>' + tag('已入账') + '</td><td>—</td></tr>'
            ]);
            if (id !== 'ST_353846837167284224') payments='<div class="settle-empty">当前示例未收录该结算单的付款清单</div>';
            if(!state.tab || !['current','payments'].includes(state.tab)) state.tab='current';
            return back + card('基本信息','<div class="settle-card-body">'+basic+'</div>') + tabs([['current','当前版'],['payments','付款清单']]) +
                card(state.tab==='current'?'订单明细':'付款清单',state.tab==='current'?current:payments) +
                card('付款记录',table(['付款时间','付款金额','付款方式','操作人','备注'],[]));
        }
        if (state.view==='commission') {
            var c=commissions.find(function(r){return r.id===id;}) || commissions[0];
            return back + card('基本信息','<div class="settle-card-body">'+kv([['清算单号',h(c.id)],['供应商',h(c.supplier)],['收款方',h(c.payee)],['收款方类型',h(c.type)],['应收佣金','¥'+h(c.amount)],['子订单数',h(c.orders)],['清算状态',tag(c.status)],['入账状态',tag(c.posting)],['关联供应商结算单',h(c.related)],['创建时间',h(c.created)]])+'</div>') +
                card('应收佣金明细',table(['子订单号','收款方','应收佣金','已结金额','入账状态'],[])) +
                card('付款记录',table(['付款时间','付款金额','付款方','状态'],[]));
        }
        if (state.view==='compensation') {
            var p=compensations.find(function(r){return r.id===id;}) || compensations[0];
            return back + card('基本信息','<div class="settle-card-body">'+kv([['补偿单号',h(p.id)],['类型',h(p.type)],['关联结算单',h(p.related)],['补偿金额','¥'+h(p.amount)],['结款状态',tag(p.status)],['子订单号','333160760836358280'],['创建时间',h(p.time)]])+'</div>',p.status==='待结款'?button('人工结款','manual',p.id,'primary'):'') +
                card('付款账户信息','<div class="settle-card-body">'+kv([['付款账户',h(p.payer)],['收款账户',h(p.payee)],['应付金额','¥'+h(p.amount)],['实际付款金额',p.status==='已结款'?'¥'+h(p.amount):'—']])+'</div>') +
                card('付款信息',table(['付款流水号','付款时间','付款金额','付款状态'],[]));
        }
        var policy=policies.find(function(r){return r.id===id;}) || policies[0];
        return back + card('基本信息','<div class="settle-card-body">'+kv([['策略名称',h(policy.name)],['策略状态',tag(policy.status)],['订单业务类型',h(policy.kind)],['订单渠道',h(policy.channel)],['策略类型','按商品分佣'],['分佣基数',h(policy.basis)],['结算节点',h(policy.trigger)],['绑定门店',h(policy.stores)],['创建时间',h(policy.time)]])+'</div>',button('操作日志','policy-log',policy.id)) +
            card('扣减规则','<div class="settle-card-body">'+kv([['运费及仓储费','不参与分佣'],['供应商采购款','优先结算给供应商']])+'</div>') +
            card('策略配置',table(['规则名称','计算方式','结算规则','参与商品','操作'],['<tr><td>'+h(policy.name)+'</td><td>按毛利率阶梯</td><td class="wrap">'+h(policy.rule)+'</td><td>部分商品（1）</td><td>'+button('查看','rule',policy.id)+'</td></tr>']));
    }
    function navigate(detail) {
        state.detail=detail || ''; state.query=''; state.status=''; state.tab='';
        var q=new URLSearchParams({view:state.view});
        if(state.detail) q.set('detail',state.detail);
        history.pushState(null,'',location.pathname+'?'+q.toString());
        render();
    }
    function render() {
        document.getElementById('settle-title').textContent='结算 / '+names[state.view]+(state.detail?' / '+detailTitle():'');
        document.title='冷丰结算 - '+names[state.view];
        app.innerHTML=state.detail?renderDetail():({summary:renderSummary,policy:renderPolicy,supplier:renderSupplier,commission:renderCommission,compensation:renderCompensation}[state.view])();
    }
    function openModal(title,body,wide,footer) {
        overlay.innerHTML='<div class="settle-overlay" data-overlay="1"><div class="settle-dialog'+(wide?' wide':'')+'" role="dialog" aria-modal="true"><div class="settle-dialog-head"><strong>'+h(title)+'</strong>'+button('✕','close')+'</div><div class="settle-dialog-body">'+body+'</div><div class="settle-dialog-foot">'+(footer||button('关闭','close','',''))+'</div></div></div>';
    }
    function openLogs(kind,id) {
        state.logKind=kind; state.logFilter=''; state.logResult='';
        var rows=kind==='general'?generalLogs:policyLogs;
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
        var data=[['周期','收款方类型','收款方','收款方ID','应收佣金','已结金额','待结金额','异常金额','清算单数','明细数']].concat(rows.map(function(x){return [x.period,x.type,x.payee,x.id,x.total,x.settled,x.pending,x.blocked,x.statements,x.lines];}));
        var csv='\uFEFF'+data.map(function(row){return row.join(',');}).join('\r\n');
        var a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='清分汇总-'+state.tab+'.csv';a.click();setTimeout(function(){URL.revokeObjectURL(a.href);},1000);
    }
    app.addEventListener('click',function(e){
        var b=e.target.closest('[data-act]'); if(!b)return;
        var act=b.dataset.act,id=b.dataset.id||'';
        if(act==='tab'){state.tab=id;state.query='';state.status='';render();return;}
        if(act==='search'){state.query=(document.getElementById('settle-query')||{}).value||'';state.status=(document.getElementById('settle-status')||{}).value||'';render();return;}
        if(act==='reset'){state.query='';state.status='';render();return;}
        if(act==='detail'){navigate(id);return;}
        if(act==='back'){navigate('');return;}
        if(act==='general-log'){openLogs('general');return;}
        if(act==='policy-log'){openLogs('policy',id);return;}
        if(act==='switch'){config[id]=!config[id];render();return;}
        if(act==='save-config'){openModal('保存通用配置','确认保存当前结算通用配置？',false,button('取消','close','','')+button('确认保存','confirm-save','','primary'));return;}
        if(act==='export-summary'){exportSummary();return;}
        if(act==='manual'){var x=compensations.find(function(r){return r.id===id;})||compensations[0];openModal('人工结款','<div class="settle-filter"><label class="settle-field"><span>结款金额</span><input class="settle-input" value="¥'+h(x.amount)+'" disabled></label><label class="settle-field"><span>付款凭证（最多 3 张）</span><input class="settle-input" type="file" accept="image/png,image/jpeg" multiple></label><label class="settle-field" style="width:100%"><span>备注（100 字以内）</span><input class="settle-input" maxlength="100" placeholder="请输入备注"></label></div>',false,button('取消','close','','')+button('确认结款','confirm-demo','','primary'));return;}
        if(act==='submit'){openModal('加入结款单','结算单 '+h(id)+' 将加入结款单。',false,button('取消','close','','')+button('确认','confirm-demo','','primary'));return;}
        if(act==='toggle-policy'){var target=policies.find(function(r){return r.id===id;});if(target){target.status=target.status==='启用'?'停用':'启用';render();}return;}
        if(act==='binding'){openModal('门店绑定','<div class="settle-note">当前策略绑定门店数：1。可按门店检索并调整绑定关系。</div>',false);return;}
        if(act==='rule'){var p=policies.find(function(r){return r.id===id;})||policies[0];openModal('结算规则',note(p.rule),false);return;}
        if(act==='new-policy'){openModal('新建佣金策略','<div class="settle-filter"><label class="settle-field"><span>策略名称</span><input class="settle-input" placeholder="输入策略名称"></label><label class="settle-field"><span>订单业务类型</span><select class="settle-select"><option>零售订单</option><option>代采订单</option></select></label><label class="settle-field"><span>订单渠道</span><select class="settle-select"><option>商城</option><option>直播</option></select></label></div>',false);return;}
    });
    overlay.addEventListener('click',function(e){
        var b=e.target.closest('[data-act]'); var act=b&&b.dataset.act, id=b&&b.dataset.id||'';
        if(e.target.dataset.overlay||act==='close'){overlay.innerHTML='';return;}
        if(act==='log-detail'){detailLog(id);return;}
        if(act==='restore-log'){overlay.innerHTML=overlay.dataset.previous||'';return;}
        if(act==='log-search'||act==='log-reset'){state.logFilter=act==='log-reset'?'':(document.getElementById('log-query')||{}).value||'';state.logResult=act==='log-reset'?'':(document.getElementById('log-result')||{}).value||'';if(act==='log-reset'){document.getElementById('log-query').value='';document.getElementById('log-result').value='';}document.getElementById('log-table').innerHTML=logTable(state.logKind==='general'?generalLogs:policyLogs,state.logKind);return;}
        if(act==='confirm-save'||act==='confirm-demo'){overlay.innerHTML='';return;}
    });
    app.addEventListener('change',function(e){if(e.target.dataset.config)config[e.target.dataset.config]=e.target.value;});
    window.addEventListener('popstate',function(){var p=new URLSearchParams(location.search);state.view=names[p.get('view')]?p.get('view'):'summary';state.detail=p.get('detail')||'';state.tab='';render();});
    render();
})();
