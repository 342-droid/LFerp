/* 门店端登录后：选择商品包、勾选 SKU 并改数量、发布资金需求。需求按门店隔离。 */
(function () {
    var PACKAGE_KEY = 'rbf_product_package_v1';
    var DEMAND_KEY = 'rbf_h5_fund_demand_v1';
    var INSTALLMENT_KEY = 'rbf_installment_v3';
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
    var DEMAND_STATUSES = ['待报价', '已报价', '待签署', '待还款', '已完成'];
    var ACTIVE_DEMAND_STATUSES = ['待报价', '已报价', '待签署', '待还款'];

    var account = null;
    var tab = 'demands';
    var screen = 'list';
    var packageCode = '';
    var pickedQty = {};
    var guarantors = [];
    var repayCycle = '';
    var repayPeriod = '';
    var QTY_MAX = 999;
    var CYCLE_ORDER = ['日还', '周还', '月还', '年还'];

    function toast(message) {
        var node = document.getElementById('rbfH5Toast');
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
        var stores = window.RbfStoreData && window.RbfStoreData.list ? window.RbfStoreData.list() : [];
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

    function demands() {
        var list = readJson(DEMAND_KEY) || [];
        var changed = false;
        list.forEach(function (item) {
            if (!item) return;
            if (item.status === '已发布' || (DEMAND_STATUSES.indexOf(item.status) < 0 && item.status !== '已取消')) {
                item.status = '待报价';
                changed = true;
            }
        });
        if (changed) saveDemands(list);
        return list;
    }

    function saveDemands(list) {
        sessionStorage.setItem(DEMAND_KEY, JSON.stringify(list));
    }

    function storeDemands() {
        if (!account) return [];
        return demands().filter(function (item) { return item.storeCode === account.code; });
    }

    /* 待报价、已报价、待签署、待还款为有效需求，同一时间只能有一条。已完成、已取消后可再发布。 */
    function hasValidDemand() {
        return storeDemands().some(isActiveDemand);
    }

    function blockDuplicateDemand() {
        if (!hasValidDemand()) return false;
        toast('同一时间仅允许存在一条有效的资金需求');
        return true;
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
        var head = document.getElementById('rbfH5HeadText');
        var name = document.querySelector('.rbf-h5-phone__head h1');
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
            code: 'FQ00001', name: '生鲜周转分期', repayCycle: '月还', periods: ['3', '6', '12'],
            periodRates: { '3': '0.60', '6': '0.90', '12': '1.20' }, repayMethod: '等额本息',
            amountMin: '20.00', amountMax: '50000', packages: ['周末生鲜包']
        },
        {
            code: 'FQ00004', name: '生鲜周转周还', repayCycle: '周还', periods: ['4', '8', '12'],
            periodRates: { '4': '0.40', '8': '0.70', '12': '1.00' }, repayMethod: '等额本息',
            amountMin: '20.00', amountMax: '50000', packages: ['周末生鲜包']
        },
        {
            code: 'FQ00005', name: '生鲜周转日还', repayCycle: '日还', periods: ['7', '15', '30'],
            periodRates: { '7': '0.30', '15': '0.45', '30': '0.60' }, repayMethod: '等额本息',
            amountMin: '20.00', amountMax: '50000', packages: ['周末生鲜包']
        },
        {
            code: 'FQ00002', name: '肉类备货分期', repayCycle: '周还', periods: ['6', '12'],
            periodRates: { '6': '0.80', '12': '1.50' }, repayMethod: '等额本金',
            amountMin: '50.00', amountMax: '100000', packages: ['肉类组合包']
        },
        {
            code: 'FQ00003', name: '果蔬短周期', repayCycle: '日还', periods: ['3'],
            periodRates: { '3': '0.50' }, repayMethod: '等额本金',
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
        var periods = orderedPeriods(item.periods && item.periods.length ? item.periods : ['3', '6', '12']);
        var rates = item.periodRates && typeof item.periodRates === 'object' ? item.periodRates : {};
        var filled = {};
        periods.forEach(function (period) {
            var rate = rates[period];
            if (rate && typeof rate === 'object' && !Array.isArray(rate)) {
                rate = rate.store != null && rate.store !== '' ? rate.store : rate.trader;
            }
            filled[period] = rate == null || rate === '' ? '1.00' : String(rate);
        });
        return {
            code: item.code || '',
            name: item.name || item.code || '',
            repayCycle: item.repayCycle || '月还',
            periods: periods,
            periodRates: filled,
            repayMethod: item.repayMethod || '等额本息',
            amountMin: item.amountMin,
            amountMax: item.amountMax,
            packages: Array.isArray(item.packages) ? item.packages.slice() : []
        };
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

    /* 所选商品包需已配置启用的分期，且所选商品售价合计落在其中一条分期的金额区间内。 */
    function publishInstallmentError(pkg, lines) {
        var matched = enabledInstallments().filter(function (plan) {
            return installmentCoversPackage(plan, pkg);
        });
        if (!matched.length) return '商品未关联分期配置';
        var amount = sumLines(lines);
        var covered = matched.some(function (plan) { return amountInPlan(plan, amount); });
        if (!covered) return '售价不在分期配置的金额区间内';
        return '';
    }

    function clearInstallmentChoice() {
        repayCycle = '';
        repayPeriod = '';
        closePlanSheet();
    }

    function availableCycles(plans) {
        var seen = {};
        plans.forEach(function (plan) {
            if (plan.repayCycle) seen[plan.repayCycle] = true;
        });
        return CYCLE_ORDER.filter(function (cycle) { return seen[cycle]; });
    }

    function planByCycle(plans, cycle) {
        var found = null;
        plans.some(function (plan) {
            if (plan.repayCycle === cycle) {
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
            repayCycle = cycles.indexOf('月还') >= 0 ? '月还' : cycles[0];
        }
        var plan = planByCycle(plans, repayCycle);
        var periods = plan ? plan.periods : [];
        if (!periods.length) {
            repayPeriod = '';
            return plan;
        }
        if (periods.indexOf(String(repayPeriod)) < 0) repayPeriod = periods[0];
        return plan;
    }

    function cycleUnit(cycle) {
        if (cycle === '日还') return '日';
        if (cycle === '周还') return '周';
        if (cycle === '年还') return '年';
        return '月';
    }

    function startOfDay(date) {
        var d = new Date(date.getTime());
        d.setHours(0, 0, 0, 0);
        return d;
    }

    function formatDate(date) {
        return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
    }

    /* 两个日期之间的日历天数；至少按 1 天计息。 */
    function daysBetween(from, to) {
        var ms = startOfDay(to).getTime() - startOfDay(from).getTime();
        var days = Math.round(ms / 86400000);
        return days > 0 ? days : 1;
    }

    function scheduleStartDate(cycle) {
        var d = startOfDay(new Date());
        if (cycle === '日还') {
            d.setDate(d.getDate() + 1);
            return d;
        }
        if (cycle === '周还') {
            d.setDate(d.getDate() + 7);
            return d;
        }
        if (cycle === '年还') {
            d.setFullYear(d.getFullYear() + 1);
            d.setMonth(0, 20);
            return d;
        }
        d.setMonth(d.getMonth() + 1, 20);
        return d;
    }

    function dueDateByIndex(start, cycle, index) {
        var d = new Date(start.getTime());
        if (cycle === '日还') d.setDate(d.getDate() + index);
        else if (cycle === '周还') d.setDate(d.getDate() + index * 7);
        else if (cycle === '年还') d.setFullYear(d.getFullYear() + index);
        else d.setMonth(d.getMonth() + index);
        return startOfDay(d);
    }

    function roundMoney(value) {
        return Math.round(Number(value) * 100) / 100;
    }

    function cyclePerYear(cycle) {
        if (cycle === '日还') return 365;
        if (cycle === '周还') return 52;
        if (cycle === '年还') return 1;
        return 12;
    }

    function annualRateText(plan, period) {
        var raw = Number((plan.periodRates || {})[String(period)] || 0);
        if (!isFinite(raw) || raw < 0) raw = 0;
        return raw.toFixed(2);
    }

    /* 按日计息：利息 = 剩余本金 × 年化率 × 实际天数 / 365。 */
    function interestByDays(balance, annualPct, days) {
        return roundMoney(Number(balance) * Number(annualPct) / 100 * Number(days) / 365);
    }

    /* 按还款方式生成还款计划。首期从放款日计至首期还款日，按实际天数计息；后续各期按上一还款日到本期还款日的实际天数计息。 */
    function buildRepayPlan(principal, plan, period) {
        var n = Number(period);
        var P = roundMoney(principal);
        var annualPct = Number((plan.periodRates || {})[String(period)] || 0);
        if (!isFinite(annualPct) || annualPct < 0) annualPct = 0;
        var periodRate = annualPct / 100 / cyclePerYear(plan.repayCycle);
        if (!isFinite(n) || n < 1 || !isFinite(P) || P <= 0) return null;
        if (!isFinite(periodRate) || periodRate < 0) periodRate = 0;

        var lendDate = startOfDay(new Date());
        var firstDue = scheduleStartDate(plan.repayCycle);
        var dues = [];
        var i;
        for (i = 0; i < n; i++) dues.push(dueDateByIndex(firstDue, plan.repayCycle, i));

        var rows = [];
        var totalInterest = 0;
        var remaining = P;
        var prevDate = lendDate;

        if (plan.repayMethod === '等额本金') {
            var principalEach = roundMoney(P / n);
            for (i = 0; i < n; i++) {
                var days = daysBetween(prevDate, dues[i]);
                var interest = interestByDays(remaining, annualPct, days);
                var principalPart = i === n - 1 ? roundMoney(remaining) : principalEach;
                if (principalPart > remaining) principalPart = roundMoney(remaining);
                var amount = roundMoney(principalPart + interest);
                remaining = roundMoney(remaining - principalPart);
                totalInterest = roundMoney(totalInterest + interest);
                rows.push({
                    index: i + 1,
                    date: formatDate(dues[i]),
                    days: days,
                    amount: money(amount),
                    principal: money(principalPart),
                    interest: money(interest)
                });
                prevDate = dues[i];
            }
        } else {
            var payment;
            if (periodRate === 0) payment = roundMoney(P / n);
            else {
                var factor = Math.pow(1 + periodRate, n);
                payment = roundMoney(P * periodRate * factor / (factor - 1));
            }
            for (i = 0; i < n; i++) {
                var daysEq = daysBetween(prevDate, dues[i]);
                var interestPart = interestByDays(remaining, annualPct, daysEq);
                var principalPay;
                var payAmount;
                if (i === n - 1) {
                    principalPay = roundMoney(remaining);
                    payAmount = roundMoney(principalPay + interestPart);
                } else {
                    principalPay = roundMoney(payment - interestPart);
                    if (principalPay < 0) principalPay = 0;
                    if (principalPay > remaining) principalPay = roundMoney(remaining);
                    payAmount = roundMoney(principalPay + interestPart);
                }
                remaining = roundMoney(remaining - principalPay);
                totalInterest = roundMoney(totalInterest + interestPart);
                rows.push({
                    index: i + 1,
                    date: formatDate(dues[i]),
                    days: daysEq,
                    amount: money(payAmount),
                    principal: money(principalPay),
                    interest: money(interestPart)
                });
                prevDate = dues[i];
            }
        }

        return {
            principal: money(P),
            totalInterest: money(totalInterest),
            total: money(roundMoney(P + totalInterest)),
            method: plan.repayMethod === '等额本金' ? '等额本金' : '等额本息',
            annualRate: annualRateText(plan, period),
            lendDate: formatDate(lendDate),
            firstDays: rows[0] ? rows[0].days : 0,
            period: String(period),
            cycle: plan.repayCycle,
            unit: cycleUnit(plan.repayCycle),
            rows: rows
        };
    }

    function closePlanSheet() {
        var sheet = document.getElementById('rbfH5Sheet');
        if (!sheet) return;
        sheet.classList.remove('is-on');
        sheet.setAttribute('aria-hidden', 'true');
    }

    function openPlanSheet(schedule) {
        var sheet = document.getElementById('rbfH5Sheet');
        var body = document.getElementById('rbfH5SheetBody');
        if (!sheet || !body || !schedule) return;
        body.innerHTML =
            '<section class="rbf-h5-sheet__card">' +
            '<div class="rbf-h5-sheet__total">¥ ' + esc(schedule.total) + '</div>' +
            '<div class="rbf-h5-sheet__sub">含本金 <b>¥ ' + esc(schedule.principal) + '</b></div>' +
            '<div class="rbf-h5-sheet__sub">利息 <b>¥ ' + esc(schedule.totalInterest) + '</b></div>' +
            '<div class="rbf-h5-sheet__method">年化率 <b>' + esc(schedule.annualRate) + '%</b></div>' +
            '<div class="rbf-h5-sheet__method">还款方式 <b>' + esc(schedule.method) + '</b></div>' +
            '<div class="rbf-h5-sheet__sub">放款日 ' + esc(schedule.lendDate) +
            '，首期按实际 ' + esc(schedule.firstDays) + ' 天计息</div>' +
            '</section>' +
            '<section class="rbf-h5-sheet__card">' +
            '<div class="rbf-h5-sheet__meta"><span>共' + esc(schedule.period) + '期</span>' +
            '<span>每' + esc(schedule.unit) + '还款金额(本金+利息)</span></div>' +
            schedule.rows.map(function (row) {
                return '<div class="rbf-h5-sheet__item">' +
                    '<div class="rbf-h5-sheet__item-top"><span>' + row.index + ' ' + esc(row.date) + '</span>' +
                    '<span>¥ ' + esc(row.amount) + '</span></div>' +
                    '<div class="rbf-h5-sheet__item-sub">含本金 ¥ ' + esc(row.principal) +
                    '  利息 ¥ ' + esc(row.interest) +
                    '  计息 ' + esc(row.days) + ' 天</div>' +
                    '</div>';
            }).join('') +
            '</section>';
        sheet.classList.add('is-on');
        sheet.setAttribute('aria-hidden', 'false');
    }

    /* 担保门店取带「担保门店」标签的准入门店，不含当前登录门店。一家担保门店只能担保一家门店。 */
    function guaranteeStores() {
        var dataApi = window.RbfStoreData;
        var tagApi = window.BusinessTagPrototypeStore;
        if (dataApi && typeof dataApi.ensureSeedTags === 'function') dataApi.ensureSeedTags();
        if (!dataApi || !tagApi || !account) return [];
        return dataApi.list().filter(function (store) {
            if (!store || store.enabled === false || store.code === account.code) return false;
            var tags = tagApi.tagsFor('RBF_STORE', store.code) || [];
            return tags.some(function (tag) { return tag.id === 'rbf-store-guarantee' || tag.name === '担保门店'; });
        });
    }

    function guarantorUsedByOther(code) {
        var used = false;
        demands().some(function (item) {
            if (!isActiveDemand(item) || item.storeCode === account.code) return false;
            var hit = (item.guarantors || []).some(function (row) { return row.code === code; });
            if (hit) used = true;
            return hit;
        });
        return used;
    }

    function renderDemand(item, withCancel) {
        var names = (item.skus || []).map(skuQtyText).join('、') || '—';
        var guarantorNames = (item.guarantors || []).map(function (row) { return row.name; }).join('、') || '—';
        var cancel = withCancel && isActiveDemand(item)
            ? '<button type="button" class="rbf-h5-cancel" data-cancel="' + esc(item.code) + '">取消</button>'
            : '';
        var statusClass = item.status === '已完成' ? ' is-done' : (item.status === '已取消' ? ' is-off' : '');
        return '<article class="rbf-h5-card">' +
            '<div class="rbf-h5-card__top"><h2>' + esc(item.code) + '</h2>' +
            '<span class="rbf-h5-status' + statusClass + '">' + esc(item.status) + '</span></div>' +
            '<p>商品包：' + esc(item.packageName) + '（' + esc(item.packageCode) + '）</p>' +
            '<p>商品：' + esc(names) + '</p>' +
            '<p>担保门店：' + esc(guarantorNames) + '</p>' +
            '<p>需求金额：¥' + esc(item.amount) + '</p>' +
            (item.repayCycle
                ? '<p>还款周期：' + esc(item.repayCycle) + ' · ' + esc(item.repayPeriod) + '期 · ' + esc(item.repayMethod || '') + '</p>' +
                  '<p>年化率：' + esc(item.annualRate || '—') + '%</p>' +
                  '<p>首期还款：¥' + esc(item.firstAmount || '—') + '</p>'
                : '') +
            '<p>发布时间：' + esc(item.createdAt) + '</p>' +
            cancel +
            '</article>';
    }

    function render() {
        var scroll = document.getElementById('rbfH5Scroll');
        var buttons = document.querySelectorAll('#rbfH5Tabbar button');
        if (!scroll) return;
        var createBar = document.getElementById('rbfH5Create');
        if (createBar) createBar.hidden = !(tab === 'demands' && screen === 'list');
        buttons.forEach(function (button) {
            button.classList.toggle('is-on', button.getAttribute('data-tab') === tab);
        });
        if (tab === 'mine') {
            setHead(screen === 'password' ? '修改密码' : '我的');
            if (screen === 'password') {
                scroll.innerHTML =
                    '<div class="rbf-h5-bar"><button type="button" class="rbf-h5-back" data-back="mine">返回</button></div>' +
                    '<section class="rbf-h5-card rbf-h5-mine">' +
                    '<div class="rbf-h5-field"><label for="rbfH5OldPwd">原密码</label><input id="rbfH5OldPwd" type="password" maxlength="32" placeholder="请输入原密码"></div>' +
                    '<div class="rbf-h5-field"><label for="rbfH5NewPwd">新密码</label><input id="rbfH5NewPwd" type="password" maxlength="32" placeholder="请输入新密码"></div>' +
                    '<div class="rbf-h5-field"><label for="rbfH5ConfirmPwd">确认新密码</label><input id="rbfH5ConfirmPwd" type="password" maxlength="32" placeholder="请再次输入新密码"></div>' +
                    '<p class="rbf-h5-tip">新密码至少 6 位。演示默认密码 123456。</p>' +
                    '<button type="button" class="rbf-h5-primary rbf-h5-publish" data-save-password>保存</button>' +
                    '</section>';
                return;
            }
            scroll.innerHTML = '<section class="rbf-h5-card rbf-h5-mine"><h2>' + esc(account.name) + '</h2>' +
                '<p>门店编码：' + esc(account.code) + '\n登录身份：' + esc((account.roles || []).join('、')) +
                '\n手机号：' + esc(account.phone) + '</p>' +
                '<button type="button" class="rbf-h5-action" data-change-password>修改密码</button>' +
                '<button type="button" class="rbf-h5-logout" data-logout>切换门店</button></section>';
            return;
        }
        if (tab === 'plans') {
            setHead('还款计划');
            var plans = storeDemands().filter(function (item) { return item.status !== '已取消'; });
            scroll.innerHTML = plans.length
                ? plans.map(function (item) { return renderDemand(item, false); }).join('')
                : '<div class="rbf-h5-empty">暂无还款计划</div>';
            return;
        }
        if (screen === 'packages') {
            setHead('选择商品包');
            var choices = packages();
            scroll.innerHTML = '<div class="rbf-h5-bar"><button type="button" class="rbf-h5-back" data-back="list">返回</button></div>' +
                (choices.length ? choices.map(function (item) {
                    return '<button type="button" class="rbf-h5-card" data-package="' + esc(item.code) + '" style="display:block;width:100%;text-align:left;cursor:pointer;">' +
                        '<h2>' + esc(item.name) + '</h2><p>' + esc(item.code) + ' · ' + esc(item.bizLine) + ' · ' + item.skus.length + ' 个商品</p></button>';
                }).join('') : '<div class="rbf-h5-empty">暂无本事业线的商品包</div>');
            return;
        }
        if (screen === 'skus') {
            var pkg = findPackage(packageCode);
            setHead('勾选商品');
            if (!pkg) {
                scroll.innerHTML = '<div class="rbf-h5-bar"><button type="button" class="rbf-h5-back" data-back="packages">返回</button></div><div class="rbf-h5-empty">商品包不存在</div>';
                return;
            }
            var lines = selectedLines(pkg);
            var allOn = pkg.skus.length > 0 && lines.length === pkg.skus.length;
            var pieceCount = lines.reduce(function (total, line) { return total + line.qty; }, 0);
            scroll.innerHTML = '<div class="rbf-h5-bar"><button type="button" class="rbf-h5-back" data-back="packages">返回</button><span>' + esc(pkg.name) + '</span></div>' +
                (pkg.skus.length
                    ? '<label class="rbf-h5-check"><input type="checkbox" data-all ' + (allOn ? 'checked' : '') + '><span><strong>全选</strong><span>共 ' + pkg.skus.length + ' 个商品</span></span></label>' +
                        pkg.skus.map(function (line) {
                            var on = isPicked(line.code);
                            var qty = on ? qtyOf(line.code) : 1;
                            var lineAmount = money(Number(line.salePrice) * qty);
                            var image = line.image
                                ? '<img class="rbf-h5-sku__img" src="' + esc(line.image) + '" alt="' + esc(line.name) + '">'
                                : '<span class="rbf-h5-sku__img rbf-h5-sku__img--empty">暂无图片</span>';
                            var foot = on
                                ? '<span class="rbf-h5-sku__foot"><span class="rbf-h5-sku__price">售价 ¥' + esc(lineAmount) + '</span>' +
                                    '<div class="rbf-h5-qty" data-qty-box="' + esc(line.code) + '">' +
                                    '<button type="button" data-qty-minus="' + esc(line.code) + '" aria-label="减少数量">−</button>' +
                                    '<input type="number" inputmode="numeric" min="1" max="' + QTY_MAX + '" value="' + qty + '" data-qty-input="' + esc(line.code) + '" aria-label="数量">' +
                                    '<button type="button" data-qty-plus="' + esc(line.code) + '" ' + (qty >= QTY_MAX ? 'disabled ' : '') + 'aria-label="增加数量">+</button>' +
                                    '</div></span>'
                                : '';
                            return '<div class="rbf-h5-check rbf-h5-sku">' +
                                '<input type="checkbox" data-sku="' + esc(line.code) + '" ' + (on ? 'checked' : '') + '>' +
                                image +
                                '<span class="rbf-h5-sku__body"><strong>' + esc(line.name) + '</strong>' +
                                '<span>商品条码 ' + esc(line.barcode) + '</span>' +
                                '<span>商品单位 ' + esc(line.unit) + '</span>' +
                                '<span>商品规格 ' + esc(line.spec) + '</span>' +
                                '<span class="rbf-h5-sku__unit">单价 ¥' + esc(line.salePrice) + '</span>' +
                                foot + '</span></div>';
                        }).join('')
                    : '<div class="rbf-h5-empty">该商品包暂无商品</div>') +
                '<p class="rbf-h5-sum">已选 ' + lines.length + ' 种共 ' + pieceCount + ' 件，需求金额 <b>¥' + money(sumLines(lines)) + '</b></p>' +
                '<p class="rbf-h5-section">担保门店</p>' +
                (function () {
                    var stores = guaranteeStores();
                    if (!stores.length) return '<div class="rbf-h5-empty">暂无可选担保门店</div>';
                    return stores.map(function (store) {
                        var on = guarantors.indexOf(store.code) >= 0;
                        return '<label class="rbf-h5-check"><input type="checkbox" data-guarantor="' + esc(store.code) + '" ' + (on ? 'checked' : '') + '>' +
                            '<span><strong>' + esc(store.name) + '</strong><span>' + esc(store.code) + '</span></span></label>';
                    }).join('');
                })() +
                '<button type="button" class="rbf-h5-primary rbf-h5-publish" data-next>下一步</button>';
            return;
        }
        if (screen === 'installment') {
            var instPkg = findPackage(packageCode);
            setHead('分期还款');
            if (!instPkg) {
                scroll.innerHTML = '<div class="rbf-h5-bar"><button type="button" class="rbf-h5-back" data-back="skus">返回</button></div><div class="rbf-h5-empty">商品包不存在</div>';
                return;
            }
            var instLines = selectedLines(instPkg);
            var instAmount = sumLines(instLines);
            var plans = matchedInstallments(instPkg, instAmount);
            if (!plans.length) {
                scroll.innerHTML = '<div class="rbf-h5-bar"><button type="button" class="rbf-h5-back" data-back="skus">返回</button></div>' +
                    '<div class="rbf-h5-empty">暂无匹配的分期配置</div>';
                return;
            }
            var currentPlan = ensureInstallmentChoice(plans);
            var cycles = availableCycles(plans);
            var periods = currentPlan ? currentPlan.periods : [];
            var schedule = currentPlan && repayPeriod ? buildRepayPlan(instAmount, currentPlan, repayPeriod) : null;
            var firstAmount = schedule && schedule.rows[0] ? schedule.rows[0].amount : '—';
            scroll.innerHTML = '<div class="rbf-h5-bar"><button type="button" class="rbf-h5-back" data-back="skus">返回</button><span>' + esc(instPkg.name) + '</span></div>' +
                '<section class="rbf-h5-inst">' +
                '<div class="rbf-h5-inst__row"><span class="rbf-h5-inst__label">分期金额</span>' +
                '<span class="rbf-h5-inst__amount">¥ ' + money(instAmount) + '</span></div>' +
                '<div class="rbf-h5-inst__row"><span class="rbf-h5-inst__label">还款周期</span>' +
                '<div class="rbf-h5-inst__chips">' + cycles.map(function (cycle) {
                    return '<button type="button" class="rbf-h5-chip' + (cycle === repayCycle ? ' is-on' : '') + '" data-cycle="' + esc(cycle) + '">' + esc(cycle) + '</button>';
                }).join('') + '</div></div>' +
                (periods.length
                    ? '<div class="rbf-h5-inst__row"><span class="rbf-h5-inst__label">分期期数</span>' +
                      '<div class="rbf-h5-inst__chips">' + periods.map(function (period) {
                          return '<button type="button" class="rbf-h5-chip' + (String(period) === String(repayPeriod) ? ' is-on' : '') + '" data-period="' + esc(period) + '">' + esc(period) + '期</button>';
                      }).join('') + '</div></div>'
                    : '') +
                '</section>' +
                (schedule
                    ? '<button type="button" class="rbf-h5-inst__link" data-open-plan>首期还 ¥ ' + esc(firstAmount) + '<span>查看还款计划 ›</span></button>'
                    : '') +
                '<button type="button" class="rbf-h5-primary rbf-h5-publish" style="margin-top:16px;" data-publish>发布</button>';
            return;
        }
        setHead('需求列表');
        var rows = storeDemands();
        scroll.innerHTML = rows.length
            ? rows.map(function (item) { return renderDemand(item, true); }).join('')
            : '<div class="rbf-h5-empty">暂无资金需求</div>';
    }

    function open(next) {
        account = next;
        tab = 'demands';
        screen = 'list';
        packageCode = '';
        clearPicked();
        guarantors = [];
        clearInstallmentChoice();
        render();
    }

    function close() {
        account = null;
        closePlanSheet();
        var scroll = document.getElementById('rbfH5Scroll');
        if (scroll) scroll.innerHTML = '';
        var createBar = document.getElementById('rbfH5Create');
        if (createBar) createBar.hidden = true;
    }

    document.getElementById('rbfH5Tabbar').addEventListener('click', function (event) {
        var button = event.target.closest('[data-tab]');
        if (!button || !account) return;
        tab = button.getAttribute('data-tab');
        if (tab === 'demands') screen = 'list';
        else if (tab !== 'mine') screen = 'list';
        else if (screen !== 'password') screen = 'mine';
        closePlanSheet();
        render();
    });

    document.getElementById('rbfH5App').addEventListener('click', function (event) {
        var create = event.target.closest('[data-create]');
        var back = event.target.closest('[data-back]');
        var pkgButton = event.target.closest('[data-package]');
        var cancel = event.target.closest('[data-cancel]');
        var nextStep = event.target.closest('[data-next]');
        var publish = event.target.closest('[data-publish]');
        var cycleBtn = event.target.closest('[data-cycle]');
        var periodBtn = event.target.closest('[data-period]');
        var openPlan = event.target.closest('[data-open-plan]');
        var logout = event.target.closest('[data-logout]');
        var changePassword = event.target.closest('[data-change-password]');
        var savePassword = event.target.closest('[data-save-password]');
        if (changePassword) {
            screen = 'password';
            render();
            return;
        }
        if (savePassword) {
            var oldPassword = String((document.getElementById('rbfH5OldPwd') || {}).value || '');
            var nextPassword = String((document.getElementById('rbfH5NewPwd') || {}).value || '');
            var confirmPassword = String((document.getElementById('rbfH5ConfirmPwd') || {}).value || '');
            if (window.RbfH5StoreLogin && window.RbfH5StoreLogin.changePassword(account.phone, oldPassword, nextPassword, confirmPassword)) {
                screen = 'mine';
                render();
            }
            return;
        }
        if (create) {
            if (blockDuplicateDemand()) return;
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
            if (screen === 'mine') tab = 'mine';
            closePlanSheet();
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
            repayPeriod = '';
            closePlanSheet();
            render();
            return;
        }
        if (periodBtn) {
            repayPeriod = periodBtn.getAttribute('data-period') || '';
            closePlanSheet();
            render();
            return;
        }
        if (openPlan) {
            var planPkg = findPackage(packageCode);
            var planLines = planPkg ? selectedLines(planPkg) : [];
            var planAmount = sumLines(planLines);
            var planList = planPkg ? matchedInstallments(planPkg, planAmount) : [];
            var selectedPlan = ensureInstallmentChoice(planList);
            var schedule = selectedPlan && repayPeriod ? buildRepayPlan(planAmount, selectedPlan, repayPeriod) : null;
            if (!schedule) {
                toast('请选择还款周期和期数');
                return;
            }
            openPlanSheet(schedule);
            return;
        }
        if (nextStep) {
            if (blockDuplicateDemand()) return;
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
            var nextBlocked = null;
            nextChosen.some(function (store) {
                if (guarantorUsedByOther(store.code)) {
                    nextBlocked = store;
                    return true;
                }
                return false;
            });
            if (nextBlocked) {
                guarantors = guarantors.filter(function (code) { return code !== nextBlocked.code; });
                toast(nextBlocked.name + '门店已担保其他门店，请重新选择！');
                render();
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
        var skuCard = event.target.closest('.rbf-h5-sku');
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
            list.forEach(function (item) {
                if (item.code === code && item.storeCode === account.code && item.status !== '已取消') item.status = '已取消';
            });
            saveDemands(list);
            toast('需求已取消');
            render();
            return;
        }
        if (publish) {
            if (blockDuplicateDemand()) return;
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
            var blocked = null;
            chosen.some(function (store) {
                if (guarantorUsedByOther(store.code)) {
                    blocked = store;
                    return true;
                }
                return false;
            });
            if (blocked) {
                guarantors = guarantors.filter(function (code) { return code !== blocked.code; });
                toast(blocked.name + '门店已担保其他门店，请重新选择！');
                render();
                return;
            }
            var amountValue = sumLines(lines);
            var publishPlans = matchedInstallments(pkg, amountValue);
            var publishPlan = ensureInstallmentChoice(publishPlans);
            if (!publishPlan || !repayCycle) {
                toast('请选择还款周期');
                return;
            }
            if (!repayPeriod) {
                toast('请选择分期期数');
                return;
            }
            var publishSchedule = buildRepayPlan(amountValue, publishPlan, repayPeriod);
            if (!publishSchedule) {
                toast('还款计划生成失败');
                return;
            }
            var all = demands();
            all.unshift({
                code: nextCode(all),
                storeCode: account.code,
                storeName: account.name,
                packageCode: pkg.code,
                packageName: pkg.name,
                skus: lines.map(function (line) {
                    return { code: line.code, name: line.name, salePrice: line.salePrice, qty: line.qty };
                }),
                guarantors: chosen.map(function (store) { return { code: store.code, name: store.name }; }),
                amount: money(amountValue),
                installmentCode: publishPlan.code,
                installmentName: publishPlan.name,
                repayCycle: publishPlan.repayCycle,
                repayMethod: publishPlan.repayMethod,
                repayPeriod: String(repayPeriod),
                annualRate: publishSchedule.annualRate,
                firstAmount: publishSchedule.rows[0] ? publishSchedule.rows[0].amount : '',
                repayTotal: publishSchedule.total,
                status: '待报价',
                createdAt: nowText()
            });
            saveDemands(all);
            screen = 'list';
            packageCode = '';
            clearPicked();
            guarantors = [];
            clearInstallmentChoice();
            toast('资金需求已发布');
            render();
            return;
        }
        if (logout && window.RbfH5StoreLogin) window.RbfH5StoreLogin.logout();
    });

    document.getElementById('rbfH5Sheet').addEventListener('click', function (event) {
        if (event.target.closest('[data-close-sheet]')) closePlanSheet();
    });

    document.getElementById('rbfH5Scroll').addEventListener('change', function (event) {
        var qtyInput = event.target.closest('[data-qty-input]');
        if (qtyInput) {
            setQty(qtyInput.getAttribute('data-qty-input'), qtyInput.value);
            render();
            return;
        }
        var guarantorBox = event.target.closest('[data-guarantor]');
        if (guarantorBox) {
            var gcode = guarantorBox.getAttribute('data-guarantor');
            var gstore = null;
            guaranteeStores().some(function (store) {
                if (store.code === gcode) {
                    gstore = store;
                    return true;
                }
                return false;
            });
            if (guarantorBox.checked) {
                if (gstore && guarantorUsedByOther(gcode)) {
                    guarantorBox.checked = false;
                    toast(gstore.name + '门店已担保其他门店，请重新选择！');
                    return;
                }
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

    window.RbfH5StoreApp = { open: open, close: close };
})();
