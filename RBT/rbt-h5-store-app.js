/* 门店端登录后：选择商品包、勾选 SKU 并改数量、发布需求。需求按门店隔离。 */
(function () {
    var PACKAGE_KEY = 'rbt_product_package_v1';
    var DEMAND_KEY = 'rbt_h5_fund_demand_v2';
    var INSTALLMENT_KEY = 'rbt_installment_v3';
    var SKUS = {
        SKU10001: { name: '库尔勒香梨 4kg', barcode: '6901234567001', unit: '箱', spec: '4kg', salePrice: '56.80' },
        SKU10002: { name: '精品黄瓜 2kg', barcode: '6901234567002', unit: '箱', spec: '2kg', salePrice: '22.80' },
        SKU10003: { name: '冷鲜牛腩 1kg', barcode: '6901234567003', unit: '件', spec: '1kg', salePrice: '78.00' },
        SKU10004: { name: '山东土豆 5kg', barcode: '6901234567004', unit: '袋', spec: '5kg', salePrice: '28.90' },
        SKU10005: { name: '云南小番茄 1kg', barcode: '6901234567005', unit: '箱', spec: '1kg', salePrice: '18.50' },
        SKU10006: { name: '新西兰奇异果 12粒', barcode: '6901234567006', unit: '盒', spec: '12粒', salePrice: '49.90' },
        SKU10007: { name: '冷冻鸡中翅 2kg', barcode: '6901234567007', unit: '袋', spec: '2kg', salePrice: '62.00' },
        SKU10008: { name: '江西紫薯 3kg', barcode: '6901234567008', unit: '箱', spec: '3kg', salePrice: '26.80' },
        SKU10009: { name: '东北黑木耳 500g', barcode: '6901234567009', unit: '袋', spec: '500g', salePrice: '39.90' },
        SKU10010: { name: '福建空心菜 400g', barcode: '6901234567010', unit: '把', spec: '400g', salePrice: '9.90' },
        SKU10011: { name: '冷鲜猪里脊 1kg', barcode: '6901234567011', unit: '件', spec: '1kg', salePrice: '52.80' },
        SKU10012: { name: '海南贝贝南瓜 2kg', barcode: '6901234567012', unit: '箱', spec: '2kg', salePrice: '24.90' }
    };
    var SEED_PACKAGES = [
        { code: 'SPB00001', name: '周末生鲜包', storeCodes: ['ONS00001', 'ONS00004'], skus: [{ code: 'SKU10001', salePrice: '56.80' }, { code: 'SKU10002', salePrice: '22.80' }] },
        { code: 'SPB00002', name: '肉类组合包', storeCodes: ['ONS00002'], skus: [{ code: 'SKU10003', salePrice: '78.00' }, { code: 'SKU10011', salePrice: '52.80' }] },
        { code: 'SPB00003', name: '果蔬尝鲜包', storeCodes: ['ONS00003'], skus: [{ code: 'SKU10005', salePrice: '18.50' }, { code: 'SKU10006', salePrice: '49.90' }, { code: 'SKU10010', salePrice: '9.90' }] }
    ];
    var BIZ_LINE_STORES = {
        '餐饮': ['ONS00001', 'ONS00004'],
        '康美': ['ONS00002'],
        '纯私域': ['ONS00003'],
        '集团内部': ['ONS00005']
    };
    var SEED_STORES = {
        SPB00001: ['ONS00001', 'ONS00004'],
        SPB00002: ['ONS00002'],
        SPB00003: ['ONS00003']
    };
    /* 主链路：待审核 → 待接单 → 待确认签约 → 待签署 → 待复核 → 支付中 → 已完成；旁路：已作废、已驳回 */
    var DEMAND_STATUSES = ['待审核', '待接单', '待确认签约', '待签署', '待复核', '支付中', '已完成'];
    var ACTIVE_DEMAND_STATUSES = ['待审核', '待接单', '待确认签约', '待签署', '待复核', '支付中'];
    var CANCELABLE_DEMAND_STATUSES = ['待审核'];
    var CLOSED_DEMAND_STATUSES = ['已作废', '已驳回'];
    var STATUS_MIGRATE = {
        '已发布': '待审核',
        '待报价': '待审核',
        '已报价': '待接单',
        '待还款': '支付中',
        '已取消': '已作废'
    };

    var account = null;
    var screen = 'list';
    var tab = 'home';
    var repayFilter = 'pending';
    var billCode = '';
    var signCode = '';
    var packageCode = '';
    var pickedQty = {};
    var repayCycle = '';
    var repayMethod = '';
    var repayPeriod = '';
    var QTY_MAX = 999;
    var CYCLE_ORDER = ['日结'];
    var METHOD_ORDER = ['比例付'];

    function toast(message) {
        var node = document.getElementById('rbtH5Toast');
        if (!node) return;
        node.textContent = message;
        node.classList.add('is-on');
        clearTimeout(toast._t);
        toast._t = setTimeout(function () { node.classList.remove('is-on'); }, 2200);
    }

    function esc(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function pad(n) {
        return n < 10 ? '0' + n : String(n);
    }

    function nowText() {
        var d = new Date();
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' +
            pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }

    function money(value) {
        var amount = Number(value);
        if (!isFinite(amount)) return '0.00';
        return amount.toFixed(2);
    }

    function readJson(key) {
        try {
            var raw = sessionStorage.getItem(key);
            var list = raw ? JSON.parse(raw) : null;
            return Array.isArray(list) ? list : null;
        } catch (e) {
            return null;
        }
    }

    function skuLine(item) {
        var code = typeof item === 'string' ? item : item && item.code;
        var known = SKUS[code] || {};
        var sale = item && item.salePrice !== undefined && item.salePrice !== '' ? item.salePrice : known.salePrice;
        return {
            code: code,
            name: known.name || code || '—',
            barcode: known.barcode || '—',
            unit: known.unit || '—',
            spec: known.spec || '—',
            image: typeof getWmsSkuImage === 'function' ? getWmsSkuImage(code) : '',
            salePrice: money(sale)
        };
    }

    function codesFromBizLine(line) {
        var stores = window.RbtStoreData && window.RbtStoreData.list ? window.RbtStoreData.list() : [];
        var matched = stores.filter(function (store) {
            return store && store.bizLine === line && store.code;
        }).map(function (store) { return store.code; });
        if (matched.length) return matched;
        return (BIZ_LINE_STORES[line] || []).slice();
    }

    function ensureStores(item) {
        if (!item) return false;
        if (Array.isArray(item.storeCodes)) {
            if (!item.bizLine) return false;
            delete item.bizLine;
            return true;
        }
        item.storeCodes = item.bizLine
            ? codesFromBizLine(item.bizLine)
            : (SEED_STORES[item.code] || []).slice();
        delete item.bizLine;
        return true;
    }

    function packages() {
        var list = readJson(PACKAGE_KEY);
        var source = list && list.length ? list : SEED_PACKAGES.slice();
        var changed = false;
        source.forEach(function (item) {
            if (ensureStores(item)) changed = true;
        });
        if (changed && list && list.length) sessionStorage.setItem(PACKAGE_KEY, JSON.stringify(source));
        var storeCode = account && account.code;
        return source.filter(function (item) {
            return item.enabled !== false && storeCode && (item.storeCodes || []).indexOf(storeCode) >= 0;
        }).map(function (item) {
            return {
                code: item.code,
                name: item.name || item.code,
                skus: (item.skus || []).map(skuLine).filter(function (line) { return line.code; })
            };
        });
    }

    function findPackage(code) {
        var found = null;
        packages().some(function (item) {
            if (item.code === code) {
                found = item;
                return true;
            }
            return false;
        });
        return found;
    }

    function isActiveDemand(item) {
        return !!(item && ACTIVE_DEMAND_STATUSES.indexOf(item.status) >= 0);
    }

    function canCancelDemand(item) {
        return !!(item && CANCELABLE_DEMAND_STATUSES.indexOf(item.status) >= 0);
    }

    function demands() {
        if (window.RbtDemandData && typeof window.RbtDemandData.list === 'function') {
            return window.RbtDemandData.list();
        }
        var list = readJson(DEMAND_KEY) || [];
        var changed = false;
        list.forEach(function (item) {
            if (!item) return;
            if (STATUS_MIGRATE[item.status]) {
                item.status = STATUS_MIGRATE[item.status];
                changed = true;
                return;
            }
            if (DEMAND_STATUSES.indexOf(item.status) < 0 && CLOSED_DEMAND_STATUSES.indexOf(item.status) < 0) {
                item.status = '待审核';
                changed = true;
            }
        });
        if (changed) saveDemands(list);
        return list;
    }

    function saveDemands(list) {
        if (window.RbtDemandData && typeof window.RbtDemandData.save === 'function') {
            window.RbtDemandData.save(list);
            return;
        }
        sessionStorage.setItem(DEMAND_KEY, JSON.stringify(list));
    }

    /* 列表只保留当前门店作为需求门店的单据。 */
    function storeDemands() {
        if (!account) return [];
        return demands().filter(function (item) {
            return item && item.storeCode === account.code;
        });
    }

    function accountQuota() {
        var dataApi = window.RbtStoreData;
        if (!dataApi || !account || typeof dataApi.get !== 'function' || typeof dataApi.quotaOf !== 'function') {
            return null;
        }
        var store = dataApi.get(account.code);
        if (!store) return null;
        return dataApi.quotaOf(store);
    }

    /* 有可用额度即可再发需求，不再限制同时仅一条有效需求。 */
    function blockNoAvailableQuota() {
        var quota = accountQuota();
        if (!quota || !(quota.available > 0)) {
            toast('可用额度不足，无法发布需求');
            return true;
        }
        return false;
    }

    function occupyDemandQuota(demand) {
        if (window.RbtDemandData && typeof window.RbtDemandData.occupyDemandQuota === 'function') {
            window.RbtDemandData.occupyDemandQuota(demand);
        }
    }

    function releaseDemandQuota(demand) {
        if (window.RbtDemandData && typeof window.RbtDemandData.releaseDemandQuota === 'function') {
            window.RbtDemandData.releaseDemandQuota(demand);
        }
    }

    function nextCode(list) {
        var max = 0;
        list.forEach(function (item) {
            var matched = String(item.code || '').match(/^XQ(\d+)$/);
            if (matched) max = Math.max(max, parseInt(matched[1], 10));
        });
        return 'XQ' + String(max + 1).padStart(5, '0');
    }

    function setHead(title) {
        var head = document.getElementById('rbtH5HeadText');
        var name = document.querySelector('.rbt-h5-phone__head h1');
        if (name) name.textContent = account && account.name ? account.name : '门店端';
        if (head) head.textContent = title;
    }

    function clearPicked() {
        pickedQty = {};
    }

    function qtyOf(code) {
        var qty = Number(pickedQty[code]);
        if (!isFinite(qty) || qty < 1) return 0;
        return Math.min(QTY_MAX, Math.floor(qty));
    }

    function isPicked(code) {
        return qtyOf(code) > 0;
    }

    function setQty(code, value) {
        var qty = Math.floor(Number(value));
        if (!isFinite(qty) || qty < 1) {
            delete pickedQty[code];
            return;
        }
        pickedQty[code] = Math.min(QTY_MAX, qty);
    }

    function selectedLines(pkg) {
        return (pkg.skus || []).filter(function (line) { return isPicked(line.code); }).map(function (line) {
            return {
                code: line.code,
                name: line.name,
                barcode: line.barcode,
                unit: line.unit,
                spec: line.spec,
                image: line.image,
                salePrice: line.salePrice,
                qty: qtyOf(line.code)
            };
        });
    }

    function sumLines(lines) {
        return lines.reduce(function (total, line) {
            return total + Number(line.salePrice) * (Number(line.qty) || 1);
        }, 0);
    }

    function skuQtyText(line) {
        var qty = Number(line && line.qty);
        if (!isFinite(qty) || qty < 1) qty = 1;
        return (line.name || '—') + '×' + qty;
    }

    function cents(value) {
        var amount = Number(value);
        if (!isFinite(amount)) return NaN;
        return Math.round(amount * 100);
    }

    var DEMO_INSTALLMENTS = [
        {
            code: 'FQ00001', name: '生鲜周转分期', repayCycle: '日结', periods: [],
            periodRatio: '10.00', storeRate: '1.60', repayMethod: '比例付',
            amountMin: '20.00', amountMax: '50000', packages: ['周末生鲜包']
        },
        {
            code: 'FQ00004', name: '生鲜周转比例付', repayCycle: '日结', periods: [],
            periodRatio: '10.00', storeRate: '1.70', repayMethod: '比例付',
            amountMin: '20.00', amountMax: '50000', packages: ['周末生鲜包']
        },
        {
            code: 'FQ00005', name: '生鲜周转日结', repayCycle: '日结', periods: [],
            periodRatio: '10.00', storeRate: '1.30', repayMethod: '比例付',
            amountMin: '20.00', amountMax: '50000', packages: ['周末生鲜包']
        },
        {
            code: 'FQ00002', name: '肉类备货分期', repayCycle: '日结', periods: [],
            periodRatio: '8.00', storeRate: '1.80', repayMethod: '比例付',
            amountMin: '50.00', amountMax: '100000', packages: ['肉类组合包']
        },
        {
            code: 'FQ00003', name: '果蔬短周期', repayCycle: '日结', periods: [],
            periodRatio: '10.00', storeRate: '1.50', repayMethod: '比例付',
            amountMin: '5.00', amountMax: '20000', packages: ['果蔬尝鲜包']
        }
    ];

    function orderedPeriods(value) {
        if (!Array.isArray(value)) return [];
        return value.map(function (item) { return String(item); }).filter(Boolean).sort(function (a, b) {
            return Number(a) - Number(b);
        });
    }

    function normalizeInstallment(item) {
        if (!item) return null;
        var sourceMethod = item.repayMethod || '比例付';
        var repayMethod = sourceMethod;
        if (repayMethod === '定额付' || repayMethod === '定额还' || repayMethod === '等额本息') repayMethod = '比例付';
        if (repayMethod === '比例还' || repayMethod === '等额本金') repayMethod = '比例付';
        var sourcePeriods = orderedPeriods(item.periods || []);
        var periods = repayMethod === '比例付' ? [] : sourcePeriods;
        var rates = item.periodRates && typeof item.periodRates === 'object' ? item.periodRates : {};
        var filled = {};
        periods.forEach(function (period) {
            var rate = rates[period];
            if (rate && typeof rate === 'object' && !Array.isArray(rate)) {
                rate = rate.store != null && rate.store !== '' ? rate.store : rate.trader;
            }
            filled[period] = rate == null || rate === '' ? '1.00' : String(rate);
        });
        var periodRatio = item.periodRatio;
        if (repayMethod === '比例付' && (periodRatio == null || periodRatio === '')) periodRatio = '10.00';
        return {
            code: item.code || '',
            name: item.name || item.code || '',
            repayCycle: (function () {
                var cycle = item.repayCycle || '日结';
                if (cycle === '日还' || cycle === '周还' || cycle === '月还' || cycle === '年还' || cycle === '日付') cycle = '日结';
                return cycle;
            })(),
            periods: periods,
            periodRates: filled,
            periodRatio: periodRatio == null || periodRatio === '' ? '' : String(periodRatio),
            storeRate: (function () {
                if (item.storeRate != null && item.storeRate !== '') return String(item.storeRate);
                if (repayMethod !== '比例付') return '';
                var first = sourcePeriods.length ? rates[sourcePeriods[0]] : null;
                if (first && typeof first === 'object' && !Array.isArray(first)) {
                    first = first.store != null && first.store !== '' ? first.store : first.trader;
                }
                return first == null || first === '' ? '' : String(first);
            })(),
            repayMethod: repayMethod,
            amountMin: item.amountMin,
            amountMax: item.amountMax,
            packages: Array.isArray(item.packages) ? item.packages.slice() : []
        };
    }

    function periodsFieldLabel(method) {
        return method === '比例付' ? '结算比例' : '结算期数';
    }

    function periodRatioText(plan) {
        if (!plan || plan.periodRatio == null || plan.periodRatio === '') return '—';
        var num = Number(plan.periodRatio);
        if (!isFinite(num)) return '—';
        return num.toFixed(2) + '%';
    }

    /* 启用中的分期配置。适用商品包按商品包名称或编码匹配。刷新后没有缓存时用初始分期。 */
    function enabledInstallments() {
        var list = readJson(INSTALLMENT_KEY);
        if (!list || !list.length) {
            list = DEMO_INSTALLMENTS.map(function (item) {
                return JSON.parse(JSON.stringify(item));
            });
        }
        var exists = {};
        list.forEach(function (item) {
            if (item && item.code) exists[item.code] = true;
        });
        var changed = false;
        DEMO_INSTALLMENTS.forEach(function (item) {
            if (exists[item.code]) return;
            list.push(JSON.parse(JSON.stringify(item)));
            exists[item.code] = true;
            changed = true;
        });
        var floors = {
            FQ00001: { '1000': '20.00', '1000.00': '20.00' },
            FQ00002: { '5000': '50.00', '5000.00': '50.00' },
            FQ00003: { '500': '5.00', '500.00': '5.00' }
        };
        list.forEach(function (item) {
            var next = item && floors[item.code] && floors[item.code][String(item.amountMin)];
            if (next) {
                item.amountMin = next;
                changed = true;
            }
            if (item && (item.repayCycle === '日付' || item.repayCycle === '日还' || item.repayCycle === '周还' || item.repayCycle === '月还' || item.repayCycle === '年还' || !item.repayCycle)) {
                item.repayCycle = '日结';
                changed = true;
            }
            if (item && item.name === '生鲜周转日付') {
                item.name = '生鲜周转日结';
                changed = true;
            }
        });
        if (changed) sessionStorage.setItem(INSTALLMENT_KEY, JSON.stringify(list));
        return list.filter(function (item) { return item && item.enabled !== false; }).map(normalizeInstallment).filter(Boolean);
    }

    function installmentCoversPackage(plan, pkg) {
        var names = plan.packages || [];
        return names.indexOf(pkg.name) >= 0 || names.indexOf(pkg.code) >= 0;
    }

    function amountInPlan(plan, amount) {
        var min = cents(plan.amountMin);
        var max = cents(plan.amountMax);
        var value = cents(amount);
        if (!isFinite(min) || !isFinite(max) || !isFinite(value)) return false;
        return value >= min && value <= max;
    }

    function matchedInstallments(pkg, amount) {
        return enabledInstallments().filter(function (plan) {
            return installmentCoversPackage(plan, pkg) && amountInPlan(plan, amount);
        });
    }

    /* 所选商品包需已配置启用的分期，且所选商品售价合计落在其中一条分期的货款区间内。 */
    function publishInstallmentError(pkg, lines) {
        var matched = enabledInstallments().filter(function (plan) {
            return installmentCoversPackage(plan, pkg);
        });
        if (!matched.length) return '商品未关联产品配置';
        var amount = sumLines(lines);
        var covered = matched.some(function (plan) { return amountInPlan(plan, amount); });
        if (!covered) return '售价不在产品配置的货款区间内';
        return '';
    }

    function clearInstallmentChoice() {
        repayCycle = '';
        repayMethod = '';
        repayPeriod = '';
    }

    function availableCycles(plans) {
        var seen = {};
        plans.forEach(function (plan) {
            if (plan.repayCycle) seen[plan.repayCycle] = true;
        });
        return CYCLE_ORDER.filter(function (cycle) { return seen[cycle]; });
    }

    function availableMethods(plans, cycle) {
        var seen = {};
        plans.forEach(function (plan) {
            if (plan.repayCycle === cycle && plan.repayMethod) seen[plan.repayMethod] = true;
        });
        return METHOD_ORDER.filter(function (method) { return seen[method]; });
    }

    function planByCycleAndMethod(plans, cycle, method) {
        var found = null;
        plans.some(function (plan) {
            if (plan.repayCycle === cycle && plan.repayMethod === method) {
                found = plan;
                return true;
            }
            return false;
        });
        return found;
    }

    function ensureInstallmentChoice(plans) {
        var cycles = availableCycles(plans);
        if (!cycles.length) {
            clearInstallmentChoice();
            return null;
        }
        if (cycles.indexOf(repayCycle) < 0) {
            repayCycle = cycles.indexOf('日结') >= 0 ? '日结' : cycles[0];
        }
        var methods = availableMethods(plans, repayCycle);
        if (!methods.length) {
            repayMethod = '';
            repayPeriod = '';
            return null;
        }
        if (methods.indexOf(repayMethod) < 0) repayMethod = methods[0];
        var plan = planByCycleAndMethod(plans, repayCycle, repayMethod);
        var periods = plan ? plan.periods : [];
        if (!periods.length) {
            repayPeriod = '';
            return plan;
        }
        if (periods.indexOf(String(repayPeriod)) < 0) repayPeriod = periods[0];
        return plan;
    }

    function roundMoney(value) {
        return Math.round(Number(value) * 100) / 100;
    }

    /* 门店倍率：定额付取当期倍率，比例付取直接门店倍率。 */
    function storeRateOf(plan, period) {
        if (!plan) return 1;
        var rate;
        if (plan.repayMethod === '比例付') rate = Number(plan.storeRate);
        else rate = Number((plan.periodRates || {})[String(period)] || 0);
        if (!isFinite(rate) || rate <= 0) return 1;
        return rate;
    }

    /* 总金额 = 商品售价合计 × 门店倍率。 */
    function payableAmount(principal, plan, period) {
        var P = Number(principal);
        if (!isFinite(P) || P <= 0) return null;
        return roundMoney(P * storeRateOf(plan, period));
    }

    /* 定额付预估每日结算货款：总金额（已含门店倍率）÷ 结算期数。 */
    function estimateDailyPay(principal, plan, period) {
        var n = Number(period);
        var total = payableAmount(principal, plan, period);
        if (!isFinite(n) || n < 1 || total == null) return null;
        return money(roundMoney(total / n));
    }

    function renderDemand(item, withCancel) {
        var names = (item.skus || []).map(skuQtyText).join('、') || '—';
        var cancel = withCancel && canCancelDemand(item) && item.storeCode === account.code
            ? '<button type="button" class="rbt-h5-cancel" data-cancel="' + esc(item.code) + '">取消</button>'
            : '';
        var sign = item.status === '待签署'
            ? '<button type="button" class="rbt-h5-sign" data-sign="' + esc(item.code) + '">去签署</button>'
            : '';
        var storeLine = item.status === '待签署' || item.storeCode !== account.code
            ? '<p>需求门店：' + esc(item.storeName || '—') + '</p>'
            : '';
        var statusClass = item.status === '已完成'
            ? ' is-done'
            : (CLOSED_DEMAND_STATUSES.indexOf(item.status) >= 0 ? ' is-off' : '');
        return '<article class="rbt-h5-card">' +
            '<div class="rbt-h5-card__top"><h2>' + esc(item.code) + '</h2>' +
            '<span class="rbt-h5-status' + statusClass + '">' + esc(item.status) + '</span></div>' +
            storeLine +
            '<p>商品包：' + esc(item.packageName) + '（' + esc(item.packageCode) + '）</p>' +
            '<p>商品：' + esc(names) + '</p>' +
            '<p>商品金额：¥' + esc(item.goodsAmount || '—') + '</p>' +
            '<p>联营服务费：¥' + esc(item.serviceFee || '—') + '</p>' +
            '<p>总金额：¥' + esc(item.amount || '—') + '</p>' +
            (item.repayCycle
                ? '<p>结算周期：' + esc(item.repayCycle) + '</p>' +
                  '<p>结算方式：' + esc(item.repayMethod || '—') + '</p>' +
                  (item.repayMethod === '比例付'
                      ? ((window.RbtSettleRatio && RbtSettleRatio.textOf(item)) ? '<p>结算比例：' + esc(RbtSettleRatio.textOf(item)) + '</p>' : '')
                      : '<p>结算期数：' + esc(item.repayPeriod || '—') + '期</p>')
                : '') +
            '<p>创建时间：' + esc(item.createdAt) + '</p>' +
            sign +
            cancel +
            '</article>';
    }

    function toolIcon(svg, background) {
        return '<span class="rbt-h5-tool__icon" style="background:' + background + '">' + svg + '</span>';
    }

    function svgIcon(paths) {
        return '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">' + paths + '</svg>';
    }

    /* 首页菜单对齐丰银宝门店首页。除 RBT 外只展示，不跳转。 */
    function renderStoreHome() {
        var storeName = account && account.name ? account.name : '门店';
        var mark = storeName.slice(0, 1);
        var gold = 'linear-gradient(180deg,#ffd15c,#ffb020)';
        var red = 'linear-gradient(180deg,#ff7a59,#ff4d4f)';
        var orange = 'linear-gradient(180deg,#ff9a45,#ff7019)';
        var blue = 'linear-gradient(180deg,#5b9bff,#3b7cff)';
        var member = svgIcon('<rect x="4" y="4" width="6" height="6" rx="1" fill="#fff"/><rect x="14" y="4" width="6" height="6" rx="1" fill="#fff"/><rect x="4" y="14" width="6" height="6" rx="1" fill="#fff"/><rect x="14" y="14" width="3" height="3" rx=".5" fill="#fff"/><rect x="18" y="14" width="2" height="2" fill="#fff"/><rect x="14" y="18" width="2" height="2" fill="#fff"/><rect x="17" y="17" width="3" height="3" rx=".5" fill="#fff"/>');
        var live = svgIcon('<rect x="3" y="6" width="18" height="12" rx="2" stroke="#fff" stroke-width="1.8"/><path d="M10 9.5v5l4.5-2.5L10 9.5z" fill="#fff"/>');
        var order = svgIcon('<rect x="6" y="3.5" width="12" height="17" rx="2" stroke="#fff" stroke-width="1.8"/><path d="M9 8h6M9 12h6M9 16h4" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>');
        var receive = svgIcon('<path d="M4 7.5l8-3.5 8 3.5v9.2c0 .7-.4 1.3-1 1.6l-7 3.2-7-3.2c-.6-.3-1-.9-1-1.6V7.5z" stroke="#fff" stroke-width="1.6"/><path d="M8.5 12.2l2.2 2.2 4.8-5" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>');
        var purchase = svgIcon('<path d="M6 7h13l-1.4 8.2a2 2 0 0 1-2 1.6H9.2a2 2 0 0 1-2-1.6L6 7z" stroke="#fff" stroke-width="1.6"/><path d="M9 7L8 4H4" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><circle cx="10" cy="19" r="1.2" fill="#fff"/><circle cx="16" cy="19" r="1.2" fill="#fff"/>');
        var wallet = svgIcon('<rect x="3" y="6" width="18" height="13" rx="2" stroke="#fff" stroke-width="1.6"/><path d="M3 10h18" stroke="#fff" stroke-width="1.6"/><circle cx="16.5" cy="14.5" r="1.2" fill="#fff"/>');
        var biz = svgIcon('<path d="M8 9.5c0-2.2 1.6-4 4-4s4 1.8 4 4c0 1.4-.6 2.5-1.6 3.2-.6.4-1 .9-1.1 1.6h-2.6c-.1-.7-.5-1.2-1.1-1.6C8.6 12 8 10.9 8 9.5z" stroke="#fff" stroke-width="1.5"/><path d="M9 16.5h6M10.2 19h3.6" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>');
        var stock = svgIcon('<path d="M4 9.5L12 5l8 4.5v8L12 22l-8-4.5v-8z" stroke="#fff" stroke-width="1.6"/><circle cx="15.5" cy="15.5" r="2.2" stroke="#fff" stroke-width="1.4"/><path d="M17.2 17.2L19 19" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>');
        var aftersale = svgIcon('<path d="M7 8H5.5A2.5 2.5 0 0 0 3 10.5V17a2 2 0 0 0 2 2h8" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><path d="M7 8l2.2-2.2M7 8l2.2 2.2" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><rect x="9" y="8" width="12" height="10" rx="2" stroke="#fff" stroke-width="1.6"/>');
        var onboard = svgIcon('<rect x="5" y="3.5" width="12" height="16" rx="2" stroke="#fff" stroke-width="1.6"/><path d="M8 8h6M8 12h4" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/><path d="M14 15.5l1.4 1.4 3-3.2" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>');
        var rbt = svgIcon('<rect x="4" y="4" width="6.2" height="6.2" rx="1.2" fill="#fff"/><rect x="13.8" y="4" width="6.2" height="6.2" rx="1.2" fill="#fff" opacity=".7"/><rect x="4" y="13.8" width="6.2" height="6.2" rx="1.2" fill="#fff" opacity=".7"/><rect x="13.8" y="13.8" width="6.2" height="6.2" rx="1.2" fill="#fff" opacity=".7"/>');
        var scan = svgIcon('<path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16M8 12h8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>');
        var bag = svgIcon('<path d="M6.8 8.2h10.4l-.9 11a1.4 1.4 0 0 1-1.4 1.3H9.1a1.4 1.4 0 0 1-1.4-1.3l-.9-11z" stroke="currentColor" stroke-width="1.6"/><path d="M9.2 8.2V6.6A2.8 2.8 0 0 1 12 3.8a2.8 2.8 0 0 1 2.8 2.8v1.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="17.4" cy="5.6" r="2.1" fill="#ff8a3d"/>');
        var bell = svgIcon('<path d="M6 16.5h12l-1.2-1.6V10a4.8 4.8 0 1 0-9.6 0v4.9L6 16.5z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M10 16.5a2 2 0 0 0 4 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>');
        var gear = svgIcon('<path fill="currentColor" d="M19.4 13.1c.1-.4.1-.7.1-1.1s0-.7-.1-1.1l1.7-1.3a.5.5 0 0 0 .1-.6l-1.6-2.8a.5.5 0 0 0-.6-.2l-2 .8a6.2 6.2 0 0 0-1.9-1.1l-.3-2.1a.5.5 0 0 0-.5-.4h-3.2a.5.5 0 0 0-.5.4l-.3 2.1c-.7.3-1.3.7-1.9 1.1l-2-.8a.5.5 0 0 0-.6.2L2.8 9a.5.5 0 0 0 .1.6l1.7 1.3c-.1.4-.1.7-.1 1.1s0 .7.1 1.1L2.9 14.4a.5.5 0 0 0-.1.6l1.6 2.8c.1.2.4.3.6.2l2-.8c.6.4 1.2.8 1.9 1.1l.3 2.1c0 .2.2.4.5.4h3.2c.3 0 .5-.2.5-.4l.3-2.1c.7-.3 1.3-.7 1.9-1.1l2 .8c.2.1.5 0 .6-.2l1.6-2.8a.5.5 0 0 0-.1-.6l-1.7-1.3zM12 15.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4z"/>');
        function shown(icon, label) {
            return '<div class="rbt-h5-tool">' + icon + '<span>' + label + '</span></div>';
        }
        return '<div class="rbt-h5-home">' +
            '<header class="rbt-h5-home__bar">' +
            '<span class="rbt-h5-home__avatar">' + esc(mark) + '</span>' +
            '<strong class="rbt-h5-home__name">' + esc(storeName) + '</strong>' +
            '<span class="rbt-h5-home__tools">' + bell + gear + '</span>' +
            '</header>' +
            '<div class="rbt-h5-home__quick">' +
            '<div class="rbt-h5-home__quick-item"><span class="rbt-h5-home__quick-icon">' + scan + '</span><span>扫码核销</span></div>' +
            '<div class="rbt-h5-home__quick-item"><span class="rbt-h5-home__quick-icon">' + bag + '</span><span>售后</span></div>' +
            '</div>' +
            '<section class="rbt-h5-home__card">' +
            '<h2>基础工具</h2>' +
            '<div class="rbt-h5-home__grid">' +
            shown(toolIcon(member, gold), '门店会员码') +
            shown(toolIcon(live, red), '直播推广') +
            shown(toolIcon(order, gold), '客户订单') +
            shown(toolIcon(receive, orange), '收货') +
            shown(toolIcon(purchase, red), '进货') +
            shown(toolIcon(wallet, orange), '门店钱包') +
            shown(toolIcon(biz, orange), '经营中心') +
            shown(toolIcon(stock, blue), '库存查询') +
            shown(toolIcon(aftersale, blue), '售后') +
            shown(toolIcon(onboard, blue), '商户进件') +
            '<button type="button" class="rbt-h5-tool" data-entry="rbt">' + toolIcon(rbt, orange) + '<span>RBT</span></button>' +
            '</div></section></div>';
    }

    function ratioText(item) {
        var api = window.RbtSettleRatio;
        if (item && item.repayMethod === '比例付' && api && typeof api.textOf === 'function') {
            return api.textOf(item) || '—';
        }
        return item && item.repayPeriod ? String(item.repayPeriod) : '—';
    }

    var REPAY_DEMO_KEY = 'rbt_h5_store_repay_demo_v1';
    var REPAY_DEMO_SCENES = [
        { id: 'pending', label: '待还款 · 无每日明细' },
        { id: 'repaid-empty', label: '已还款 · 无每日明细' },
        { id: 'repaid-days', label: '已还款 · 有每日明细' }
    ];
    /* 演示日数据：已发生日期的营业流水 × 该渠道结算比例。不把总金额拆成每日本金，也不预造未发生的日期。 */
    var REPAY_DEMO_DAYS = [
        { date: '2026-11-07', channel: 'POS', turnover: 860 },
        { date: '2026-11-08', channel: '直播', turnover: 420 },
        { date: '2026-11-09', channel: '商城', turnover: 310 },
        { date: '2026-11-10', channel: 'POS', turnover: 980 },
        { date: '2026-11-11', channel: '直播', turnover: 560 },
        { date: '2026-11-12', channel: '商城', turnover: 240 }
    ];

    function readRepayDemo() {
        try {
            var id = localStorage.getItem(REPAY_DEMO_KEY);
            if (REPAY_DEMO_SCENES.some(function (scene) { return scene.id === id; })) return id;
        } catch (e) {}
        return 'repaid-days';
    }

    function channelRatio(item, channel) {
        var list = item && item.settleRatios || [];
        var fallback = 0;
        var i;
        for (i = 0; i < list.length; i++) {
            var value = Number(String(list[i].fallback || '').replace('%', ''));
            if (!isFinite(value) || value <= 0) continue;
            if (!fallback) fallback = value;
            if (list[i].channel === channel) return value;
        }
        return fallback || 10;
    }

    function repayDayRows(item) {
        return REPAY_DEMO_DAYS.map(function (row) {
            var ratio = channelRatio(item, row.channel);
            var due = (Math.round(row.turnover * ratio) / 100).toFixed(2);
            return {
                date: row.date,
                channel: row.channel,
                turnover: row.turnover.toFixed(2),
                ratio: ratio.toFixed(2) + '%',
                due: due,
                actual: due
            };
        });
    }

    function sumDayField(days, field) {
        return (days || []).reduce(function (total, row) {
            return total + Number(row[field] || 0);
        }, 0);
    }

    function repayAnchorCode() {
        var found = '';
        storeDemands().some(function (item) {
            if (item && item.status === '支付中') {
                found = item.code;
                return true;
            }
            return false;
        });
        return found;
    }

    /* 验收场景只改还款页看到的状态和每日明细，需求单列表仍是原状态。 */
    function repayView(item) {
        var scene = readRepayDemo();
        if (!item || scene === 'pending' || item.code !== repayAnchorCode()) return item;
        var view = {};
        Object.keys(item).forEach(function (key) { view[key] = item[key]; });
        view.status = '已完成';
        view._demoRepaid = true;
        if (scene === 'repaid-days') view._days = repayDayRows(item);
        return view;
    }

    function repayViews() {
        return storeDemands().map(repayView);
    }

    function repayDemands(done) {
        return repayViews().filter(function (item) {
            return item && item.status === (done ? '已完成' : '支付中');
        });
    }

    function syncTabbar() {
        var bar = document.getElementById('rbtH5Tabbar');
        if (!bar) return;
        var show = screen === 'list' || screen === 'repay' || screen === 'mine';
        bar.hidden = !show;
        Array.prototype.forEach.call(bar.querySelectorAll('[data-tab]'), function (btn) {
            btn.classList.toggle('is-on', show && btn.getAttribute('data-tab') === tab);
        });
    }

    /* 待还款=支付中，已还款=已完成。比例付不预造应履行金额，也不写剩余天数和逾期。 */
    function renderRepay() {
        var done = repayFilter === 'done';
        var rows = repayDemands(done);
        var daySum = 0;
        var hasDays = false;
        rows.forEach(function (item) {
            if (!item._days || !item._days.length) return;
            hasDays = true;
            daySum += sumDayField(item._days, 'actual');
        });
        setHead('还款');
        return '<div class="rbt-repay-hero">' +
            '<div class="rbt-repay-switch" role="tablist">' +
            '<button type="button" data-repay-view="pending"' + (done ? '' : ' class="is-on"') + '>待还款</button>' +
            '<button type="button" data-repay-view="done"' + (done ? ' class="is-on"' : '') + '>已还款</button>' +
            '</div>' +
            '<p class="rbt-repay-hero__label">' + (done ? '实际履行' : '应履行') + '</p>' +
            '<p class="rbt-repay-hero__amt">' + (hasDays ? ('¥' + money(daySum)) : (done ? '未产生' : '未计算')) + '</p>' +
            '<button type="button" class="rbt-repay-go" data-bill-first ' + (rows.length ? '' : 'disabled') + '>账单明细</button>' +
            '<p class="rbt-repay-hero__note">' + (hasDays
                ? '已产生的日结按当日营业流水乘结算比例计算，未发生的日期不预造。'
                : (done
                    ? '已完成只表示需求状态。完成依据待确认，实际履行未产生。'
                    : '支付中表示复核已通过。比例付不预造固定金额，起算待确认。')) + '</p>' +
            '</div>' +
            (rows.length ? rows.map(function (item) {
                var side = item._days && item._days.length
                    ? ('实际履行 ¥' + money(sumDayField(item._days, 'actual')) + ' · ' + item._days.length + '日')
                    : (done ? '实际履行未产生' : '应履行未计算');
                return '<button type="button" class="rbt-repay-row" data-bill="' + esc(item.code) + '">' +
                    '<span><span class="rbt-repay-row__title">' + esc(item.code) + '</span>' +
                    '<span class="rbt-repay-row__sub">总金额 ¥' + esc(item.amount || '—') + ' · ' + esc(item.repayCycle || '—') + ' ' + esc(item.repayMethod || '—') + '</span></span>' +
                    '<span class="rbt-repay-row__side' + (done ? ' is-done' : '') + '"><b>' + esc(item.status) + '</b><span>' +
                    esc(side) + '</span></span></button>';
            }).join('') : '<div class="rbt-h5-empty">' + (done ? '暂无已完成的合作' : '暂无支付中的合作') + '</div>');
    }

    function renderDayList(days) {
        return days.slice().reverse().map(function (day) {
            return '<div class="rbt-bill__day">' +
                '<span class="rbt-bill__day-date">' + esc(String(day.date).slice(5)) + '</span>' +
                '<span class="rbt-bill__day-body"><b>实际履行 ¥' + esc(money(day.actual)) + '</b>' +
                '<span>' + esc(day.channel) + '营业流水 ¥' + esc(money(day.turnover)) + ' · 比例 ' + esc(day.ratio) + '</span></span></div>';
        }).join('');
    }

    function renderBill(item) {
        var done = item.status === '已完成';
        var days = item._days || [];
        var dueSum = days.length ? money(sumDayField(days, 'due')) : '';
        var actSum = days.length ? money(sumDayField(days, 'actual')) : '';
        setHead('账单明细');
        var lines = days.length
            ? [
                ['履约计划', '已按日产生'],
                ['结算比例', ratioText(item)],
                ['计算来源依据', '获准营业事实'],
                ['应履行', '¥' + dueSum],
                ['可结算', '¥' + dueSum],
                ['实际履行', '¥' + actSum],
                ['原结算关联', '未生成'],
                ['差异事实', dueSum === actSum ? '未登记' : '应履行与实际履行不一致']
            ]
            : [
                ['履约计划', done ? '需求已完成，完成依据待确认' : '未激活'],
                ['结算比例', ratioText(item)],
                ['计算来源依据', '无获准营业事实'],
                ['应履行', done ? '完成依据待确认' : '未产生'],
                ['可结算', '未产生'],
                ['实际履行', '未产生'],
                ['原结算关联', '未生成'],
                ['差异事实', done ? '未登记' : '源数据缺失，不记成零']
            ];
        return '<section class="rbt-bill__head">' +
            '<div class="rbt-bill__top"><span class="rbt-bill__code">' + esc(item.code) + '</span><span class="rbt-bill__tag">' + esc(item.status || '—') + '</span></div>' +
            '<p class="rbt-bill__label">总金额</p>' +
            '<p class="rbt-bill__amt">' + esc(item.amount || '—') + '</p>' +
            '<div class="rbt-bill__stats">' +
            '<div><span>结算周期</span><b>' + esc(item.repayCycle || '—') + '</b></div>' +
            '<div><span>结算方式</span><b>' + esc(item.repayMethod || '—') + '</b></div>' +
            '</div>' +
            '<div class="rbt-bill__trader"><span>接单贸易商</span><b>' + esc(item.traderName || '—') + '</b></div>' +
            '</section>' +
            '<section class="rbt-bill__sheet"><h3>账单明细</h3>' +
            lines.map(function (line) {
                return '<div class="rbt-bill__line"><span>' + esc(line[0]) + '</span><b>' + esc(line[1]) + '</b></div>';
            }).join('') +
            '</section>' +
            '<section class="rbt-bill__sheet"><h3>每日明细</h3>' +
            (days.length
                ? renderDayList(days)
                : ('<p class="rbt-bill__empty">' + (done
                    ? '暂无每日明细。完成依据待确认，不补造每日金额。'
                    : '暂无每日明细。履约计划未激活，比例付不预造每日金额。') + '</p>')) +
            '</section>';
    }

    function renderMine() {
        setHead('我的');
        return '<section class="rbt-h5-card"><h2>' + esc(account && account.name ? account.name : '门店') + '</h2>' +
            '<p>门店编码：' + esc(account && account.code) + '</p>' +
            '<p>手机号：' + esc(account && account.phone) + '</p>' +
            '<button type="button" class="rbt-h5-action" data-switch-store>切换门店</button></section>';
    }

    function syncHomeChrome() {
        var phone = document.getElementById('rbtH5Phone');
        var scroll = document.getElementById('rbtH5Scroll');
        var on = screen === 'home';
        if (phone) phone.classList.toggle('is-home', on);
        if (scroll) scroll.classList.toggle('is-home', on);
    }

    /* 返回放在门店名左侧。首页、还款、我的没有上一级。 */
    function backTarget() {
        if (screen === 'bill') return 'repay';
        if (screen === 'packages' || screen === 'sign') return 'list';
        if (screen === 'skus') return 'packages';
        if (screen === 'installment') return 'skus';
        return '';
    }

    function syncHeadBack() {
        var btn = document.getElementById('rbtH5HeadBack');
        if (!btn) return;
        btn.classList.toggle('is-on', !!(account && backTarget()));
    }

    function goBack(target) {
        if (target === 'repay') {
            tab = 'repay';
            screen = 'repay';
        } else if (target) {
            screen = target;
            if (screen === 'packages') {
                clearPicked();
                clearInstallmentChoice();
            }
            if (screen === 'skus') clearInstallmentChoice();
        }
        render();
    }

    function render() {
        var scroll = document.getElementById('rbtH5Scroll');
        if (!scroll) return;
        syncHomeChrome();
        syncTabbar();
        syncHeadBack();
        var createBar = document.getElementById('rbtH5Create');
        if (createBar) createBar.hidden = screen !== 'list';
        if (screen === 'home') {
            setHead('首页');
            scroll.innerHTML = renderStoreHome();
            return;
        }
        if (screen === 'packages') {
            setHead('选择商品包');
            var choices = packages();
            scroll.innerHTML = (choices.length ? choices.map(function (item) {
                    return '<button type="button" class="rbt-h5-card" data-package="' + esc(item.code) + '" style="display:block;width:100%;text-align:left;cursor:pointer;">' +
                        '<h2>' + esc(item.name) + '</h2><p>' + esc(item.code) + ' · ' + item.skus.length + ' 个商品</p></button>';
                }).join('') : '<div class="rbt-h5-empty">暂无本门店的商品包</div>');
            return;
        }
        if (screen === 'skus') {
            var pkg = findPackage(packageCode);
            setHead('勾选商品');
            if (!pkg) {
                scroll.innerHTML = '<div class="rbt-h5-empty">商品包不存在</div>';
                return;
            }
            var lines = selectedLines(pkg);
            var allOn = pkg.skus.length > 0 && lines.length === pkg.skus.length;
            var pieceCount = lines.reduce(function (total, line) { return total + line.qty; }, 0);
            scroll.innerHTML = '<p class="rbt-h5-step-name">' + esc(pkg.name) + '</p>' +
                (pkg.skus.length
                    ? '<label class="rbt-h5-check"><input type="checkbox" data-all ' + (allOn ? 'checked' : '') + '><span><strong>全选</strong><span>共 ' + pkg.skus.length + ' 个商品</span></span></label>' +
                        pkg.skus.map(function (line) {
                            var on = isPicked(line.code);
                            var qty = on ? qtyOf(line.code) : 1;
                            var lineAmount = money(Number(line.salePrice) * qty);
                            var image = line.image
                                ? '<img class="rbt-h5-sku__img" src="' + esc(line.image) + '" alt="' + esc(line.name) + '">'
                                : '<span class="rbt-h5-sku__img rbt-h5-sku__img--empty">暂无图片</span>';
                            var foot = on
                                ? '<span class="rbt-h5-sku__foot"><span class="rbt-h5-sku__price">售价 ¥' + esc(lineAmount) + '</span>' +
                                    '<div class="rbt-h5-qty" data-qty-box="' + esc(line.code) + '">' +
                                    '<button type="button" data-qty-minus="' + esc(line.code) + '" aria-label="减少数量">−</button>' +
                                    '<input type="number" inputmode="numeric" min="1" max="' + QTY_MAX + '" value="' + qty + '" data-qty-input="' + esc(line.code) + '" aria-label="数量">' +
                                    '<button type="button" data-qty-plus="' + esc(line.code) + '" ' + (qty >= QTY_MAX ? 'disabled ' : '') + 'aria-label="增加数量">+</button>' +
                                    '</div></span>'
                                : '';
                            return '<div class="rbt-h5-check rbt-h5-sku">' +
                                '<input type="checkbox" data-sku="' + esc(line.code) + '" ' + (on ? 'checked' : '') + '>' +
                                image +
                                '<span class="rbt-h5-sku__body"><strong>' + esc(line.name) + '</strong>' +
                                '<span>商品条码 ' + esc(line.barcode) + '</span>' +
                                '<span>商品单位 ' + esc(line.unit) + '</span>' +
                                '<span>商品规格 ' + esc(line.spec) + '</span>' +
                                '<span class="rbt-h5-sku__unit">单价 ¥' + esc(line.salePrice) + '</span>' +
                                foot + '</span></div>';
                        }).join('')
                    : '<div class="rbt-h5-empty">该商品包暂无商品</div>') +
                '<p class="rbt-h5-sum">已选 ' + lines.length + ' 种共 ' + pieceCount + ' 件，需求金额 <b>¥' + money(sumLines(lines)) + '</b></p>' +
                '<button type="button" class="rbt-h5-primary rbt-h5-publish" data-next>下一步</button>';
            return;
        }
        if (screen === 'installment') {
            var instPkg = findPackage(packageCode);
            setHead('结算');
            if (!instPkg) {
                scroll.innerHTML = '<div class="rbt-h5-empty">商品包不存在</div>';
                return;
            }
            var instLines = selectedLines(instPkg);
            var instAmount = sumLines(instLines);
            var plans = matchedInstallments(instPkg, instAmount);
            if (!plans.length) {
                scroll.innerHTML = '<div class="rbt-h5-empty">暂无匹配的产品配置</div>';
                return;
            }
            var currentPlan = ensureInstallmentChoice(plans);
            var cycles = availableCycles(plans);
            var methods = availableMethods(plans, repayCycle);
            var periods = currentPlan ? currentPlan.periods : [];
            var isRatio = repayMethod === '比例付';
            var amountWithRate = currentPlan
                ? payableAmount(instAmount, currentPlan, isRatio ? '' : repayPeriod)
                : null;
            var showAmount = amountWithRate != null ? money(amountWithRate) : money(instAmount);
            var goodsAmount = money(instAmount);
            var serviceFee = money(Number(showAmount) - Number(goodsAmount));
            var periodLabel = periodsFieldLabel(repayMethod);
            var periodRow = isRatio
                ? ''
                : (periods.length
                    ? '<div class="rbt-h5-inst__row"><span class="rbt-h5-inst__label">' + esc(periodLabel) + '</span>' +
                      '<div class="rbt-h5-inst__chips">' + periods.map(function (period) {
                          return '<button type="button" class="rbt-h5-chip' + (String(period) === String(repayPeriod) ? ' is-on' : '') + '" data-period="' + esc(period) + '">' + esc(period) + '期</button>';
                      }).join('') + '</div></div>'
                    : '');
            scroll.innerHTML = '<p class="rbt-h5-step-name">' + esc(instPkg.name) + '</p>' +
                '<section class="rbt-h5-inst">' +
                '<div class="rbt-h5-inst__row rbt-h5-inst__row--muted"><span class="rbt-h5-inst__label">商品金额</span>' +
                '<span class="rbt-h5-inst__amount">¥ ' + goodsAmount + '</span></div>' +
                '<div class="rbt-h5-inst__row rbt-h5-inst__row--muted"><span class="rbt-h5-inst__label">联营服务费</span>' +
                '<span class="rbt-h5-inst__amount">¥ ' + serviceFee + '</span></div>' +
                '<div class="rbt-h5-inst__row rbt-h5-inst__row--total"><span class="rbt-h5-inst__label">总金额</span>' +
                '<span class="rbt-h5-inst__amount">¥ ' + showAmount + '</span></div>' +
                '<div class="rbt-h5-inst__row"><span class="rbt-h5-inst__label">结算周期</span>' +
                '<div class="rbt-h5-inst__chips">' + cycles.map(function (cycle) {
                    return '<button type="button" class="rbt-h5-chip' + (cycle === repayCycle ? ' is-on' : '') + '" data-cycle="' + esc(cycle) + '">' + esc(cycle) + '</button>';
                }).join('') + '</div></div>' +
                (methods.length
                    ? '<div class="rbt-h5-inst__row"><span class="rbt-h5-inst__label">结算方式</span>' +
                      '<div class="rbt-h5-inst__chips">' + methods.map(function (method) {
                          return '<button type="button" class="rbt-h5-chip' + (method === repayMethod ? ' is-on' : '') + '" data-method="' + esc(method) + '">' + esc(method) + '</button>';
                      }).join('') + '</div></div>'
                    : '') +
                periodRow +
                '</section>' +
                '<button type="button" class="rbt-h5-primary rbt-h5-publish" style="margin-top:16px;" data-publish>发布</button>';
            return;
        }
        if (screen === 'sign') {
            setHead('合同签署');
            var signing = window.RbtDemandData && window.RbtDemandData.get(signCode);
            scroll.innerHTML = '' +
                (window.RbtContractSign
                    ? window.RbtContractSign.render(signing, { role: 'store', code: account && account.code, name: account && account.name })
                    : '<div class="rbt-h5-empty">合同签署页不可用</div>');
            return;
        }
        if (screen === 'bill') {
            var bill = repayViews().filter(function (item) { return item.code === billCode; })[0];
            scroll.innerHTML = bill
                ? renderBill(bill)
                : '<div class="rbt-h5-empty">账单不存在</div>';
            return;
        }
        if (tab === 'mine') {
            scroll.innerHTML = renderMine();
            return;
        }
        if (tab === 'repay') {
            scroll.innerHTML = renderRepay();
            return;
        }
        setHead('首页');
        var rows = storeDemands();
        scroll.innerHTML = rows.length
            ? rows.map(function (item) { return renderDemand(item, true); }).join('')
            : '<div class="rbt-h5-empty">暂无需求</div>';
    }

    function open(next) {
        account = next;
        if (readRepayDemo() === 'pending') {
            tab = 'home';
            screen = 'list';
            repayFilter = 'pending';
        } else {
            tab = 'repay';
            screen = 'repay';
            repayFilter = 'done';
        }
        packageCode = '';
        clearPicked();
        clearInstallmentChoice();
        render();
    }

    function close() {
        account = null;
        tab = 'home';
        screen = 'list';
        var tabbar = document.getElementById('rbtH5Tabbar');
        if (tabbar) tabbar.hidden = true;
        var phone = document.getElementById('rbtH5Phone');
        var scroll = document.getElementById('rbtH5Scroll');
        var headBack = document.getElementById('rbtH5HeadBack');
        if (headBack) headBack.classList.remove('is-on');
        if (phone) phone.classList.remove('is-home');
        if (scroll) {
            scroll.classList.remove('is-home');
            scroll.innerHTML = '';
        }
        var createBar = document.getElementById('rbtH5Create');
        if (createBar) createBar.hidden = true;
    }

    var headBackBtn = document.getElementById('rbtH5HeadBack');
    if (headBackBtn) {
        headBackBtn.addEventListener('click', function () {
            var target = backTarget();
            if (target) goBack(target);
        });
    }

    document.getElementById('rbtH5App').addEventListener('click', function (event) {
        var tabBtn = event.target.closest('[data-tab]');
        var repayView = event.target.closest('[data-repay-view]');
        var billBtn = event.target.closest('[data-bill]');
        var billFirst = event.target.closest('[data-bill-first]');
        var backRepay = event.target.closest('[data-back-repay]');
        var switchStore = event.target.closest('[data-switch-store]');
        if (tabBtn) {
            tab = tabBtn.getAttribute('data-tab') || 'home';
            screen = tab === 'repay' ? 'repay' : (tab === 'mine' ? 'mine' : 'list');
            render();
            return;
        }
        if (repayView) {
            repayFilter = repayView.getAttribute('data-repay-view') === 'done' ? 'done' : 'pending';
            tab = 'repay';
            screen = 'repay';
            render();
            return;
        }
        if (billFirst || billBtn) {
            var code = billBtn ? billBtn.getAttribute('data-bill') : '';
            if (!code) {
                var first = repayDemands(repayFilter === 'done')[0];
                code = first ? first.code : '';
            }
            if (!code) return;
            billCode = code;
            tab = 'repay';
            screen = 'bill';
            render();
            return;
        }
        if (backRepay) {
            tab = 'repay';
            screen = 'repay';
            render();
            return;
        }
        if (switchStore && window.RbtH5StoreLogin) {
            window.RbtH5StoreLogin.logout();
            return;
        }
        var entry = event.target.closest('[data-entry]');
        var create = event.target.closest('[data-create]');
        var back = event.target.closest('[data-back]');
        var pkgButton = event.target.closest('[data-package]');
        var cancel = event.target.closest('[data-cancel]');
        var sign = event.target.closest('[data-sign]');
        var confirmSign = event.target.closest('[data-confirm-sign]');
        var nextStep = event.target.closest('[data-next]');
        var publish = event.target.closest('[data-publish]');
        var cycleBtn = event.target.closest('[data-cycle]');
        var methodBtn = event.target.closest('[data-method]');
        var periodBtn = event.target.closest('[data-period]');
        var ratioHelp = event.target.closest('[data-ratio-help]');
        var helpWraps = document.querySelectorAll('.rbt-h5-help-wrap');
        if (ratioHelp) {
            var wrap = ratioHelp.closest('.rbt-h5-help-wrap');
            var tip = wrap && wrap.querySelector('.rbt-h5-help-tip');
            var willOpen = tip && tip.hasAttribute('hidden');
            Array.prototype.forEach.call(helpWraps, function (item) {
                item.classList.remove('is-open');
                var btn = item.querySelector('[data-ratio-help]');
                var pop = item.querySelector('.rbt-h5-help-tip');
                if (btn) btn.setAttribute('aria-expanded', 'false');
                if (pop) pop.setAttribute('hidden', '');
            });
            if (willOpen && wrap && tip) {
                wrap.classList.add('is-open');
                tip.removeAttribute('hidden');
                ratioHelp.setAttribute('aria-expanded', 'true');
            }
            return;
        }
        Array.prototype.forEach.call(helpWraps, function (item) {
            item.classList.remove('is-open');
            var btn = item.querySelector('[data-ratio-help]');
            var pop = item.querySelector('.rbt-h5-help-tip');
            if (btn) btn.setAttribute('aria-expanded', 'false');
            if (pop) pop.setAttribute('hidden', '');
        });
        if (entry && entry.getAttribute('data-entry') === 'rbt') {
            screen = 'list';
            render();
            return;
        }
        if (create) {
            if (blockNoAvailableQuota()) return;
            screen = 'packages';
            packageCode = '';
            clearPicked();
            clearInstallmentChoice();
            render();
            return;
        }
        if (back) {
            screen = back.getAttribute('data-back');
            if (screen === 'packages') {
                clearPicked();
                clearInstallmentChoice();
            }
            if (screen === 'skus') clearInstallmentChoice();
            render();
            return;
        }
        if (pkgButton) {
            packageCode = pkgButton.getAttribute('data-package');
            clearPicked();
            clearInstallmentChoice();
            screen = 'skus';
            render();
            return;
        }
        if (cycleBtn) {
            repayCycle = cycleBtn.getAttribute('data-cycle') || '';
            repayMethod = '';
            repayPeriod = '';
            render();
            return;
        }
        if (methodBtn) {
            repayMethod = methodBtn.getAttribute('data-method') || '';
            repayPeriod = '';
            render();
            return;
        }
        if (periodBtn) {
            repayPeriod = periodBtn.getAttribute('data-period') || '';
            render();
            return;
        }
        if (nextStep) {
            if (blockNoAvailableQuota()) return;
            var nextPkg = findPackage(packageCode);
            var nextLines = nextPkg ? selectedLines(nextPkg) : [];
            if (!nextPkg) {
                toast('请选择商品包');
                return;
            }
            if (!nextLines.length) {
                toast('请勾选商品');
                return;
            }
            var nextError = publishInstallmentError(nextPkg, nextLines);
            if (nextError) {
                toast(nextError);
                return;
            }
            clearInstallmentChoice();
            screen = 'installment';
            render();
            return;
        }
        var qtyMinus = event.target.closest('[data-qty-minus]');
        var qtyPlus = event.target.closest('[data-qty-plus]');
        if (qtyMinus || qtyPlus) {
            var qtyCode = (qtyMinus || qtyPlus).getAttribute(qtyMinus ? 'data-qty-minus' : 'data-qty-plus');
            var nextQty = qtyOf(qtyCode) + (qtyMinus ? -1 : 1);
            setQty(qtyCode, nextQty);
            render();
            return;
        }
        var skuCard = event.target.closest('.rbt-h5-sku');
        if (skuCard && !event.target.closest('[data-qty-box]') && !event.target.closest('input[type="checkbox"]')) {
            var skuBox = skuCard.querySelector('[data-sku]');
            if (skuBox) {
                skuBox.checked = !skuBox.checked;
                skuBox.dispatchEvent(new Event('change', { bubbles: true }));
            }
            return;
        }
        if (confirmSign) {
            var signedCode = confirmSign.getAttribute('data-confirm-sign');
            var signApi = window.RbtDemandData;
            var signResult = signApi && typeof signApi.signDemand === 'function'
                ? signApi.signDemand(signedCode, { role: 'store', code: account && account.code, name: account && account.name }, confirmSign.getAttribute('data-contract-key'))
                : { ok: false };
            if (signResult && signResult.ok && signResult.done) toast('各方已完成签署，需求进入待复核');
            else if (signResult && signResult.ok) toast('签署成功');
            else if (signResult && signResult.reason === 'signed') toast('你已签署');
            else toast('当前不能签署');
            render();
            return;
        }
        if (sign) {
            signCode = sign.getAttribute('data-sign') || '';
            screen = 'sign';
            render();
            return;
        }
        if (cancel) {
            var code = cancel.getAttribute('data-cancel');
            var list = demands();
            var target = null;
            list.some(function (item) {
                if (item.code === code && item.storeCode === account.code) {
                    target = item;
                    return true;
                }
                return false;
            });
            if (!canCancelDemand(target)) {
                toast('当前状态不允许取消');
                return;
            }
            var cancelBy = (account.person || account.name || '门店').split('、')[0];
            if (window.RbtDemandData && typeof window.RbtDemandData.setStatus === 'function') {
                window.RbtDemandData.setStatus(code, '已作废', cancelBy);
            } else {
                target.status = '已作废';
                target.updater = cancelBy;
                target.updatedAt = nowText();
                releaseDemandQuota(target);
                saveDemands(list);
            }
            toast('需求已作废');
            render();
            return;
        }
        if (publish) {
            if (blockNoAvailableQuota()) return;
            var pkg = findPackage(packageCode);
            var lines = pkg ? selectedLines(pkg) : [];
            if (!pkg) {
                toast('请选择商品包');
                return;
            }
            if (!lines.length) {
                toast('请勾选商品');
                return;
            }
            var amountValue = sumLines(lines);
            var publishPlans = matchedInstallments(pkg, amountValue);
            var publishPlan = ensureInstallmentChoice(publishPlans);
            if (!publishPlan || !repayCycle) {
                toast('请选择结算周期');
                return;
            }
            if (!repayMethod) {
                toast('请选择结算方式');
                return;
            }
            var isRatioPay = repayMethod === '比例付';
            if (!isRatioPay && !repayPeriod) {
                toast('请选择结算期数');
                return;
            }
            var publishPayable = payableAmount(amountValue, publishPlan, isRatioPay ? '' : repayPeriod);
            var publishDaily = isRatioPay ? null : estimateDailyPay(amountValue, publishPlan, repayPeriod);
            if (publishPayable == null) {
                toast('总金额计算失败');
                return;
            }
            var quota = accountQuota();
            var available = quota ? quota.available : 0;
            if (cents(publishPayable) > cents(available)) {
                toast('总金额须小于等于可用额度');
                return;
            }
            var all = demands();
            var publishAt = nowText();
            var publisher = (account.person || account.name || '门店').split('、')[0];
            var created = {
                code: nextCode(all),
                storeCode: account.code,
                storeName: account.name,
                packageCode: pkg.code,
                packageName: pkg.name,
                skus: lines.map(function (line) {
                    return { code: line.code, name: line.name, salePrice: line.salePrice, qty: line.qty };
                }),
                goodsAmount: money(amountValue),
                serviceFee: money(Number(money(publishPayable)) - Number(money(amountValue))),
                amount: money(publishPayable),
                installmentCode: publishPlan.code,
                installmentName: publishPlan.name,
                repayCycle: publishPlan.repayCycle,
                repayMethod: publishPlan.repayMethod,
                repayPeriod: isRatioPay ? '' : String(repayPeriod),
                dailyAmount: publishDaily || '',
                status: '待审核',
                quotaHeld: false,
                creator: publisher,
                createdAt: publishAt,
                updater: publisher,
                updatedAt: publishAt
            };
            occupyDemandQuota(created);
            all.unshift(created);
            saveDemands(all);
            if (window.RbtDemandData && typeof window.RbtDemandData.createAuditForDemand === 'function') {
                window.RbtDemandData.createAuditForDemand(created);
            }
            screen = 'list';
            packageCode = '';
            clearPicked();
            clearInstallmentChoice();
            toast('需求已发布');
            render();
            return;
        }
    });

    document.getElementById('rbtH5Scroll').addEventListener('change', function (event) {
        var qtyInput = event.target.closest('[data-qty-input]');
        if (qtyInput) {
            setQty(qtyInput.getAttribute('data-qty-input'), qtyInput.value);
            render();
            return;
        }
        var all = event.target.closest('[data-all]');
        var one = event.target.closest('[data-sku]');
        var pkg = findPackage(packageCode);
        if (!pkg) return;
        if (all) {
            if (all.checked) {
                pkg.skus.forEach(function (line) {
                    if (!isPicked(line.code)) setQty(line.code, 1);
                });
            } else {
                clearPicked();
            }
            render();
            return;
        }
        if (one) {
            var code = one.getAttribute('data-sku');
            if (one.checked) setQty(code, 1);
            else setQty(code, 0);
            render();
        }
    });

    function mountRepayDemo() {
        if (document.getElementById('rbtRepayDemo')) return;
        var current = readRepayDemo();
        var panel = document.createElement('div');
        panel.id = 'rbtRepayDemo';
        panel.className = 'rbt-repay-demo';
        panel.innerHTML =
            '<div class="rbt-repay-demo__title">还款验收开关</div>' +
            '<label class="rbt-repay-demo__row">场景' +
            '<select id="rbtRepayDemoScene">' +
            REPAY_DEMO_SCENES.map(function (scene) {
                return '<option value="' + scene.id + '"' + (scene.id === current ? ' selected' : '') + '>' + scene.label + '</option>';
            }).join('') +
            '</select></label>' +
            '<p class="rbt-repay-demo__hint">已还款的每日明细按营业流水和结算比例生成。只影响还款页，不改需求单状态。</p>' +
            '<button type="button" class="rbt-repay-demo__apply" id="rbtRepayDemoApply">应用并刷新</button>';
        document.body.appendChild(panel);
        document.getElementById('rbtRepayDemoApply').addEventListener('click', function () {
            var select = document.getElementById('rbtRepayDemoScene');
            var next = select ? select.value : current;
            try { localStorage.setItem(REPAY_DEMO_KEY, next); } catch (e) {}
            window.location.reload();
        });
    }

    mountRepayDemo();

    window.RbtH5StoreApp = { open: open, close: close };
})();
