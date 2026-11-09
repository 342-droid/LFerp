/**
 * 操作日志（共用）— 按 UAT 实际组件还原
 * - 通用业务日志抽屉（BusinessOperationLogDrawer）：MdmOplog.open(scene, { resourceId, resourceName })
 * - 门店详情「操作日志」页签（StoreOperationLogTab）：MdmOplog.renderStoreTab(store)
 * - 页面入口：任意元素加 data-oplog-scene="场景"，可选 data-oplog-id / data-oplog-name，点击即打开
 * 场景、操作类型、字段名取自 UAT 字典（js/mdm-oplog-dict.js），日志为原型模拟数据。
 */
(function (global) {
    'use strict';

    var DICT = global.MdmOplogDict || { scenes: {}, values: {} };
    var SCENES = DICT.scenes;
    var VALUES = DICT.values;

    /* 门店详情页签（UAT StoreOperationLogTab）的操作类型 */
    var STORE_SCENE = {
        title: '门店档案', resource: 'store',
        actions: { 'store.create': '创建门店', 'store.saveDraft': '保存门店草稿', 'store.update': '修改门店', 'store.submit': '提交门店', 'store.delete': '删除门店', 'store.updateWithdrawPhone': '修改提现手机号', 'onboarding.submit': '进件提交', 'onboarding.draft': '进件草稿', 'onboarding.subSubject': '子主体独立进件' },
        fields: { storeName: '门店名称', storeShortName: '门店简称', businessHours: '营业时间', withdrawPhone: '提现手机号', address: '详细地址' }
    };

    /* 模拟数据：每个场景的对象名 */
    var NAMES = {
        merchantSubject: ['冷丰杭州总店', '南京鲜达商贸', '华东供应链有限公司'], supplier: ['华东供应链', '舟山海鲜直供'], orgWarehouse: ['华东一号仓', '苏州冷链仓'],
        product: ['智利车厘子 JJ 级 2.5kg', '舟山带鱼 500g', '赣南脐橙 5kg'], productCategory: ['生鲜 / 水果', '水产 / 鱼类'], mallCategory: ['时令水果', '冷冻水产'],
        liveSession: ['双11 生鲜专场'], shippingFee: ['华东标准运费', '自提免运费'], protocol: ['用户协议', '隐私协议'], recommendation: ['新人专享推荐位', '首页轮播-双11'],
        orderConfig: ['平台订单配置', '冷丰杭州总店'], memberLevelPolicy: ['会员等级政策 v3'], growthPolicy: ['成长值规则'], store: ['冷丰杭州总店']
    };
    var SAMPLE = {
        orgName: ['冷丰杭州总店', '杭州总店'], contactName: ['张三', '李四'], contactPhone: ['138****1024', '139****8866'], address: ['西湖区文三路 90 号', '西湖区文一西路 588 号'],
        province: ['浙江省', '浙江省'], city: ['杭州市', '杭州市'], district: ['西湖区', '拱墅区'], orgId: ['AG10086', 'AG10086'], agreementCode: ['—', 'AGR-20261106-0003'],
        agreementAlias: ['杭州总店', '冷丰杭州总店'], warehouseName: ['华东一号仓', '华东中心仓'], warehouseCode: ['WH-HZ-01', 'WH-HZ-01'], categoryName: ['生鲜', '生鲜水果'],
        sessionName: ['双11 生鲜专场', '双11 生鲜专场（加场）'], startsAt: ['2026-11-11 19:00:00', '2026-11-11 20:00:00'], endsAt: ['2026-11-11 22:00:00', '2026-11-11 23:00:00'],
        intro: ['车厘子限时秒杀', '车厘子、帝王蟹限时秒杀'], regions: ['浙江省 / 杭州市', '浙江省 / 杭州市、宁波市'], stores: ['共 12 家', '共 15 家'], liveTimePeriodName: ['晚场 19:00–22:00', '晚场 20:00–23:00'],
        templateName: ['华东标准运费', '华东标准运费（冬季）'], templateCode: ['FT-HD-001', 'FT-HD-001'], feeAmount: ['8.00 元', '6.00 元'], goodsAmountMin: ['0.00 元', '0.00 元'], goodsAmountMax: ['59.00 元', '79.00 元'],
        regionPath: ['浙江省 / 杭州市', '浙江省 / 杭州市 / 西湖区'], tierLines: ['第 1 档：浙江省 / 杭州市 0.00 至 59.00 元，运费 8.00 元', '第 1 档：浙江省 / 杭州市 0.00 至 79.00 元，运费 6.00 元'],
        title: ['冷丰商城用户服务协议 v3', '冷丰商城用户服务协议 v4'], protocolVersion: ['v3', 'v4'], content: ['（原正文，略）', '（新正文，略）'], linkTargetName: ['智利车厘子 JJ 级', '满 59 减 10 券'],
        couponTemplateName: ['满 39 减 5 券', '满 59 减 10 券'], effectiveStartTime: ['2026-11-01 00:00:00', '2026-11-05 00:00:00'], effectiveEndTime: ['2026-11-30 23:59:59', '2026-12-15 23:59:59'],
        levelName: ['银卡会员', '金卡会员'], levelCode: ['V2', 'V2'], growthThreshold: ['500', '800'], amountUnitYuan: ['10 元', '20 元'], growthPerUnit: ['1', '2'], validityDays: ['365', '730'],
        cutoverAt: ['—', '2026-12-01 00:00:00'], activeRuleVersionNo: ['3', '4'],
        businessHours: ['跟随平台', '09:00–21:00'], withdrawPhone: ['138****1024', '186****3301'], remark: ['—', '冬季调价']
    };
    var OPERATORS = ['杨欣如', '张晓琳', '李运营', '王审核', '陈财务', '超级管理员'];
    var IPS = ['10.12.3.41', '10.12.3.58', '172.16.8.20', '10.12.5.103'];

    var seed = 20261109;
    function rand() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    function pick(a) { return a[Math.floor(rand() * a.length)]; }
    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    function timeAgo(days) {
        var d = new Date(Date.now() - Math.floor(rand() * days * 86400000));
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }
    function hex(n) { var s = ''; for (var i = 0; i < n; i++) s += '0123456789abcdef'[Math.floor(rand() * 16)]; return s; }
    function longId() { var s = '37'; for (var i = 0; i < 16; i++) s += Math.floor(rand() * 10); return s; }
    function esc(v) {
        return String(v == null || v === '' ? '—' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function sceneDef(key) { return key === 'store' ? STORE_SCENE : SCENES[key]; }

    function sample(field, label, name) {
        if (SAMPLE[field]) return SAMPLE[field];
        if ((field === 'name' || /Name$/.test(field)) && name) return [name, name + '（调整）'];
        var map = VALUES[field];
        if (map) { var vs = Object.keys(map).map(function (k) { return map[k]; }); if (vs.length > 1) return [vs[0], vs[1]]; }
        if (/Time|At$|From$|To$/.test(field)) return ['2026-10-01 00:00:00', '2026-12-31 23:59:59'];
        return ['原' + label, '新' + label];
    }

    function makeChanges(def, label, name) {
        var fields = Object.keys(def.fields || {});
        if (!fields.length) return [];
        var create = /^(新增|新建|创建|绑定|上传|发布)/.test(label);
        var del = /^(删除|解绑)/.test(label);
        var status = /(启用|禁用|停用|上架|下架|状态|开始直播|结束直播|显示)/.test(label);
        var statusFields = fields.filter(function (f) { return /status|Status|enabled|visibleFlag/.test(f); });
        var sf = statusFields.filter(function (f) { return f === 'enabled' || f === 'status'; })[0] || statusFields[0];
        if (status && sf) {
            var sv = sample(sf, def.fields[sf], name);
            var NEG = /(禁用|停用|下架|关闭|已结束|草稿|隐藏|未开始)/;
            var neg = NEG.test(sv[0]) ? sv[0] : sv[1], pos = neg === sv[0] ? sv[1] : sv[0];
            var toNeg = /(禁用|停用|下架|结束)/.test(label);
            return [{ field: def.fields[sf], before: toNeg ? pos : neg, after: toNeg ? neg : pos }];
        }
        var n = create ? Math.min(fields.length, 5) : 1 + Math.floor(rand() * 2);
        var start = create ? 0 : Math.floor(rand() * Math.max(fields.length - n, 1));
        return fields.slice(start, start + n).map(function (f) {
            var v = sample(f, def.fields[f], name);
            return { field: def.fields[f], before: create ? '—' : v[0], after: del ? '—' : v[1] };
        });
    }

    function makeLog(scene, opts) {
        var def = sceneDef(scene);
        var keys = Object.keys(def.actions || {});
        var action = keys.length ? pick(keys) : scene + '.update';
        var label = (def.actions || {})[action] || '其他操作';
        var success = rand() > 0.12;
        var name = opts.resourceName || pick(NAMES[scene] || [def.title]);
        var rid = opts.resourceId || longId();
        var res = [].concat(def.resource || scene)[0];
        var svc = /growth|member/.test(res) ? 'member-core' : /live/.test(res) ? 'live-core' : /fee/.test(res) ? 'settlement-core' : /spu|sku|category|mall/i.test(res) ? 'product-core' : 'system-core';
        var verb = action.split('.').pop();
        var method = /delete|unbind/i.test(verb) ? 'DELETE' : /create|schedule|bind|publish|Draft/i.test(verb) ? 'POST' : 'PUT';
        return {
            id: 'mol-' + hex(12), scene: scene, action: action, actionLabel: label, timestamp: opts.time || timeAgo(30),
            operator: pick(OPERATORS), resourceId: rid, resourceName: name, success: success,
            errorMessage: success ? '' : pick(['名称已存在，请修改后重试', '数据已被他人修改，请刷新后重试', '无该操作权限', '关联数据校验未通过']),
            changes: success ? makeChanges(def, label, name) : [],
            service: svc, httpMethod: method,
            requestUri: '/' + svc + '/v1/' + res.replace(/\./g, '/') + '/' + verb.replace(/[A-Z]/g, function (c) { return '-' + c.toLowerCase(); }).replace(/_/g, '-'),
            clientIp: pick(IPS), elapsedMs: 20 + Math.floor(rand() * 600), traceId: hex(32),
            requestParams: JSON.stringify([{ id: rid, name: name, contactPhone: '138****8952', smsCode: '••••••' }], null, 2)
        };
    }

    var cache = {};
    function logsFor(scene, opts) {
        var key = scene + '|' + (opts.resourceId || '') + '|' + (opts.resourceName || '');
        if (!cache[key]) {
            seed = 0;
            for (var c = 0; c < key.length; c++) seed = (seed * 31 + key.charCodeAt(c)) % 233280;
            var list = [];
            var n = opts.resourceId || opts.resourceName ? 8 + Math.floor(rand() * 8) : 24 + Math.floor(rand() * 10);
            for (var i = 0; i < n; i++) list.push(makeLog(scene, opts));
            list.sort(function (a, b) { return a.timestamp < b.timestamp ? 1 : -1; });
            cache[key] = list;
        }
        return cache[key];
    }

    /* ---------- 弹层 ---------- */
    function layer(cls, html, top) {
        var mask = document.createElement('div');
        mask.className = 'mol-mask' + (top ? ' mol-mask--top' : '');
        var box = document.createElement('div');
        box.className = cls;
        box.innerHTML = html;
        document.body.appendChild(mask);
        document.body.appendChild(box);
        function close() { mask.remove(); box.remove(); }
        mask.addEventListener('click', function () { if (!top) close(); });
        box.addEventListener('click', function (e) { if (e.target.closest('[data-mol-close]')) close(); });
        box._molClose = close;
        return box;
    }
    function resultTag(ok) { return '<span class="mol-tag ' + (ok === false ? 'mol-tag--danger' : 'mol-tag--success') + '">' + (ok === false ? '失败' : '成功') + '</span>'; }
    function desc(rows) {
        var h = '';
        for (var i = 0; i < rows.length; i++) {
            var a = rows[i];
            if (a[2]) { h += '<tr><th>' + esc(a[0]) + '</th><td colspan="3">' + esc(a[1]) + '</td></tr>'; continue; }
            var b = rows[i + 1] && !rows[i + 1][2] ? rows[++i] : null;
            h += '<tr><th>' + esc(a[0]) + '</th><td>' + esc(a[1]) + '</td>' + (b ? '<th>' + esc(b[0]) + '</th><td>' + esc(b[1]) + '</td>' : '<td colspan="2"></td>') + '</tr>';
        }
        return '<table class="mol-desc"><tbody>' + h + '</tbody></table>';
    }
    function changeTable(changes, first) {
        if (!changes.length) return '<div class="mol-empty">无字段级变更</div>';
        return '<table class="mol-table mol-table--bordered"><thead><tr><th>' + first + '</th><th>变更前</th><th>变更后</th></tr></thead><tbody>' +
            changes.map(function (c) { return '<tr><td>' + esc(c.field) + '</td><td><span class="mol-before">' + esc(c.before) + '</span></td><td><span class="mol-after">' + esc(c.after) + '</span></td></tr>'; }).join('') +
            '</tbody></table>';
    }
    function bizCell(scene, l) {
        if (scene === 'generalSettlement') return { primary: '平台' };
        if (scene === 'liveSettings') return { primary: '全局直播配置' };
        return { primary: l.resourceName || l.resourceId, secondary: l.resourceName ? l.resourceId : '' };
    }
    function bizLabel(scene) { return scene === 'shippingFee' ? '费用模板' : scene === 'liveSettings' ? '配置对象' : '业务编号'; }

    /* 通用详情弹窗（UAT：760px，基础信息 + 变更明细 + 技术信息） */
    function openDetail(scene, l) {
        var b = bizCell(scene, l);
        var html = '<div class="mol-detail-head">' + resultTag(l.success) + '<strong>' + esc(l.actionLabel) + '</strong></div>' +
            desc([['操作时间', l.timestamp], ['操作人', l.operator], [bizLabel(scene), b.primary + (b.secondary ? '（' + b.secondary + '）' : '')], ['操作结果', l.success ? '成功' : '失败']]) +
            '<div class="mol-section-title">变更明细 <span>（共 ' + l.changes.length + ' 项）</span></div>' +
            (l.changes.length ? '<div class="mol-group-title">' + esc(sceneDef(scene).title) + '</div>' : '') + changeTable(l.changes, '变更项') +
            (l.success === false && l.errorMessage ? '<div class="mol-alert">' + esc(l.errorMessage) + '</div>' : '') +
            '<details class="mol-collapse"><summary>技术信息</summary>' +
            desc([['后台动作标识', l.action], ['来源服务', l.service], ['请求方式', l.httpMethod], ['接口路径', l.requestUri], ['客户端 IP', l.clientIp], ['处理耗时', l.elapsedMs + ' 毫秒'], ['TraceID', l.traceId, true]]) +
            '<pre class="mol-pre">' + esc(l.requestParams || '未记录请求参数') + '</pre></details>';
        layer('mol-dialog', '<div class="mol-dialog__head">操作日志详情<button type="button" class="mol-close" data-mol-close aria-label="关闭">×</button></div>' +
            '<div class="mol-dialog__body">' + html + '</div><div class="mol-dialog__foot"><button type="button" class="mol-btn" data-mol-close>关闭</button></div>', true);
    }

    /* 字段级详情（门店详情页签：资源对象 + 请求参数） */
    function openFieldDetail(l) {
        var html = '<div class="mol-detail-head">' + resultTag(l.success) + '<strong>' + esc(l.actionLabel) + '</strong><small>TraceID ' + esc(l.traceId) + '</small></div>' +
            desc([['操作时间', l.timestamp], ['操作人', l.operator], ['资源对象', 'store-' + l.resourceId], ['客户端IP', l.clientIp], ['来源服务', l.service], ['耗时', l.elapsedMs + ' ms']]) +
            '<div class="mol-section-title">变更明细 <span>（共 ' + l.changes.length + ' 个字段）</span></div>' + changeTable(l.changes, '字段') +
            (l.success === false ? '<div class="mol-alert">错误信息：' + esc(l.errorMessage) + '</div>' : '') +
            '<div class="mol-section-title">请求参数</div><div class="mol-method">' + esc(l.httpMethod + ' ' + l.requestUri) + '</div><pre class="mol-pre">' + esc(l.requestParams) + '</pre>';
        layer('mol-dialog', '<div class="mol-dialog__head">操作日志详情<button type="button" class="mol-close" data-mol-close aria-label="关闭">×</button></div>' +
            '<div class="mol-dialog__body">' + html + '</div><div class="mol-dialog__foot"><button type="button" class="mol-btn" data-mol-close>关闭</button></div>', true);
    }

    function pager(total, page, size) {
        var pages = Math.max(1, Math.ceil(total / size));
        var h = '<span>共 ' + total + ' 条</span><button type="button" data-mol-page="' + (page - 1) + '"' + (page <= 1 ? ' disabled' : '') + '>‹</button>';
        for (var p = 1; p <= pages; p++) h += '<button type="button" data-mol-page="' + p + '"' + (p === page ? ' class="is-active"' : '') + '>' + p + '</button>';
        return h + '<button type="button" data-mol-page="' + (page + 1) + '"' + (page >= pages ? ' disabled' : '') + '>›</button>';
    }
    function actionOptions(def) {
        return Object.keys(def.actions || {}).map(function (k) { return '<option value="' + esc(k) + '">' + esc(def.actions[k]) + '</option>'; }).join('');
    }

    /* ---------- 通用业务日志抽屉 ---------- */
    function open(scene, opts) {
        opts = opts || {};
        var def = sceneDef(scene);
        if (!def) return;
        var obj = opts.resourceName || opts.resourceId;
        var logs = logsFor(scene, opts);
        var st = { page: 1, size: 20, action: '', success: '', kw: '' };
        var keyword = scene === 'shippingFee' && !opts.resourceId;
        var box = layer('mol-drawer',
            '<div class="mol-drawer__head"><span class="mol-drawer__title">' + esc(def.title + ' · 操作日志' + (obj ? ' · ' + obj : '')) + '</span>' +
            '<button type="button" class="mol-close" data-mol-close aria-label="关闭">×</button></div>' +
            '<div class="mol-drawer__body"><div class="mol-filter">' +
            (keyword ? '<input class="mol-input" data-mol-f="kw" placeholder="模板名称 / ID">' : '') +
            '<select class="mol-select" data-mol-f="action"><option value="">操作类型</option>' + actionOptions(def) + '</select>' +
            '<select class="mol-select" data-mol-f="success"><option value="">操作结果</option><option value="1">成功</option><option value="0">失败</option></select>' +
            '<button type="button" class="mol-btn mol-btn--primary" data-mol-act="query">查询</button><button type="button" class="mol-btn" data-mol-act="reset">重置</button></div>' +
            '<table class="mol-table"><thead><tr><th>操作时间</th><th>操作内容</th><th>操作人</th><th>' + bizLabel(scene) + '</th><th class="is-center">结果</th><th class="is-center">操作</th></tr></thead><tbody data-mol-body></tbody></table>' +
            '<div class="mol-pager" data-mol-pager></div></div>');
        function render() {
            var list = logs.filter(function (l) {
                return (!st.action || l.action === st.action) && (st.success === '' || String(l.success ? 1 : 0) === st.success) &&
                    (!st.kw || (l.resourceName + l.resourceId).indexOf(st.kw) >= 0);
            });
            var rows = list.slice((st.page - 1) * st.size, st.page * st.size);
            box.querySelector('[data-mol-body]').innerHTML = rows.length ? rows.map(function (l) {
                var b = bizCell(scene, l);
                return '<tr><td>' + esc(l.timestamp) + '</td><td>' + esc(l.actionLabel) + '</td><td>' + esc(l.operator) + '</td>' +
                    '<td>' + esc(b.primary) + (b.secondary ? '<span class="mol-sub">' + esc(b.secondary) + '</span>' : '') + '</td>' +
                    '<td class="is-center">' + resultTag(l.success) + '</td><td class="is-center"><button type="button" class="mol-link" data-mol-detail="' + l.id + '">查看详情</button></td></tr>';
            }).join('') : '<tr><td colspan="6" class="mol-empty">暂无操作记录</td></tr>';
            box.querySelector('[data-mol-pager]').innerHTML = pager(list.length, st.page, st.size);
        }
        box.addEventListener('click', function (e) {
            var t = e.target;
            if (t.dataset.molDetail) openDetail(scene, logs.filter(function (l) { return l.id === t.dataset.molDetail; })[0]);
            if (t.dataset.molPage && !t.disabled) { st.page = +t.dataset.molPage; render(); }
            if (t.dataset.molAct === 'query') {
                st.action = box.querySelector('[data-mol-f="action"]').value; st.success = box.querySelector('[data-mol-f="success"]').value;
                var kw = box.querySelector('[data-mol-f="kw"]'); st.kw = kw ? kw.value.trim() : ''; st.page = 1; render();
            }
            if (t.dataset.molAct === 'reset') { box.querySelectorAll('[data-mol-f]').forEach(function (x) { x.value = ''; }); st.action = st.success = st.kw = ''; st.page = 1; render(); }
        });
        render();
    }

    /* ---------- 门店详情「操作日志」页签 ---------- */
    function renderStoreTab(store) {
        store = store || {};
        var opts = { resourceId: store.storeId || store.id || '', resourceName: store.name || '' };
        var logs = logsFor('store', opts);
        var root = document.createElement('div');
        root.className = 'mol-tab';
        var st = { action: '', success: '', from: '', to: '' };
        root.innerHTML = '<div class="mol-filter">' +
            '<select class="mol-select" data-mol-f="action"><option value="">操作类型</option>' + actionOptions(STORE_SCENE) + '</select>' +
            '<select class="mol-select" data-mol-f="success"><option value="">操作结果</option><option value="1">成功</option><option value="0">失败</option></select>' +
            '<input type="date" class="mol-input mol-input--date" data-mol-f="from" aria-label="开始日期"><span>至</span><input type="date" class="mol-input mol-input--date" data-mol-f="to" aria-label="结束日期">' +
            '<button type="button" class="mol-btn mol-btn--primary" data-mol-act="query">查询</button><button type="button" class="mol-btn" data-mol-act="reset">重置</button></div>' +
            '<table class="mol-table"><thead><tr><th>操作时间</th><th>操作内容</th><th>操作人</th><th>资源对象</th><th>方法</th><th class="is-center">结果</th><th class="is-center">操作</th></tr></thead><tbody data-mol-body></tbody></table>' +
            '<div class="mol-pager" data-mol-pager></div>';
        function render() {
            var list = logs.filter(function (l) {
                var day = l.timestamp.slice(0, 10);
                return (!st.action || l.action === st.action) && (st.success === '' || String(l.success ? 1 : 0) === st.success) &&
                    (!st.from || day >= st.from) && (!st.to || day <= st.to);
            });
            root.querySelector('[data-mol-body]').innerHTML = list.length ? list.map(function (l) {
                return '<tr><td>' + esc(l.timestamp) + '</td><td>' + esc(l.actionLabel) + '</td><td>' + esc(l.operator) + '</td><td>' + esc('store-' + l.resourceId) + '</td>' +
                    '<td><span class="mol-method">' + esc(l.httpMethod + ' ' + l.requestUri) + '</span></td><td class="is-center">' + resultTag(l.success) + '</td>' +
                    '<td class="is-center"><button type="button" class="mol-link" data-mol-detail="' + l.id + '">查看详情</button></td></tr>';
            }).join('') : '<tr><td colspan="7" class="mol-empty">暂无数据</td></tr>';
            root.querySelector('[data-mol-pager]').innerHTML = pager(list.length, 1, 20);
        }
        root.addEventListener('click', function (e) {
            var t = e.target;
            if (t.dataset.molDetail) openFieldDetail(logs.filter(function (l) { return l.id === t.dataset.molDetail; })[0]);
            if (t.dataset.molAct === 'query') ['action', 'success', 'from', 'to'].forEach(function (k) { st[k] = root.querySelector('[data-mol-f="' + k + '"]').value; });
            if (t.dataset.molAct === 'reset') { root.querySelectorAll('[data-mol-f]').forEach(function (x) { x.value = ''; }); st = { action: '', success: '', from: '', to: '' }; }
            if (t.dataset.molAct) render();
        });
        render();
        return root;
    }

    /* 页面入口：data-oplog-scene */
    document.addEventListener('click', function (e) {
        var t = e.target.closest && e.target.closest('[data-oplog-scene]');
        if (!t) return;
        e.preventDefault();
        open(t.getAttribute('data-oplog-scene'), { resourceId: t.getAttribute('data-oplog-id') || '', resourceName: t.getAttribute('data-oplog-name') || '' });
    });
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        var boxes = document.querySelectorAll('.mol-dialog, .mol-drawer');
        if (boxes.length) boxes[boxes.length - 1]._molClose();
    });

    global.MdmOplog = { open: open, renderStoreTab: renderStoreTab };
})(window);
