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
    var DEMAND_STATUSES = ['待审核', '待接单', '待签署', '待复核', '支付中', '已完成'];
    var CLOSED_STATUSES = ['已取消', '已驳回'];
    /* 进入这些状态时释放需求门店与担保门店的已占用额度 */
    var RELEASE_STATUSES = ['已取消', '已驳回', '已完成'];
    /* 待签署及之后才有关联合同 */
    var CONTRACT_STATUSES = ['待签署', '待复核', '支付中', '已完成'];
    var STATUS_MIGRATE = {
        '已发布': '待审核',
        '待报价': '待审核',
        '已报价': '待接单',
        '待还款': '支付中'
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

    /* 待签署及之后补合同；更早或旁路状态清空合同。 */
    function ensureContract(item) {
        if (!item) return false;
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
                code: 'XQ00001',
                storeCode: 'ONS00001',
                storeName: '西湖中心生鲜店',
                packageCode: 'SPB00001',
                packageName: '周末生鲜包',
                skus: [
                    { code: 'SKU10001', name: '库尔勒香梨 4kg', salePrice: '56.80', qty: 20 },
                    { code: 'SKU10002', name: '精品黄瓜 2kg', salePrice: '22.80', qty: 30 }
                ],
                guarantors: [
                    { code: 'ONS00002', name: '东城和平里生鲜店' },
                    { code: 'ONS00004', name: '五角场体验店' }
                ],
                amount: '2860.80',
                installmentCode: 'FQ00001',
                installmentName: '生鲜周转分期',
                repayCycle: '日付',
                repayMethod: '定额付',
                repayPeriod: '6',
                dailyAmount: '476.80',
                status: '待审核',
                creator: '喻巧',
                createdAt: '2026-11-10 09:18:22',
                updater: '喻巧',
                updatedAt: '2026-11-10 09:18:22'
            },
            {
                code: 'XQ00002',
                storeCode: 'ONS00003',
                storeName: '河东大桥道自提点',
                packageCode: 'SPB00003',
                packageName: '果蔬尝鲜包',
                skus: [
                    { code: 'SKU10005', name: '云南小番茄 1kg', salePrice: '18.50', qty: 40 },
                    { code: 'SKU10006', name: '新西兰奇异果 12粒', salePrice: '49.90', qty: 15 },
                    { code: 'SKU10010', name: '福建空心菜 400g', salePrice: '9.90', qty: 50 }
                ],
                guarantors: [{ code: 'ONS00005', name: '余杭仓前便利店' }],
                amount: '2227.50',
                installmentCode: 'FQ00003',
                installmentName: '果蔬短周期',
                repayCycle: '日付',
                repayMethod: '定额付',
                repayPeriod: '3',
                dailyAmount: '742.50',
                status: '待审核',
                creator: '周海',
                createdAt: '2026-11-10 10:05:41',
                updater: '周海',
                updatedAt: '2026-11-10 10:05:41'
            },
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
                guarantors: [{ code: 'ONS00003', name: '河东大桥道自提点' }],
                amount: '5364.00',
                installmentCode: 'FQ00002',
                installmentName: '肉类备货分期',
                repayCycle: '日付',
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
                code: 'XQ00004',
                storeCode: 'ONS00004',
                storeName: '五角场体验店',
                packageCode: 'SPB00001',
                packageName: '周末生鲜包',
                skus: [
                    { code: 'SKU10001', name: '库尔勒香梨 4kg', salePrice: '56.80', qty: 12 },
                    { code: 'SKU10002', name: '精品黄瓜 2kg', salePrice: '22.80', qty: 18 }
                ],
                guarantors: [{ code: 'ONS00002', name: '东城和平里生鲜店' }],
                amount: '1747.20',
                installmentCode: 'FQ00001',
                installmentName: '生鲜周转分期',
                repayCycle: '日付',
                repayMethod: '定额付',
                repayPeriod: '12',
                dailyAmount: '145.60',
                status: '待签署',
                contract: { code: 'HT00004', name: '生鲜周转分期合作合同', signStatus: '待签署' },
                creator: '赵倩',
                createdAt: '2026-11-08 14:20:05',
                updater: '李敏',
                updatedAt: '2026-11-08 15:02:33'
            },
            {
                code: 'XQ00005',
                storeCode: 'ONS00002',
                storeName: '东城和平里生鲜店',
                packageCode: 'SPB00001',
                packageName: '周末生鲜包',
                skus: [
                    { code: 'SKU10001', name: '库尔勒香梨 4kg', salePrice: '56.80', qty: 8 },
                    { code: 'SKU10002', name: '精品黄瓜 2kg', salePrice: '22.80', qty: 10 }
                ],
                guarantors: [{ code: 'ONS00004', name: '五角场体验店' }],
                amount: '1139.20',
                installmentCode: 'FQ00001',
                installmentName: '生鲜周转分期',
                repayCycle: '日付',
                repayMethod: '定额付',
                repayPeriod: '3',
                dailyAmount: '379.73',
                status: '待复核',
                contract: { code: 'HT00005', name: '生鲜周转分期合作合同', signStatus: '已签署' },
                creator: '夏利',
                createdAt: '2026-11-07 11:33:48',
                updater: '王丽',
                updatedAt: '2026-11-07 16:20:11'
            },
            {
                code: 'XQ00006',
                storeCode: 'ONS00005',
                storeName: '余杭仓前便利店',
                packageCode: 'SPB00003',
                packageName: '果蔬尝鲜包',
                skus: [
                    { code: 'SKU10005', name: '云南小番茄 1kg', salePrice: '18.50', qty: 20 },
                    { code: 'SKU10006', name: '新西兰奇异果 12粒', salePrice: '49.90', qty: 8 }
                ],
                guarantors: [{ code: 'ONS00001', name: '西湖中心生鲜店' }],
                amount: '1149.60',
                installmentCode: 'FQ00003',
                installmentName: '果蔬短周期',
                repayCycle: '日付',
                repayMethod: '定额付',
                repayPeriod: '3',
                dailyAmount: '383.20',
                status: '支付中',
                dealLocked: true,
                contract: { code: 'HT00006', name: '果蔬短周期合作合同', signStatus: '已签署' },
                creator: '陈晨',
                createdAt: '2026-11-06 09:12:30',
                updater: '王丽',
                updatedAt: '2026-11-06 14:45:02'
            },
            {
                code: 'XQ00007',
                storeCode: 'ONS00001',
                storeName: '西湖中心生鲜店',
                packageCode: 'SPB00001',
                packageName: '周末生鲜包',
                skus: [
                    { code: 'SKU10001', name: '库尔勒香梨 4kg', salePrice: '56.80', qty: 15 },
                    { code: 'SKU10002', name: '精品黄瓜 2kg', salePrice: '22.80', qty: 20 }
                ],
                guarantors: [{ code: 'ONS00003', name: '河东大桥道自提点' }],
                amount: '2088.00',
                installmentCode: 'FQ00001',
                installmentName: '生鲜周转分期',
                repayCycle: '日付',
                repayMethod: '定额付',
                repayPeriod: '6',
                dailyAmount: '348.00',
                status: '已完成',
                dealLocked: true,
                contract: { code: 'HT00007', name: '生鲜周转分期合作合同', signStatus: '已签署' },
                creator: '喻巧',
                createdAt: '2026-11-01 18:05:16',
                updater: '王丽',
                updatedAt: '2026-11-05 10:18:40'
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
                guarantors: [{ code: 'ONS00005', name: '余杭仓前便利店' }],
                amount: '2354.40',
                installmentCode: 'FQ00002',
                installmentName: '肉类备货分期',
                repayCycle: '日付',
                repayMethod: '比例付',
                repayPeriod: '8.00%',
                dailyAmount: '',
                status: '已取消',
                creator: '赵倩',
                createdAt: '2026-11-03 13:27:09',
                updater: '赵倩',
                updatedAt: '2026-11-03 13:40:21'
            },
            {
                code: 'XQ00009',
                storeCode: 'ONS00003',
                storeName: '河东大桥道自提点',
                packageCode: 'SPB00001',
                packageName: '周末生鲜包',
                skus: [
                    { code: 'SKU10001', name: '库尔勒香梨 4kg', salePrice: '56.80', qty: 6 },
                    { code: 'SKU10002', name: '精品黄瓜 2kg', salePrice: '22.80', qty: 8 }
                ],
                guarantors: [{ code: 'ONS00002', name: '东城和平里生鲜店' }],
                amount: '854.40',
                installmentCode: 'FQ00001',
                installmentName: '生鲜周转分期',
                repayCycle: '日付',
                repayMethod: '定额付',
                repayPeriod: '3',
                dailyAmount: '284.80',
                status: '已驳回',
                creator: '周海',
                createdAt: '2026-11-04 15:50:02',
                updater: '王丽',
                updatedAt: '2026-11-04 16:12:55'
            }
        ];
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

    function list() {
        var current = readRaw();
        var seeded = false;
        if (!current || !current.length) {
            current = seed();
            write(current);
            seeded = true;
        }
        var changed = false;
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
            if (ensureContract(item)) changed = true;
            return item;
        }).filter(Boolean);
        if (changed) write(rows);
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

    /* 未释放占用的进行中需求（已取消 / 已驳回 / 已完成除外）。 */
    function holdsOccupiedQuota(demand) {
        if (!demand) return false;
        if (RELEASE_STATUSES.indexOf(demand.status) >= 0) return false;
        if (demand.quotaHeld === false) return false;
        return true;
    }

    function demandInvolvesStore(demand, storeCode) {
        if (!demand || !storeCode) return false;
        if (demand.storeCode === storeCode) return true;
        return (demand.guarantors || []).some(function (row) {
            return row && row.code === storeCode;
        });
    }

    /* 某门店当前占用额度所关联的需求单（本店作为需求门店或担保门店）。 */
    function listOccupyingDemands(storeCode) {
        if (!storeCode) return [];
        return list().filter(function (demand) {
            return holdsOccupiedQuota(demand) && demandInvolvesStore(demand, storeCode);
        }).map(function (demand) {
            return {
                code: demand.code,
                storeCode: demand.storeCode,
                storeName: demand.storeName,
                packageCode: demand.packageCode,
                packageName: demand.packageName,
                amount: demand.amount,
                status: demand.status,
                repayCycle: demand.repayCycle,
                repayMethod: demand.repayMethod,
                repayPeriod: demand.repayPeriod,
                creator: demand.creator,
                createdAt: demand.createdAt,
                occupyRole: demand.storeCode === storeCode ? '需求门店' : '担保门店'
            };
        });
    }

    function demandStoreCodes(demand) {
        var codes = [];
        var seen = {};
        function push(code) {
            if (!code || seen[code]) return;
            seen[code] = true;
            codes.push(code);
        }
        if (demand) {
            push(demand.storeCode);
            (demand.guarantors || []).forEach(function (row) {
                push(row && row.code);
            });
        }
        return codes;
    }

    function adjustStoresOccupied(codes, delta) {
        var storeApi = window.RbtStoreData;
        if (!storeApi || typeof storeApi.adjustOccupied !== 'function') return;
        var amount = Number(delta) || 0;
        if (!amount) return;
        (codes || []).forEach(function (code) {
            storeApi.adjustOccupied(code, amount);
        });
    }

    /* 发布成功：需求门店 + 担保门店同步增加已占用。 */
    function occupyDemandQuota(demand) {
        if (!demand || demand.quotaHeld) return demand;
        var amount = Number(demand.amount) || 0;
        if (amount > 0) adjustStoresOccupied(demandStoreCodes(demand), amount);
        demand.quotaHeld = true;
        return demand;
    }

    /* 已取消 / 已驳回 / 已完成：释放需求门店与担保门店已占用。 */
    function releaseDemandQuota(demand) {
        if (!demand || !demand.quotaHeld) return demand;
        var amount = Number(demand.amount) || 0;
        if (amount > 0) adjustStoresOccupied(demandStoreCodes(demand), -Math.abs(amount));
        demand.quotaHeld = false;
        return demand;
    }

    /* 复核成功：仅给需求门店累加已成交（不扣可用额度）。 */
    function lockDemandDeal(demand) {
        if (!demand || demand.dealLocked) return demand;
        var storeApi = window.RbtStoreData;
        var amount = Number(demand.amount) || 0;
        if (amount > 0 && demand.storeCode && storeApi && typeof storeApi.adjustLocked === 'function') {
            storeApi.adjustLocked(demand.storeCode, amount);
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
        target.status = status;
        touchAudit(target, operator || '王丽');
        if (prev === '待复核' && status === '支付中') lockDemandDeal(target);
        if (RELEASE_STATUSES.indexOf(status) >= 0) releaseDemandQuota(target);
        ensureContract(target);
        write(rows);
        syncAuditByDemand(target, operator);
        return target;
    }

    /* ---------- 审核中心 · 需求单审核 ---------- */
    var AUDIT_KEY = 'rbt_demand_audit_v1';
    var AUDIT_STATUSES = ['待审核', '审核通过', '审核驳回', '已取消'];

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
        if (demand.status === '已取消') return '已取消';
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
            amount: demand.amount || '',
            repayCycle: demand.repayCycle || '',
            repayMethod: demand.repayMethod || '',
            repayPeriod: demand.repayPeriod || '',
            submitter: demand.creator || demand.storeName || '门店',
            submittedAt: demand.createdAt || nowText(),
            status: status,
            auditor: status === '待审核' ? '' : (demand.updater || '王丽'),
            auditedAt: status === '待审核' ? '' : (demand.updatedAt || ''),
            opinion: status === '审核驳回' ? (demand.rejectReason || '不符合放款条件') : ''
        };
    }

    function findAuditByDemand(list, demandCode) {
        var found = null;
        (list || []).some(function (item) {
            if (item && item.demandCode === demandCode) {
                found = item;
                return true;
            }
            return false;
        });
        return found;
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

    function syncAuditByDemand(demand, operator) {
        if (!demand || !demand.code) return null;
        var rows = readAuditsRaw() || [];
        var target = findAuditByDemand(rows, demand.code);
        if (!target) {
            target = buildAuditFromDemand(demand, rows);
            rows.unshift(target);
        }
        var nextStatus = auditStatusFromDemand(demand);
        target.status = nextStatus;
        target.storeName = demand.storeName || target.storeName;
        target.amount = demand.amount || target.amount;
        if (nextStatus === '待审核') {
            target.auditor = '';
            target.auditedAt = '';
            target.opinion = '';
        } else {
            target.auditor = operator || demand.updater || target.auditor || '王丽';
            target.auditedAt = demand.updatedAt || nowText();
            if (nextStatus === '审核驳回' && demand.rejectReason) {
                target.opinion = demand.rejectReason;
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
            var existing = findAuditByDemand(rows, demand.code);
            if (!existing) {
                rows.push(buildAuditFromDemand(demand, rows));
                changed = true;
                return;
            }
            var expected = auditStatusFromDemand(demand);
            if (existing.status === '待审核' && expected !== '待审核') {
                existing.status = expected;
                existing.auditor = demand.updater || existing.auditor || '王丽';
                existing.auditedAt = demand.updatedAt || nowText();
                if (expected === '审核驳回' && !existing.opinion) {
                    existing.opinion = demand.rejectReason || '不符合放款条件';
                }
                changed = true;
            }
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

    function approveAudit(id, operator) {
        var target = getAudit(id);
        if (!target || target.status !== '待审核') return null;
        var who = operator || '王丽';
        var demand = setStatus(target.demandCode, '待接单', who);
        if (!demand) return null;
        var rows = readAuditsRaw() || [];
        target = findAuditByDemand(rows, demand.code);
        if (!target) return null;
        target.status = '审核通过';
        target.auditor = who;
        target.auditedAt = nowText();
        target.opinion = '';
        writeAudits(rows);
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
        var rows = readAuditsRaw() || [];
        target = findAuditByDemand(rows, demand.code);
        if (!target) return null;
        target.status = '审核驳回';
        target.auditor = who;
        target.auditedAt = nowText();
        target.opinion = reason;
        writeAudits(rows);
        return target;
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
        listAudits: listAudits,
        getAudit: getAudit,
        createAuditForDemand: createAuditForDemand,
        syncAuditByDemand: syncAuditByDemand,
        ensureAuditsSynced: ensureAuditsSynced,
        approveAudit: approveAudit,
        rejectAudit: rejectAudit
    };
})();
