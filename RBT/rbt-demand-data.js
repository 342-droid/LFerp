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

    function statusLogText(prev, next) {
        if (!prev || !next || prev === next) return '';
        if (prev === '待审核' && next === '待接单') return '初审通过，状态：待审核 → 待接单';
        if (next === '已驳回') return '审核驳回，状态：' + prev + ' → 已驳回';
        if (next === '已作废') return '作废，状态：' + prev + ' → 已作废';
        if (prev === '待接单' && next === '待确认签约') return '接单，状态：待接单 → 待确认签约';
        if (prev === '待确认签约' && next === '待接单') return '撤回接单，状态：待确认签约 → 待接单';
        if (prev === '待确认签约' && next === '待签署') return '确认签约，状态：待确认签约 → 待签署';
        if (prev === '待签署' && next === '待复核') return '合同签署完成，状态：待签署 → 待复核';
        if (prev === '待复核' && next === '支付中') return '复核通过，状态：待复核 → 支付中';
        if (next === '已完成') return '需求完成，状态：' + prev + ' → 已完成';
        return '状态：' + prev + ' → ' + next;
    }
    var DEMAND_STATUSES = ['待审核', '待接单', '待确认签约', '待签署', '待复核', '支付中', '已完成'];
    var CLOSED_STATUSES = ['已作废', '已驳回'];
    /* 支付中之前，平台可在需求单列表作废 */
    var VOIDABLE_STATUSES = ['待审核', '待接单', '待确认签约', '待签署', '待复核'];
    /* 进入这些状态时释放需求门店的已占用额度 */
    var RELEASE_STATUSES = ['已作废', '已驳回', '已完成'];
    /* 待签署及之后才有关联合同 */
    var CONTRACT_STATUSES = ['待签署', '待复核', '支付中', '已完成'];
    var STATUS_MIGRATE = {
        '已发布': '待审核',
        '待报价': '待审核',
        '已报价': '待接单',
        '待还款': '支付中',
        '已取消': '已作废'
    };

    function hasContractStatus(status) {
        return CONTRACT_STATUSES.indexOf(status) >= 0;
    }

    /* 待签署仍为待签署；进入待复核及之后视为已签署。 */
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
        return [
            {
                code: 'XQ00003',
                storeCode: 'ONS00001',
                storeName: '西湖中心生鲜店',
                packageCode: 'SPB00002',
                packageName: '肉类组合包',
                skus: [
                    { code: 'SKU10003', name: '冷鲜牛腩 1kg', salePrice: '78.00', qty: 25 },
                    { code: 'SKU10011', name: '冷鲜猪里脊 1kg', salePrice: '52.80', qty: 20 }
                ],
                amount: '5364.00',
                installmentCode: 'FQ00002',
                installmentName: '肉类备货分期',
                repayCycle: '日结',
                repayMethod: '比例付',
                repayPeriod: '8.00%',
                dailyAmount: '',
                status: '待接单',
                creator: '喻巧',
                createdAt: '2026-11-09 16:42:10',
                updater: '王丽',
                updatedAt: '2026-11-09 17:10:08'
            },
            {
                code: 'XQ00008',
                storeCode: 'ONS00004',
                storeName: '五角场体验店',
                packageCode: 'SPB00002',
                packageName: '肉类组合包',
                skus: [
                    { code: 'SKU10003', name: '冷鲜牛腩 1kg', salePrice: '78.00', qty: 10 },
                    { code: 'SKU10011', name: '冷鲜猪里脊 1kg', salePrice: '52.80', qty: 10 }
                ],
                amount: '2354.40',
                installmentCode: 'FQ00002',
                installmentName: '肉类备货分期',
                repayCycle: '日结',
                repayMethod: '比例付',
                repayPeriod: '8.00%',
                dailyAmount: '',
                status: '已作废',
                creator: '赵倩',
                createdAt: '2026-11-03 13:27:09',
                updater: '赵倩',
                updatedAt: '2026-11-03 13:40:21'
            },
            {
                code: 'XQ00012',
                storeCode: 'ONS00004',
                storeName: '五角场体验店',
                packageCode: 'SPB00002',
                packageName: '肉类组合包',
                skus: [
                    { code: 'SKU10003', name: '冷鲜牛腩 1kg', salePrice: '78.00', qty: 8 },
                    { code: 'SKU10011', name: '冷鲜猪里脊 1kg', salePrice: '52.80', qty: 12 }
                ],
                amount: '2263.68',
                installmentCode: 'FQ00002',
                installmentName: '肉类备货分期',
                repayCycle: '日结',
                repayMethod: '比例付',
                repayPeriod: '8.00%',
                dailyAmount: '',
                status: '待接单',
                creator: '赵倩',
                createdAt: '2026-11-11 11:05:27',
                updater: '王丽',
                updatedAt: '2026-11-11 11:22:19'
            }
        ].concat(extraStoreSeeds());
    }

    /* 待复核演示单：销售合同、采购合同的各方都已签署。 */
    function signedRows(storeCode, storeName, traderName, signedAt) {
        return [
            { key: 'sale:store:' + storeCode, role: 'store', code: storeCode, name: storeName, contractKey: 'sale', signedAt: signedAt },
            { key: 'sale:trader:' + traderName, role: 'trader', code: '', name: traderName, contractKey: 'sale', signedAt: signedAt },
            { key: 'purchase:trader:' + traderName, role: 'trader', code: '', name: traderName, contractKey: 'purchase', signedAt: signedAt },
            { key: 'purchase:supply', role: 'supply', code: 'supply', name: '冷丰供应链', contractKey: 'purchase', signedAt: signedAt }
        ];
    }

    /* 每家门店另加 2 条日结比例付。商品包按该店已关联的包；余杭未关联商品包，演示挂周末生鲜包。 */
    function extraStoreSeeds() {
        var fresh = { code: 'SPB00001', name: '周末生鲜包' };
        var meat = { code: 'SPB00002', name: '肉类组合包' };
        var veg = { code: 'SPB00003', name: '果蔬尝鲜包' };
        var freshPlan = { installmentCode: 'FQ00001', installmentName: '生鲜周转分期', repayPeriod: '10.00%' };
        var meatPlan = { installmentCode: 'FQ00002', installmentName: '肉类备货分期', repayPeriod: '8.00%' };
        var vegPlan = { installmentCode: 'FQ00003', installmentName: '果蔬短周期', repayPeriod: '10.00%' };
        var xianDa = { traderName: '杭州鲜达贸易有限公司', traderPhone: '13800001001' };
        var lengLian = { traderName: '上海冷链融资租赁有限公司', traderPhone: '13800001002' };
        var haiFeng = { traderName: '宁波海丰商业保理有限公司', traderPhone: '13800001003' };
        return [
            rowSeed({
                code: 'XQ00013', storeCode: 'ONS00001', storeName: '西湖中心生鲜店',
                pkg: fresh, plan: freshPlan, status: '待审核',
                skus: [{ code: 'SKU10001', name: '库尔勒香梨 4kg', salePrice: '56.80', qty: 6 }, { code: 'SKU10002', name: '精品黄瓜 2kg', salePrice: '22.80', qty: 4 }],
                amount: '691.20', creator: '喻巧', createdAt: '2026-11-10 09:18:22', updater: '喻巧', updatedAt: '2026-11-10 09:18:22'
            }),
            rowSeed(Object.assign({
                code: 'XQ00014', storeCode: 'ONS00001', storeName: '西湖中心生鲜店',
                pkg: fresh, plan: freshPlan, status: '待确认签约',
                skus: [{ code: 'SKU10001', name: '库尔勒香梨 4kg', salePrice: '56.80', qty: 12 }, { code: 'SKU10002', name: '精品黄瓜 2kg', salePrice: '22.80', qty: 10 }],
                amount: '1455.36', creator: '喻巧', createdAt: '2026-11-08 14:06:33', updater: '杭州鲜达贸易有限公司', updatedAt: '2026-11-08 15:20:11',
                acceptedAt: '2026-11-08 15:20:11'
            }, xianDa)),
            rowSeed({
                code: 'XQ00015', storeCode: 'ONS00002', storeName: '东城和平里生鲜店',
                pkg: meat, plan: meatPlan, status: '待接单',
                skus: [{ code: 'SKU10003', name: '冷鲜牛腩 1kg', salePrice: '78.00', qty: 6 }, { code: 'SKU10011', name: '冷鲜猪里脊 1kg', salePrice: '52.80', qty: 4 }],
                amount: '1222.56', creator: '夏利', createdAt: '2026-11-11 10:12:40', updater: '王丽', updatedAt: '2026-11-11 10:40:18'
            }),
            rowSeed(Object.assign({
                code: 'XQ00016', storeCode: 'ONS00002', storeName: '东城和平里生鲜店',
                pkg: meat, plan: meatPlan, status: '待复核',
                skus: [{ code: 'SKU10003', name: '冷鲜牛腩 1kg', salePrice: '78.00', qty: 15 }, { code: 'SKU10011', name: '冷鲜猪里脊 1kg', salePrice: '52.80', qty: 10 }],
                amount: '3056.40', creator: '夏利', createdAt: '2026-11-06 11:22:09', updater: '王丽', updatedAt: '2026-11-07 09:30:12',
                acceptedAt: '2026-11-06 13:05:44',
                signings: signedRows('ONS00002', '东城和平里生鲜店', '上海冷链融资租赁有限公司', '2026-11-07 09:12:40')
            }, lengLian)),
            rowSeed({
                code: 'XQ00017', storeCode: 'ONS00003', storeName: '河东大桥道自提点',
                pkg: veg, plan: vegPlan, status: '待审核',
                skus: [
                    { code: 'SKU10005', name: '云南小番茄 1kg', salePrice: '18.50', qty: 8 },
                    { code: 'SKU10006', name: '新西兰奇异果 12粒', salePrice: '49.90', qty: 4 },
                    { code: 'SKU10010', name: '福建空心菜 400g', salePrice: '9.90', qty: 6 }
                ],
                amount: '610.50', creator: '周海', createdAt: '2026-11-12 08:46:15', updater: '周海', updatedAt: '2026-11-12 08:46:15'
            }),
            rowSeed({
                code: 'XQ00018', storeCode: 'ONS00003', storeName: '河东大桥道自提点',
                pkg: veg, plan: vegPlan, status: '已驳回', rejectReason: '门店近期流水不足',
                skus: [
                    { code: 'SKU10005', name: '云南小番茄 1kg', salePrice: '18.50', qty: 4 },
                    { code: 'SKU10006', name: '新西兰奇异果 12粒', salePrice: '49.90', qty: 2 },
                    { code: 'SKU10010', name: '福建空心菜 400g', salePrice: '9.90', qty: 3 }
                ],
                amount: '305.25', creator: '周海', createdAt: '2026-11-04 16:18:40', updater: '王丽', updatedAt: '2026-11-04 17:02:11'
            }),
            rowSeed(Object.assign({
                code: 'XQ00019', storeCode: 'ONS00004', storeName: '五角场体验店',
                pkg: fresh, plan: freshPlan, status: '待签署',
                skus: [{ code: 'SKU10001', name: '库尔勒香梨 4kg', salePrice: '56.80', qty: 8 }, { code: 'SKU10002', name: '精品黄瓜 2kg', salePrice: '22.80', qty: 6 }],
                amount: '945.92', creator: '赵倩', createdAt: '2026-11-09 09:40:18', updater: '宁波海丰商业保理有限公司', updatedAt: '2026-11-09 11:15:36',
                acceptedAt: '2026-11-09 11:15:36'
            }, haiFeng)),
            rowSeed(Object.assign({
                code: 'XQ00020', storeCode: 'ONS00004', storeName: '五角场体验店',
                pkg: fresh, plan: freshPlan, status: '待复核',
                skus: [{ code: 'SKU10001', name: '库尔勒香梨 4kg', salePrice: '56.80', qty: 20 }, { code: 'SKU10002', name: '精品黄瓜 2kg', salePrice: '22.80', qty: 12 }],
                amount: '2255.36', creator: '赵倩', createdAt: '2026-11-05 10:08:27', updater: '王丽', updatedAt: '2026-11-06 16:48:20',
                acceptedAt: '2026-11-05 14:22:03',
                signings: signedRows('ONS00004', '五角场体验店', '杭州鲜达贸易有限公司', '2026-11-06 16:20:08')
            }, xianDa)),
            rowSeed({
                code: 'XQ00021', storeCode: 'ONS00005', storeName: '余杭仓前便利店',
                pkg: fresh, plan: freshPlan, status: '待接单',
                skus: [{ code: 'SKU10001', name: '库尔勒香梨 4kg', salePrice: '56.80', qty: 5 }, { code: 'SKU10002', name: '精品黄瓜 2kg', salePrice: '22.80', qty: 5 }],
                amount: '636.80', creator: '陈晨', createdAt: '2026-11-11 15:33:41', updater: '王丽', updatedAt: '2026-11-11 16:01:09'
            }),
            rowSeed({
                code: 'XQ00022', storeCode: 'ONS00005', storeName: '余杭仓前便利店',
                pkg: fresh, plan: freshPlan, status: '已作废',
                skus: [{ code: 'SKU10001', name: '库尔勒香梨 4kg', salePrice: '56.80', qty: 3 }, { code: 'SKU10002', name: '精品黄瓜 2kg', salePrice: '22.80', qty: 2 }],
                amount: '345.60', creator: '陈晨', createdAt: '2026-11-02 13:12:55', updater: '陈晨', updatedAt: '2026-11-02 13:40:18'
            }),
            rowSeed(Object.assign({
                code: 'XQ00024', storeCode: 'ONS00001', storeName: '西湖中心生鲜店',
                pkg: fresh, plan: freshPlan, status: '支付中',
                skus: [{ code: 'SKU10001', name: '库尔勒香梨 4kg', salePrice: '56.80', qty: 10 }, { code: 'SKU10002', name: '精品黄瓜 2kg', salePrice: '22.80', qty: 8 }],
                amount: '1200.64', creator: '喻巧', createdAt: '2026-11-10 11:08:16', updater: '王丽', updatedAt: '2026-11-12 17:20:08',
                acceptedAt: '2026-11-10 15:42:30',
                dealLocked: true,
                signings: signedRows('ONS00001', '西湖中心生鲜店', '杭州鲜达贸易有限公司', '2026-11-11 10:18:44'),
                guaranteeDeposit: {
                    paid: true,
                    voucherType: 'application/pdf',
                    voucherName: '担保金缴纳凭证.pdf',
                    voucherData: '#',
                    uploadedAt: '2026-11-12 17:20:08',
                    uploadedBy: '王丽'
                }
            }, xianDa))
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
        if (spec.acceptedAt) row.acceptedAt = spec.acceptedAt;
        if (spec.signings) row.signings = spec.signings;
        if (spec.rejectReason) row.rejectReason = spec.rejectReason;
        if (spec.dealLocked) row.dealLocked = true;
        if (spec.guaranteeDeposit) row.guaranteeDeposit = spec.guaranteeDeposit;
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
        return '待审核';
    }

    /* 初审已通过。这些需求单上应能看到结算比例。 */
    function passedFirstAudit(status) {
        return status === '待接单' || status === '待确认签约' || status === '待签署' || status === '待复核' || status === '支付中' || status === '已完成';
    }

    /* 演示数据当初写在产品上的比例。初审已通过、单上还没有渠道比例时，用它补三个渠道的默认比例。 */
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

    function list() {
        ensurePendingSeed();
        var current = readRaw();
        var seeded = false;
        if (!current || !current.length) {
            current = seed();
            write(current);
            seeded = true;
        }
        var changed = false;
        var legacyRatios = legacyRatioIndex();
        var rows = current.map(function (item) {
            if (!item) return null;
            var next = normalizeStatus(item.status);
            if (next !== item.status) {
                item.status = next;
                changed = true;
            }
            /* 支付中/已完成视为已复核通过，用于重算已成交 */
            if ((item.status === '支付中' || item.status === '已完成') && !item.dealLocked) {
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
            if (item.repayMethod === '比例付' && passedFirstAudit(item.status) && !(item.settleRatios && item.settleRatios.length)) {
                var legacy = legacyAuditedRatio(item, legacyRatios);
                var filled = legacy && window.RbtSettleRatio.normalize(window.RbtSettleRatio.CHANNELS.map(function (channel) {
                    return { channel: channel, fallback: legacy, rows: [] };
                }));
                if (filled) {
                    item.settleRatios = filled;
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
                pushLog(item, '生成冷丰销售单、贸易商销售单、供应链采购单、门店采购单', item.updater || '系统', item.updatedAt);
                tradeMade = true;
            });
        }
        if (changed || tradeMade) write(rows);
        if (seeded || changed) rebuildStoreDealAmounts();
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

    /* 发布成功：需求门店增加已占用。 */
    function occupyDemandQuota(demand) {
        if (!demand || demand.quotaHeld) return demand;
        var amount = Number(demand.amount) || 0;
        if (amount > 0) adjustStoresOccupied(demandStoreCodes(demand), amount, demand.updater || demand.creator || '用户名');
        demand.quotaHeld = true;
        return demand;
    }

    /* 已作废 / 已驳回 / 已完成：释放需求门店已占用。 */
    function releaseDemandQuota(demand) {
        if (!demand || !demand.quotaHeld) return demand;
        var amount = Number(demand.amount) || 0;
        if (amount > 0) adjustStoresOccupied(demandStoreCodes(demand), -Math.abs(amount), demand.updater || demand.creator || '用户名');
        demand.quotaHeld = false;
        return demand;
    }

    /* 复核成功：仅给需求门店累加已成交（不扣可用额度）。 */
    function lockDemandDeal(demand) {
        if (!demand || demand.dealLocked) return demand;
        var storeApi = window.RbtStoreData;
        var amount = Number(demand.amount) || 0;
        if (amount > 0 && demand.storeCode && storeApi && typeof storeApi.adjustLocked === 'function') {
            storeApi.adjustLocked(demand.storeCode, amount, demand.updater || demand.creator || '用户名');
        }
        demand.dealLocked = true;
        return demand;
    }

    /* 按「已复核通过」的需求单重算各门店已成交，避免演示假数据混入。 */
    function rebuildStoreDealAmounts() {
        var storeApi = window.RbtStoreData;
        if (!storeApi || typeof storeApi.list !== 'function' || typeof storeApi.applyQuota !== 'function') return;
        var sums = {};
        var demands = readRaw() || [];
        demands.forEach(function (demand) {
            if (!demand || !demand.storeCode || !demand.dealLocked) return;
            var amount = Number(demand.amount) || 0;
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
        var statusLog = statusLogText(prev, status);
        if (statusLog) pushLog(target, statusLog, target.updater, target.updatedAt);
        if (prev === '待复核' && status === '支付中') {
            lockDemandDeal(target);
            if (window.RbtTradeDocs && typeof window.RbtTradeDocs.ensureForDemand === 'function') {
                var madeDocs = window.RbtTradeDocs.ensureForDemand(target, operator);
                if (madeDocs && madeDocs.created) {
                    pushLog(target, '生成冷丰销售单、贸易商销售单、供应链采购单、门店采购单', target.updater, target.updatedAt);
                }
            }
        }
        if (RELEASE_STATUSES.indexOf(status) >= 0) releaseDemandQuota(target);
        ensureContract(target);
        write(rows);
        syncAuditByDemand(target, operator);
        return target;
    }

    function traderNameOf(trader) {
        return (trader && (trader.name || trader.traderName)) || '';
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

    /* 仅待接单可接。成功后进入待确认签约，此时还不生成合同。 */
    function acceptDemand(code, trader) {
        var rows = list();
        var target = findDemand(rows, code);
        if (!target) return { ok: false, reason: 'missing' };
        if (target.status !== '待接单' || target.traderName) {
            return { ok: false, reason: 'taken', demand: target };
        }
        var name = traderNameOf(trader) || '贸易商';
        target.traderName = name;
        target.traderPhone = (trader && trader.phone) || '';
        target.acceptedAt = nowText();
        write(rows);
        var saved = setStatus(code, '待确认签约', name);
        if (!saved) return { ok: false, reason: 'missing' };
        return { ok: true, demand: saved };
    }

    /* 待确认签约由接单贸易商确认。确认后进入待签署，并生成销售合同、采购合同。 */
    function confirmSigning(code, trader) {
        var rows = list();
        var target = findDemand(rows, code);
        if (!target) return { ok: false, reason: 'missing' };
        if (target.status !== '待确认签约') return { ok: false, reason: 'status', demand: target };
        var name = traderNameOf(trader);
        if (!name || target.traderName !== name) return { ok: false, reason: 'trader', demand: target };
        var saved = setStatus(code, '待签署', name);
        if (!saved) return { ok: false, reason: 'missing' };
        return { ok: true, demand: saved };
    }

    /* 确认签约前可撤回。清空接单贸易商，需求回到待接单。 */
    function withdrawAccept(code, trader) {
        var rows = list();
        var target = findDemand(rows, code);
        if (!target) return { ok: false, reason: 'missing' };
        if (target.status !== '待确认签约') return { ok: false, reason: 'status', demand: target };
        var name = traderNameOf(trader);
        if (!name || target.traderName !== name) return { ok: false, reason: 'trader', demand: target };
        target.traderName = '';
        target.traderPhone = '';
        target.acceptedAt = '';
        write(rows);
        var saved = setStatus(code, '待接单', name);
        if (!saved) return { ok: false, reason: 'missing' };
        return { ok: true, demand: saved };
    }

    function canVoidDemand(demand) {
        return !!(demand && VOIDABLE_STATUSES.indexOf(demand.status) >= 0);
    }

    /* 支付中之前由平台作废。已产生的审核单、合同在 setStatus 里同步作废。 */
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

    /* 当前签署方确认其中一份合同。销售合同和采购合同的各方都签完后，需求进入待复核。 */
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
        write(rows);
        var saved = setStatus(code, '待复核', mine.name || '签署');
        return { ok: true, done: true, demand: saved || target };
    }

    /* ---------- 审核中心 · 需求单审核 ---------- */
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

    function auditStatusFromDemand(demand) {
        if (!demand) return '待审核';
        if (demand.status === '待审核') return '待审核';
        if (demand.status === '已作废' || demand.status === '已取消') return '审核驳回';
        if (demand.status === '已驳回') return '审核驳回';
        return '审核通过';
    }

    function nextAuditId(list) {
        var max = 0;
        (list || []).forEach(function (item) {
            var matched = String(item && item.id || '').match(/^RBT-AUD-(\d+)$/);
            if (matched) max = Math.max(max, parseInt(matched[1], 10));
        });
        return 'RBT-AUD-' + String(max + 1).padStart(5, '0');
    }

    function buildAuditFromDemand(demand, list) {
        var status = auditStatusFromDemand(demand);
        return {
            id: nextAuditId(list),
            demandCode: demand.code,
            storeCode: demand.storeCode || '',
            storeName: demand.storeName || '',
            packageCode: demand.packageCode || '',
            packageName: demand.packageName || '',
            goodsAmount: demand.goodsAmount || '',
            serviceFee: demand.serviceFee || '',
            amount: demand.amount || '',
            repayCycle: demand.repayCycle || '',
            repayMethod: demand.repayMethod || '',
            repayPeriod: demand.repayPeriod || '',
            submitter: demand.creator || demand.storeName || '门店',
            submittedAt: demand.createdAt || nowText(),
            status: status,
            auditor: status === '待审核' ? '' : (demand.updater || '王丽'),
            auditedAt: status === '待审核' ? '' : (demand.updatedAt || ''),
            opinion: status === '审核驳回'
                ? ((demand.status === '已作废' || demand.status === '已取消') ? (demand.rejectReason || '需求已作废') : (demand.rejectReason || '不符合放款条件'))
                : '',
            stage: '初审'
        };
    }

    function auditStage(item) {
        return item && item.stage === '复核' ? '复核' : '初审';
    }

    /* 同一需求单可能有初审、复核两条。未指定环节时取初审。 */
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

    function findAuditById(list, id) {
        var found = null;
        (list || []).some(function (item) {
            if (item && item.id === id) {
                found = item;
                return true;
            }
            return false;
        });
        return found;
    }

    function ensureReviewAudit(demand, rows) {
        var review = findAuditByDemand(rows, demand.code, '复核');
        if (review) return review;
        var created = buildAuditFromDemand(demand, rows);
        created.stage = '复核';
        created.status = '待审核';
        created.submitter = demand.updater || demand.creator || '系统';
        created.submittedAt = nowText();
        created.auditor = '';
        created.auditedAt = '';
        created.opinion = '';
        rows.unshift(created);
        return created;
    }

    /* 门店发布成功：写入一条待审核记录。 */
    function createAuditForDemand(demand) {
        if (!demand || !demand.code) return null;
        var rows = readAuditsRaw() || [];
        var exists = findAuditByDemand(rows, demand.code);
        if (exists) {
            exists.storeCode = demand.storeCode || exists.storeCode;
            exists.storeName = demand.storeName || exists.storeName;
            exists.packageCode = demand.packageCode || exists.packageCode;
            exists.packageName = demand.packageName || exists.packageName;
            exists.goodsAmount = demand.goodsAmount || exists.goodsAmount || '';
            exists.serviceFee = demand.serviceFee || exists.serviceFee || '';
            exists.amount = demand.amount || exists.amount;
            exists.repayCycle = demand.repayCycle || exists.repayCycle;
            exists.repayMethod = demand.repayMethod || exists.repayMethod;
            exists.repayPeriod = demand.repayPeriod || exists.repayPeriod;
            exists.submitter = demand.creator || exists.submitter;
            exists.submittedAt = demand.createdAt || exists.submittedAt;
            exists.status = '待审核';
            exists.auditor = '';
            exists.auditedAt = '';
            exists.opinion = '';
            writeAudits(rows);
            return exists;
        }
        var created = buildAuditFromDemand(demand, rows);
        created.status = '待审核';
        created.auditor = '';
        created.auditedAt = '';
        created.opinion = '';
        rows.unshift(created);
        writeAudits(rows);
        return created;
    }

    /* 需求作废后：审核通过的不动；待审核按驳回，意见记「需求已作废」。 */
    function voidRelatedAudits(rows, demand, operator) {
        var who = operator || (demand && demand.updater) || '平台';
        var when = nowText();
        var changed = false;
        (rows || []).forEach(function (row) {
            if (!row || !demand || row.demandCode !== demand.code) return;
            if (row.status !== '待审核' && row.status !== '已作废' && row.status !== '已取消') return;
            var pending = row.status === '待审核';
            row.status = '审核驳回';
            changed = true;
            if (pending || !row.auditor) {
                row.auditor = who;
                row.auditedAt = when;
            }
            if (pending || !row.opinion) row.opinion = '需求已作废';
        });
        return changed;
    }

    function syncAuditByDemand(demand, operator) {
        if (!demand || !demand.code) return null;
        var rows = readAuditsRaw() || [];
        var target = findAuditByDemand(rows, demand.code, '初审');
        if (!target) {
            target = buildAuditFromDemand(demand, rows);
            target.stage = '初审';
            rows.unshift(target);
        }
        target.storeName = demand.storeName || target.storeName;
        target.goodsAmount = demand.goodsAmount || target.goodsAmount || '';
        target.serviceFee = demand.serviceFee || target.serviceFee || '';
        target.amount = demand.amount || target.amount;
        if (demand.status === '待审核') {
            target.status = '待审核';
            target.auditor = '';
            target.auditedAt = '';
            target.opinion = '';
        } else if (demand.status === '已作废' || demand.status === '已取消') {
            voidRelatedAudits(rows, demand, operator);
        } else if (demand.status === '已驳回' && target.status === '待审核') {
            target.status = '审核驳回';
            target.auditor = operator || demand.updater || '王丽';
            target.auditedAt = demand.updatedAt || nowText();
            target.opinion = demand.rejectReason || target.opinion || '不符合放款条件';
        } else if (target.status === '待审核') {
            target.status = '审核通过';
            target.auditor = operator || demand.updater || target.auditor || '王丽';
            target.auditedAt = demand.updatedAt || nowText();
        }
        if (demand.status === '待复核') ensureReviewAudit(demand, rows);
        if (demand.status === '已驳回') {
            var review = findAuditByDemand(rows, demand.code, '复核');
            if (review && review.status === '待审核') {
                review.status = '审核驳回';
                review.auditor = operator || demand.updater || '王丽';
                review.auditedAt = demand.updatedAt || nowText();
                review.opinion = demand.rejectReason || review.opinion || '不符合放款条件';
            }
        }
        writeAudits(rows);
        return target;
    }

    /* 按需求单补齐审核记录，保证发布进需求单管理的同时审核中心有单。 */
    function ensureAuditsSynced() {
        var demands = list();
        var rows = readAuditsRaw();
        var changed = false;
        if (!rows) {
            rows = [];
            changed = true;
        }
        demands.forEach(function (demand) {
            if (!demand || !demand.code) return;
            var existing = findAuditByDemand(rows, demand.code, '初审');
            if (!existing) {
                existing = buildAuditFromDemand(demand, rows);
                rows.push(existing);
                changed = true;
            }
            var expected = auditStatusFromDemand(demand);
            if (!existing.stage) {
                existing.stage = '初审';
                changed = true;
            }
            var demandVoided = demand.status === '已作废' || demand.status === '已取消';
            if (!demandVoided && existing.status === '待审核' && expected !== '待审核' && auditStage(existing) === '初审') {
                existing.status = expected;
                existing.auditor = demand.updater || existing.auditor || '王丽';
                existing.auditedAt = demand.updatedAt || nowText();
                if (expected === '审核驳回' && !existing.opinion) {
                    existing.opinion = demand.rejectReason || '不符合放款条件';
                }
                changed = true;
            }
            if (auditStage(existing) === '初审' && existing.status === '审核通过' && demand.settleRatios && demand.settleRatios.length && !(existing.settleRatios && existing.settleRatios.length)) {
                existing.settleRatios = demand.settleRatios;
                changed = true;
            }
            if (demand.status === '待复核' && !findAuditByDemand(rows, demand.code, '复核')) {
                ensureReviewAudit(demand, rows);
                changed = true;
            }
            if ((demand.status === '已作废' || demand.status === '已取消') && voidRelatedAudits(rows, demand, demand.updater || '平台')) {
                changed = true;
            }
            rows.forEach(function (row) {
                if (!row || row.demandCode !== demand.code) return;
                if (row.status === '已作废' || row.status === '已取消') {
                    row.status = '审核驳回';
                    if (!row.opinion) row.opinion = '需求已作废';
                    changed = true;
                }
                var goods = demand.goodsAmount || '';
                var fee = demand.serviceFee || '';
                var total = demand.amount || row.amount;
                if (row.goodsAmount === goods && row.serviceFee === fee && row.amount === total) return;
                row.goodsAmount = goods;
                row.serviceFee = fee;
                row.amount = total;
                changed = true;
            });
        });
        if (changed) {
            rows.sort(function (a, b) {
                return String(b.submittedAt || '').localeCompare(String(a.submittedAt || ''));
            });
            writeAudits(rows);
        }
        return rows.slice();
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

    function approveAudit(id, operator, extra) {
        var target = getAudit(id);
        if (!target || target.status !== '待审核') return null;
        var who = operator || '王丽';
        if (auditStage(target) === '复核') return approveReviewAudit(target, who, extra);
        var ratioApi = window.RbtSettleRatio;
        var settleRatios = ratioApi && typeof ratioApi.normalize === 'function' ? ratioApi.normalize(extra && extra.settleRatios) : null;
        if (!settleRatios) return null;
        var demandRows = list();
        var pending = null;
        demandRows.some(function (item) {
            if (item && item.code === target.demandCode) {
                pending = item;
                return true;
            }
            return false;
        });
        if (!pending) return null;
        pending.settleRatios = settleRatios;
        write(demandRows);
        var demand = setStatus(target.demandCode, '待接单', who);
        if (!demand) return null;
        return patchAudit(id, function (row) {
            row.status = '审核通过';
            row.auditor = who;
            row.auditedAt = nowText();
            row.opinion = '';
            row.settleRatios = settleRatios;
        });
    }

    function patchAudit(id, mutate) {
        var rows = readAuditsRaw() || [];
        var current = findAuditById(rows, id);
        if (!current) return null;
        mutate(current);
        writeAudits(rows);
        return current;
    }

    function saveGuaranteeVoucher(code, voucher, operator) {
        var rows = list();
        var demand = null;
        rows.some(function (item) {
            if (item && item.code === code) {
                demand = item;
                return true;
            }
            return false;
        });
        if (!demand) return null;
        demand.guaranteeDeposit = {
            paid: true,
            voucherName: voucher.voucherName || '缴纳凭证',
            voucherType: voucher.voucherType || '',
            voucherData: voucher.voucherData || '',
            uploadedAt: nowText(),
            uploadedBy: operator || '王丽'
        };
        write(rows);
        return demand;
    }

    /* 原型演示：复核通过不拦截合同签署状态，弹窗固定展示已签署，不写入 PRD。正式规则按各合同实时签署状态核对，未全部签署不能通过。 */
    function approveReviewAudit(target, who, extra) {
        var demand = get(target.demandCode);
        if (!demand || demand.status !== '待复核') return null;
        if (!extra || extra.depositPaid !== true || !extra.voucherData) return null;
        if (!saveGuaranteeVoucher(demand.code, extra, who)) return null;
        if (!setStatus(demand.code, '支付中', who)) return null;
        return patchAudit(target.id, function (row) {
            row.status = '审核通过';
            row.auditor = who;
            row.auditedAt = nowText();
            row.opinion = '';
        });
    }

    /* 待接单到支付中可改本单结算比例，不改需求状态。 */
    function canEditSettleRatios(item) {
        var ratioApi = window.RbtSettleRatio;
        if (ratioApi && typeof ratioApi.canEdit === 'function') return ratioApi.canEdit(item);
        return !!(item && ['待接单', '待确认签约', '待签署', '待复核', '支付中'].indexOf(item.status) >= 0);
    }

    function updateSettleRatios(code, ratioList, operator) {
        var ratioApi = window.RbtSettleRatio;
        var settleRatios = ratioApi && typeof ratioApi.normalize === 'function' ? ratioApi.normalize(ratioList) : null;
        if (!settleRatios) return null;
        var rows = list();
        var target = findDemand(rows, code);
        if (!target || !canEditSettleRatios(target)) return null;
        target.settleRatios = settleRatios;
        touchAudit(target, operator || '王丽');
        ensureLogs(target);
        pushLog(target, '修改结算比例', target.updater, target.updatedAt);
        write(rows);
        var audits = readAuditsRaw() || [];
        var first = findAuditByDemand(audits, code, '初审');
        if (first) {
            first.settleRatios = settleRatios;
            writeAudits(audits);
        }
        return target;
    }

    function rejectAudit(id, opinion, operator) {
        var target = getAudit(id);
        if (!target || target.status !== '待审核') return null;
        var who = operator || '王丽';
        var reason = String(opinion || '').trim() || '不符合放款条件';
        var demandRows = list();
        var demand = null;
        demandRows.some(function (item) {
            if (item.code === target.demandCode) {
                demand = item;
                return true;
            }
            return false;
        });
        if (!demand) return null;
        demand.rejectReason = reason;
        write(demandRows);
        if (!setStatus(target.demandCode, '已驳回', who)) return null;
        return patchAudit(id, function (row) {
            row.status = '审核驳回';
            row.auditor = who;
            row.auditedAt = nowText();
            row.opinion = reason;
        });
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
        rebuildStoreDealAmounts: rebuildStoreDealAmounts,
        setStatus: setStatus,
        acceptDemand: acceptDemand,
        confirmSigning: confirmSigning,
        withdrawAccept: withdrawAccept,
        canVoidDemand: canVoidDemand,
        voidDemand: voidDemand,
        signContracts: signContracts,
        signParties: signParties,
        matchParty: matchParty,
        signDemand: signDemand,
        listAudits: listAudits,
        getAudit: getAudit,
        createAuditForDemand: createAuditForDemand,
        syncAuditByDemand: syncAuditByDemand,
        ensureAuditsSynced: ensureAuditsSynced,
        approveAudit: approveAudit,
        rejectAudit: rejectAudit,
        canEditSettleRatios: canEditSettleRatios,
        updateSettleRatios: updateSettleRatios
    };
})();
