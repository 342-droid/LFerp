/**
 * 基础设置 - 操作日志
 * 1. 全局日志：汇总 UAT 各模块审计日志（/system-core/v1/audit-log）统一查询
 * 2. 入口清单：UAT 现有全部操作日志入口，按实际样式还原预览
 */
(function (global) {
    'use strict';

    var DICT = global.OplogUatDict || { scenes: {}, values: {} };
    var SCENES = DICT.scenes;
    var VALUES = DICT.values;

    /* ---------- 工具 ---------- */
    function esc(v) {
        return String(v == null || v === '' ? '—' : v)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    var seed = 20261109;
    function rand() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    function pick(arr) { return arr[Math.floor(rand() * arr.length)]; }
    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    function fmt(d) {
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' +
            pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }
    var NOW = new Date('2026-11-09T11:30:00+08:00').getTime();
    function timeAgo(maxDays) { return fmt(new Date(NOW - Math.floor(rand() * maxDays * 86400000))); }
    function traceId() { var s = ''; for (var i = 0; i < 32; i++) s += '0123456789abcdef'[Math.floor(rand() * 16)]; return s; }

    var OPERATORS = ['马国斌', '张晓琳', '李运营', '王审核', '陈财务', '超级管理员'];
    var IPS = ['10.12.3.41', '10.12.3.58', '172.16.8.20', '10.12.5.103'];

    /* ---------- 日志样式（UAT 实际组件） ---------- */
    var STYLES = {
        A: { name: '通用业务日志抽屉', comp: 'BusinessOperationLogDrawer', desc: '70% 抽屉；操作类型 + 操作结果筛选；列表 操作时间/操作内容/操作人/业务编号/结果；详情弹窗含变更明细与折叠「技术信息」' },
        B: { name: '营销模板日志', comp: 'MarketingTemplateOperationLogPanel', desc: '抽屉标题「操作日志 · 对象名」；列表含「方法」列；详情含查询对象、客户端IP、来源服务、耗时、请求参数' },
        C: { name: '结算策略日志', comp: 'SettlementPolicyOperationLogPanel', desc: '列表「更多 → 操作日志」抽屉 + 编辑/详情页「操作日志」卡片；筛选含时间范围；详情含资源对象' },
        D: { name: '门店详情日志页签', comp: 'StoreOperationLogTab', desc: '门店详情抽屉/页的「操作日志」页签；筛选 操作类型/操作结果/时间；列表含资源对象、方法' },
        E: { name: '审核日志抽屉', comp: 'ReviewOperationLogDrawer', desc: '50% 抽屉「操作日志 - 名称」；取审核单 auditHistory；列 操作时间/操作内容/操作人/说明/结果；不分页' },
        F: { name: '红包模版日志抽屉', comp: 'TemplateLogDrawer', desc: '抽屉「操作日志 - 模版名」；接口 cash-redpack/template/operation-logs；列 操作时间/操作内容/操作人/说明/结果' },
        G: { name: '详情页时间线', comp: 'OrderDetailPage / DetailDrawer', desc: '订单、售后、退款详情页可折叠卡片「操作日志」；时间线展示节点、摘要、操作人；核销节点展示提货明细' }
    };

    /* ---------- 非通用场景的操作类型（取自 UAT 组件） ---------- */
    var EXTRA_SCENES = {
        marketingTemplate: { title: '模版配置', actions: { 'activity.create': '创建模板', 'activity.update': '修改模板', 'activity.activate': '启用模板', 'activity.pause': '禁用模板' },
            fields: { name: '模板名称', status: '状态', validFrom: '有效期起', validTo: '有效期止', totalStock: '发放数量', applicableChannel: '适用渠道' } },
        couponApproval: { title: '优惠券启用审核', actions: { 'coupon.create': '创建模板', 'coupon.update': '修改模板', 'coupon.approve': '确认启用', 'coupon.pause': '禁用模板' },
            fields: { couponType: '优惠券类型', denomination: '面额', threshold: '门槛', itemScope: '适用商品', perUserLimit: '每人限领', stackable: '是否可叠加' } },
        settlementPolicy: { title: '佣金策略', actions: { 'policy.create': '创建策略', 'policy.update': '修改策略', 'policy.copy': '复制策略', 'policy.enable': '启用策略', 'policy.disable': '停用策略', 'policy.terminate': '终止策略', 'policy.delete': '删除策略', 'policy.replace': '策略替换', 'policy.storeBinding': '门店绑定变更', 'policy.rule.create': '新增规则行', 'policy.rule.update': '修改规则行', 'policy.rule.delete': '删除规则行' },
            fields: { strategyName: '策略名称', strategyType: '策略类型', channel: '适用渠道', storeScope: '门店范围', settleNode: '结算节点', settleCycle: '结算周期', status: '状态' } },
        store: { title: '门店档案', actions: { 'store.create': '创建门店', 'store.saveDraft': '保存门店草稿', 'store.update': '修改门店', 'store.submit': '提交门店', 'store.delete': '删除门店', 'store.updateWithdrawPhone': '修改提现手机号', 'onboarding.submit': '进件提交', 'onboarding.draft': '进件草稿', 'onboarding.subSubject': '子主体独立进件' },
            fields: { storeName: '门店名称', storeShortName: '门店简称', businessHours: '营业时间', withdrawPhone: '提现手机号', address: '详细地址' } }
    };

    /* ---------- 入口清单（UAT 实际页面） ---------- */
    var ENTRIES = [
        ['业务伙伴', '所有主体（商家管理）', '列表工具栏「操作日志」', 'A', 'merchantSubject', '模块级：查询全部商家主体'],
        ['业务伙伴', '门店档案 → 门店详情', '详情「操作日志」页签', 'D', 'store', '单门店'],
        ['业务伙伴', '门店档案 → 汇付商户绑定', '商户绑定区「操作日志」按钮', 'A', 'paymentMerchant', '单门店'],
        ['业务伙伴', '供应商档案', '列表工具栏「操作日志」', 'A', 'supplier', '模块级（UAT 未配置操作类型字典，内容统一显示「其他操作」）'],
        ['业务伙伴', '仓库档案（仓库列表）', '列表工具栏「操作日志」', 'A', 'orgWarehouse', '模块级'],
        ['商品', '选品库', '列表工具栏「操作日志」', 'A', 'product', '模块级（SPU / SKU 合并查询）'],
        ['商品', '商品类目', '页面顶部「操作日志」', 'A', 'productCategory', '模块级'],
        ['商品', '商城类目', '页面顶部「操作日志」', 'A', 'mallCategory', '模块级'],
        ['营销', '模版配置', '行操作「操作日志」', 'B', 'marketingTemplate', '单模板'],
        ['营销', '现金红包模版', '行操作「操作日志」/「更多 → 操作日志」', 'F', 'redpackTemplate', '单模版'],
        ['审核中心', '优惠券启用审核', '审核详情内日志面板', 'B', 'couponApproval', '单券'],
        ['审核中心', '现金红包审核', '行操作「更多 → 操作日志」', 'E', 'redpackApproval', '单审核单'],
        ['审核中心', '派发红包审核', '行操作「更多 → 操作日志」', 'E', 'redpackManualApproval', '单审核单'],
        ['直播', '直播场次', '列表行操作 / 编辑页「操作日志」', 'A', 'liveSession', '单场次'],
        ['直播', '直播配置', '页面顶部「操作日志」', 'A', 'liveSettings', '全局配置（违禁词 + 直播运行配置合并查询）'],
        ['订单', '直播订单 → 订单详情', '详情「操作日志」卡片', 'G', 'orderLive', '单订单'],
        ['订单', '商城订单 → 订单详情', '详情「操作日志」卡片', 'G', 'orderMall', '单订单'],
        ['订单', '代采订单 → 订单详情', '详情「操作日志」卡片', 'G', 'orderProxy', '单订单'],
        ['订单', '零售订单 → 订单详情', '详情「操作日志」卡片（含核销提货明细）', 'G', 'orderRetail', '单订单'],
        ['售后', '售后单 → 售后详情', '详情「操作日志」卡片', 'G', 'afterSale', '单售后单'],
        ['售后', '退款单管理 → 退款详情', '详情「操作日志」卡片', 'G', 'refund', '单退款单'],
        ['结算', '佣金策略', '列表「更多 → 操作日志」+ 编辑/详情页「操作日志」卡片', 'C', 'settlementPolicy', '单策略'],
        ['结算', '结算通用配置', '页面顶部「操作日志」', 'A', 'generalSettlement', '平台级'],
        ['结算', '运费配置', '列表「操作日志」+ 编辑抽屉「基本信息」右上角', 'A', 'shippingFee', '模块级（可按模板名称 / ID 搜索）或单模板'],
        ['基础设置', '协议配置', '页面「操作日志」', 'A', 'protocol', '模块级'],
        ['基础设置', '平台信息', '页面「操作日志」', 'A', 'platformInfo', '平台级'],
        ['基础设置', '推荐位配置', '列表工具栏「操作日志」', 'A', 'recommendation', '模块级'],
        ['基础设置', '订单配置', '页面「操作日志」', 'A', 'orderConfig', '平台 / 门店配置'],
        ['会员配置', '会员等级', '页面「操作日志」', 'A', 'memberLevelPolicy', '政策级'],
        ['会员配置', '成长值规则', '页面「操作日志」', 'A', 'growthPolicy', '租户级'],
        ['会员配置', '积分规则', '页面「操作日志」', 'A', 'pointsPolicy', '租户级'],
        ['会员配置', '消费送积分', '列表「操作日志」', 'A', 'pointsConsume', '模块级 / 单规则'],
        ['会员配置', '积分抵现', '列表「操作日志」', 'A', 'pointsCash', '模块级 / 单规则'],
        ['会员配置', '悦玲积分导入', '页面「操作日志」', 'A', 'pointsImport', '固定对象「悦玲积分导入」'],
        ['基础设置', 'APP版本管理', '页面「操作日志」', 'A', 'appRelease', '模块级'],
        ['系统管理', '组织管理', '工具栏「操作日志」', 'A', 'org', '模块级'],
        ['系统管理', '用户管理', '工具栏「操作日志」', 'A', 'systemUser', '模块级'],
        ['系统管理', '角色管理', '工具栏「操作日志」', 'A', 'role', '模块级'],
        ['系统管理', '菜单管理', '工具栏「操作日志」', 'A', 'menu', '模块级'],
        ['系统管理', '字典管理', '工具栏「操作日志」', 'A', 'dict', '模块级（字典类型 + 字典项合并查询）'],
        ['消息配置中心', '消息模板管理', '工具栏「操作日志」', 'A', 'msgTemplate', '模块级'],
        ['仓储', '仓库管理（基础数据）', '工具栏「操作日志」', 'A', 'warehouse', '模块级']
    ].map(function (r, i) {
        return { no: i + 1, menu: r[0], page: r[1], entry: r[2], style: r[3], scene: r[4], scope: r[5] };
    });

    /* 知识库《操作日志》PRD 规划、UAT 尚未落地的场景 */
    var KB_GAPS = [
        ['进件 / 入网', '进件提交、审核通过、审核驳回、重新提交', '审核中心 → 进件审核'],
        ['商户进件（BD 工作台）', '商户进件提交、BD 预审通过/驳回、负责人终审通过/驳回', 'BD 工作台'],
        ['BD 管理', 'BD 新增、编辑、上下级调整、银行卡修改、删除', '人员中心 → BD'],
        ['分佣账户', '账户创建、启用、禁用、余额调整、删除', '结算 → 分佣账户'],
        ['结算单', '结算单生成、确认结算/分账、标记/取消异常、删除', '结算 → 对账结算 / 佣金清算'],
        ['素材管理', '素材新增、编辑、下线、批量下线、删除；素材类型新增、删除', '基础设置 → 素材管理'],
        ['安全与权限', '登录、角色授权、角色回收、权限变更', '系统管理'],
        ['消息渠道', '消息渠道配置保存', '消息配置中心 → 触发机制 / 渠道'],
        ['商城优惠券 / 秒杀', '优惠券新建、编辑、启停；秒杀活动新增、编辑、上下架', '营销 → 商城营销（UAT 仅优惠券启用审核有日志）']
    ];

    /* ---------- 模拟变更值 ---------- */
    var SAMPLE = {
        orgName: ['冷丰杭州总店', '杭州总店'], storeShortName: ['冷丰杭州总店', '杭州总店'], contactName: ['张三', '李四'],
        contactPhone: ['138****1024', '139****8866'], address: ['西湖区文三路 90 号', '西湖区文一西路 588 号'],
        sessionName: ['双11 生鲜专场', '双11 生鲜专场（加场）'], startsAt: ['2026-11-11 19:00:00', '2026-11-11 20:00:00'],
        endsAt: ['2026-11-11 22:00:00', '2026-11-11 23:00:00'], words: ['共 12 个：微信、私聊…', '共 14 个：微信、私聊、加V…'],
        perPointAmount: ['0.01 元', '0.02 元'], maxRatio: ['10%', '20%'], maxAmount: ['50.00 元', '80.00 元'],
        amountPerPoint: ['10.00 元', '5.00 元'], validityDays: ['365', '730'], templateName: ['华东标准运费', '华东标准运费（冬季）'],
        feeAmount: ['8.00 元', '6.00 元'], warehouseName: ['华东一号仓', '华东中心仓'],
        warehouseCode: ['WH-HZ-01', 'WH-HZ-01'], nickName: ['运营小王', '运营王五'], roleName: ['运营专员', '高级运营'],
        menuName: ['订单配置', '订单与履约配置'], cycleValue: ['7 天', '15 天'], minPayAmountCent: ['1.00 元', '2.00 元'],
        strategyName: ['华东门店分佣', '华东门店分佣 2026Q4'], settleCycle: ['每周', '每月'], storeName: ['冷丰杭州总店', '冷丰杭州总店'],
        businessHours: ['跟随平台', '09:00–21:00'], withdrawPhone: ['138****1024', '186****3301'], denomination: ['5 元', '10 元'],
        threshold: ['满 39 元', '满 59 元'], totalStock: ['1000', '2000'], amountUnitYuan: ['10 元', '20 元'], growthPerUnit: ['1', '2'],
        itemScope: ['全部商品', '指定商品'], perUserLimit: ['1', '2'], couponType: ['满减券', '折扣券'], stackable: ['不可叠加', '可叠加'],
        applicableChannel: ['全部渠道', '仅直播'], validFrom: ['2026-11-01', '2026-11-10'], validTo: ['2026-11-30', '2026-12-15'],
        strategyType: ['商品分佣', '业务分成'], storeScope: ['全部门店', '指定门店'], settleNode: ['订单完成', '售后期结束'],
        withdraw: ['138****1024', '186****3301'], categoryName: ['生鲜', '生鲜水果'], code: ['ORDER_SOURCE_LIVE', 'ORDER_SOURCE_LIVE'],
        label: ['直播', '直播下单'], roleCode: ['OPS', 'OPS'], username: ['wangxiao', 'wangxiao'], nickname: ['运营小王', '运营王五'],
        phone: ['138****1024', '186****3301'], orgType: ['自定义部门', '自定义部门'], path: ['/config/orderConfig', '/config/order'],
        title: ['冷丰用户协议 v3', '冷丰用户协议 v4'], protocolVersion: ['v3', 'v4'], icpNo: ['浙ICP备2026000001号', '浙ICP备2026000001号-2'],
        serviceHours: ['09:00–18:00', '08:30–21:00'], levelName: ['银卡会员', '金卡会员'], growthThreshold: ['500', '800'],
        intro: ['双11 生鲜专场，车厘子限时秒杀', '双11 生鲜专场，车厘子、帝王蟹限时秒杀'], liveTimePeriodName: ['晚场 19:00–22:00', '晚场 20:00–23:00'],
        regions: ['浙江省 / 杭州市', '浙江省 / 杭州市、宁波市'], stores: ['共 12 家', '共 15 家'], saleScope: ['全部区域', '指定门店'],
        saleStores: ['共 3 家：冷丰杭州总店…', '共 5 家：冷丰杭州总店…'], portScope: ['全部端口', '指定端口'], productScope: ['全部商品', '指定商品'],
        lessThanOne: ['四舍五入', '忽略'], linkTargetName: ['智利车厘子 JJ 级', '双11 生鲜专场'], effectiveStartTime: ['2026-11-01 00:00:00', '2026-11-05 00:00:00'],
        effectiveEndTime: ['2026-11-30 23:59:59', '2026-12-15 23:59:59'], batchNo: ['—', 'YL20261109001'], templateCode: ['FT-HD-001', 'FT-HD-001'],
        goodsAmountMin: ['0.00 元', '0.00 元'], goodsAmountMax: ['59.00 元', '79.00 元'], regionPath: ['浙江省 / 杭州市', '浙江省 / 杭州市 / 西湖区'],
        tierLines: ['第 1 档：浙江省 / 杭州市 0.00 至 59.00 元，运费 8.00 元', '第 1 档：浙江省 / 杭州市 0.00 至 79.00 元，运费 6.00 元'],
        statementGenTime: ['每日 02:00', '每日 03:00'], paymentExecHours: ['24 小时', '48 小时'], ruleDescription: ['消费 1 元得 1 积分', '消费 1 元得 1 积分，积分有效期 1 年'],
        content: ['（原正文，略）', '（新正文，略）'], province: ['浙江省', '浙江省'], city: ['杭州市', '杭州市'], district: ['西湖区', '拱墅区'], orgId: ['AG10086', 'AG10086'], saleRegions: ['浙江省 / 杭州市', '浙江省 / 杭州市、宁波市'], saleRegionSummary: ['浙江省 / 杭州市', '浙江省 / 杭州市、宁波市'], typeName: ['订单来源', '订单来源渠道']
    };
    function sampleValue(field, label) {
        if (SAMPLE[field]) return SAMPLE[field].slice();
        var map = VALUES[field];
        if (map) { var vs = Object.keys(map).map(function (k) { return map[k]; }); if (vs.length > 1) return [vs[0], vs[1]]; }
        if (/Time|At$|From$|To$/.test(field)) return ['2026-10-01 00:00:00', '2026-12-31 23:59:59'];
        if (/enabled|Switch|Enabled|status|Status/.test(field)) return ['开启', '关闭'];
        return ['原' + label, '新' + label];
    }

    function sceneDef(key) { return SCENES[key] || EXTRA_SCENES[key] || null; }

    function makeChanges(scene, actionLabel, name) {
        var def = sceneDef(scene); if (!def) return [];
        var fields = Object.keys(def.fields || {});
        if (!fields.length) return [];
        var isCreate = /^(新增|新建|创建|绑定|上传)/.test(actionLabel);
        var isDelete = /^(删除|解绑|移出)/.test(actionLabel);
        var isStatus = /(启用|禁用|停用|上架|下架|状态|封停|开始直播|结束直播|终止|确认启用)/.test(actionLabel);
        var statusFields = fields.filter(function (f) { return /status|Status|enabled/.test(f); });
        var statusField = statusFields.filter(function (f) { return f === 'enabled' || f === 'status'; })[0] || statusFields[0];
        if (isStatus && statusField) {
            var sv = sampleValue(statusField, def.fields[statusField]);
            var NEG = /(禁用|停用|下架|关闭|封停|已结束|终止|草稿|隐藏)/;
            var neg = NEG.test(sv[0]) ? sv[0] : sv[1], pos = neg === sv[0] ? sv[1] : sv[0];
            var toNeg = /(禁用|停用|下架|封停|结束|终止)/.test(actionLabel);
            return [{ field: def.fields[statusField], before: toNeg ? pos : neg, after: toNeg ? neg : pos }];
        }
        var n = isCreate ? Math.min(fields.length, 4) : 1 + Math.floor(rand() * 2);
        var start = Math.floor(rand() * Math.max(fields.length - n, 1));
        return fields.slice(start, start + n).map(function (f) {
            var v = (f === 'name' || /Name$/.test(f)) && name && !SAMPLE[f] ? [name, name + '（调整）'] : sampleValue(f, def.fields[f]);
            return { field: def.fields[f], before: isCreate ? '—' : v[0], after: isDelete ? '—' : (isCreate ? v[1] : v[1]) };
        });
    }

    var RESOURCE_NAMES = {
        merchantSubject: ['冷丰杭州总店', '南京鲜达商贸', '华东供应链'], paymentMerchant: ['冷丰杭州总店'], supplier: ['华东供应链', '舟山海鲜直供'],
        orgWarehouse: ['华东一号仓', '苏州冷链仓'], product: ['智利车厘子 JJ 级 2.5kg', '舟山带鱼 500g'], productCategory: ['生鲜 / 水果', '水产 / 鱼类'],
        mallCategory: ['时令水果', '冷冻水产'], liveSession: ['双11 生鲜专场', '周末海鲜专场'], liveSettings: ['全局直播配置'],
        generalSettlement: ['平台'], shippingFee: ['华东标准运费', '自提免运费'], protocol: ['用户协议', '隐私协议'], platformInfo: ['冷丰'],
        recommendation: ['新人专享推荐位', '首页轮播-双11'], orderConfig: ['平台订单配置', '冷丰杭州总店'], memberLevelPolicy: ['会员等级政策 v3'],
        growthPolicy: ['成长值规则'], pointsPolicy: ['积分规则'], pointsConsume: ['双11 消费送积分', '日常消费送积分'], pointsCash: ['积分抵现-全端'],
        pointsImport: ['悦玲积分导入'], appRelease: ['冷丰门店端 v2.6.0'], org: ['华东大区', '杭州运营部'], systemUser: ['运营小王', '张晓琳'],
        role: ['运营专员', '财务结算'], menu: ['订单配置', '会员配置'], dict: ['订单来源', '售后原因'], msgTemplate: ['订单发货通知', '优惠券到账提醒'],
        warehouse: ['华东一号仓'], marketingTemplate: ['自动领取福袋', '整点签到'], couponApproval: ['满 59 减 10 券'], settlementPolicy: ['华东门店分佣'],
        store: ['冷丰杭州总店']
    };
    var BUSINESS_PREFIX = { merchantSubject: 'AG', product: 'SPU', liveSession: 'LS', shippingFee: 'FT', store: 'ST', settlementPolicy: 'CP', marketingTemplate: 'MT', couponApproval: 'CT' };

    function makeLog(scene, opts) {
        opts = opts || {};
        var def = sceneDef(scene);
        var keys = Object.keys(def.actions || {});
        var actionKey = opts.action || (keys.length ? pick(keys) : scene + '.update');
        var label = (def.actions || {})[actionKey] || '其他操作';
        var success = opts.success != null ? opts.success : rand() > 0.12;
        var names = RESOURCE_NAMES[scene] || [def.title];
        var name = opts.resourceName || pick(names);
        var rid = (BUSINESS_PREFIX[scene] || 'ID') + (100000 + Math.floor(rand() * 899999));
        var res = Array.isArray(def.resource) ? def.resource[0] : (def.resource || scene);
        var svc = /points|growth|member/.test(res) ? 'member-core' : /live/.test(res) ? 'live-core' : /fee|settlement|policy/.test(res) ? 'settlement-core' : /activity|coupon/.test(actionKey) ? 'marketing-core' : /spu|category|mall/.test(res) ? 'product-core' : 'system-core';
        var method = /delete|unbind/.test(actionKey) ? 'DELETE' : /create|schedule|bind|upload/.test(actionKey) ? 'POST' : 'PUT';
        var changes = success ? makeChanges(scene, label, name) : [];
        return {
            id: 'log-' + Math.floor(rand() * 1e9),
            scene: scene, module: def.title, action: actionKey, actionLabel: label,
            timestamp: opts.time || timeAgo(30), operator: pick(OPERATORS), userId: 10000 + Math.floor(rand() * 900),
            resourceId: rid, resourceName: name, success: success,
            errorMessage: success ? '' : pick(['名称已存在，请修改后重试', '数据已被他人修改，请刷新后重试', '无该操作权限', '关联数据校验未通过']),
            changes: changes,
            service: svc, httpMethod: method,
            requestUri: '/' + svc + '/v1/' + res.replace(/\./g, '/') + '/' + actionKey.split('.').pop().replace(/_/g, '-'),
            clientIp: pick(IPS), elapsedMs: 20 + Math.floor(rand() * 400), traceId: traceId(),
            requestParams: JSON.stringify([{ id: rid, name: name, contactPhone: '138****8952', smsCode: '••••••', idempotencyKey: '1793950124474-' + rid.toLowerCase() }], null, 2)
        };
    }

    function sortByTime(list) { return list.sort(function (a, b) { return a.timestamp < b.timestamp ? 1 : -1; }); }

    /*
     * UAT 审计表（audit-log）中已有记录、但页面没有任何查看入口的业务资源。
     * 取自 2026-10-29 ~ 11-09 UAT 最近 4000 条审计记录的 resource / action 统计，中文名为本次梳理建议。
     */
    var UNCOVERED = {
        mallProduct: { title: '商城商品', resource: 'mallProduct', actions: { 'mallProduct.saveAndList': '保存并上架', 'mallProduct.update': '修改商品', 'mallProduct.updatePrice': '修改价格', 'mallProduct.changeStatus': '上下架', 'mallProduct.batchChangeStatus': '批量上下架', 'mallProduct.batchUpdate': '批量修改', 'mallProduct.changeSkuShelf': '规格上下架', 'mallProduct.delete': '删除商品' }, fields: { price: '售价', status: '上下架状态' } },
        consignmentProduct: { title: '代采商品', resource: 'consignmentProduct', actions: { 'consignmentProduct.saveAndList': '保存并上架', 'consignmentProduct.update': '修改商品', 'consignmentProduct.updatePrice': '修改价格', 'consignmentProduct.changeStatus': '上下架', 'consignmentProduct.batchUpdate': '批量修改' }, fields: { price: '代采价', status: '上下架状态' } },
        consignmentCategory: { title: '代采类目', resource: 'consignmentCategory', actions: { 'consignmentCategory.create': '新增类目', 'consignmentCategory.delete': '删除类目' }, fields: {} },
        channelProduct: { title: '直播商品', resource: 'channelProduct', actions: { 'channelProduct.import': '导入商品', 'channelProduct.saveMedia': '保存图文', 'channelProduct.liveProduct.updatePrice': '修改直播价', 'channelProduct.centralProduct.suspend': '暂停售卖', 'channelProduct.centralProduct.recover': '恢复售卖' }, fields: {} },
        order: { title: '订单', resource: 'order', actions: { 'order.create': '创建订单', 'order.pay': '支付', 'order.cancel': '取消订单', 'order.cancel.admin': '运营取消订单', 'order.confirmReceive': '确认收货', 'order.direct-ship.batch': '批量直发', 'order.tracking.upload': '上传物流单号', 'order.verify.confirm': '核销确认' }, fields: {} },
        afterSale: { title: '售后单', resource: 'after_sale_order', actions: { 'aftersale.apply': '申请售后', 'aftersale.approved': '审批通过', 'aftersale.rejected': '审批驳回', 'aftersale.canceled': '取消售后', 'aftersale.return_received': '退货已收货', 'aftersale.refund_started': '发起退款', 'aftersale.refund_closed': '退款完成', 'aftersale.offline_pending': '转线下退款' }, fields: {} },
        merchantWallet: { title: '商户钱包', resource: 'merchant-wallet', actions: { 'merchant-wallet.adjust': '余额调整', 'merchant-wallet.rule-rebalance': '规则重算' }, fields: { balance: '余额' } },
        storeWallet: { title: '门店钱包', resource: 'store-wallet', actions: { 'store-wallet.recharge': '充值' }, fields: { balance: '余额' } },
        settlementStatement: { title: '结算单', resource: 'settlement-statement', actions: { 'settlement-statement.statement.createClearingBill': '生成清分单', 'settlement-statement.statement.executePayout': '执行结款' }, fields: {} },
        permission: { title: '权限能力', resource: ['capability', 'permissionAtom', 'orgCapability'], actions: { 'capability.save': '保存能力', 'capability.disable': '停用能力', 'capability.delete': '删除能力', 'capability.bindMenus': '绑定菜单', 'permissionAtom.save': '保存权限点', 'orgCapability.toggle': '组织能力开关' }, fields: {} },
        session: { title: '登录与会话', resource: ['user', 'session', 'identity'], actions: { 'user.login': '登录', 'user.logout': '退出登录', 'user.switchOrg': '切换组织', 'session.forceLogoutAll': '强制全部下线', 'identity.consumer.login.wechat': '会员微信登录' }, fields: {} },
        purchase: { title: '采购单', resource: 'purchase_order', actions: { 'purchase_order.create_manual': '手工创建', 'purchase_order.approve': '审核', 'purchase_order.generate_from_demand': '由需求生成', 'purchase_order.record_received': '登记收货' }, fields: {} },
        inventory: { title: '库存', resource: ['inventory', 'omni_inventory'], actions: { 'inventory.resetQuota': '重置可售额度', 'omni_inventory.adjust': '库存调整', 'omni_inventory.omni.inventory.opening': '期初库存' }, fields: {} },
        cashRedpackManual: { title: '手动发放红包', resource: 'cash_redpack_manual', actions: { 'cash-redpack.manual.create': '新建发放', 'cash-redpack.manual.submit': '提交审核', 'cash-redpack.manual.approve': '审核通过' }, fields: {} }
    };
    var UNCOVERED_ENTRY = {
        mallProduct: '商城商品 → 商品列表 工具栏「操作日志」', consignmentProduct: '代采商品 → 商品列表 工具栏「操作日志」', consignmentCategory: '代采商品 → 类目管理',
        channelProduct: '直播 → 店铺商品 / 直播排品', order: '订单详情「操作日志」卡片补充运营操作（取消、改地址、上传单号）', afterSale: '售后详情时间线（已有节点日志，可补操作人）',
        merchantWallet: '结算 → 资金账户「调账记录」', storeWallet: '门店详情 → 钱包', settlementStatement: '结算 → 对账结算 / 佣金清算 详情', permission: '系统管理 → 角色管理 / 菜单管理',
        session: '系统管理 → 用户管理「登录记录」', purchase: '采购 → 采购单详情', inventory: '仓储 → 库存日志', cashRedpackManual: '营销 → 手动发放红包 行操作'
    };
    Object.keys(UNCOVERED).forEach(function (k) { UNCOVERED[k].uncovered = true; EXTRA_SCENES[k] = UNCOVERED[k]; });

    /* 查询类动作（list / detail / tree / trace 等）不属于变更，全局日志默认隐藏 */
    var READ_ACTIONS = [['mallProduct', 'mallProduct.list', '查询商品列表'], ['mallProduct', 'mallProduct.detail', '查看商品详情'], ['order', 'order.detail', '查看订单详情'],
        ['order', 'order.trace', '查看订单轨迹'], ['consignmentProduct', 'consignmentProduct.list', '查询代采商品'], ['consignmentCategory', 'consignmentCategory.tree', '查询代采类目树']];
    function isReadAction(action) { return /\.(list|detail|tree|trace|payments|commissionSplits|skuDetail|all|stats|time_period_list)$/.test(action); }

    /* ---------- 全局日志数据 ---------- */
    var GLOBAL_SCENES = Object.keys(SCENES).concat(['marketingTemplate', 'couponApproval', 'settlementPolicy', 'store']).concat(Object.keys(UNCOVERED));
    var GLOBAL_LOGS = (function () {
        var list = [];
        GLOBAL_SCENES.forEach(function (s) {
            var n = 3 + Math.floor(rand() * 5);
            for (var i = 0; i < n; i++) list.push(makeLog(s));
        });
        READ_ACTIONS.forEach(function (r) {
            for (var i = 0; i < 6; i++) {
                var log = makeLog(r[0] === 'consignmentCategory' ? 'consignmentCategory' : r[0], { action: r[1], success: true });
                log.actionLabel = r[2]; log.changes = []; log.httpMethod = 'GET'; list.push(log);
            }
        });
        return sortByTime(list);
    })();

    /* ---------- 弹层 ---------- */
    function closeLayer(el) { if (!el) return; var m = el.previousElementSibling; if (m && m.classList.contains('oplog-mask')) m.remove(); el.remove(); }
    function openLayer(cls, html, width, top) {
        var mask = document.createElement('div');
        mask.className = 'oplog-mask' + (top ? ' oplog-mask--top' : '');
        var box = document.createElement('div');
        box.className = cls;
        if (width) box.style.width = width;
        box.innerHTML = html;
        document.body.appendChild(mask);
        document.body.appendChild(box);
        mask.addEventListener('click', function () { if (!top) closeLayer(box); });
        box.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) closeLayer(box); });
        return box;
    }
    function drawer(title, bodyHtml, width) {
        return openLayer('oplog-drawer',
            '<div class="oplog-drawer__header"><span class="oplog-drawer__title">' + esc(title) + '</span>' +
            '<button type="button" class="oplog-drawer__close" data-close aria-label="关闭">×</button></div>' +
            '<div class="oplog-drawer__body">' + bodyHtml + '</div>', width || '70%');
    }
    function resultTag(ok) { return '<span class="oplog-tag ' + (ok === false ? 'oplog-tag--danger' : 'oplog-tag--success') + '">' + (ok === false ? '失败' : '成功') + '</span>'; }
    function descTable(rows) {
        var html = '';
        for (var i = 0; i < rows.length; i += 2) {
            var a = rows[i], b = rows[i + 1];
            if (a[2]) { html += '<tr><th>' + esc(a[0]) + '</th><td colspan="3">' + esc(a[1]) + '</td></tr>'; i--; continue; }
            html += '<tr><th>' + esc(a[0]) + '</th><td>' + esc(a[1]) + '</td>' + (b ? '<th>' + esc(b[0]) + '</th><td>' + esc(b[1]) + '</td>' : '<td colspan="2"></td>') + '</tr>';
        }
        return '<table class="oplog-desc"><tbody>' + html + '</tbody></table>';
    }
    function changeTable(changes, firstCol) {
        if (!changes.length) return '<div class="oplog-empty">无字段级变更</div>';
        return '<table class="oplog-table oplog-table--bordered"><thead><tr><th>' + firstCol + '</th><th>变更前</th><th>变更后</th></tr></thead><tbody>' +
            changes.map(function (c) {
                return '<tr><td>' + esc(c.field) + '</td><td><span class="oplog-before">' + esc(c.before) + '</span></td><td><span class="oplog-after">' + esc(c.after) + '</span></td></tr>';
            }).join('') + '</tbody></table>';
    }

    /* 通用详情（UAT BusinessOperationLogDrawer 详情弹窗） */
    function openGeneralDetail(log, bizLabel, withModule) {
        var rows = [['操作时间', log.timestamp], ['操作人', log.operator], [bizLabel || '业务编号', log.resourceName + '（' + log.resourceId + '）'], ['操作结果', log.success ? '成功' : '失败']];
        if (withModule) rows.unshift(['业务模块', log.module], ['后台资源', Array.isArray((sceneDef(log.scene) || {}).resource) ? sceneDef(log.scene).resource.join(' / ') : ((sceneDef(log.scene) || {}).resource || log.scene)]);
        var html =
            '<div class="oplog-detail-head">' + resultTag(log.success) + '<strong>' + esc(log.actionLabel) + '</strong></div>' +
            descTable(rows) +
            '<div class="oplog-section-title">变更明细 <span>（共 ' + log.changes.length + ' 项）</span></div>' +
            (log.changes.length ? '<div class="oplog-group-title">' + esc(log.module) + '</div>' : '') +
            changeTable(log.changes, '变更项') +
            (log.success === false && log.errorMessage ? '<div class="oplog-alert">' + esc(log.errorMessage) + '</div>' : '') +
            '<details class="oplog-collapse"><summary>技术信息</summary>' +
            descTable([['后台动作标识', log.action], ['来源服务', log.service], ['请求方式', log.httpMethod], ['接口路径', log.requestUri],
                ['客户端 IP', log.clientIp], ['处理耗时', log.elapsedMs + ' 毫秒'], ['TraceID', log.traceId, true]]) +
            '<pre class="oplog-pre">' + esc(log.requestParams || '未记录请求参数') + '</pre></details>';
        openLayer('oplog-dialog',
            '<div class="oplog-dialog__header">操作日志详情<button type="button" class="oplog-drawer__close" data-close aria-label="关闭">×</button></div>' +
            '<div class="oplog-dialog__body">' + html + '</div>' +
            '<div class="oplog-dialog__footer"><button type="button" class="oplog-btn" data-close>关闭</button></div>', null, true);
    }

    /* 营销 / 结算 / 门店日志详情（UAT 字段级详情：查询对象 / 资源对象 + 请求参数） */
    function openFieldDetail(log, objLabel) {
        var html =
            '<div class="oplog-detail-head">' + resultTag(log.success) + '<strong>' + esc(log.actionLabel) + '</strong><small>TraceID ' + esc(log.traceId) + '</small></div>' +
            descTable([['操作时间', log.timestamp], ['操作人', log.operator], [objLabel, log.resourceName + '-' + log.resourceId], ['客户端IP', log.clientIp], ['来源服务', log.service], ['耗时', log.elapsedMs + ' ms']]) +
            '<div class="oplog-section-title">变更明细 <span>（共 ' + log.changes.length + ' 个字段）</span></div>' +
            changeTable(log.changes, '字段') +
            (log.success === false ? '<div class="oplog-alert">错误信息：' + esc(log.errorMessage) + '</div>' : '') +
            '<div class="oplog-section-title">请求参数</div><div class="oplog-method">' + esc(log.httpMethod + ' ' + log.requestUri) + '</div>' +
            '<pre class="oplog-pre">' + esc(log.requestParams) + '</pre>';
        openLayer('oplog-dialog',
            '<div class="oplog-dialog__header">操作日志详情<button type="button" class="oplog-drawer__close" data-close aria-label="关闭">×</button></div>' +
            '<div class="oplog-dialog__body">' + html + '</div>' +
            '<div class="oplog-dialog__footer"><button type="button" class="oplog-btn" data-close>关闭</button></div>', null, true);
    }

    /* 分页渲染（UAT：total, prev, pager, next；全局页额外提供每页条数） */
    function pagerHtml(total, page, size, withSizes) {
        var pages = Math.max(1, Math.ceil(total / size));
        var html = '<span>共 ' + total + ' 条</span>';
        if (withSizes) html += '<select class="oplog-select" data-size>' + [20, 50, 100].map(function (s) { return '<option value="' + s + '"' + (s === size ? ' selected' : '') + '>' + s + '条/页</option>'; }).join('') + '</select>';
        html += '<button type="button" data-page="' + (page - 1) + '"' + (page <= 1 ? ' disabled' : '') + '>‹</button>';
        for (var p = 1; p <= pages; p++) {
            if (pages > 7 && p > 2 && p < pages - 1 && Math.abs(p - page) > 1) { if (p === 3 || p === pages - 2) html += '<span>…</span>'; continue; }
            html += '<button type="button" data-page="' + p + '"' + (p === page ? ' class="is-active"' : '') + '>' + p + '</button>';
        }
        html += '<button type="button" data-page="' + (page + 1) + '"' + (page >= pages ? ' disabled' : '') + '>›</button>';
        return html;
    }

    function actionOptions(scene) {
        var def = sceneDef(scene) || { actions: {} };
        return Object.keys(def.actions).map(function (k) { return '<option value="' + esc(k) + '">' + esc(def.actions[k]) + '</option>'; }).join('');
    }

    /* ---------- 样式 A：通用业务日志抽屉 ---------- */
    function openStyleA(scene, resourceName) {
        var def = sceneDef(scene);
        var bizLabel = scene === 'shippingFee' ? '费用模板' : scene === 'liveSettings' ? '配置对象' : '业务编号';
        var logs = [];
        for (var i = 0; i < 26; i++) logs.push(makeLog(scene, resourceName ? { resourceName: resourceName } : {}));
        sortByTime(logs);
        var title = def.title + ' · 操作日志' + (resourceName ? ' · ' + resourceName : '');
        var state = { page: 1, size: 20, action: '', success: '', kw: '' };
        var box = drawer(title,
            '<div class="oplog-drawer__note">还原 UAT「' + esc(STYLES.A.comp) + '」，查询 /system-core/v1/audit-log/list?resource=' + esc([].concat(def.resource).join(',')) + '</div>' +
            '<div class="oplog-filter">' +
            (scene === 'shippingFee' ? '<input class="oplog-input" data-f="kw" placeholder="模板名称 / ID">' : '') +
            '<select class="oplog-select" data-f="action"><option value="">操作类型</option>' + actionOptions(scene) + '</select>' +
            '<select class="oplog-select" data-f="success"><option value="">操作结果</option><option value="1">成功</option><option value="0">失败</option></select>' +
            '<button type="button" class="oplog-btn oplog-btn--primary" data-act="query">查询</button><button type="button" class="oplog-btn" data-act="reset">重置</button></div>' +
            '<div class="oplog-table-wrap"><table class="oplog-table"><thead><tr><th>操作时间</th><th>操作内容</th><th>操作人</th><th>' + bizLabel + '</th><th class="is-center">结果</th><th class="is-center">操作</th></tr></thead><tbody data-body></tbody></table></div>' +
            '<div class="oplog-pagination" data-pager></div>');
        function filtered() {
            return logs.filter(function (l) {
                if (state.action && l.action !== state.action) return false;
                if (state.success !== '' && String(l.success ? 1 : 0) !== state.success) return false;
                if (state.kw && (l.resourceName + l.resourceId).indexOf(state.kw) < 0) return false;
                return true;
            });
        }
        function render() {
            var list = filtered(), rows = list.slice((state.page - 1) * state.size, state.page * state.size);
            box.querySelector('[data-body]').innerHTML = rows.length ? rows.map(function (l) {
                var primary = scene === 'generalSettlement' ? '平台' : scene === 'liveSettings' ? '全局直播配置' : l.resourceName;
                return '<tr><td>' + esc(l.timestamp) + '</td><td>' + esc(l.actionLabel) + '</td><td>' + esc(l.operator) + '</td>' +
                    '<td>' + esc(primary) + (scene === 'generalSettlement' || scene === 'liveSettings' ? '' : '<span class="oplog-sub">' + esc(l.resourceId) + '</span>') + '</td>' +
                    '<td class="is-center">' + resultTag(l.success) + '</td><td class="is-center"><button type="button" class="oplog-link" data-detail="' + l.id + '">查看详情</button></td></tr>';
            }).join('') : '<tr><td colspan="6" class="oplog-empty">暂无操作记录</td></tr>';
            box.querySelector('[data-pager]').innerHTML = pagerHtml(list.length, state.page, state.size, false);
        }
        box.addEventListener('click', function (e) {
            var t = e.target;
            if (t.dataset.detail) { openGeneralDetail(logs.filter(function (l) { return l.id === t.dataset.detail; })[0], bizLabel); }
            if (t.dataset.page && !t.disabled) { state.page = +t.dataset.page; render(); }
            if (t.dataset.act === 'query') {
                state.action = box.querySelector('[data-f="action"]').value; state.success = box.querySelector('[data-f="success"]').value;
                var kw = box.querySelector('[data-f="kw"]'); state.kw = kw ? kw.value.trim() : ''; state.page = 1; render();
            }
            if (t.dataset.act === 'reset') { box.querySelectorAll('[data-f]').forEach(function (el) { el.value = ''; }); state.action = state.success = state.kw = ''; state.page = 1; render(); }
        });
        render();
    }

    /* ---------- 样式 B / C / D：字段级日志列表（含「方法」列） ---------- */
    function openFieldStyle(style, scene, entryName) {
        var def = sceneDef(scene);
        var name = (RESOURCE_NAMES[scene] || [def.title])[0];
        var logs = [];
        for (var i = 0; i < 12; i++) logs.push(makeLog(scene, { resourceName: name }));
        sortByTime(logs);
        var objLabel = style === 'B' ? '查询对象' : '资源对象';
        var withTime = style !== 'B';
        var title = style === 'D' ? '门店详情 · ' + name : '操作日志 · ' + name;
        var cols = '<th>操作时间</th><th>操作内容</th><th>操作人</th>' + (style === 'D' ? '<th>资源对象</th>' : '') + '<th>方法</th><th class="is-center">结果</th><th class="is-center">操作</th>';
        var state = { action: '', success: '' };
        var tabs = style === 'D' ? '<div class="oplog-tabs" style="margin-bottom:12px"><button type="button">基础信息</button><button type="button">绑定客户</button><button type="button">分佣明细</button><button type="button">商品统计</button><button type="button">业绩报表</button><button type="button" class="is-active">操作日志</button></div>' : '';
        var box = drawer(title,
            '<div class="oplog-drawer__note">还原 UAT「' + esc(STYLES[style].comp) + '」（' + esc(entryName) + '），查询 /system-core/v1/audit-log/history</div>' + tabs +
            (style !== 'B' ? '<div class="oplog-filter"><select class="oplog-select" data-f="action"><option value="">操作类型</option>' + actionOptions(scene) + '</select>' +
                '<select class="oplog-select" data-f="success"><option value="">操作结果</option><option value="1">成功</option><option value="0">失败</option></select>' +
                (withTime ? '<label>时间 <input type="date" class="oplog-input oplog-input--date" value="2026-10-10"> 至 <input type="date" class="oplog-input oplog-input--date" value="2026-11-09"></label>' : '') +
                '<button type="button" class="oplog-btn oplog-btn--primary" data-act="query">查询</button><button type="button" class="oplog-btn" data-act="reset">重置</button></div>' : '') +
            '<div class="oplog-table-wrap"><table class="oplog-table"><thead><tr>' + cols + '</tr></thead><tbody data-body></tbody></table></div>' +
            '<div class="oplog-pagination" data-pager></div>', style === 'D' ? '70%' : '60%');
        function render() {
            var list = logs.filter(function (l) {
                return (!state.action || l.action === state.action) && (state.success === '' || String(l.success ? 1 : 0) === state.success);
            });
            box.querySelector('[data-body]').innerHTML = list.length ? list.map(function (l) {
                return '<tr><td>' + esc(l.timestamp) + '</td><td>' + esc(l.actionLabel) + '</td><td>' + esc(l.operator) + '</td>' +
                    (style === 'D' ? '<td>' + esc('store-' + l.resourceId) + '</td>' : '') +
                    '<td><span class="oplog-method">' + esc(l.httpMethod + ' ' + l.requestUri) + '</span></td>' +
                    '<td class="is-center">' + resultTag(l.success) + '</td><td class="is-center"><button type="button" class="oplog-link" data-detail="' + l.id + '">查看详情</button></td></tr>';
            }).join('') : '<tr><td colspan="7" class="oplog-empty">暂无数据</td></tr>';
            box.querySelector('[data-pager]').innerHTML = pagerHtml(list.length, 1, 20, false);
        }
        box.addEventListener('click', function (e) {
            var t = e.target;
            if (t.dataset.detail) openFieldDetail(logs.filter(function (l) { return l.id === t.dataset.detail; })[0], objLabel);
            if (t.dataset.act === 'query') { state.action = box.querySelector('[data-f="action"]').value; state.success = box.querySelector('[data-f="success"]').value; render(); }
            if (t.dataset.act === 'reset') { box.querySelectorAll('[data-f]').forEach(function (el) { el.value = ''; }); state.action = state.success = ''; render(); }
        });
        render();
    }

    /* ---------- 样式 E / F：审核 / 红包模版日志 ---------- */
    var REVIEW_LOGS = {
        redpackApproval: { name: '双11 直播红包模版', rows: [
            ['2026-11-08 10:02:11', '提交审核', '张晓琳', '新建模版提交审核', '—'],
            ['2026-11-08 14:30:45', '审核驳回', '王审核', '单个红包金额超出 200 元上限', '驳回'],
            ['2026-11-08 15:12:03', '提交审核', '张晓琳', '已调整金额后重新提交', '—'],
            ['2026-11-08 16:40:27', '审核通过', '王审核', '—', '通过']] },
        redpackManualApproval: { name: '11月门店激励红包', rows: [
            ['2026-11-07 09:15:20', '提交审核', '李运营', '手动派发 120 人，合计 2,400.00 元', '—'],
            ['2026-11-07 11:03:51', '审核通过', '陈财务', '—', '通过']] },
        redpackTemplate: { name: '双11 直播红包模版', rows: [
            ['2026-11-08 09:58:40', '新建模版', '张晓琳', '金额 2.00–5.00 元，每人限领 1 次', '成功'],
            ['2026-11-08 15:10:12', '编辑模版', '张晓琳', '最大金额 300.00 → 200.00 元', '成功'],
            ['2026-11-08 16:41:02', '启用', '张晓琳', '草稿 → 启用', '成功'],
            ['2026-11-09 08:30:00', '禁用', '李运营', '启用 → 草稿', '成功']] }
    };
    function openStyleE(style, scene) {
        var d = REVIEW_LOGS[scene];
        var body = '<div class="oplog-drawer__note">还原 UAT「' + esc(STYLES[style].comp) + '」' + (style === 'E' ? '：数据来自审核单 auditHistory，不分页' : '：查询 /system-core/v1/cash-redpack/template/operation-logs') + '</div>' +
            '<table class="oplog-table"><thead><tr><th>操作时间</th><th>操作内容</th><th>操作人</th><th>说明</th><th>结果</th></tr></thead><tbody>' +
            d.rows.slice().reverse().map(function (r) {
                return '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td><td>' + esc(r[2]) + '</td><td>' + esc(r[3]) + '</td><td>' + esc(r[4]) + '</td></tr>';
            }).join('') + '</tbody></table>';
        drawer('操作日志 - ' + d.name, body, '50%');
    }

    /* ---------- 样式 G：详情页时间线 ---------- */
    var TIMELINES = {
        orderLive: [['2026-11-08 20:31:05', '下单', '直播间「双11 生鲜专场」下单 3 件', ''], ['2026-11-08 20:31:40', '已支付', '微信支付 89.70 元', ''], ['2026-11-09 09:12:18', '已截单', '门店订货截单', '系统'], ['2026-11-09 15:40:02', '已发货', '中通快递 7731 0042 5521', '李运营']],
        orderMall: [['2026-11-07 12:01:22', '下单', '商城下单 2 件', ''], ['2026-11-07 12:01:58', '已支付', '积分抵现 2.00 元，实付 57.80 元', ''], ['2026-11-08 10:20:11', '待提货', '已到店', '冷丰杭州总店']],
        orderProxy: [['2026-11-06 16:10:40', '提交订单', '门店代采 12 件', '冷丰杭州总店'], ['2026-11-06 16:12:05', '已支付', '余额支付 1,280.00 元', ''], ['2026-11-07 08:00:00', '已截单', '统一截单', '系统'], ['2026-11-08 06:30:21', '已送达', '线路「杭州西线」送达', '司机 周师傅']],
        orderRetail: [['2026-11-08 11:05:12', '下单', '零售下单 3 件', ''], ['2026-11-08 11:05:40', '已支付', '实付 128.00 元', ''], ['2026-11-09 10:20:31', '部分核销', '', '', true], ['2026-11-09 17:46:09', '全部核销', '订单已完成', '冷丰杭州总店 店员小周']],
        afterSale: [['2026-11-09 09:30:00', '申请售后', '仅退款 · 商品破损 · 申请 29.90 元', '用户'], ['2026-11-09 10:12:44', '审批通过', '同意退款 29.90 元', '王审核'], ['2026-11-09 10:12:46', '生成退款单', 'RF202611090012', '系统']],
        refund: [['2026-11-09 10:12:46', '退款单创建', '来源：售后单', '系统'], ['2026-11-09 10:13:05', '退款中', '原路退回 29.90 元', '系统'], ['2026-11-09 10:15:30', '退款成功', '微信退款到账', '系统']]
    };
    function openStyleG(scene, page) {
        var items = (TIMELINES[scene] || []).slice().reverse();
        var html = items.map(function (r) {
            var pickup = r[4] ? '<div class="oplog-pickup">' +
                '<div class="oplog-pickup__row"><b>商品</b><span>智利车厘子 JJ 级 2.5kg</span></div>' +
                '<div class="oplog-pickup__row"><b>条码</b><span>6970123456789</span></div>' +
                '<div class="oplog-pickup__row"><b>本次提货</b><span>+2 件</span></div>' +
                '<div class="oplog-pickup__row"><b>累计进度</b><span>2 / 3 件</span></div>' +
                '<div class="oplog-pickup__row"><b>操作人</b><span>冷丰杭州总店 店员小周</span></div></div>' : '';
            return '<li><div class="oplog-timeline__time">' + esc(r[0]) + '</div><div class="oplog-timeline__content"><span><b>' + esc(r[1]) + '</b></span>' +
                (r[2] && !r[4] ? '<span>' + esc(r[2]) + '</span>' : '') + (r[3] && !r[4] ? '<span>· ' + esc(r[3]) + '</span>' : '') + '</div>' + pickup + '</li>';
        }).join('');
        drawer(page,
            '<div class="oplog-drawer__note">还原 UAT 订单/售后详情「操作日志」卡片：时间线按节点倒序，节点名 + 摘要 + · 操作人；核销节点展开提货明细；无数据显示「暂无操作日志」</div>' +
            '<div class="oplog-detail-card"><div class="oplog-detail-card__head">基本信息<span>▾</span></div><div class="oplog-detail-card__body" style="color:#909399;padding-bottom:14px">（订单 / 售后基本信息、商品明细、清分明细等略）</div></div>' +
            '<div class="oplog-detail-card"><div class="oplog-detail-card__head">操作日志<span>▾</span></div><div class="oplog-detail-card__body"><ul class="oplog-timeline">' + html + '</ul></div></div>', '60%');
    }

    function preview(entry) {
        if (entry.style === 'A') return openStyleA(entry.scene, /单(门店|场次)|固定对象/.test(entry.scope) ? (RESOURCE_NAMES[entry.scene] || [])[0] : '');
        if (entry.style === 'B' || entry.style === 'C' || entry.style === 'D') return openFieldStyle(entry.style, entry.scene, entry.page);
        if (entry.style === 'E' || entry.style === 'F') return openStyleE(entry.style, entry.scene);
        if (entry.style === 'G') return openStyleG(entry.scene, entry.page);
    }

    /* ---------- 页面：全局日志 ---------- */
    var gState = { page: 1, size: 20, module: '', action: '', success: '', operator: '', kw: '', from: '2026-10-10', to: '2026-11-09', writeOnly: true };
    function renderGlobal(root) {
        function opt(s) { return '<option value="' + s + '">' + esc(sceneDef(s).title) + '</option>'; }
        var moduleOpts = '<optgroup label="已有日志入口">' + GLOBAL_SCENES.filter(function (s) { return !sceneDef(s).uncovered; }).map(opt).join('') + '</optgroup>' +
            '<optgroup label="审计表已有数据、暂无查看入口">' + Object.keys(UNCOVERED).map(opt).join('') + '</optgroup>';
        root.innerHTML =
            '<div class="oplog-tip"><strong>全局日志</strong>：统一查询 UAT 各业务模块已写入的审计日志（/system-core/v1/audit-log/list），列表与详情沿用 UAT 通用业务日志样式。' +
            '业务模块与操作类型字典取自 UAT 通用日志组件（' + Object.keys(SCENES).length + ' 个模块、' + Object.keys(SCENES).reduce(function (n, k) { return n + Object.keys(SCENES[k].actions).length; }, 0) + ' 个操作类型），另含模版配置、优惠券启用审核、佣金策略、门店档案。' +
            '另外 UAT 审计表中商城商品、代采商品、订单、售后、钱包调账、权限、登录等 ' + Object.keys(UNCOVERED).length + ' 类记录目前没有任何查看入口，本页一并纳入。' +
            '审计表同时记录了大量查询类请求（列表、详情），默认勾选「只看变更操作」将其隐藏；请求参数中的验证码、手机号等在详情中脱敏展示。</div>' +
            '<div class="oplog-card"><div class="oplog-filter">' +
            '<label>操作时间 <input type="date" class="oplog-input oplog-input--date" data-g="from" value="' + gState.from + '"> 至 <input type="date" class="oplog-input oplog-input--date" data-g="to" value="' + gState.to + '"></label>' +
            '<select class="oplog-select" data-g="module"><option value="">业务模块</option>' + moduleOpts + '</select>' +
            '<select class="oplog-select" data-g="action"><option value="">操作类型</option></select>' +
            '<select class="oplog-select" data-g="success"><option value="">操作结果</option><option value="1">成功</option><option value="0">失败</option></select>' +
            '<input class="oplog-input" data-g="operator" placeholder="操作人">' +
            '<input class="oplog-input" data-g="kw" placeholder="业务编号 / 对象名称">' +
            '<label><input type="checkbox" data-g-write checked> 只看变更操作</label>' +
            '<button type="button" class="oplog-btn oplog-btn--primary" data-g-act="query">查询</button><button type="button" class="oplog-btn" data-g-act="reset">重置</button></div>' +
            '<div class="oplog-table-wrap"><table class="oplog-table"><thead><tr><th>操作时间</th><th>业务模块</th><th>操作内容</th><th>操作人</th><th>业务编号</th><th class="is-center">结果</th><th class="is-center">操作</th></tr></thead><tbody data-gbody></tbody></table></div>' +
            '<div class="oplog-pagination" data-gpager></div></div>';
        var moduleSel = root.querySelector('[data-g="module"]');
        moduleSel.addEventListener('change', function () {
            root.querySelector('[data-g="action"]').innerHTML = '<option value="">操作类型</option>' + (moduleSel.value ? actionOptions(moduleSel.value) : '');
        });
        root.addEventListener('click', function (e) {
            var t = e.target;
            if (t.dataset.gAct === 'query') {
                ['module', 'action', 'success', 'operator', 'kw', 'from', 'to'].forEach(function (k) { gState[k] = root.querySelector('[data-g="' + k + '"]').value.trim(); });
                gState.writeOnly = root.querySelector('[data-g-write]').checked;
                gState.page = 1; drawGlobal(root);
            }
            if (t.dataset.gAct === 'reset') {
                root.querySelector('[data-g-write]').checked = true;
                root.querySelectorAll('[data-g]').forEach(function (el) { el.value = ''; });
                root.querySelector('[data-g="from"]').value = '2026-10-10'; root.querySelector('[data-g="to"]').value = '2026-11-09';
                root.querySelector('[data-g="action"]').innerHTML = '<option value="">操作类型</option>';
                gState = { page: 1, size: gState.size, module: '', action: '', success: '', operator: '', kw: '', from: '2026-10-10', to: '2026-11-09', writeOnly: true };
                drawGlobal(root);
            }
            if (t.dataset.page && !t.disabled && t.closest('[data-gpager]')) { gState.page = +t.dataset.page; drawGlobal(root); }
            if (t.dataset.gdetail) openGeneralDetail(GLOBAL_LOGS.filter(function (l) { return l.id === t.dataset.gdetail; })[0], '业务编号', true);
        });
        root.addEventListener('change', function (e) {
            if (e.target.dataset.size != null && e.target.closest('[data-gpager]')) { gState.size = +e.target.value; gState.page = 1; drawGlobal(root); }
        });
        drawGlobal(root);
    }
    function drawGlobal(root) {
        var list = GLOBAL_LOGS.filter(function (l) {
            var day = l.timestamp.slice(0, 10);
            if (gState.from && day < gState.from) return false;
            if (gState.to && day > gState.to) return false;
            if (gState.module && l.scene !== gState.module) return false;
            if (gState.action && l.action !== gState.action) return false;
            if (gState.success !== '' && String(l.success ? 1 : 0) !== gState.success) return false;
            if (gState.operator && l.operator.indexOf(gState.operator) < 0) return false;
            if (gState.kw && (l.resourceId + l.resourceName).indexOf(gState.kw) < 0) return false;
            if (gState.writeOnly && isReadAction(l.action)) return false;
            return true;
        });
        var rows = list.slice((gState.page - 1) * gState.size, gState.page * gState.size);
        root.querySelector('[data-gbody]').innerHTML = rows.length ? rows.map(function (l) {
            var mod = esc(l.module) + (sceneDef(l.scene).uncovered ? '<span class="oplog-sub">暂无查看入口</span>' : '');
            return '<tr><td>' + esc(l.timestamp) + '</td><td>' + mod + '</td><td>' + esc(l.actionLabel) + (isReadAction(l.action) ? ' <span class="oplog-tag oplog-tag--info">查询</span>' : '') + '</td><td>' + esc(l.operator) + '</td>' +
                '<td>' + esc(l.resourceName) + '<span class="oplog-sub">' + esc(l.resourceId) + '</span></td><td class="is-center">' + resultTag(l.success) + '</td>' +
                '<td class="is-center"><button type="button" class="oplog-link" data-gdetail="' + l.id + '">查看详情</button></td></tr>';
        }).join('') : '<tr><td colspan="7" class="oplog-empty">暂无操作记录</td></tr>';
        root.querySelector('[data-gpager]').innerHTML = pagerHtml(list.length, gState.page, gState.size, true);
    }

    /* ---------- 页面：入口清单 ---------- */
    var cState = { style: '', menu: '', kw: '' };
    function renderCatalog(root) {
        var counts = {};
        ENTRIES.forEach(function (e) { counts[e.style] = (counts[e.style] || 0) + 1; });
        var menus = ENTRIES.map(function (e) { return e.menu; }).filter(function (m, i, a) { return a.indexOf(m) === i; });
        root.innerHTML =
            '<div class="oplog-tip"><strong>入口清单</strong>：UAT（构建 2026-11-05）现有 ' + ENTRIES.length + ' 个操作日志入口，归为 7 种日志样式。点击「预览」按 UAT 实际样式打开（数据为模拟）。' +
            '下方另列 UAT 审计表已有数据但无查看入口的业务，以及知识库《操作日志》PRD 已规划、UAT 尚未落地的场景。</div>' +
            '<div class="oplog-summary">' + Object.keys(STYLES).map(function (k) {
                return '<div class="oplog-summary__item" data-style="' + k + '"><strong>' + k + '. ' + esc(STYLES[k].name) + '<em>' + (counts[k] || 0) + '</em></strong><span>' + esc(STYLES[k].desc) + '</span></div>';
            }).join('') + '</div>' +
            '<div class="oplog-card"><div class="oplog-filter">' +
            '<select class="oplog-select" data-c="menu"><option value="">一级菜单</option>' + menus.map(function (m) { return '<option>' + esc(m) + '</option>'; }).join('') + '</select>' +
            '<select class="oplog-select" data-c="style"><option value="">日志样式</option>' + Object.keys(STYLES).map(function (k) { return '<option value="' + k + '">' + k + '. ' + esc(STYLES[k].name) + '</option>'; }).join('') + '</select>' +
            '<input class="oplog-input" data-c="kw" placeholder="页面 / 操作类型">' +
            '<button type="button" class="oplog-btn oplog-btn--primary" data-c-act="query">查询</button><button type="button" class="oplog-btn" data-c-act="reset">重置</button></div>' +
            '<div class="oplog-table-wrap"><table class="oplog-table oplog-table--catalog"><thead><tr><th>序号</th><th>一级菜单</th><th>页面</th><th>入口位置</th><th>日志样式</th><th>查询维度</th><th>记录的操作类型</th><th class="is-center">操作</th></tr></thead><tbody data-cbody></tbody></table></div></div>' +
            '<div class="oplog-card"><div class="oplog-section-title" style="margin-top:0">UAT 审计表已有数据、暂无查看入口</div>' +
            '<table class="oplog-table"><thead><tr><th>业务对象</th><th>后台资源</th><th>已记录的操作（节选）</th><th>建议入口</th></tr></thead><tbody>' +
            Object.keys(UNCOVERED).map(function (k) {
                var u = UNCOVERED[k];
                return '<tr><td>' + esc(u.title) + '</td><td><span class="oplog-method">' + esc([].concat(u.resource).join(' / ')) + '</span></td><td><div class="oplog-tags">' +
                    Object.keys(u.actions).map(function (x) { return '<span class="oplog-tag oplog-tag--info">' + esc(u.actions[x]) + '</span>'; }).join('') + '</div></td><td>' + esc(UNCOVERED_ENTRY[k] || '全局日志') + '</td></tr>';
            }).join('') + '</tbody></table></div>' +
            '<div class="oplog-card"><div class="oplog-section-title" style="margin-top:0">知识库已规划、UAT 未落地</div>' +
            '<table class="oplog-table"><thead><tr><th>场景</th><th>应记录的操作</th><th>建议入口</th></tr></thead><tbody>' +
            KB_GAPS.map(function (g) { return '<tr><td>' + esc(g[0]) + '</td><td>' + esc(g[1]) + '</td><td>' + esc(g[2]) + '</td></tr>'; }).join('') + '</tbody></table></div>';
        root.addEventListener('click', function (e) {
            var t = e.target.closest('[data-style],[data-c-act],[data-preview]');
            if (!t) return;
            if (t.dataset.preview) return preview(ENTRIES[+t.dataset.preview - 1]);
            if (t.dataset.style) { cState.style = cState.style === t.dataset.style ? '' : t.dataset.style; root.querySelector('[data-c="style"]').value = cState.style; }
            if (t.dataset.cAct === 'query') { cState.menu = root.querySelector('[data-c="menu"]').value; cState.style = root.querySelector('[data-c="style"]').value; cState.kw = root.querySelector('[data-c="kw"]').value.trim(); }
            if (t.dataset.cAct === 'reset') { cState = { style: '', menu: '', kw: '' }; root.querySelectorAll('[data-c]').forEach(function (el) { el.value = ''; }); }
            drawCatalog(root);
        });
        drawCatalog(root);
    }
    function entryActions(e) {
        if (e.style === 'G') return (TIMELINES[e.scene] || []).map(function (r) { return r[1]; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
        if (e.style === 'E' || e.style === 'F') return REVIEW_LOGS[e.scene].rows.map(function (r) { return r[1]; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
        var def = sceneDef(e.scene); var acts = Object.keys(def.actions).map(function (k) { return def.actions[k]; });
        return acts.length ? acts : ['其他操作'];
    }
    function drawCatalog(root) {
        root.querySelectorAll('.oplog-summary__item').forEach(function (el) { el.classList.toggle('is-active', el.dataset.style === cState.style); });
        var list = ENTRIES.filter(function (e) {
            if (cState.style && e.style !== cState.style) return false;
            if (cState.menu && e.menu !== cState.menu) return false;
            if (cState.kw && (e.page + entryActions(e).join('')).indexOf(cState.kw) < 0) return false;
            return true;
        });
        root.querySelector('[data-cbody]').innerHTML = list.length ? list.map(function (e) {
            return '<tr><td>' + e.no + '</td><td>' + esc(e.menu) + '</td><td>' + esc(e.page) + '</td><td>' + esc(e.entry) + '</td>' +
                '<td><span class="oplog-tag oplog-tag--primary">' + e.style + '. ' + esc(STYLES[e.style].name) + '</span></td><td>' + esc(e.scope) + '</td>' +
                '<td><div class="oplog-tags">' + entryActions(e).map(function (a) { return '<span class="oplog-tag oplog-tag--info">' + esc(a) + '</span>'; }).join('') + '</div></td>' +
                '<td class="is-center"><button type="button" class="oplog-link" data-preview="' + e.no + '">预览</button></td></tr>';
        }).join('') : '<tr><td colspan="8" class="oplog-empty">暂无数据</td></tr>';
    }

    /* ---------- 初始化 ---------- */
    function init() {
        var app = document.getElementById('oplogApp');
        if (!app) return;
        app.innerHTML = '<div class="oplog-tabs"><button type="button" class="is-active" data-tab="global">全局日志</button><button type="button" data-tab="catalog">入口清单</button></div>' +
            '<div data-panel="global"></div><div data-panel="catalog" hidden></div>';
        renderGlobal(app.querySelector('[data-panel="global"]'));
        renderCatalog(app.querySelector('[data-panel="catalog"]'));
        app.querySelector('.oplog-tabs').addEventListener('click', function (e) {
            var tab = e.target.dataset.tab; if (!tab) return;
            app.querySelectorAll('.oplog-tabs button').forEach(function (b) { b.classList.toggle('is-active', b.dataset.tab === tab); });
            app.querySelectorAll('[data-panel]').forEach(function (p) { p.hidden = p.dataset.panel !== tab; });
        });
        document.addEventListener('keydown', function (e) {
            if (e.key !== 'Escape') return;
            var layers = document.querySelectorAll('.oplog-dialog, .oplog-drawer');
            if (layers.length) closeLayer(layers[layers.length - 1]);
        });
    }

    global.OplogPrototype = { entries: ENTRIES, styles: STYLES, preview: preview };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})(window);
