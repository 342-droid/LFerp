/* 需求单共享数据：门店端发布写入，B 端需求单管理读取。 */
(function () {
    var KEY = 'rbt_h5_fund_demand_v2';

    function nowText() {
        var d = new Date();
        function pad(n) { return n < 10 ? '0' + n : String(n); }
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' +
            pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }

    function touchAudit(item, operator) {
        if (!item) return item;
        var who = operator || '系统';
        item.updater = who;
        item.updatedAt = nowText();
        return item;
    }

    function pushLog(item, content, operator, time) {
        if (!item || !content) return;
        if (!Array.isArray(item.logs)) item.logs = [];
        item.logs.unshift({
            time: time || nowText(),
            operator: operator || item.updater || item.creator || '系统',
            content: content
        });
    }

    /* 旧数据没有操作记录时，补一条发布记录。之后的变更只追加真实差异。 */
    function ensureLogs(item) {
        if (!item || Array.isArray(item.logs)) return false;
        item.logs = [{
            time: item.createdAt || item.updatedAt || '',
            operator: item.creator || '门店',
            content: '发布需求单'
        }];
        return true;
    }

    function statusLogText(prev, next, item) {
        if (!prev || !next || prev === next) return '';
        if (next === '已驳回') return '审核驳回，状态：' + prev + ' → 已驳回';
        if (next === '已作废') return '作废，状态：' + prev + ' → 已作废';
        if (prev === '待接单' && next === '待确认签约') return '接单，状态：待接单 → 待确认签约';
        if (prev === '待确认签约' && next === '待重新确认') {
            var why = item && String(item.withdrawReason || '').trim();
            return why
                ? '撤回接单，原因：' + why + '，状态：待确认签约 → 待重新确认'
                : '撤回接单，状态：待确认签约 → 待重新确认';
        }
        if (prev === '待确认签约' && next === '待接单') return '接单超时，自动撤回，状态：待确认签约 → 待接单';
        if (prev === '待重新确认' && next === '待接单') return '重新发布，状态：待重新确认 → 待接单';
        if (prev === '待确认签约' && next === '待签署') return '确认签约，状态：待确认签约 → 待签署';
        if (prev === '待签署' && next === '发货中') return '合同签署完成，系统自动划款支付，状态：待签署 → 发货中';
        if (prev === '发货中' && next === '门店付款中') return '确认发货完成，按需求单明细生成交易单，状态：发货中 → 门店付款中';
        if (next === '已完成') return '需求完成，状态：' + prev + ' → 已完成';
        return '状态：' + prev + ' → ' + next;
    }
    /* 各方签完后系统自动划款，进入发货中，不生成交易单。确认发货完成后才进入门店付款中并生成交易单。门店付款中：门店按日还款。 */
    var DEMAND_STATUSES = ['待接单', '待确认签约', '待重新确认', '待签署', '发货中', '门店付款中', '已完成'];
    var CLOSED_STATUSES = ['已作废', '已驳回'];
    /* 门店付款中之前，平台可在需求单列表作废。撤回接单后的待重新确认也可作废。 */
    var VOIDABLE_STATUSES = ['待接单', '待确认签约', '待重新确认', '待签署'];
    /* 进入这些状态时释放需求门店的已占用额度 */
    var RELEASE_STATUSES = ['已作废', '已驳回', '已完成'];
    /* 待签署及之后才有关联合同 */
    var CONTRACT_STATUSES = ['待签署', '待付款', '发货中', '门店付款中', '已完成'];
    var STATUS_MIGRATE = {
        '已发布': '待接单',
        '待报价': '待接单',
        '待审核': '待接单',
        '已报价': '待接单',
        '待还款': '门店付款中',
        '支付中': '门店付款中',
        '还款中': '门店付款中',
        '付款中': '门店付款中',
        '待支付': '门店付款中',
        '待付款': '门店付款中',
        '待复核': '门店付款中',
        '已取消': '已作废'
    };

    function hasContractStatus(status) {
        return CONTRACT_STATUSES.indexOf(status) >= 0;
    }

    /* 待签署仍为待签署；发货中及之后视为已签署。 */
    function contractSignStatus(status) {
        if (status === '待签署') return '待签署';
        if (hasContractStatus(status)) return '已签署';
        return '';
    }

    function buildContract(item) {
        var seq = String(item && item.code || '').replace(/\D/g, '') || '00001';
        return {
            code: 'HT' + seq,
            name: ((item && item.installmentName) || '货款分期') + '合作合同',
            signStatus: contractSignStatus(item && item.status)
        };
    }

    /* 待签署及之后补合同。已作废且曾经生成过合同的，保留并标成已作废。 */
    function ensureContract(item) {
        if (!item) return false;
        if (item.status === '已作废') {
            if (!item.contractsVoided) {
                if (item.contract) {
                    delete item.contract;
                    return true;
                }
                return false;
            }
            if (item.contract && item.contract.signStatus !== '已作废') {
                item.contract.signStatus = '已作废';
                return true;
            }
            return false;
        }
        if (!hasContractStatus(item.status)) {
            if (item.contract) {
                delete item.contract;
                return true;
            }
            return false;
        }
        var expected = contractSignStatus(item.status);
        if (!item.contract || !item.contract.code) {
            item.contract = buildContract(item);
            return true;
        }
        var changed = false;
        if (!item.contract.name) {
            item.contract.name = ((item.installmentName) || '货款分期') + '合作合同';
            changed = true;
        }
        if (item.contract.signStatus !== expected) {
            item.contract.signStatus = expected;
            changed = true;
        }
        return changed;
    }

    function seed() {
        return extraStoreSeeds();
    }

    /* 门店付款中演示单：销售合同、采购合同的各方都已签署，贸易商已付款。 */
    function signedRows(storeCode, storeName, traderName, signedAt) {
        return [
            { key: 'sale:store:' + storeCode, role: 'store', code: storeCode, name: storeName, contractKey: 'sale', signedAt: signedAt },
            { key: 'sale:trader:' + traderName, role: 'trader', code: '', name: traderName, contractKey: 'sale', signedAt: signedAt },
            { key: 'purchase:trader:' + traderName, role: 'trader', code: '', name: traderName, contractKey: 'purchase', signedAt: signedAt },
            { key: 'purchase:supply', role: 'supply', code: 'supply', name: '冷丰供应链', contractKey: 'purchase', signedAt: signedAt }
        ];
    }

    /* 按门店已关联的商品包整包下单。明细不可改、不可删。
       售卖单价 = 商品包标准售卖单价 × 1.12（1 + 1.20 − 1.08），售卖金额 = 数量 × 售卖单价。
       总金额 = 折算后商品金额 × 贸易商结算系数 1.08。进行中的单每店只留一笔。
       五角场额度盖不住铺货包，余杭未关联商品包，这两家没有需求单。 */
    function extraStoreSeeds() {
        var fresh = { code: 'SPB00001', name: '汉言开业铺货包' };
        var image = { code: 'SPB00002', name: '门店形象配置包' };
        var ops = { code: 'SPB00003', name: '开业运营服务包' };
        var freshPlan = { installmentCode: 'FQ00001', installmentName: '开业铺货日结', repayPeriod: '10.00%' };
        var imagePlan = { installmentCode: 'FQ00002', installmentName: '门店形象日结', repayPeriod: '8.00%' };
        var opsPlan = { installmentCode: 'FQ00003', installmentName: '开业运营日结', repayPeriod: '10.00%' };
        var xianDa = { traderName: '杭州鲜达贸易有限公司', traderPhone: '13800001001' };
        var lengLian = { traderName: '上海冷链融资租赁有限公司', traderPhone: '13800001002' };
        function linesOf(rows) {
            return rows.map(function (line) { return Object.assign({}, line); });
        }
        var freshLines = [
            { code: 'SKU20001', name: '汉言首批铺货', salePrice: '24640.00', qty: 1 },
            { code: 'SKU20002', name: '门店设备辅料包', salePrice: '17920.00', qty: 1 },
            { code: 'SKU20003', name: '门店拉新人力', salePrice: '13440.00', qty: 1 }
        ];
        var imageLines = [
            { code: 'SKU20004', name: '开业拉新物料', salePrice: '33.60', qty: 300 },
            { code: 'SKU20005', name: '门头招牌及店内品宣', salePrice: '20160.00', qty: 1 },
            { code: 'SKU20006', name: '门店监控套装', salePrice: '14560.00', qty: 1 }
        ];
        var opsLines = [
            { code: 'SKU20007', name: 'POS及会员管理系统', salePrice: '13440.00', qty: 1 },
            { code: 'SKU20008', name: '抖音本地生活投放', salePrice: '11200.00', qty: 1 },
            { code: 'SKU20009', name: '开业督导服务', salePrice: '8960.00', qty: 1 }
        ];
        return [
            rowSeed({
                code: 'XQ00013', storeCode: 'ONS00001', storeName: '西湖中心生鲜店',
                pkg: fresh, plan: freshPlan, status: '已驳回', rejectReason: '门店近期流水不足',
                skus: linesOf(freshLines), amount: '60480.00',
                creator: '喻巧', createdAt: '2026-10-08 09:16:20', updater: '王丽', updatedAt: '2026-10-09 11:02:18'
            }),
            rowSeed({
                code: 'XQ00014', storeCode: 'ONS00001', storeName: '西湖中心生鲜店',
                pkg: fresh, plan: freshPlan, status: '已作废',
                skus: linesOf(freshLines), amount: '60480.00',
                creator: '喻巧', createdAt: '2026-10-12 14:06:33', updater: '喻巧', updatedAt: '2026-10-14 16:20:11'
            }),
            /* 履约中，供门店端一键履约。额度已由发货中的 XQ00026 占满，本单不再重复占用。 */
            rowSeed(Object.assign({
                code: 'XQ00023', storeCode: 'ONS00001', storeName: '西湖中心生鲜店',
                pkg: fresh, plan: freshPlan, status: '门店付款中',
                quotaHeld: false,
                skus: linesOf(freshLines), amount: '60480.00',
                creator: '喻巧', createdAt: '2026-10-18 09:16:40', updater: '王丽', updatedAt: '2026-11-02 10:28:16',
                acceptedAt: '2026-10-18 14:02:18',
                dealLocked: true,
                signings: signedRows('ONS00001', '西湖中心生鲜店', '杭州鲜达贸易有限公司', '2026-10-20 11:26:33'),
                guaranteeDeposit: {
                    paid: true,
                    voucherName: '缴纳凭证',
                    uploadedAt: '2026-10-21 10:28:16',
                    uploadedBy: '王丽'
                }
            }, xianDa)),
            /* 发货中：首批铺货已到店确认，设备辅料已发出待确认，拉新人力尚未进场。 */
            rowSeed(Object.assign({
                code: 'XQ00026', storeCode: 'ONS00001', storeName: '西湖中心生鲜店',
                pkg: fresh, plan: freshPlan, status: '发货中',
                skus: linesOf(freshLines), amount: '60480.00',
                creator: '喻巧', createdAt: '2026-11-18 09:12:18', updater: '王丽', updatedAt: '2026-11-23 09:18:40',
                acceptedAt: '2026-11-18 11:06:22',
                signings: signedRows('ONS00001', '西湖中心生鲜店', '杭州鲜达贸易有限公司', '2026-11-18 16:40:08'),
                shipments: [
                    {
                        id: 'FH00026-1', skuCode: 'SKU20001', name: '汉言首批铺货', qty: 1, amount: '24640.00',
                        logisticsNo: 'SF1029384756', createdAt: '2026-11-20 10:12:08', creator: '王丽',
                        confirmed: true, confirmQty: 1, confirmedAt: '2026-11-20 15:06:21', confirmedBy: '喻巧'
                    },
                    {
                        id: 'FH00026-2', skuCode: 'SKU20002', name: '门店设备辅料包', qty: 1, amount: '17920.00',
                        logisticsNo: '', createdAt: '2026-11-23 09:18:40', creator: '王丽',
                        confirmed: false, confirmQty: 0
                    }
                ]
            }, xianDa)),
            rowSeed({
                code: 'XQ00015', storeCode: 'ONS00002', storeName: '东城和平里生鲜店',
                pkg: image, plan: imagePlan, status: '已作废',
                skus: linesOf(imageLines), amount: '48384.00',
                creator: '夏利', createdAt: '2026-10-20 10:12:40', updater: '夏利', updatedAt: '2026-10-21 09:40:18'
            }),
            rowSeed(Object.assign({
                code: 'XQ00024', storeCode: 'ONS00001', storeName: '西湖中心生鲜店',
                pkg: fresh, plan: freshPlan, status: '门店付款中',
                skus: linesOf(freshLines),
                amount: '60480.00', creator: '喻巧', createdAt: '2025-12-16 11:08:16', updater: '王丽', updatedAt: '2026-11-12 17:20:08',
                acceptedAt: '2025-12-17 15:42:30',
                /* 签署／支付提前到 2025-12，便于门店经营自定义时段演示跨年、跨月 */
                paidAt: '2025-12-18 16:08:26',
                quotaHeld: false,
                dealLocked: true,
                signings: signedRows('ONS00001', '西湖中心生鲜店', '杭州鲜达贸易有限公司', '2025-12-18 10:18:44'),
                guaranteeDeposit: {
                    paid: true,
                    voucherName: '缴纳凭证',
                    uploadedAt: '2025-12-18 17:20:08',
                    uploadedBy: '王丽'
                }
            }, xianDa)),
            /* 门店付款中：形象包已交付，门店按日还款。担保金凭证供详情和履约查看。 */
            rowSeed(Object.assign({
                code: 'XQ00016', storeCode: 'ONS00002', storeName: '东城和平里生鲜店',
                pkg: image, plan: imagePlan, status: '门店付款中',
                skus: linesOf(imageLines), amount: '48384.00',
                creator: '夏利', createdAt: '2026-11-06 11:22:09', updater: '王丽', updatedAt: '2026-11-12 17:20:08',
                acceptedAt: '2026-11-06 13:05:44',
                paidAt: '2026-11-07 09:22:05',
                dealLocked: true,
                signings: signedRows('ONS00002', '东城和平里生鲜店', '上海冷链融资租赁有限公司', '2026-11-07 09:12:40'),
                guaranteeDeposit: {
                    paid: true,
                    voucherType: 'application/pdf',
                    voucherName: '担保金缴纳凭证.pdf',
                    voucherData: '#',
                    uploadedAt: '2026-11-12 17:20:08',
                    uploadedBy: '王丽'
                }
            }, lengLian, {
                providerName: '宁波海丰商业保理有限公司',
                providerId: 'PRV20190002',
                hasProvider: true
            })),
            rowSeed({
                code: 'XQ00018', storeCode: 'ONS00003', storeName: '河东大桥道自提点',
                pkg: ops, plan: opsPlan, status: '已驳回', rejectReason: '门店近期流水不足',
                skus: linesOf(opsLines), amount: '36288.00',
                creator: '周海', createdAt: '2026-10-16 16:18:40', updater: '王丽', updatedAt: '2026-10-17 17:02:11'
            }),
            rowSeed({
                code: 'XQ00017', storeCode: 'ONS00003', storeName: '河东大桥道自提点',
                pkg: ops, plan: opsPlan, status: '待接单',
                skus: linesOf(opsLines), amount: '36288.00',
                creator: '周海', createdAt: '2026-11-12 08:46:15', updater: '周海', updatedAt: '2026-11-12 08:46:15'
            })
        ];
    }

    function rowSeed(spec) {
        var row = {
            code: spec.code,
            storeCode: spec.storeCode,
            storeName: spec.storeName,
            packageCode: spec.pkg.code,
            packageName: spec.pkg.name,
            skus: spec.skus,
            amount: spec.amount,
            installmentCode: spec.plan.installmentCode,
            installmentName: spec.plan.installmentName,
            repayCycle: '日结',
            repayMethod: '比例付',
            repayPeriod: spec.plan.repayPeriod,
            dailyAmount: '',
            status: spec.status,
            creator: spec.creator,
            createdAt: spec.createdAt,
            updater: spec.updater,
            updatedAt: spec.updatedAt
        };
        if (spec.traderName) row.traderName = spec.traderName;
        if (spec.traderPhone) row.traderPhone = spec.traderPhone;
        if (spec.providerName) row.providerName = spec.providerName;
        if (spec.providerId) row.providerId = spec.providerId;
        if (spec.hasProvider) row.hasProvider = true;
        if (spec.acceptedAt) row.acceptedAt = spec.acceptedAt;
        if (spec.paidAt) row.paidAt = spec.paidAt;
        if (spec.signings) row.signings = spec.signings;
        if (spec.rejectReason) row.rejectReason = spec.rejectReason;
        if (spec.dealLocked) row.dealLocked = true;
        if (spec.quotaHeld === false) row.quotaHeld = false;
        if (spec.guaranteeDeposit) row.guaranteeDeposit = spec.guaranteeDeposit;
        if (spec.shipments) row.shipments = spec.shipments;
        if (spec.supplementVoucher) row.supplementVoucher = spec.supplementVoucher;
        return row;
    }

    /* 会话里缺的演示需求补上。已存在的单不改状态、不覆盖。 */
    function ensurePendingSeed() {
        var current = readRaw();
        if (!current || !current.length) return;
        var codes = {};
        current.forEach(function (item) {
            if (item && item.code) codes[item.code] = true;
        });
        var added = false;
        seed().forEach(function (item) {
            if (!item || !item.code || codes[item.code]) return;
            current.push(item);
            codes[item.code] = true;
            added = true;
        });
        if (added) write(current);
    }

    function centsOf(value) {
        var text = String(value == null ? '' : value).replace(/^¥/, '').replace(/,/g, '');
        var num = Number(text);
        if (!isFinite(num)) return 0;
        return Math.round(num * 100);
    }

    function fromCents(cents) {
        var sign = cents < 0 ? '-' : '';
        var abs = Math.abs(Math.round(cents));
        return sign + Math.floor(abs / 100) + '.' + String(abs % 100).padStart(2, '0');
    }

    /* 商品金额 = 售价×数量；总金额沿用 amount；服务费 = 总金额 − 商品金额。 */
    function ensureAmountParts(item) {
        var goods = 0;
        (item.skus || []).forEach(function (sku) {
            var qty = Number(sku && sku.qty);
            if (!isFinite(qty) || qty < 0) qty = 0;
            goods += centsOf(sku && sku.salePrice) * qty;
        });
        goods = Math.round(goods);
        var total = centsOf(item.amount);
        var goodsText = fromCents(goods);
        var feeText = fromCents(total - goods);
        var totalText = fromCents(total);
        var changed = false;
        if (item.goodsAmount !== goodsText) {
            item.goodsAmount = goodsText;
            changed = true;
        }
        if (item.serviceFee !== feeText) {
            item.serviceFee = feeText;
            changed = true;
        }
        if (String(item.amount == null ? '' : item.amount) !== totalText) {
            item.amount = totalText;
            changed = true;
        }
        return changed;
    }

    function readRaw() {
        try {
            var raw = sessionStorage.getItem(KEY);
            if (raw == null) return null;
            var list = JSON.parse(raw);
            return Array.isArray(list) ? list : null;
        } catch (e) {
            return null;
        }
    }

    function write(list) {
        sessionStorage.setItem(KEY, JSON.stringify(list || []));
    }

    function normalizeStatus(status) {
        if (STATUS_MIGRATE[status]) return STATUS_MIGRATE[status];
        if (DEMAND_STATUSES.indexOf(status) >= 0 || CLOSED_STATUSES.indexOf(status) >= 0) return status;
        return '待接单';
    }

    /* 产品配置里的三方结算系数。会话里改过的优先，没有再回落到演示产品。 */
    var PRODUCT_RATES = {
        FQ00001: { store: '1.20', trader: '1.08', provider: '1.02' },
        FQ00002: { store: '1.20', trader: '1.08', provider: '1.02' },
        FQ00003: { store: '1.20', trader: '1.08', provider: '1.02' },
        FQ00004: { store: '1.20', trader: '1.08', provider: '1.02' },
        FQ00005: { store: '1.20', trader: '1.08', provider: '1.02' }
    };

    function settlementRates(item) {
        return productRates(item && item.installmentCode);
    }

    /* 已打开过的演示产品若还停在旧系数，刷成门店 1.20、贸易商 1.08、服务商 1.02。 */
    function refreshDemoProductRates(list) {
        var previous = {
            FQ00001: [['1.60', '1.20', '1.05'], ['1.60', '1.50', '1.40'], ['1.60', '1.00', '0.60']],
            FQ00004: [['1.70', '1.30', '1.05'], ['1.70', '1.60', '1.50'], ['1.70', '1.00', '0.70']],
            FQ00005: [['1.30', '1.10', '1.02'], ['1.30', '1.20', '1.10'], ['1.30', '0.80', '0.50']],
            FQ00002: [['1.80', '1.40', '1.08'], ['1.80', '1.70', '1.60'], ['1.80', '1.10', '0.70']],
            FQ00003: [['1.50', '1.20', '1.04'], ['1.50', '1.40', '1.30'], ['1.50', '0.90', '0.60']]
        };
        var changed = false;
        (list || []).forEach(function (item) {
            var rows = item && previous[item.code];
            if (!rows) return;
            var store = String(item.storeRate || '');
            var trader = String(item.traderRate || '');
            var provider = String(item.providerRate || '');
            if (store === '1.20' && trader === '1.08' && provider === '1.02') return;
            var hit = rows.some(function (pair) {
                return pair[0] === store && pair[1] === trader && (!provider || pair[2] === provider);
            });
            if (!hit) return;
            item.storeRate = '1.20';
            item.traderRate = '1.08';
            item.providerRate = '1.02';
            changed = true;
        });
        return changed;
    }

    function productRates(code) {
        var stored = null;
        try {
            var raw = sessionStorage.getItem('rbt_installment_v3');
            var list = raw ? JSON.parse(raw) : null;
            if (Array.isArray(list) && refreshDemoProductRates(list)) {
                sessionStorage.setItem('rbt_installment_v3', JSON.stringify(list));
            }
            if (Array.isArray(list)) {
                list.some(function (item) {
                    if (item && item.code === code) {
                        stored = item;
                        return true;
                    }
                    return false;
                });
            }
        } catch (e) {
            stored = null;
        }
        var fallback = PRODUCT_RATES[code] || null;
        function pick(field) {
            var live = stored && stored[field];
            if (live != null && String(live).trim() !== '') return String(live).trim();
            return fallback ? fallback[field === 'storeRate' ? 'store' : field === 'traderRate' ? 'trader' : 'provider'] : '';
        }
        var store = pick('storeRate');
        var trader = pick('traderRate');
        var provider = pick('providerRate');
        if (!store || !trader || !provider) return null;
        return { store: store, trader: trader, provider: provider };
    }

    function confirmedHasProvider(item) {
        if (!item || item.hasProvider === false) return false;
        if (item.hasProvider === true) return true;
        return !!(String(item.providerId || '').trim() || String(item.providerName || '').trim());
    }

    /* 发布后即待接单。只在确认有服务商时计提，没有则这部分留在冷丰。 */
    function includeProviderReceivable(item) {
        if (!item) return false;
        if (passedFirstAudit(item.status) || item.hasProvider === true || item.hasProvider === false) {
            return confirmedHasProvider(item);
        }
        return true;
    }

    function rateShare(goodsCents, rate) {
        var num = Number(rate);
        if (!isFinite(num)) return null;
        return Math.round(goodsCents * Math.round(num * 100) / 100);
    }

    function receivables(item) {
        var empty = { trader: '', lengfeng: '', provider: '' };
        if (!item || item.repayMethod !== '比例付') return empty;
        var rates = productRates(item.installmentCode);
        if (!rates) return empty;
        var goods = centsOf(item.goodsAmount);
        var storePay = rateShare(goods, rates.store);
        var traderPay = rateShare(goods, rates.trader);
        if (storePay == null || traderPay == null) return empty;
        var providerPay = 0;
        if (includeProviderReceivable(item)) {
            var accrued = rateShare(goods, rates.provider);
            if (accrued == null) return empty;
            providerPay = accrued - goods;
        }
        var lengfeng = storePay - traderPay - providerPay;
        return {
            trader: fromCents(traderPay),
            lengfeng: fromCents(lengfeng),
            provider: fromCents(providerPay)
        };
    }

    /* 扣率：门店应付按门店系数，贸易商实付 = 门店应付 ÷ 贸易商系数，服务商按实付计提。付款、每日付款仍用上面的 receivables。 */
    function ratePoints(rate) {
        var num = Number(rate);
        if (!isFinite(num)) return null;
        return Math.round(num * 100);
    }

    function deductAmounts(goodsCents, storeRate, traderRate, providerRate, withProvider) {
        var storePts = ratePoints(storeRate);
        var traderPts = ratePoints(traderRate);
        var providerPts = withProvider ? ratePoints(providerRate) : 100;
        if (storePts == null || traderPts == null || providerPts == null) return null;
        if (traderPts <= 0 || providerPts < 100 || providerPts >= 200) return null;
        var storePay = Math.round(goodsCents * storePts / 100);
        var traderPaid = Math.round(storePay * 100 / traderPts);
        var providerPay = withProvider ? Math.round(traderPaid * (providerPts - 100) / 100) : 0;
        var lengfeng = traderPaid - goodsCents - providerPay;
        return {
            storePay: storePay,
            traderPaid: traderPaid,
            traderReceipt: storePay,
            profit: storePay - traderPaid,
            providerPay: providerPay,
            lengfeng: lengfeng,
            s0: traderPts / (200 - providerPts),
            storeRate: storePts / 100
        };
    }

    /* 测算从商品包金额出发。商品金额先按 1 + 门店系数 − 贸易商系数折算，总金额再乘贸易商系数。 */
    function packageQuote(packageYuan, storeRate, traderRate, providerRate) {
        var pack = Math.round(Number(packageYuan) * 100);
        var storePts = ratePoints(storeRate);
        var traderPts = ratePoints(traderRate);
        var providerPts = ratePoints(providerRate);
        if (!isFinite(pack) || pack < 0 || storePts == null || traderPts == null || providerPts == null) return null;
        if (storePts <= 0 || traderPts <= 0) return null;
        var multPts = 100 + storePts - traderPts;
        if (multPts <= 0) return { blocked: true };
        var goods = Math.round(pack * multPts / 100);
        var total = Math.round(goods * traderPts / 100);
        var providerPay = Math.round(goods * (providerPts - 100) / 100);
        return {
            blocked: false,
            goods: goods / 100,
            fee: (total - goods) / 100,
            total: total / 100,
            paid: goods / 100,
            receive: total / 100,
            profit: (total - goods) / 100,
            providerPay: providerPay / 100
        };
    }

    function deductQuote(goodsYuan, storeRate, traderRate, providerRate) {
        var goods = Math.round(Number(goodsYuan) * 100);
        if (!isFinite(goods) || goods < 0) return null;
        var row = deductAmounts(goods, storeRate, traderRate, providerRate, true);
        if (!row) return null;
        return {
            storePay: row.storePay / 100,
            traderPaid: row.traderPaid / 100,
            traderReceipt: row.traderReceipt / 100,
            profit: row.profit / 100,
            providerPay: row.providerPay / 100,
            lengfeng: row.lengfeng / 100,
            blocked: row.lengfeng <= 0 || row.s0 >= row.storeRate - 0.0000001
        };
    }

    function deductSettlement(item) {
        var empty = { storePay: '', traderPaid: '', trader: '', profit: '', lengfeng: '', provider: '' };
        if (!item || item.repayMethod !== '比例付') return empty;
        var rates = productRates(item.installmentCode);
        if (!rates) return empty;
        var withProvider = includeProviderReceivable(item);
        var row = deductAmounts(centsOf(item.goodsAmount), rates.store, rates.trader, withProvider ? rates.provider : '1.00', withProvider);
        if (!row) return empty;
        return {
            storePay: fromCents(row.storePay),
            traderPaid: fromCents(row.traderPaid),
            trader: fromCents(row.traderReceipt),
            profit: fromCents(row.profit),
            lengfeng: fromCents(row.lengfeng),
            provider: fromCents(row.providerPay)
        };
    }

    /* 贸易商服务费并进单价。需求单商品金额仍是原价。加价率 = 贸易商结算系数 − 1。订单实付按原价 ×（1 + 加价率）。 */
    function markupOf(item) {
        var rates = productRates(item && item.installmentCode);
        var goods = centsOf(item && item.goodsAmount);
        var traderRate = rates ? Number(rates.trader) : NaN;
        var rate = isFinite(traderRate) && traderRate > 0 ? Math.round((traderRate - 1) * 10000) / 100 : null;
        var marked = rate != null ? Math.round(goods * Math.round(traderRate * 100) / 100) : null;
        return {
            rate: rate,
            rateText: rate == null ? '—' : rate.toFixed(2) + '%',
            original: fromCents(goods),
            marked: marked == null ? '' : fromCents(marked)
        };
    }

    /* 待接单及之后应能看到结算比例。 */
    function passedFirstAudit(status) {
        return status === '待接单' || status === '待确认签约' || status === '待重新确认' || status === '待签署' || status === '发货中' || status === '待付款' || status === '门店付款中' || status === '已完成';
    }

    /* 演示数据当初写在产品上的比例。待接单及之后、单上还没有渠道比例时，用它补三个渠道的默认比例。 */
    function legacyRatioIndex() {
        var byCode = {};
        var byPlan = {};
        seed().forEach(function (item) {
            var ratio = window.RbtSettleRatio ? RbtSettleRatio.parseRatio(item.repayPeriod) : '';
            if (!ratio) return;
            if (item.code) byCode[item.code] = ratio;
            if (item.installmentCode && !byPlan[item.installmentCode]) byPlan[item.installmentCode] = ratio;
        });
        return { byCode: byCode, byPlan: byPlan };
    }

    function legacyAuditedRatio(item, index) {
        var api = window.RbtSettleRatio;
        if (!api || !item) return '';
        var own = api.parseRatio(item.repayPeriod);
        if (own) return own;
        if (index.byCode[item.code]) return index.byCode[item.code];
        return index.byPlan[item.installmentCode] || '';
    }

    var ACCEPT_TIMEOUT_KEY = 'rbt_accept_timeout_v1';
    var WITHDRAW_REASON_KEY = 'rbt_withdraw_reasons_v1';

    function withdrawReasons() {
        try {
            var raw = sessionStorage.getItem(WITHDRAW_REASON_KEY);
            if (!raw) return [];
            var data = JSON.parse(raw);
            var list = Array.isArray(data) ? data : (data && data.reasons);
            if (!Array.isArray(list)) return [];
            var seen = {};
            return list.reduce(function (rows, item) {
                var text = String(item || '').trim();
                if (!text || text.length > 30 || seen[text]) return rows;
                seen[text] = true;
                rows.push(text);
                return rows;
            }, []);
        } catch (e) {
            return [];
        }
    }

    function saveWithdrawReasons(list) {
        var next = withdrawReasonsFrom(list);
        sessionStorage.setItem(WITHDRAW_REASON_KEY, JSON.stringify({ reasons: next }));
        return next;
    }

    function withdrawReasonsFrom(list) {
        var seen = {};
        return (list || []).reduce(function (rows, item) {
            var text = String(item || '').trim();
            if (!text || text.length > 30 || seen[text]) return rows;
            seen[text] = true;
            rows.push(text);
            return rows;
        }, []);
    }

    function readAcceptTimeoutMinutes() {
        try {
            var raw = sessionStorage.getItem(ACCEPT_TIMEOUT_KEY);
            if (!raw) return 0;
            var data = JSON.parse(raw);
            var minutes = Number(data && data.minutes);
            if (!isFinite(minutes) || minutes <= 0 || Math.floor(minutes) !== minutes) return 0;
            return minutes;
        } catch (e) {
            return 0;
        }
    }

    function parseClock(text) {
        var matched = String(text || '').match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/);
        if (!matched) return NaN;
        return new Date(Number(matched[1]), Number(matched[2]) - 1, Number(matched[3]), Number(matched[4]), Number(matched[5]), Number(matched[6] || 0)).getTime();
    }

    /* 只处理待确认签约。确认签约后已生成合同，不再因接单超时退回。 */
    function expireAcceptTimeout(rows) {
        var minutes = readAcceptTimeoutMinutes();
        if (!minutes) return false;
        var limit = minutes * 60 * 1000;
        var now = Date.now();
        var changed = false;
        (rows || []).forEach(function (item) {
            if (!item || item.status !== '待确认签约' || !item.acceptedAt) return;
            var accepted = parseClock(item.acceptedAt);
            if (!isFinite(accepted) || now - accepted < limit) return;
            item.status = '待接单';
            item.traderName = '';
            item.traderPhone = '';
            item.acceptedAt = '';
            item.providerName = '';
            item.providerId = '';
            delete item.hasProvider;
            var note = '接单超时，自动撤回';
            var remark = String(item.remark || '').trim();
            item.remark = remark && remark.indexOf(note) < 0 ? remark + '；' + note : (remark || note);
            touchAudit(item, '系统');
            ensureLogs(item);
            pushLog(item, '接单超时，自动撤回，状态：待确认签约 → 待接单', '系统', item.updatedAt);
            changed = true;
        });
        return changed;
    }

    /* 旧演示单还是生鲜 SKU。整表换成按商品包铺开的开业需求，避免和额度、产品对不上。 */
    function replaceLegacyFoodDemands() {
        var current = readRaw();
        if (!current || !current.length) return false;
        var legacy = current.some(function (item) {
            return (item && item.skus || []).some(function (sku) {
                return sku && /^SKU100/.test(String(sku.code || ''));
            });
        });
        if (!legacy) return false;
        write(seed());
        return true;
    }

    /* 演示需求若还停在商品包标准售价，按 1.12 折成售卖单价，并重算总金额。发货金额若仍等于旧售价，一并改掉。 */
    var DEMO_SALE_QUOTE = {
        SKU20001: { from: 2200000, to: '24640.00' },
        SKU20002: { from: 1600000, to: '17920.00' },
        SKU20003: { from: 1200000, to: '13440.00' },
        SKU20004: { from: 3000, to: '33.60' },
        SKU20005: { from: 1800000, to: '20160.00' },
        SKU20006: { from: 1300000, to: '14560.00' },
        SKU20007: { from: 1200000, to: '13440.00' },
        SKU20008: { from: 1000000, to: '11200.00' },
        SKU20009: { from: 800000, to: '8960.00' }
    };

    function refreshQuotedSales(item) {
        if (!item) return false;
        var touched = false;
        (item.skus || []).forEach(function (sku) {
            var spec = sku && DEMO_SALE_QUOTE[sku.code];
            if (!spec || centsOf(sku.salePrice) !== spec.from) return;
            sku.salePrice = spec.to;
            touched = true;
        });
        (item.shipments || []).forEach(function (row) {
            var spec = row && DEMO_SALE_QUOTE[row.skuCode];
            if (!spec) return;
            var qty = Number(row.qty);
            if (!isFinite(qty) || qty < 0) qty = 0;
            if (centsOf(row.amount) !== spec.from * qty) return;
            row.amount = fromCents(centsOf(spec.to) * qty);
            touched = true;
        });
        var goods = 0;
        (item.skus || []).forEach(function (sku) {
            var qty = Number(sku && sku.qty);
            if (!isFinite(qty) || qty < 0) qty = 0;
            goods += centsOf(sku && sku.salePrice) * qty;
        });
        var rates = productRates(item.installmentCode);
        var traderPts = rates && rates.trader ? Math.round(Number(rates.trader) * 100) : null;
        var nextAmount = traderPts > 0 ? fromCents(Math.round(goods * traderPts / 100)) : '';
        var staleTotals = {
            FQ00001: [8000000, 6000000, 6720000],
            FQ00002: [7200000, 4800000, 5376000],
            FQ00003: [4500000, 3600000, 4032000]
        };
        var stale = staleTotals[item.installmentCode] || [];
        if (!touched && !(nextAmount && stale.indexOf(centsOf(item.amount)) >= 0)) return false;
        if (nextAmount && item.amount !== nextAmount) {
            item.amount = nextAmount;
            touched = true;
        }
        return touched;
    }

    function list() {
        var replaced = replaceLegacyFoodDemands();
        ensurePendingSeed();
        var current = readRaw();
        var seeded = false;
        if (!current || !current.length) {
            current = seed();
            write(current);
            seeded = true;
        }
        var changed = replaced;
        var legacyRatios = legacyRatioIndex();
        var rows = current.map(function (item) {
            if (!item) return null;
            var next = normalizeStatus(item.status);
            if (next !== item.status) {
                item.status = next;
                changed = true;
            }
            var packageRename = { '周末生鲜包': '汉言开业铺货包', '肉类组合包': '门店形象配置包', '果蔬尝鲜包': '开业运营服务包' };
            if (packageRename[item.packageName]) {
                item.packageName = packageRename[item.packageName];
                changed = true;
            }
            var productRename = { '生鲜周转分期': '开业铺货日结', '肉类备货分期': '门店形象日结', '果蔬短周期': '开业运营日结' };
            if (productRename[item.installmentName]) {
                item.installmentName = productRename[item.installmentName];
                changed = true;
            }
            /* 旧种子把西湖中心演示单写成已完成，门店端没有剩余履行额，一键履约会一直置灰。 */
            if (item.code === 'XQ00023' && item.storeCode === 'ONS00001' && item.status === '已完成' && item.updatedAt === '2026-11-02 10:28:16') {
                item.status = '门店付款中';
                item.quotaHeld = false;
                changed = true;
            }
            /* 门店付款中/已完成表示贸易商已付款，用于重算已成交 */
            if ((item.status === '门店付款中' || item.status === '已完成') && !item.dealLocked) {
                item.dealLocked = true;
                changed = true;
            }
            if (!item.creator) {
                item.creator = item.storeName || '门店';
                changed = true;
            }
            if (!item.createdAt) {
                item.createdAt = item.updatedAt || nowText();
                changed = true;
            }
            if (!item.updater) {
                item.updater = item.creator;
                changed = true;
            }
            if (!item.updatedAt) {
                item.updatedAt = item.createdAt;
                changed = true;
            }
            if (item.guarantors) {
                delete item.guarantors;
                changed = true;
            }
            if (Array.isArray(item.signings)) {
                var signings = item.signings.filter(function (row) {
                    return row && String(row.key || '').indexOf('guarantee:') !== 0;
                });
                if (signings.length !== item.signings.length) {
                    item.signings = signings;
                    changed = true;
                }
            }
            if (item.repayMethod === '比例付' && !(item.settleRatios && item.settleRatios.length)) {
                var fromProduct = ratiosFromProduct(item);
                if (!fromProduct && passedFirstAudit(item.status)) {
                    var legacy = legacyAuditedRatio(item, legacyRatios);
                    fromProduct = legacy && window.RbtSettleRatio.normalize(window.RbtSettleRatio.CHANNELS.map(function (channel) {
                        return { channel: channel, fallback: legacy, rows: [] };
                    }));
                }
                if (fromProduct) {
                    item.settleRatios = fromProduct;
                    changed = true;
                }
            }
            if (item.repayMethod === '比例付' && !(item.settleRatios && item.settleRatios.length) && item.repayPeriod) {
                item.repayPeriod = '';
                changed = true;
            }
            if (item.repayCycle === '日付' || item.repayCycle === '日还') {
                item.repayCycle = '日结';
                changed = true;
            }
            /* 已付过款的演示单补支付时间。时间落在签署之后、复核或凭证之前，不改更新时间。 */
            var paidSeeds = {
                XQ00016: '2026-11-07 09:22:05',
                XQ00020: '2026-11-06 16:35:16',
                XQ00023: '2026-11-08 16:42:18',
                XQ00024: '2025-12-18 16:08:26'
            };
            if (!item.paidAt && paidSeeds[item.code] && (item.status === '待复核' || item.status === '还款中' || item.status === '门店付款中' || item.status === '已完成')) {
                item.paidAt = paidSeeds[item.code];
                changed = true;
            }
            /* 接单后、确认签约前还没有合同。未签署的 XQ00014 从待签署收回这一步。 */
            if (item.code === 'XQ00014' && item.status === '待签署' && !(item.signings && item.signings.length)) {
                item.status = '待确认签约';
                changed = true;
            }
            /* 早期演示把 XQ00012 的商品金额写成了总金额，按肉类 1.80 系数补回。 */
            if (item.code === 'XQ00012' && String(item.amount) === '1257.60') {
                item.amount = '2263.68';
                changed = true;
            }
            if (refreshQuotedSales(item)) changed = true;
            if (ensureAmountParts(item)) changed = true;
            if (ensureContract(item)) changed = true;
            if (ensureLogs(item)) changed = true;
            return item;
        }).filter(function (item) {
            if (!item) return false;
            var method = item.repayMethod;
            if (method === '定额付' || method === '定额还' || method === '等额本息') {
                changed = true;
                return false;
            }
            return true;
        });
        var tradeMade = false;
        if (window.RbtTradeDocs && typeof window.RbtTradeDocs.ensureForPassedDemands === 'function') {
            var madeDocs = window.RbtTradeDocs.ensureForPassedDemands(rows);
            (madeDocs || []).forEach(function (result) {
                var item = result && result.demandCode ? findDemand(rows, result.demandCode) : null;
                if (!item) return;
                ensureLogs(item);
                pushLog(item, '生成上游交易单、下游交易单', item.updater || '系统', item.updatedAt);
                tradeMade = true;
            });
        }
        if (expireAcceptTimeout(rows)) changed = true;
        if (changed || tradeMade) write(rows);
        if (seeded || changed) rebuildStoreDealAmounts();
        rebuildStoreOccupiedAmounts();
        return rows;
    }

    function get(code) {
        var found = null;
        list().some(function (item) {
            if (item.code === code) {
                found = item;
                return true;
            }
            return false;
        });
        return found;
    }

    /* 未释放占用的进行中需求（已作废 / 已驳回 / 已完成除外）。 */
    function holdsOccupiedQuota(demand) {
        if (!demand) return false;
        if (RELEASE_STATUSES.indexOf(demand.status) >= 0) return false;
        if (demand.quotaHeld === false) return false;
        return true;
    }

    /* 某门店当前占用额度所关联的需求单（本店作为需求门店）。 */
    function listOccupyingDemands(storeCode) {
        if (!storeCode) return [];
        return list().filter(function (demand) {
            return holdsOccupiedQuota(demand) && demand && demand.storeCode === storeCode;
        }).map(function (demand) {
            return {
                code: demand.code,
                storeCode: demand.storeCode,
                storeName: demand.storeName,
                packageCode: demand.packageCode,
                packageName: demand.packageName,
                goodsAmount: demand.goodsAmount,
                serviceFee: demand.serviceFee,
                amount: demand.amount,
                status: demand.status,
                repayCycle: demand.repayCycle,
                repayMethod: demand.repayMethod,
                repayPeriod: demand.repayPeriod,
                creator: demand.creator,
                createdAt: demand.createdAt
            };
        });
    }

    function demandStoreCodes(demand) {
        return demand && demand.storeCode ? [demand.storeCode] : [];
    }

    function adjustStoresOccupied(codes, delta, operator) {
        var storeApi = window.RbtStoreData;
        if (!storeApi || typeof storeApi.adjustOccupied !== 'function') return;
        var amount = Number(delta) || 0;
        if (!amount) return;
        (codes || []).forEach(function (code) {
            storeApi.adjustOccupied(code, amount, operator);
        });
    }

    function moneyNumber(value) {
        var num = Number(String(value == null ? '' : value).replace(/,/g, '').replace(/^¥/, ''));
        if (!isFinite(num)) return 0;
        return Number(num.toFixed(2));
    }

    /* 占用按商品金额。已记下占用额的单，释放时用当时的金额。 */
    function occupyAmount(demand) {
        return moneyNumber(demand && demand.goodsAmount);
    }

    /* 发布成功：需求门店按商品金额增加已占用。 */
    function occupyDemandQuota(demand) {
        if (!demand || demand.quotaHeld) return demand;
        var amount = occupyAmount(demand);
        demand.quotaAmount = amount;
        if (amount > 0) adjustStoresOccupied(demandStoreCodes(demand), amount, demand.updater || demand.creator || '用户名');
        demand.quotaHeld = true;
        return demand;
    }

    /* 已作废 / 已驳回 / 已完成：按当时占用的商品金额释放。 */
    function releaseDemandQuota(demand) {
        if (!demand || !demand.quotaHeld) return demand;
        var amount = demand.quotaAmount != null && demand.quotaAmount !== ''
            ? moneyNumber(demand.quotaAmount)
            : moneyNumber(demand.amount);
        if (amount > 0) adjustStoresOccupied(demandStoreCodes(demand), -Math.abs(amount), demand.updater || demand.creator || '用户名');
        demand.quotaHeld = false;
        return demand;
    }

    /* 确认发货完成：已成交只加需求单商品金额，不按总金额，也不按实发。 */
    function lockDemandDeal(demand) {
        if (!demand || demand.dealLocked) return demand;
        var storeApi = window.RbtStoreData;
        var amount = occupyGoodsAmount(demand);
        if (amount > 0 && demand.storeCode && storeApi && typeof storeApi.adjustLocked === 'function') {
            storeApi.adjustLocked(demand.storeCode, amount, demand.updater || demand.creator || '用户名');
        }
        demand.dealLocked = true;
        return demand;
    }

    /* 已占用按进行中需求单的商品金额重算，与已占用弹窗同一口径。已作废、已驳回、已完成不计入。 */
    function occupyGoodsAmount(demand) {
        if (!demand) return 0;
        if (demand.goodsAmount != null && demand.goodsAmount !== '') return moneyNumber(demand.goodsAmount);
        var goods = 0;
        (demand.skus || []).forEach(function (sku) {
            var qty = Number(sku && sku.qty);
            if (!isFinite(qty) || qty < 0) qty = 0;
            goods += centsOf(sku && sku.salePrice) * qty;
        });
        return moneyNumber(fromCents(Math.round(goods)));
    }

    function demandRowsForQuota() {
        var current = readRaw();
        return current ? current : seed();
    }

    function rebuildStoreOccupiedAmounts() {
        replaceLegacyFoodDemands();
        var storeApi = window.RbtStoreData;
        if (!storeApi || typeof storeApi.list !== 'function' || typeof storeApi.applyQuota !== 'function') return;
        var sums = {};
        demandRowsForQuota().forEach(function (demand) {
            if (!holdsOccupiedQuota(demand) || !demand.storeCode) return;
            var amount = occupyGoodsAmount(demand);
            if (amount <= 0) return;
            sums[demand.storeCode] = Number(((sums[demand.storeCode] || 0) + amount).toFixed(2));
        });
        var stores = storeApi.list();
        var changed = false;
        stores.forEach(function (store) {
            var next = sums[store.code] || 0;
            if (Number(store.occupiedQuota || 0) === next) return;
            storeApi.applyQuota(store, store.storeQuota, next, store.lockedQuota != null ? store.lockedQuota : 0);
            changed = true;
        });
        if (changed && typeof storeApi.saveList === 'function') storeApi.saveList(stores);
        rebuildStoreDealAmounts();
    }

    /* 按已进入门店付款中或已完成的需求单重算各门店已成交，避免演示假数据混入。 */
    function rebuildStoreDealAmounts() {
        var storeApi = window.RbtStoreData;
        if (!storeApi || typeof storeApi.list !== 'function' || typeof storeApi.applyQuota !== 'function') return;
        var sums = {};
        var demands = demandRowsForQuota();
        demands.forEach(function (demand) {
            if (!demand || !demand.storeCode || !demand.dealLocked) return;
            var amount = occupyGoodsAmount(demand);
            if (amount <= 0) return;
            sums[demand.storeCode] = Number(((sums[demand.storeCode] || 0) + amount).toFixed(2));
        });
        var stores = storeApi.list();
        var changed = false;
        stores.forEach(function (store) {
            var next = sums[store.code] || 0;
            if (Number(store.lockedQuota || 0) === next) return;
            storeApi.applyQuota(store, store.storeQuota, store.occupiedQuota, next);
            changed = true;
        });
        if (changed && typeof storeApi.saveList === 'function') storeApi.saveList(stores);
    }

    function setStatus(code, status, operator) {
        var rows = list();
        var target = null;
        rows.some(function (item) {
            if (item.code === code) {
                target = item;
                return true;
            }
            return false;
        });
        if (!target) return null;
        var prev = target.status;
        if (status === '已作废' && prev !== '已作废' && (hasContractStatus(prev) || (target.signings && target.signings.length) || (target.contract && target.contract.code))) {
            target.contractsVoided = true;
        }
        target.status = status;
        touchAudit(target, operator || '王丽');
        ensureLogs(target);
        var statusLog = statusLogText(prev, status, target);
        if (statusLog) pushLog(target, statusLog, target.updater, target.updatedAt);
        if (status === '门店付款中' && prev !== '门店付款中') {
            if (target.shipments && target.shipments.length) target.shipSkus = aggregateShipSkus(target);
            lockDemandDeal(target);
            if (window.RbtTradeDocs && typeof window.RbtTradeDocs.ensureForDemand === 'function') {
                var madeDocs = window.RbtTradeDocs.ensureForDemand(target, operator);
                if (madeDocs && madeDocs.created) {
                    pushLog(target, '生成上游交易单、下游交易单', target.updater, target.updatedAt);
                }
            }
        }
        if (prev !== '已完成' && status === '已完成') target.completedAt = target.updatedAt;
        if (RELEASE_STATUSES.indexOf(status) >= 0) releaseDemandQuota(target);
        ensureContract(target);
        write(rows);
        return target;
    }

    function traderNameOf(trader) {
        return (trader && (trader.name || trader.traderName)) || '';
    }

    /* 服务商档案中的账号不能接单。对不上档案时仍按贸易商处理。 */
    function traderIsProvider(trader) {
        var name = traderNameOf(trader);
        var api = window.MdmProviderArchiveStore;
        if (!name || !api || typeof api.list !== 'function') return false;
        var matched = false;
        (api.list() || []).some(function (row) {
            if (!row) return false;
            if (row.name === name || row.subjectName === name || (row.license && row.license.name === name)) {
                matched = true;
                return true;
            }
            return false;
        });
        return matched;
    }

    function findDemand(rows, code) {
        var target = null;
        (rows || []).some(function (item) {
            if (item && item.code === code) {
                target = item;
                return true;
            }
            return false;
        });
        return target;
    }

    function clearDemandProvider(target) {
        if (!target) return;
        target.providerName = '';
        target.providerId = '';
        delete target.hasProvider;
    }

    /* 接单时带上该贸易商档案里绑定的服务商。对不上档案时不写。 */
    function boundProviderOf(traderName) {
        var traderApi = window.MdmTraderArchiveStore;
        if (!traderApi || typeof traderApi.list !== 'function' || !traderName) return null;
        var trader = null;
        (traderApi.list() || []).some(function (row) {
            if (!row) return false;
            var name = row.name || row.subjectName || (row.license && row.license.name) || '';
            if (name === traderName) {
                trader = row;
                return true;
            }
            return false;
        });
        if (!trader) return null;
        var boundName = String(trader.boundProvider || '').trim();
        if (!boundName || boundName === '—') return null;
        var providerId = '';
        var providerApi = window.MdmProviderArchiveStore;
        if (providerApi && typeof providerApi.list === 'function') {
            (providerApi.list() || []).some(function (row) {
                if (!row) return false;
                if (row.name === boundName || row.subjectName === boundName) {
                    providerId = row.id || '';
                    return true;
                }
                return false;
            });
        }
        return { name: boundName, id: providerId };
    }

    function attachBoundProvider(target, traderName) {
        var bound = boundProviderOf(traderName);
        if (!bound) {
            clearDemandProvider(target);
            return;
        }
        target.providerName = bound.name;
        target.providerId = bound.id;
        target.hasProvider = true;
    }

    /* 仅待接单可接。成功后进入待确认签约，并带上绑定服务商。此时还不生成合同。 */
    function acceptDemand(code, trader) {
        var rows = list();
        var target = findDemand(rows, code);
        if (!target) return { ok: false, reason: 'missing' };
        if (traderIsProvider(trader)) return { ok: false, reason: 'provider', demand: target };
        if (target.status !== '待接单' || target.traderName) {
            return { ok: false, reason: 'taken', demand: target };
        }
        var name = traderNameOf(trader) || '贸易商';
        target.traderName = name;
        target.traderPhone = (trader && trader.phone) || '';
        target.acceptedAt = nowText();
        target.withdrawReason = '';
        attachBoundProvider(target, name);
        write(rows);
        var saved = setStatus(code, '待确认签约', name);
        if (!saved) return { ok: false, reason: 'missing' };
        return { ok: true, demand: saved };
    }

    /* 余额尚未对接。演示余额按贸易商名称，可被 session 覆盖。 */
    var TRADER_BALANCE_KEY = 'rbt_trader_balance_mock_v1';
    var TRADER_BALANCE_DEFAULTS = {
        '杭州鲜达贸易有限公司': '100000.00',
        '上海冷链融资租赁有限公司': '200000.00',
        '宁波海丰商业保理有限公司': '50000.00'
    };

    function readTraderBalances() {
        var map = {};
        Object.keys(TRADER_BALANCE_DEFAULTS).forEach(function (key) {
            map[key] = TRADER_BALANCE_DEFAULTS[key];
        });
        try {
            var raw = sessionStorage.getItem(TRADER_BALANCE_KEY);
            var saved = raw ? JSON.parse(raw) : null;
            if (saved && typeof saved === 'object') {
                Object.keys(saved).forEach(function (key) {
                    if (saved[key] != null && String(saved[key]).trim() !== '') map[key] = String(saved[key]);
                });
            }
        } catch (e) { /* 用默认演示余额 */ }
        return map;
    }

    function traderBalanceOf(name) {
        if (typeof window !== 'undefined' && window.RbtPartyWallet && typeof window.RbtPartyWallet.balanceOf === 'function') {
            var fromWallet = window.RbtPartyWallet.balanceOf('trader', name);
            if (isFinite(fromWallet)) return fromWallet;
        }
        var text = readTraderBalances()[name];
        return text == null ? 0 : moneyNumber(text);
    }

    /* 确认签约前，贸易商余额须覆盖本单应付。应付 = 商品金额。通过后与生成合同同一步冻结。演示只校验，不扣款。 */
    function traderBalanceCheck(code, trader) {
        var item = code && typeof code === 'object' ? code : get(code);
        var name = traderNameOf(trader);
        var need = item && item.goodsAmount ? moneyNumber(item.goodsAmount) : 0;
        var balance = traderBalanceOf(name);
        if (!item) return { ok: false, reason: 'missing', balance: balance, need: need };
        if (!(need > 0)) return { ok: false, reason: 'amount', balance: balance, need: need, demand: item };
        if (balance + 0.001 < need) return { ok: false, reason: 'balance', balance: balance, need: need, demand: item };
        return { ok: true, balance: balance, need: need, demand: item };
    }

    /* 待确认签约由接单贸易商确认。余额足够时进入待签署，生成两份合同，并冻结本单实付。余额不足则不生成合同、不冻结。 */
    function confirmSigning(code, trader) {
        var rows = list();
        var target = findDemand(rows, code);
        if (!target) return { ok: false, reason: 'missing' };
        if (target.status !== '待确认签约') return { ok: false, reason: 'status', demand: target };
        var name = traderNameOf(trader);
        if (!name || target.traderName !== name) return { ok: false, reason: 'trader', demand: target };
        var covered = traderBalanceCheck(target, trader);
        if (!covered.ok) return covered;
        var saved = setStatus(code, '待签署', name);
        if (!saved) return { ok: false, reason: 'missing' };
        return { ok: true, demand: saved };
    }

    /* 确认签约前可撤回。必须填写原因。清空接单贸易商，进入待重新确认；平台重新发布后才回到待接单。 */
    function withdrawAccept(code, trader, reason) {
        var why = String(reason || '').trim();
        if (!why) return { ok: false, reason: 'empty' };
        if (why.length > 100) return { ok: false, reason: 'long' };
        var rows = list();
        var target = findDemand(rows, code);
        if (!target) return { ok: false, reason: 'missing' };
        if (target.status !== '待确认签约') return { ok: false, reason: 'status', demand: target };
        var name = traderNameOf(trader);
        if (!name || target.traderName !== name) return { ok: false, reason: 'trader', demand: target };
        target.traderName = '';
        target.traderPhone = '';
        target.acceptedAt = '';
        target.withdrawReason = why;
        clearDemandProvider(target);
        write(rows);
        var saved = setStatus(code, '待重新确认', name);
        if (!saved) return { ok: false, reason: 'missing' };
        return { ok: true, demand: saved };
    }

    function canRepublishDemand(demand) {
        return !!(demand && demand.status === '待重新确认');
    }

    /* 平台确认后重新发布，需求回到待接单，贸易商可以再接。 */
    function republishDemand(code, operator) {
        var rows = list();
        var target = findDemand(rows, code);
        if (!target || !canRepublishDemand(target)) return null;
        target.traderName = '';
        target.traderPhone = '';
        target.acceptedAt = '';
        target.withdrawReason = '';
        clearDemandProvider(target);
        write(rows);
        return setStatus(code, '待接单', operator || '平台');
    }

    function canVoidDemand(demand) {
        return !!(demand && VOIDABLE_STATUSES.indexOf(demand.status) >= 0);
    }

    /* 门店付款中之前由平台作废。已产生的合同在 setStatus 里标成已作废。 */
    function voidDemand(code, operator) {
        var rows = list();
        var target = findDemand(rows, code);
        if (!target) return null;
        if (!canVoidDemand(target)) return null;
        return setStatus(code, '已作废', operator || '平台');
    }

    function partyKey(contractKey, role, code, name) {
        if (role === 'trader') return contractKey + ':trader:' + (name || '');
        if (role === 'supply') return contractKey + ':supply';
        return contractKey + ':' + role + ':' + (code || '');
    }

    function signedMap(item) {
        var signed = {};
        (item && item.signings || []).forEach(function (row) {
            if (row && row.key) signed[row.key] = row.signedAt || '';
        });
        return signed;
    }

    function bindParty(party, contractKey, signed) {
        party.key = partyKey(contractKey, party.role, party.code, party.name);
        party.signedAt = signed[party.key] || '';
        return party;
    }

    /* 两份文件：销售合同（需求门店与贸易商）、采购合同（贸易商与冷丰供应链）。 */
    function signContracts(item) {
        if (!item) return [];
        if (item.status === '已作废' && !item.contractsVoided) return [];
        var signed = signedMap(item);
        var seq = String(item.code || '').replace(/\D/g, '') || '00001';
        var contracts = [];
        contracts.push({
            key: 'sale',
            type: 'sale',
            name: '销售合同',
            code: 'XS' + seq,
            parties: [
                bindParty({ role: 'store', roleLabel: '需求门店', code: item.storeCode || '', name: item.storeName || '需求门店' }, 'sale', signed),
                bindParty({ role: 'trader', roleLabel: '贸易商', code: '', name: item.traderName || '' }, 'sale', signed)
            ]
        });
        contracts.push({
            key: 'purchase',
            type: 'purchase',
            name: '采购合同',
            code: 'CG' + seq,
            parties: [
                bindParty({ role: 'trader', roleLabel: '贸易商', code: '', name: item.traderName || '' }, 'purchase', signed),
                bindParty({ role: 'supply', roleLabel: '冷丰供应链', code: 'supply', name: '冷丰供应链' }, 'purchase', signed)
            ]
        });
        var voided = item.status === '已作废' && item.contractsVoided;
        contracts.forEach(function (contract) {
            if (voided) {
                contract.signStatus = '已作废';
                return;
            }
            contract.signStatus = contract.parties.every(function (party) { return !!party.signedAt; }) ? '已签署' : '待签署';
        });
        return contracts;
    }

    function signParties(item) {
        var list = [];
        signContracts(item).forEach(function (contract) {
            (contract.parties || []).forEach(function (party) { list.push(party); });
        });
        return list;
    }

    function partyMatchesActor(party, actor) {
        if (!party || !actor) return false;
        if (party.role === 'trader') return actor.role === 'trader' && !!party.name && party.name === (actor.name || '');
        if (party.role === 'supply') return actor.role === 'supply';
        if (actor.role === 'trader' || actor.role === 'supply') return false;
        return !!actor.code && party.code === actor.code && party.role === 'store';
    }

    function matchParty(item, actor) {
        var found = null;
        signParties(item).some(function (party) {
            if (partyMatchesActor(party, actor)) {
                found = party;
                return true;
            }
            return false;
        });
        return found;
    }

    function contractsDone(item) {
        return signContracts(item).every(function (contract) {
            return (contract.parties || []).every(function (party) { return !!party.signedAt; });
        });
    }

    /* 当前签署方确认其中一份合同。冻结已在确认签约完成，这里不再校验余额。各方都签完后系统自动划款，需求进入发货中，先不生成交易单。 */
    function signDemand(code, actor, contractKey) {
        var rows = list();
        var target = null;
        rows.some(function (item) {
            if (item && item.code === code) {
                target = item;
                return true;
            }
            return false;
        });
        if (!target) return { ok: false, reason: 'missing' };
        if (target.status !== '待签署') return { ok: false, reason: 'status', demand: target };
        var contract = null;
        signContracts(target).some(function (row) {
            if (row.key === contractKey) {
                contract = row;
                return true;
            }
            return false;
        });
        var mine = null;
        if (contract) {
            contract.parties.some(function (party) {
                if (partyMatchesActor(party, actor)) {
                    mine = party;
                    return true;
                }
                return false;
            });
        }
        if (!mine) return { ok: false, reason: 'party', demand: target };
        if (mine.signedAt) return { ok: false, reason: 'signed', demand: target };
        target.signings = target.signings || [];
        target.signings.push({
            key: mine.key,
            role: mine.role,
            code: mine.code || '',
            name: mine.name || '',
            contractKey: contractKey,
            signedAt: nowText()
        });
        var done = contractsDone(target);
        if (!done) {
            touchAudit(target, mine.name || '签署');
            ensureLogs(target);
            pushLog(target, '签署' + (contract.name || '合同'), mine.name || '签署', target.updatedAt);
            write(rows);
            return { ok: true, done: false, demand: target };
        }
        target.payMethod = 'auto';
        target.paidAt = nowText();
        write(rows);
        if (typeof window !== 'undefined' && window.RbtPartyWallet && typeof window.RbtPartyWallet.transferToSupply === 'function') {
            window.RbtPartyWallet.transferToSupply(target.traderName, code, moneyNumber(target.goodsAmount));
        }
        var saved = setStatus(code, '发货中', '系统');
        return { ok: true, done: true, demand: saved || target };
    }

    /* 不再由贸易商选择支付。划款在各方签署完成时由系统完成。 */
    function payDemand() {
        return { ok: false, reason: 'auto' };
    }

    /* 初审和自动审核已取消。这里只保留历史审核记录的读取，不再新建、不再通过或驳回。 */
    var AUDIT_KEY = 'rbt_demand_audit_v1';
    var AUDIT_STATUSES = ['待审核', '审核通过', '审核驳回'];

    function readAuditsRaw() {
        try {
            var raw = sessionStorage.getItem(AUDIT_KEY);
            if (raw == null) return null;
            var list = JSON.parse(raw);
            return Array.isArray(list) ? list : null;
        } catch (e) {
            return null;
        }
    }

    function writeAudits(list) {
        sessionStorage.setItem(AUDIT_KEY, JSON.stringify(list || []));
    }

    function auditStage(item) {
        return '初审';
    }

    /* 同一需求只保留初审。未指定环节时取初审。 */
    function findAuditByDemand(list, demandCode, stage) {
        var primary = null;
        var fallback = null;
        (list || []).some(function (item) {
            if (!item || item.demandCode !== demandCode) return false;
            if (stage && auditStage(item) === stage) {
                primary = item;
                return true;
            }
            if (!stage && auditStage(item) === '初审') {
                primary = item;
                return true;
            }
            if (!fallback) fallback = item;
            return false;
        });
        return primary || (stage ? null : fallback);
    }

    function dropReviewAudits(rows) {
        var kept = (rows || []).filter(function (row) { return !row || row.stage !== '复核'; });
        return { rows: kept, dropped: kept.length !== (rows || []).length };
    }

    /* 发布后直接待接单，不再写入审核中心。 */
    function createAuditForDemand() {
        return null;
    }

    function syncAuditByDemand() {
        return null;
    }

    /* 不再按需求补审核单。只清掉复核和仍待审的初审队列。 */
    function ensureAuditsSynced() {
        var rows = readAuditsRaw();
        if (!rows) return [];
        var cleaned = dropReviewAudits(rows);
        var kept = cleaned.rows.filter(function (row) {
            return row && row.status !== '待审核';
        });
        if (cleaned.dropped || kept.length !== cleaned.rows.length) writeAudits(kept);
        return kept.slice();
    }

    function listAudits() {
        return ensureAuditsSynced();
    }

    function getAudit(id) {
        var found = null;
        listAudits().some(function (item) {
            if (item.id === id) {
                found = item;
                return true;
            }
            return false;
        });
        return found;
    }

    function approveAudit() {
        return null;
    }

    function readProduct(code) {
        if (!code) return null;
        var products = window.RbtInstallmentData;
        if (products && typeof products.get === 'function') {
            var live = products.get(code);
            if (live) return live;
        }
        try {
            var raw = sessionStorage.getItem('rbt_installment_v3');
            var list = raw ? JSON.parse(raw) : null;
            if (!Array.isArray(list)) return null;
            var found = null;
            list.some(function (item) {
                if (item && item.code === code) {
                    found = item;
                    return true;
                }
                return false;
            });
            return found;
        } catch (e) {
            return null;
        }
    }

    /* 发布时记到需求单。产品上有渠道比例就用那份；没有则用产品默认比例补三个渠道。 */
    function ratiosFromProduct(item) {
        var ratioApi = window.RbtSettleRatio;
        if (!ratioApi || !item || item.repayMethod !== '比例付') return null;
        var product = readProduct(item.installmentCode);
        var normalized = product && typeof ratioApi.normalize === 'function' ? ratioApi.normalize(product.settleRatios) : null;
        if (normalized) return normalized;
        var fallback = product && typeof ratioApi.parseRatio === 'function' ? ratioApi.parseRatio(product.periodRatio) : '';
        if (!fallback || !ratioApi.CHANNELS) return null;
        return ratioApi.normalize(ratioApi.CHANNELS.map(function (channel) {
            return { channel: channel, fallback: fallback, rows: [] };
        }));
    }

    /* 待接单到门店付款中可改本单结算比例，不改需求状态。 */
    function canEditSettleRatios(item) {
        var ratioApi = window.RbtSettleRatio;
        if (ratioApi && typeof ratioApi.canEdit === 'function') return ratioApi.canEdit(item);
        return !!(item && ['待接单', '待确认签约', '待签署', '发货中', '门店付款中'].indexOf(item.status) >= 0);
    }

    function settleRatioLogText(list) {
        var ratioApi = window.RbtSettleRatio;
        var text = ratioApi && typeof ratioApi.summary === 'function' ? ratioApi.summary(list) : '';
        return text || '无';
    }

    function updateSettleRatios(code, ratioList, operator, reason) {
        var why = String(reason == null ? '' : reason).trim();
        if (!why || why.length > 100) return null;
        var ratioApi = window.RbtSettleRatio;
        var settleRatios = ratioApi && typeof ratioApi.normalize === 'function' ? ratioApi.normalize(ratioList) : null;
        if (!settleRatios) return null;
        var rows = list();
        var target = findDemand(rows, code);
        if (!target || !canEditSettleRatios(target)) return null;
        var beforeText = settleRatioLogText(target.settleRatios);
        var afterText = settleRatioLogText(settleRatios);
        if (beforeText === afterText) return null;
        target.settleRatios = settleRatios;
        touchAudit(target, operator || '王丽');
        ensureLogs(target);
        pushLog(target, '修改结算比例，原因：' + why + '。修改前：' + beforeText + '；修改后：' + afterText, target.updater, target.updatedAt);
        write(rows);
        var audits = readAuditsRaw() || [];
        var first = findAuditByDemand(audits, code, '初审');
        if (first) {
            first.settleRatios = settleRatios;
            writeAudits(audits);
        }
        return target;
    }

    /* 与商品包可选商品一致。开业费用项目在前，售卖单价用商品包里的演示售价。 */
    var SHIP_CATALOG = [
        { code: 'SKU20001', name: '汉言首批铺货', barcode: '6901234568001', unit: '套', spec: '首批到店', category: '门店费用', purchasePrice: 18000, salePrice: '22000.00' },
        { code: 'SKU20002', name: '门店设备辅料包', barcode: '6901234568002', unit: '套', spec: '开业配置', category: '门店费用', purchasePrice: 13000, salePrice: '16000.00' },
        { code: 'SKU20003', name: '门店拉新人力', barcode: '6901234568003', unit: '项', spec: '驻店拉新', category: '门店费用', purchasePrice: 10000, salePrice: '12000.00' },
        { code: 'SKU20004', name: '开业拉新物料', barcode: '6901234568004', unit: '份', spec: '300份', category: '门店费用', purchasePrice: 24, salePrice: '30.00' },
        { code: 'SKU20005', name: '门头招牌及店内品宣', barcode: '6901234568005', unit: '项', spec: '门头及店内', category: '门店费用', purchasePrice: 15000, salePrice: '18000.00' },
        { code: 'SKU20006', name: '门店监控套装', barcode: '6901234568006', unit: '套', spec: '店内监控', category: '门店费用', purchasePrice: 11000, salePrice: '13000.00' },
        { code: 'SKU20007', name: 'POS及会员管理系统', barcode: '6901234568007', unit: '套', spec: '含会员管理', category: '门店费用', purchasePrice: 10000, salePrice: '12000.00' },
        { code: 'SKU20008', name: '抖音本地生活投放', barcode: '6901234568008', unit: '项', spec: '本地生活', category: '门店费用', purchasePrice: 8000, salePrice: '10000.00' },
        { code: 'SKU20009', name: '开业督导服务', barcode: '6901234568009', unit: '项', spec: '开业辅导', category: '门店费用', purchasePrice: 6500, salePrice: '8000.00' },
        { code: 'SKU10001', name: '库尔勒香梨 4kg', barcode: '6901234567001', unit: '箱', spec: '4kg', category: '时令水果', purchasePrice: 42.5, salePrice: '56.80' },
        { code: 'SKU10002', name: '精品黄瓜 2kg', barcode: '6901234567002', unit: '箱', spec: '2kg', category: '新鲜蔬菜', purchasePrice: 16.8, salePrice: '22.80' },
        { code: 'SKU10003', name: '冷鲜牛腩 1kg', barcode: '6901234567003', unit: '件', spec: '1kg', category: '肉禽蛋品', purchasePrice: 58, salePrice: '78.00' },
        { code: 'SKU10004', name: '山东土豆 5kg', barcode: '6901234567004', unit: '袋', spec: '5kg', category: '新鲜蔬菜', purchasePrice: 21.6, salePrice: '28.90' },
        { code: 'SKU10005', name: '云南小番茄 1kg', barcode: '6901234567005', unit: '箱', spec: '1kg', category: '时令水果', purchasePrice: 13.2, salePrice: '18.50' },
        { code: 'SKU10006', name: '新西兰奇异果 12粒', barcode: '6901234567006', unit: '盒', spec: '12粒', category: '时令水果', purchasePrice: 36.9, salePrice: '49.90' },
        { code: 'SKU10007', name: '冷冻鸡中翅 2kg', barcode: '6901234567007', unit: '袋', spec: '2kg', category: '肉禽蛋品', purchasePrice: 47, salePrice: '62.00' },
        { code: 'SKU10008', name: '江西紫薯 3kg', barcode: '6901234567008', unit: '箱', spec: '3kg', category: '新鲜蔬菜', purchasePrice: 19.9, salePrice: '26.80' },
        { code: 'SKU10009', name: '东北黑木耳 500g', barcode: '6901234567009', unit: '袋', spec: '500g', category: '粮油调味', purchasePrice: 29.5, salePrice: '39.90' },
        { code: 'SKU10010', name: '福建空心菜 400g', barcode: '6901234567010', unit: '把', spec: '400g', category: '新鲜蔬菜', purchasePrice: 6.8, salePrice: '9.90' },
        { code: 'SKU10011', name: '冷鲜猪里脊 1kg', barcode: '6901234567011', unit: '件', spec: '1kg', category: '肉禽蛋品', purchasePrice: 39.8, salePrice: '52.80' },
        { code: 'SKU10012', name: '海南贝贝南瓜 2kg', barcode: '6901234567012', unit: '箱', spec: '2kg', category: '新鲜蔬菜', purchasePrice: 18.4, salePrice: '24.90' }
    ];

    function lineSaleCents(sku) {
        var qty = Number(sku && sku.qty);
        if (!isFinite(qty) || qty < 0) qty = 0;
        return centsOf(sku && sku.salePrice) * qty;
    }

    function syncDemandMoney(item) {
        var goods = 0;
        (item.skus || []).forEach(function (sku) {
            goods += lineSaleCents(sku);
        });
        goods = Math.round(goods);
        var rates = productRates(item.installmentCode);
        var total = rates ? rateShare(goods, rates.trader) : goods;
        if (total == null) total = goods;
        item.goodsAmount = fromCents(goods);
        item.amount = fromCents(total);
        item.serviceFee = fromCents(total - goods);
    }

    function findSku(item, skuCode) {
        var found = null;
        (item.skus || []).some(function (sku) {
            if (sku && sku.code === skuCode) {
                found = sku;
                return true;
            }
            return false;
        });
        return found;
    }

    function shippedOf(item, skuCode) {
        var qty = 0;
        var amount = 0;
        (item.shipments || []).forEach(function (row) {
            if (!row || row.skuCode !== skuCode) return;
            qty += Number(row.qty) || 0;
            amount += centsOf(row.amount);
        });
        return { qty: qty, amount: amount };
    }

    function aggregateShipSkus(demand) {
        var map = {};
        var order = [];
        (demand.shipments || []).forEach(function (row) {
            if (!row || !row.skuCode) return;
            if (!map[row.skuCode]) {
                map[row.skuCode] = { code: row.skuCode, name: row.name || '', qty: 0, amount: 0 };
                order.push(row.skuCode);
            }
            map[row.skuCode].qty += Number(row.qty) || 0;
            map[row.skuCode].amount += centsOf(row.amount);
        });
        return order.map(function (code) {
            var row = map[code];
            var unit = row.qty > 0 ? Math.round(row.amount / row.qty) : 0;
            return {
                code: row.code,
                name: row.name,
                qty: row.qty,
                salePrice: fromCents(unit),
                shipAmount: fromCents(row.amount)
            };
        });
    }

    function nextShipId(item) {
        var max = 0;
        (item.shipments || []).forEach(function (row) {
            var matched = String(row && row.id || '').match(/(\d+)$/);
            if (matched) max = Math.max(max, Number(matched[1]));
        });
        return 'FH' + String(item.code || '').replace(/\D/g, '') + '-' + (max + 1);
    }

    function requireShipping(item) {
        if (!item) return '需求单不存在';
        if (item.status !== '发货中') return '当前不是发货中，不能发货';
        return '';
    }

    /* 发货中按需求明细发货。累计数量或金额超过该行时只提示，仍保存。 */
    function shipLine(code, input, operator) {
        var rows = list();
        var target = findDemand(rows, code);
        var blocked = requireShipping(target);
        if (blocked) return { ok: false, reason: blocked };
        var sku = findSku(target, input && input.skuCode);
        if (!sku) return { ok: false, reason: '请选择需求单上的商品' };
        var qty = Number(input && input.qty);
        if (!isFinite(qty) || Math.round(qty) !== qty || qty < 1 || qty > 999) {
            return { ok: false, reason: '发货数量须为 1 到 999 的整数' };
        }
        var amountCents = centsOf(input && input.amount);
        if (amountCents <= 0) return { ok: false, reason: '请填写发货金额' };
        var shipped = shippedOf(target, sku.code);
        var warn = '';
        if (shipped.qty + qty > Number(sku.qty)) warn = '累计发货数量超过该商品的需求数量';
        if (shipped.amount + amountCents > lineSaleCents(sku)) {
            warn = warn ? (warn + '；累计发货金额超过该商品的售卖金额') : '累计发货金额超过该商品的售卖金额';
        }
        if (!Array.isArray(target.shipments)) target.shipments = [];
        var when = nowText();
        var who = operator || '王丽';
        target.shipments.push({
            id: nextShipId(target),
            skuCode: sku.code,
            name: sku.name,
            qty: qty,
            amount: fromCents(amountCents),
            logisticsNo: String(input && input.logisticsNo || '').trim(),
            createdAt: when,
            creator: who,
            confirmed: false,
            confirmQty: 0
        });
        target.updater = who;
        target.updatedAt = when;
        pushLog(target, '发货 ' + sku.name + ' ×' + qty + ' ¥' + fromCents(amountCents), who, when);
        write(rows);
        return { ok: true, warn: warn, demand: target };
    }

    function deleteShipment(code, shipId, operator) {
        var rows = list();
        var target = findDemand(rows, code);
        var blocked = requireShipping(target);
        if (blocked) return { ok: false, reason: blocked };
        var index = -1;
        (target.shipments || []).some(function (row, i) {
            if (row && row.id === shipId) {
                index = i;
                return true;
            }
            return false;
        });
        if (index < 0) return { ok: false, reason: '发货记录不存在' };
        if (target.shipments[index].confirmed) return { ok: false, reason: '门店已确认收货，不能删除' };
        var removed = target.shipments.splice(index, 1)[0];
        var when = nowText();
        var who = operator || '王丽';
        target.updater = who;
        target.updatedAt = when;
        pushLog(target, '删除发货记录 ' + (removed.name || '') + ' ×' + removed.qty, who, when);
        write(rows);
        return { ok: true, demand: target };
    }

    /* 发货中新增的商品不写入需求商品明细，直接生成一条发货记录。 */
    function addShipSku(code, input, operator) {
        var rows = list();
        var target = findDemand(rows, code);
        var blocked = requireShipping(target);
        if (blocked) return { ok: false, reason: blocked };
        var skuCode = String(input && input.skuCode || '').trim();
        var catalog = null;
        SHIP_CATALOG.some(function (row) {
            if (row.code === skuCode) {
                catalog = row;
                return true;
            }
            return false;
        });
        if (!catalog) return { ok: false, reason: '请选择商品' };
        if (findSku(target, skuCode)) return { ok: false, reason: '该商品已在需求单中，请用发货填写' };
        var qty = Number(input && input.qty);
        if (!isFinite(qty) || Math.round(qty) !== qty || qty < 1 || qty > 999) {
            return { ok: false, reason: '商品数量须为 1 到 999 的整数' };
        }
        var priceCents = centsOf(input && input.salePrice);
        if (priceCents <= 0) return { ok: false, reason: '请填写售卖单价' };
        if (!Array.isArray(target.shipments)) target.shipments = [];
        var when = nowText();
        var who = operator || '王丽';
        var amountCents = priceCents * qty;
        target.shipments.push({
            id: nextShipId(target),
            skuCode: catalog.code,
            name: catalog.name,
            qty: qty,
            amount: fromCents(amountCents),
            logisticsNo: String(input && input.logisticsNo || '').trim(),
            createdAt: when,
            creator: who,
            confirmed: false,
            confirmQty: 0
        });
        target.updater = who;
        target.updatedAt = when;
        pushLog(target, '新增发货商品 ' + catalog.name + ' ×' + qty + ' ¥' + fromCents(amountCents), who, when);
        write(rows);
        return { ok: true, demand: target };
    }

    /* 确认数量固定等于发货数量，回写后该条不能再删。 */
    function confirmReceipt(code, shipId, operator) {
        var rows = list();
        var target = findDemand(rows, code);
        if (!target || target.status !== '发货中') return { ok: false, reason: '当前不能确认收货' };
        var row = null;
        (target.shipments || []).some(function (item) {
            if (item && item.id === shipId) {
                row = item;
                return true;
            }
            return false;
        });
        if (!row) return { ok: false, reason: '发货记录不存在' };
        if (row.confirmed) return { ok: false, reason: '已经确认过' };
        var when = nowText();
        var who = operator || target.storeName || '门店';
        row.confirmed = true;
        row.confirmQty = Number(row.qty) || 0;
        row.confirmedAt = when;
        row.confirmedBy = who;
        target.updater = who;
        target.updatedAt = when;
        pushLog(target, '确认收货 ' + (row.name || '') + ' ×' + row.confirmQty, who, when);
        write(rows);
        return { ok: true, demand: target };
    }

    /* 行没发满只提示。未确认、发货总金额小于商品金额仍然不能完成。 */
    function finishShipChecks(item) {
        var blocks = [];
        var warns = [];
        (item.skus || []).forEach(function (sku) {
            var shipped = shippedOf(item, sku.code);
            var name = sku.name || sku.code;
            if (shipped.qty < Number(sku.qty)) warns.push(name + ' 发货数量未达到需求数量');
            if (shipped.amount < lineSaleCents(sku)) warns.push(name + ' 发货金额未达到售卖金额');
        });
        var pending = (item.shipments || []).filter(function (row) { return row && !row.confirmed; }).length;
        if (pending) blocks.push('还有 ' + pending + ' 条发货记录待门店确认');
        var shippedTotal = 0;
        (item.shipments || []).forEach(function (row) { shippedTotal += centsOf(row && row.amount); });
        if (shippedTotal < centsOf(item.goodsAmount)) blocks.push('发货总金额小于需求单商品金额');
        if (shippedTotal > centsOf(item.goodsAmount)) warns.push('发货金额超过需求单商品金额');
        return { blocks: blocks, warns: warns };
    }

    /* ack 为真才改状态。未确认时只返回能不能完成，以及可以忽略的提示。 */
    function finishShip(code, ack, operator) {
        var item = get(code);
        if (!item || item.status !== '发货中') return { ok: false, reason: '当前不是发货中' };
        var check = finishShipChecks(item);
        if (check.blocks.length) return { ok: false, reason: check.blocks.join('；') };
        var reason = check.warns.join('；');
        if (!ack) return { ok: false, needAck: true, reason: reason };
        var saved = setStatus(code, '门店付款中', operator || '王丽');
        return { ok: true, warn: reason, demand: saved };
    }

    function saveSupplement(code, file, operator) {
        var rows = list();
        var target = findDemand(rows, code);
        if (!target) return { ok: false, reason: '需求单不存在' };
        var name = String(file && file.name || '').trim();
        if (!name) return { ok: false, reason: '请选择补缴凭证' };
        var when = nowText();
        var who = operator || '王丽';
        target.supplementVoucher = {
            name: name,
            type: file.type || '',
            data: file.data || '',
            uploadedAt: when,
            uploadedBy: who
        };
        target.updater = who;
        target.updatedAt = when;
        pushLog(target, '上传补缴凭证 ' + name, who, when);
        write(rows);
        return { ok: true, demand: target };
    }

    function rejectAudit() {
        return null;
    }

    window.RbtDemandData = {
        KEY: KEY,
        AUDIT_KEY: AUDIT_KEY,
        STATUSES: DEMAND_STATUSES.slice(),
        CLOSED_STATUSES: CLOSED_STATUSES.slice(),
        RELEASE_STATUSES: RELEASE_STATUSES.slice(),
        CONTRACT_STATUSES: CONTRACT_STATUSES.slice(),
        AUDIT_STATUSES: AUDIT_STATUSES.slice(),
        hasContractStatus: hasContractStatus,
        contractSignStatus: contractSignStatus,
        list: list,
        get: get,
        holdsOccupiedQuota: holdsOccupiedQuota,
        listOccupyingDemands: listOccupyingDemands,
        save: write,
        seed: seed,
        nowText: nowText,
        touchAudit: touchAudit,
        demandStoreCodes: demandStoreCodes,
        occupyDemandQuota: occupyDemandQuota,
        releaseDemandQuota: releaseDemandQuota,
        lockDemandDeal: lockDemandDeal,
        rebuildStoreOccupiedAmounts: rebuildStoreOccupiedAmounts,
        rebuildStoreDealAmounts: rebuildStoreDealAmounts,
        setStatus: setStatus,
        acceptDemand: acceptDemand,
        confirmSigning: confirmSigning,
        traderBalanceCheck: traderBalanceCheck,
        withdrawAccept: withdrawAccept,
        withdrawReasons: withdrawReasons,
        saveWithdrawReasons: saveWithdrawReasons,
        canRepublishDemand: canRepublishDemand,
        republishDemand: republishDemand,
        canVoidDemand: canVoidDemand,
        voidDemand: voidDemand,
        signContracts: signContracts,
        signParties: signParties,
        matchParty: matchParty,
        signDemand: signDemand,
        payDemand: payDemand,
        listAudits: listAudits,
        getAudit: getAudit,
        createAuditForDemand: createAuditForDemand,
        syncAuditByDemand: syncAuditByDemand,
        ensureAuditsSynced: ensureAuditsSynced,
        approveAudit: approveAudit,
        rejectAudit: rejectAudit,
        canEditSettleRatios: canEditSettleRatios,
        updateSettleRatios: updateSettleRatios,
        receivables: receivables,
        deductSettlement: deductSettlement,
        deductQuote: deductQuote,
        packageQuote: packageQuote,
        markupOf: markupOf,
        settlementRates: settlementRates,
        shipCatalog: function () { return SHIP_CATALOG.slice(); },
        shipLine: shipLine,
        deleteShipment: deleteShipment,
        addShipSku: addShipSku,
        confirmReceipt: confirmReceipt,
        finishShip: finishShip,
        saveSupplement: saveSupplement
    };
})();
