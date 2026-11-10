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
        { code: 'SPB00001', name: '周末生鲜包', bizLine: '餐饮', skus: [{ code: 'SKU10001', salePrice: '56.80' }, { code: 'SKU10002', salePrice: '22.80' }] },
        { code: 'SPB00002', name: '肉类组合包', bizLine: '康美', skus: [{ code: 'SKU10003', salePrice: '78.00' }, { code: 'SKU10011', salePrice: '52.80' }] },
        { code: 'SPB00003', name: '果蔬尝鲜包', bizLine: '纯私域', skus: [{ code: 'SKU10005', salePrice: '18.50' }, { code: 'SKU10006', salePrice: '49.90' }, { code: 'SKU10010', salePrice: '9.90' }] }
    ];
    var SEED_BIZ_LINE = { SPB00001: '餐饮', SPB00002: '康美', SPB00003: '纯私域' };
    /* 主链路：待审核 → 待接单 → 待签署 → 待复核 → 支付中 → 已完成；旁路：已取消、已驳回 */
    var DEMAND_STATUSES = ['待审核', '待接单', '待签署', '待复核', '支付中', '已完成'];
    var ACTIVE_DEMAND_STATUSES = ['待审核', '待接单', '待签署', '待复核', '支付中'];
    var CANCELABLE_DEMAND_STATUSES = ['待审核', '待接单'];
    var CLOSED_DEMAND_STATUSES = ['已取消', '已驳回'];
    var STATUS_MIGRATE = {
        '已发布': '待审核',
        '待报价': '待审核',
        '已报价': '待接单',
        '待还款': '支付中'
    };

    var account = null;
    var screen = 'list';
    var packageCode = '';
    var pickedQty = {};
    var guarantors = [];
    var repayCycle = '';
    var repayMethod = '';
    var repayPeriod = '';
    var QTY_MAX = 999;
    var CYCLE_ORDER = ['日付'];
    var METHOD_ORDER = ['定额付', '比例付'];

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

    function storeBizLine() {
        if (!account) return '';
        var stores = window.RbtStoreData && window.RbtStoreData.list ? window.RbtStoreData.list() : [];
        var line = '';
        stores.some(function (store) {
            if (store.code === account.code) {
                line = store.bizLine || '';
                return true;
            }
            return false;
        });
        return line || account.bizLine || '';
    }

    function packages() {
        var list = readJson(PACKAGE_KEY);
        var source = list && list.length ? list : SEED_PACKAGES.slice();
        var filled = false;
        source.forEach(function (item) {
            if (item && !item.bizLine && SEED_BIZ_LINE[item.code]) {
                item.bizLine = SEED_BIZ_LINE[item.code];
                filled = true;
            }
        });
        if (filled && list && list.length) sessionStorage.setItem(PACKAGE_KEY, JSON.stringify(source));
        var line = storeBizLine();
        return source.filter(function (item) { return item.enabled !== false && item.bizLine === line; }).map(function (item) {
            return {
                code: item.code,
                name: item.name || item.code,
                bizLine: item.bizLine || '',
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

    function storeDemands() {
        if (!account) return [];
        return demands().filter(function (item) { return item.storeCode === account.code; });
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

    function storeAvailable(code) {
        var dataApi = window.RbtStoreData;
        if (!dataApi || typeof dataApi.get !== 'function' || typeof dataApi.quotaOf !== 'function') return 0;
        var store = dataApi.get(code);
        if (!store) return 0;
        return dataApi.quotaOf(store).available;
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
            code: 'FQ00001', name: '生鲜周转分期', repayCycle: '日付', periods: ['3', '6', '12'],
            periodRates: {
                '3': { store: '1.60', trader: '1.50' },
                '6': { store: '1.90', trader: '1.80' },
                '12': { store: '2.20', trader: '2.10' }
            }, repayMethod: '定额付',
            amountMin: '20.00', amountMax: '50000', packages: ['周末生鲜包']
        },
        {
            code: 'FQ00004', name: '生鲜周转比例付', repayCycle: '日付', periods: [],
            periodRatio: '10.00', storeRate: '1.70', repayMethod: '比例付',
            amountMin: '20.00', amountMax: '50000', packages: ['周末生鲜包']
        },
        {
            code: 'FQ00005', name: '生鲜周转日付', repayCycle: '日付', periods: ['7', '15', '30'],
            periodRates: {
                '7': { store: '1.30', trader: '1.20' },
                '15': { store: '1.45', trader: '1.35' },
                '30': { store: '1.60', trader: '1.50' }
            }, repayMethod: '定额付',
            amountMin: '20.00', amountMax: '50000', packages: ['周末生鲜包']
        },
        {
            code: 'FQ00002', name: '肉类备货分期', repayCycle: '日付', periods: [],
            periodRatio: '8.00', storeRate: '1.80', repayMethod: '比例付',
            amountMin: '50.00', amountMax: '100000', packages: ['肉类组合包']
        },
        {
            code: 'FQ00003', name: '果蔬短周期', repayCycle: '日付', periods: ['3'],
            periodRates: { '3': { store: '1.50', trader: '1.40' } }, repayMethod: '定额付',
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
        var repayMethod = item.repayMethod || '定额付';
        if (repayMethod === '定额还' || repayMethod === '等额本息') repayMethod = '定额付';
        if (repayMethod === '比例还' || repayMethod === '等额本金') repayMethod = '比例付';
        var periods = repayMethod === '比例付'
            ? orderedPeriods(item.periods || [])
            : orderedPeriods(item.periods && item.periods.length ? item.periods : ['3', '6', '12']);
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
                var cycle = item.repayCycle || '日付';
                if (cycle === '日还' || cycle === '周还' || cycle === '月还' || cycle === '年还') cycle = '日付';
                return cycle;
            })(),
            periods: periods,
            periodRates: filled,
            periodRatio: periodRatio == null || periodRatio === '' ? '' : String(periodRatio),
            storeRate: item.storeRate == null || item.storeRate === '' ? '' : String(item.storeRate),
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
            if (!next) return;
            item.amountMin = next;
            changed = true;
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
        if (!matched.length) return '商品未关联分期配置';
        var amount = sumLines(lines);
        var covered = matched.some(function (plan) { return amountInPlan(plan, amount); });
        if (!covered) return '售价不在分期配置的货款区间内';
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
        var ordered = METHOD_ORDER.filter(function (method) { return seen[method]; });
        Object.keys(seen).forEach(function (method) {
            if (ordered.indexOf(method) < 0) ordered.push(method);
        });
        return ordered;
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
            repayCycle = cycles.indexOf('日付') >= 0 ? '日付' : cycles[0];
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

    /* 货款总金额 = 商品售价合计 × 门店倍率。 */
    function payableAmount(principal, plan, period) {
        var P = Number(principal);
        if (!isFinite(P) || P <= 0) return null;
        return roundMoney(P * storeRateOf(plan, period));
    }

    /* 定额付预估每日结算货款：货款总金额（已含门店倍率）÷ 结算期数。 */
    function estimateDailyPay(principal, plan, period) {
        var n = Number(period);
        var total = payableAmount(principal, plan, period);
        if (!isFinite(n) || n < 1 || total == null) return null;
        return money(roundMoney(total / n));
    }

    /* 担保门店取带「担保门店」标签的准入门店，不含当前登录门店。一家担保可给多家门店担保，以可用额度为限。 */
    function guaranteeStores() {
        var dataApi = window.RbtStoreData;
        var tagApi = window.BusinessTagPrototypeStore;
        if (dataApi && typeof dataApi.ensureSeedTags === 'function') dataApi.ensureSeedTags();
        if (!dataApi || !tagApi || !account) return [];
        return dataApi.list().filter(function (store) {
            if (!store || store.enabled === false || store.code === account.code) return false;
            var tags = tagApi.tagsFor('RBT_STORE', store.code) || [];
            return tags.some(function (tag) { return tag.id === 'rbt-store-guarantee' || tag.name === '担保门店'; });
        });
    }

    function renderDemand(item, withCancel) {
        var names = (item.skus || []).map(skuQtyText).join('、') || '—';
        var guarantorNames = (item.guarantors || []).map(function (row) { return row.name; }).join('、') || '—';
        var cancel = withCancel && canCancelDemand(item)
            ? '<button type="button" class="rbt-h5-cancel" data-cancel="' + esc(item.code) + '">取消</button>'
            : '';
        var statusClass = item.status === '已完成'
            ? ' is-done'
            : (CLOSED_DEMAND_STATUSES.indexOf(item.status) >= 0 ? ' is-off' : '');
        return '<article class="rbt-h5-card">' +
            '<div class="rbt-h5-card__top"><h2>' + esc(item.code) + '</h2>' +
            '<span class="rbt-h5-status' + statusClass + '">' + esc(item.status) + '</span></div>' +
            '<p>商品包：' + esc(item.packageName) + '（' + esc(item.packageCode) + '）</p>' +
            '<p>商品：' + esc(names) + '</p>' +
            '<p>担保门店：' + esc(guarantorNames) + '</p>' +
            '<p>货款总金额：¥' + esc(item.amount) + '</p>' +
            (item.repayCycle
                ? '<p>结算周期：' + esc(item.repayCycle) + '</p>' +
                  '<p>结算方式：' + esc(item.repayMethod || '—') + '</p>' +
                  (item.repayMethod === '比例付'
                      ? '<p>结算比例：' + esc(item.repayPeriod || '—') + '</p>'
                      : '<p>结算期数：' + esc(item.repayPeriod || '—') + '期</p>' +
                        '<p>预估每日结算货款：¥' + esc(item.dailyAmount || item.firstAmount || '—') + '</p>')
                : '') +
            '<p>创建时间：' + esc(item.createdAt) + '</p>' +
            cancel +
            '</article>';
    }

    function render() {
        var scroll = document.getElementById('rbtH5Scroll');
        if (!scroll) return;
        var createBar = document.getElementById('rbtH5Create');
        if (createBar) createBar.hidden = screen !== 'list';
        if (screen === 'packages') {
            setHead('选择商品包');
            var choices = packages();
            scroll.innerHTML = '<div class="rbt-h5-bar"><button type="button" class="rbt-h5-back" data-back="list">返回</button></div>' +
                (choices.length ? choices.map(function (item) {
                    return '<button type="button" class="rbt-h5-card" data-package="' + esc(item.code) + '" style="display:block;width:100%;text-align:left;cursor:pointer;">' +
                        '<h2>' + esc(item.name) + '</h2><p>' + esc(item.code) + ' · ' + esc(item.bizLine) + ' · ' + item.skus.length + ' 个商品</p></button>';
                }).join('') : '<div class="rbt-h5-empty">暂无本事业线的商品包</div>');
            return;
        }
        if (screen === 'skus') {
            var pkg = findPackage(packageCode);
            setHead('勾选商品');
            if (!pkg) {
                scroll.innerHTML = '<div class="rbt-h5-bar"><button type="button" class="rbt-h5-back" data-back="packages">返回</button></div><div class="rbt-h5-empty">商品包不存在</div>';
                return;
            }
            var lines = selectedLines(pkg);
            var allOn = pkg.skus.length > 0 && lines.length === pkg.skus.length;
            var pieceCount = lines.reduce(function (total, line) { return total + line.qty; }, 0);
            scroll.innerHTML = '<div class="rbt-h5-bar"><button type="button" class="rbt-h5-back" data-back="packages">返回</button><span>' + esc(pkg.name) + '</span></div>' +
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
                '<p class="rbt-h5-section">担保门店</p>' +
                (function () {
                    var stores = guaranteeStores();
                    if (!stores.length) return '<div class="rbt-h5-empty">暂无可选担保门店</div>';
                    return stores.map(function (store) {
                        var on = guarantors.indexOf(store.code) >= 0;
                        var place = store.region || store.address || store.code;
                        return '<label class="rbt-h5-check"><input type="checkbox" data-guarantor="' + esc(store.code) + '" ' + (on ? 'checked' : '') + '>' +
                            '<span><strong>' + esc(store.name) + '</strong><span>' + esc(place) + '</span></span></label>';
                    }).join('');
                })() +
                '<button type="button" class="rbt-h5-primary rbt-h5-publish" data-next>下一步</button>';
            return;
        }
        if (screen === 'installment') {
            var instPkg = findPackage(packageCode);
            setHead('结算');
            if (!instPkg) {
                scroll.innerHTML = '<div class="rbt-h5-bar"><button type="button" class="rbt-h5-back" data-back="skus">返回</button></div><div class="rbt-h5-empty">商品包不存在</div>';
                return;
            }
            var instLines = selectedLines(instPkg);
            var instAmount = sumLines(instLines);
            var plans = matchedInstallments(instPkg, instAmount);
            if (!plans.length) {
                scroll.innerHTML = '<div class="rbt-h5-bar"><button type="button" class="rbt-h5-back" data-back="skus">返回</button></div>' +
                    '<div class="rbt-h5-empty">暂无匹配的分期配置</div>';
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
            var dailyAmount = !isRatio && currentPlan && repayPeriod
                ? estimateDailyPay(instAmount, currentPlan, repayPeriod)
                : null;
            var periodLabel = periodsFieldLabel(repayMethod);
            var periodRow = isRatio
                ? '<div class="rbt-h5-inst__row"><span class="rbt-h5-inst__label">' + esc(periodLabel) +
                  '<span class="rbt-h5-help-wrap">' +
                  '<button type="button" class="rbt-h5-help" data-ratio-help aria-label="结算比例说明" aria-expanded="false">?</button>' +
                  '<span class="rbt-h5-help-tip" role="tooltip" hidden>根据每日经营流水总额，抽取固定比例用于支付货款</span>' +
                  '</span></span>' +
                  '<span class="rbt-h5-inst__amount">' + esc(periodRatioText(currentPlan)) + '</span></div>'
                : (periods.length
                    ? '<div class="rbt-h5-inst__row"><span class="rbt-h5-inst__label">' + esc(periodLabel) + '</span>' +
                      '<div class="rbt-h5-inst__chips">' + periods.map(function (period) {
                          return '<button type="button" class="rbt-h5-chip' + (String(period) === String(repayPeriod) ? ' is-on' : '') + '" data-period="' + esc(period) + '">' + esc(period) + '期</button>';
                      }).join('') + '</div></div>'
                    : '');
            scroll.innerHTML = '<div class="rbt-h5-bar"><button type="button" class="rbt-h5-back" data-back="skus">返回</button><span>' + esc(instPkg.name) + '</span></div>' +
                '<section class="rbt-h5-inst">' +
                '<div class="rbt-h5-inst__row"><span class="rbt-h5-inst__label">货款总金额</span>' +
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
                (dailyAmount
                    ? '<div class="rbt-h5-inst__estimate">预估每日结算货款 <b>¥ ' + esc(dailyAmount) + '</b></div>'
                    : '') +
                '<button type="button" class="rbt-h5-primary rbt-h5-publish" style="margin-top:16px;" data-publish>发布</button>';
            return;
        }
        setHead('需求列表');
        var rows = storeDemands();
        scroll.innerHTML = rows.length
            ? rows.map(function (item) { return renderDemand(item, true); }).join('')
            : '<div class="rbt-h5-empty">暂无需求</div>';
    }

    function open(next) {
        account = next;
        screen = 'list';
        packageCode = '';
        clearPicked();
        guarantors = [];
        clearInstallmentChoice();
        render();
    }

    function close() {
        account = null;
        var scroll = document.getElementById('rbtH5Scroll');
        if (scroll) scroll.innerHTML = '';
        var createBar = document.getElementById('rbtH5Create');
        if (createBar) createBar.hidden = true;
    }

    document.getElementById('rbtH5App').addEventListener('click', function (event) {
        var create = event.target.closest('[data-create]');
        var back = event.target.closest('[data-back]');
        var pkgButton = event.target.closest('[data-package]');
        var cancel = event.target.closest('[data-cancel]');
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
        if (create) {
            if (blockNoAvailableQuota()) return;
            screen = 'packages';
            packageCode = '';
            clearPicked();
            guarantors = [];
            clearInstallmentChoice();
            render();
            return;
        }
        if (back) {
            screen = back.getAttribute('data-back');
            if (screen === 'packages') {
                clearPicked();
                guarantors = [];
                clearInstallmentChoice();
            }
            if (screen === 'skus') clearInstallmentChoice();
            render();
            return;
        }
        if (pkgButton) {
            packageCode = pkgButton.getAttribute('data-package');
            clearPicked();
            guarantors = [];
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
            var nextChosen = guaranteeStores().filter(function (store) { return guarantors.indexOf(store.code) >= 0; });
            if (!nextChosen.length) {
                toast('请选择担保门店');
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
                window.RbtDemandData.setStatus(code, '已取消', cancelBy);
            } else {
                target.status = '已取消';
                target.updater = cancelBy;
                target.updatedAt = nowText();
                releaseDemandQuota(target);
                saveDemands(list);
            }
            toast('需求已取消');
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
            var chosen = guaranteeStores().filter(function (store) { return guarantors.indexOf(store.code) >= 0; });
            if (!chosen.length) {
                toast('请选择担保门店');
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
            if (isRatioPay && (!publishPlan.periodRatio || !isFinite(Number(publishPlan.periodRatio)))) {
                toast('结算比例无效');
                return;
            }
            var publishPayable = payableAmount(amountValue, publishPlan, isRatioPay ? '' : repayPeriod);
            var publishDaily = isRatioPay ? null : estimateDailyPay(amountValue, publishPlan, repayPeriod);
            if (publishPayable == null) {
                toast('货款总金额计算失败');
                return;
            }
            if (!isRatioPay && !publishDaily) {
                toast('预估每日结算货款计算失败');
                return;
            }
            var quota = accountQuota();
            var available = quota ? quota.available : 0;
            if (cents(publishPayable) > cents(available)) {
                toast('货款总金额须小于等于可用额度');
                return;
            }
            var shortGuarantor = null;
            chosen.some(function (store) {
                if (cents(publishPayable) > cents(storeAvailable(store.code))) {
                    shortGuarantor = store;
                    return true;
                }
                return false;
            });
            if (shortGuarantor) {
                toast(shortGuarantor.name + '可用额度不足，无法作为担保门店');
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
                guarantors: chosen.map(function (store) { return { code: store.code, name: store.name }; }),
                amount: money(publishPayable),
                installmentCode: publishPlan.code,
                installmentName: publishPlan.name,
                repayCycle: publishPlan.repayCycle,
                repayMethod: publishPlan.repayMethod,
                repayPeriod: isRatioPay ? periodRatioText(publishPlan) : String(repayPeriod),
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
            guarantors = [];
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
        var guarantorBox = event.target.closest('[data-guarantor]');
        if (guarantorBox) {
            var gcode = guarantorBox.getAttribute('data-guarantor');
            if (guarantorBox.checked) {
                if (guarantors.indexOf(gcode) < 0) guarantors.push(gcode);
            } else {
                guarantors = guarantors.filter(function (code) { return code !== gcode; });
            }
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

    window.RbtH5StoreApp = { open: open, close: close };
})();
