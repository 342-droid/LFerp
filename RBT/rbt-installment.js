/* RBT 产品配置：查询、新增、编辑、启用禁用，产品编码弹出详情。 */
(function () {
    var octopus = window.OctopusPrototype;
    var Vue = octopus && octopus.Vue ? octopus.Vue : {};
    var ref = Vue.ref;
    var computed = Vue.computed;
    var ElMessage = octopus && octopus.ElementPlus ? octopus.ElementPlus.ElMessage : null;
    var KEY = 'rbt_installment_v3';
    var PACKAGE_KEY = 'rbt_product_package_v2';
    var REPAY_CYCLES = ['日结'];
    var REPAY_METHODS = ['比例付'];
    var LENG_WARN = '冷丰实收不能小于或等于0';

    function migrateEnumLabels(item) {
        if (!item) return false;
        var changed = false;
        var cycleMap = { '日还': '日结' };
        var methodMap = { '定额还': '定额付', '比例还': '比例付' };
        if (cycleMap[item.repayCycle]) {
            item.repayCycle = cycleMap[item.repayCycle];
            changed = true;
        }
        if (methodMap[item.repayMethod]) {
            item.repayMethod = methodMap[item.repayMethod];
            changed = true;
        }
        return changed;
    }

    /* 定额付已下线。旧记录改成比例付：结算比例缺省 10.00，结算系数取原最短一期。 */
    function dropFixedPay(item) {
        var method = item.repayMethod;
        var legacy = method === '定额付' || method === '定额还' || method === '等额本息' ||
            blank(method) || REPAY_METHODS.indexOf(method) < 0;
        if (!legacy) return false;
        var pair = emptyRatePair();
        var periods = orderedPeriods(item.periods || []);
        var rates = item.periodRates && typeof item.periodRates === 'object' && !Array.isArray(item.periodRates)
            ? item.periodRates
            : {};
        if (periods.length && rates[periods[0]]) pair = normalizeRatePair(rates[periods[0]]);
        else {
            Object.keys(rates).some(function (key) {
                pair = normalizeRatePair(rates[key]);
                return true;
            });
        }
        item.repayMethod = '比例付';
        if (blank(item.periodRatio)) item.periodRatio = '10.00';
        if (blank(item.storeRate)) item.storeRate = pair.store || '1.50';
        if (blank(item.traderRate)) item.traderRate = pair.trader || pair.store || '1.40';
        if (blank(item.providerRate)) item.providerRate = pair.provider || defaultProviderRate(item.traderRate, item.storeRate);
        item.periods = [];
        item.periodRates = {};
        return true;
    }


    function blank(value) {
        return value === undefined || value === null || String(value).trim() === '';
    }

    function includesText(source, query) {
        if (blank(query)) return true;
        return String(source || '').toLowerCase().indexOf(String(query).trim().toLowerCase()) >= 0;
    }

    function show(value) {
        return blank(value) ? '—' : String(value);
    }

    function pad(n) {
        return n < 10 ? '0' + n : String(n);
    }

    function nowText() {
        var d = new Date();
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' +
            pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }

    function pushLog(item, content, operator, time) {
        if (!item || !content) return;
        if (!Array.isArray(item.logs)) item.logs = [];
        item.logs.unshift({
            time: time || nowText(),
            operator: operator || '用户名',
            content: content
        });
    }

    /* 旧数据没有操作记录时，补一条新增记录。之后的变更只追加真实差异。 */
    function ensureLogs(item) {
        if (!item || Array.isArray(item.logs)) return false;
        item.logs = [{
            time: item.createdAt || item.updatedAt || '',
            operator: item.creator || '用户名',
            content: '新增产品'
        }];
        return true;
    }

    function packagesLogText(row) {
        var names = row && Array.isArray(row.packages) ? row.packages.filter(Boolean) : [];
        return names.length ? names.join('、') : '无';
    }

    function samePackages(left, right) {
        return (left || []).slice().sort().join('\n') === (right || []).slice().sort().join('\n');
    }

    function defaultSettleRatios(percent) {
        var ratio = '10.00';
        var text = String(percent == null ? '' : percent).replace(/%/g, '').trim();
        if (/^\d+(\.\d+)?$/.test(text)) {
            var num = Number(text);
            if (isFinite(num) && num > 0 && num <= 100) ratio = num.toFixed(2);
        }
        return ['POS', '直播', '商城'].map(function (channel) {
            return { channel: channel, fallback: ratio, rows: [] };
        });
    }

    function seed() {
        return [
            {
                code: 'FQ00001',
                name: '开业铺货日结',
                repayCycle: '日结',
                repayMethod: '比例付',
                periodRatio: '10.00',
                storeRate: '1.20',
                traderRate: '1.08',
                providerRate: '1.02',
                periods: [],
                periodRates: {},
                settleRatios: defaultSettleRatios('10.00'),
                amountMin: '20.00',
                amountMax: '50000',
                packages: ['汉言开业铺货包'],
                creator: '王丽',
                createdAt: '2026-08-02 10:12:00',
                updater: '王丽',
                updatedAt: '2026-08-12 09:20:00'
            },
            {
                code: 'FQ00004',
                name: '开业铺货加价',
                repayCycle: '日结',
                repayMethod: '比例付',
                periodRatio: '10.00',
                storeRate: '1.20',
                traderRate: '1.08',
                providerRate: '1.02',
                periods: [],
                periodRates: {},
                settleRatios: defaultSettleRatios('10.00'),
                amountMin: '20.00',
                amountMax: '50000',
                packages: [],
                creator: '王丽',
                createdAt: '2026-08-03 09:10:00',
                updater: '王丽',
                updatedAt: '2026-08-13 09:10:00'
            },
            {
                code: 'FQ00005',
                name: '开业铺货轻量',
                repayCycle: '日结',
                repayMethod: '比例付',
                periodRatio: '10.00',
                storeRate: '1.20',
                traderRate: '1.08',
                providerRate: '1.02',
                periods: [],
                periodRates: {},
                settleRatios: defaultSettleRatios('10.00'),
                amountMin: '20.00',
                amountMax: '50000',
                packages: [],
                creator: '王丽',
                createdAt: '2026-08-03 11:20:00',
                updater: '王丽',
                updatedAt: '2026-08-13 11:20:00'
            },
            {
                code: 'FQ00002',
                name: '门店形象日结',
                repayCycle: '日结',
                repayMethod: '比例付',
                periodRatio: '8.00',
                storeRate: '1.20',
                traderRate: '1.08',
                providerRate: '1.02',
                periods: [],
                periodRates: {},
                settleRatios: defaultSettleRatios('8.00'),
                amountMin: '50.00',
                amountMax: '100000',
                packages: ['门店形象配置包'],
                creator: '张宁',
                createdAt: '2026-08-04 14:30:00',
                updater: '张宁',
                updatedAt: '2026-08-14 16:05:00'
            },
            {
                code: 'FQ00003',
                name: '开业运营日结',
                repayCycle: '日结',
                repayMethod: '比例付',
                periodRatio: '10.00',
                storeRate: '1.20',
                traderRate: '1.08',
                providerRate: '1.02',
                periods: [],
                periodRates: {},
                settleRatios: defaultSettleRatios('10.00'),
                amountMin: '5.00',
                amountMax: '30000',
                packages: ['开业运营服务包'],
                creator: '李萌',
                createdAt: '2026-08-06 11:08:00',
                updater: '李萌',
                updatedAt: '2026-08-16 13:40:00'
            }
        ];
    }

    function parsePeriodTokens(text) {
        return String(text == null ? '' : text)
            .split(/[、,，\s]+/)
            .map(function (part) { return String(part).replace(/期/g, '').trim(); })
            .filter(Boolean);
    }

    function isValidPeriod(token) {
        return /^\d+$/.test(String(token)) && Number(token) > 0;
    }

    function normalizePeriod(token) {
        return String(Number(token));
    }

    function orderedPeriods(value) {
        if (!Array.isArray(value)) return [];
        var unique = [];
        value.forEach(function (item) {
            var period = String(item);
            if (!period || unique.indexOf(period) >= 0) return;
            unique.push(period);
        });
        return unique.sort(function (a, b) { return Number(a) - Number(b); });
    }

    function periodsDisplay(periods) {
        return orderedPeriods(periods || []).join('、');
    }

    function emptyRatePair() {
        return { store: '', trader: '', provider: '' };
    }

    function isRatePair(value) {
        return !!(value && typeof value === 'object' && !Array.isArray(value) &&
            ('store' in value || 'trader' in value || 'provider' in value));
    }

    function rateCents(value) {
        var amount = Number(value);
        if (!isFinite(amount)) return NaN;
        return Math.round(amount * 100);
    }

    /* 服务商系数是 1 加计提比例。1.00 表示不从冷丰差额计提。 */
    function defaultProviderRate() {
        return '1.00';
    }

    /* 演示产品统一为门店 1.20、贸易商 1.08、服务商 1.02。只改仍停在旧示例系数上的记录。 */
    var DEMO_RATES = { store: '1.20', trader: '1.08', provider: '1.02' };
    var DEMO_RATE_FIX = {
        FQ00001: [['1.60', '1.20', '1.05'], ['1.60', '1.50', '1.40'], ['1.60', '1.00', '0.60']],
        FQ00004: [['1.70', '1.30', '1.05'], ['1.70', '1.60', '1.50'], ['1.70', '1.00', '0.70']],
        FQ00005: [['1.30', '1.10', '1.02'], ['1.30', '1.20', '1.10'], ['1.30', '0.80', '0.50']],
        FQ00002: [['1.80', '1.40', '1.08'], ['1.80', '1.70', '1.60'], ['1.80', '1.10', '0.70']],
        FQ00003: [['1.50', '1.20', '1.04'], ['1.50', '1.40', '1.30'], ['1.50', '0.90', '0.60']]
    };

    function migrateRateSum(item) {
        var previous = DEMO_RATE_FIX[item.code];
        if (previous) {
            var store = String(item.storeRate || '');
            var trader = String(item.traderRate || '');
            var provider = String(item.providerRate || '');
            var current = store === DEMO_RATES.store && trader === DEMO_RATES.trader && provider === DEMO_RATES.provider;
            var hit = !current && previous.some(function (pair) {
                return pair[0] === store && pair[1] === trader && (blank(provider) || pair[2] === provider);
            });
            if (hit) {
                item.storeRate = DEMO_RATES.store;
                item.traderRate = DEMO_RATES.trader;
                item.providerRate = DEMO_RATES.provider;
                return true;
            }
        }
        if (blank(item.providerRate)) {
            item.providerRate = defaultProviderRate();
            return true;
        }
        return false;
    }

    /* 新增、编辑里按商品包金额 50000 试算，和结算测算同一套口径。 */
    function ratePreview(form) {
        var rule = '冷丰系数 = 1 + 门店结算系数 − 贸易商结算系数。商品金额 = 商品包金额 × 冷丰系数，四舍五入到分。总金额 = 商品金额 × 贸易商结算系数。服务费 = 总金额 − 商品金额。贸易商应付 = 商品金额，贸易商应收 = 总金额，贸易商收益 = 服务费。服务商实收 = 商品金额 ×（服务商结算系数 − 1）。冷丰应收 = 商品金额 − 商品金额 / 冷丰系数。冷丰实收 = 冷丰应收 − 服务商实收。';
        if (!form || !validDecimal(form.storeRate) || !validDecimal(form.traderRate) || !validDecimal(form.providerRate)) return rule;
        var api = window.RbtDemandData;
        var quote = api && typeof api.packageQuote === 'function'
            ? api.packageQuote(50000, form.storeRate, form.traderRate, form.providerRate)
            : null;
        if (!quote) return rule;
        function yuan(value) {
            return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        /* 冷丰系数小于等于 0 时算不出金额；算得出但冷丰实收小于等于 0 时，试算数字仍展示，并跟上提示。 */
        if (quote.blocked) return LENG_WARN;
        var sentence = '按商品包金额 50,000 元试算：商品金额 ' + yuan(quote.goods) +
            '，服务费 ' + yuan(quote.fee) +
            '，总金额 ' + yuan(quote.total) +
            '，贸易商应付 ' + yuan(quote.paid) +
            '，贸易商应收 ' + yuan(quote.receive) +
            '，贸易商收益 ' + yuan(quote.profit) +
            '，冷丰应收 ' + yuan(quote.lengfengReceive) +
            '，服务商实收 ' + yuan(quote.providerPay) +
            '，冷丰实收 ' + yuan(quote.lengfeng) + '。';
        if (!(Number(quote.lengfeng) > 0)) sentence += LENG_WARN;
        return sentence;
    }

    /* 试算说明里只把「冷丰实收不能小于或等于0」标红，前后的金额说明保持原色。 */
    function tipParts(text) {
        var raw = text == null ? '' : String(text);
        if (!raw || raw.indexOf(LENG_WARN) < 0) return [{ text: raw, warn: false }];
        var chunks = raw.split(LENG_WARN);
        var parts = [];
        chunks.forEach(function (chunk, index) {
            if (chunk) parts.push({ text: chunk, warn: false });
            if (index < chunks.length - 1) parts.push({ text: LENG_WARN, warn: true });
        });
        return parts;
    }

    /* 旧单值结算系数迁成门店/贸易商/服务商；旧费率区间仍先按期插值。 */
    function normalizeRatePair(value) {
        if (isRatePair(value)) {
            var store = value.store == null ? '' : String(value.store);
            var trader = value.trader == null ? '' : String(value.trader);
            var provider = value.provider == null || value.provider === ''
                ? defaultProviderRate(trader, store)
                : String(value.provider);
            return { store: store, trader: trader, provider: provider };
        }
        if (value == null || value === '') return emptyRatePair();
        var text = String(value);
        return { store: text, trader: text, provider: defaultProviderRate(text, text) };
    }

    function migratePeriodRates(item) {
        var changed = false;
        var periods = orderedPeriods(item.periods || []);
        if (!item.periodRates || typeof item.periodRates !== 'object' || Array.isArray(item.periodRates)) {
            var rates = {};
            var min = blank(item.rateMin) ? null : Number(item.rateMin);
            var max = blank(item.rateMax) ? null : Number(item.rateMax);
            periods.forEach(function (period, index) {
                var text = '';
                if (isFinite(min) && isFinite(max) && periods.length > 1) {
                    var ratio = index / (periods.length - 1);
                    text = (min + (max - min) * ratio).toFixed(2);
                } else if (isFinite(min)) {
                    text = Number(min).toFixed(2);
                } else if (isFinite(max)) {
                    text = Number(max).toFixed(2);
                }
                rates[period] = { store: text, trader: text, provider: defaultProviderRate(text, text) };
            });
            item.periodRates = rates;
            delete item.rateMin;
            delete item.rateMax;
            delete item.rateRange;
            return true;
        }
        var next = {};
        periods.forEach(function (period) {
            var current = item.periodRates[period];
            var pair = normalizeRatePair(current);
            next[period] = pair;
            if (!isRatePair(current) || String(current.store || '') !== pair.store || String(current.trader || '') !== pair.trader || String(current.provider || '') !== pair.provider) {
                changed = true;
            }
        });
        Object.keys(item.periodRates).forEach(function (key) {
            if (periods.indexOf(key) < 0) changed = true;
        });
        if (changed || Object.keys(item.periodRates).length !== periods.length) {
            item.periodRates = next;
            changed = true;
        }
        if (item.rateMin != null || item.rateMax != null || item.rateRange != null) {
            delete item.rateMin;
            delete item.rateMax;
            delete item.rateRange;
            changed = true;
        }
        return changed;
    }

    function read() {
        try {
            var raw = sessionStorage.getItem(KEY);
            var list = raw ? JSON.parse(raw) : null;
            if (!Array.isArray(list) || !list.length) {
                list = seed();
                sessionStorage.setItem(KEY, JSON.stringify(list));
            }
            var changed = false;
            var exists = {};
            list.forEach(function (item) {
                if (item && item.code) exists[item.code] = true;
            });
            seed().forEach(function (item) {
                if (!item || !item.code || exists[item.code]) return;
                list.push(JSON.parse(JSON.stringify(item)));
                exists[item.code] = true;
                changed = true;
            });
            var packageRename = { '周末生鲜包': '汉言开业铺货包', '肉类组合包': '门店形象配置包', '果蔬尝鲜包': '开业运营服务包' };
            list.forEach(function (item) {
                if (!item) return;
                if (Array.isArray(item.packages)) {
                    var nextPackages = item.packages.map(function (name) { return packageRename[name] || name; });
                    if (nextPackages.join('\n') !== item.packages.join('\n')) {
                        item.packages = nextPackages;
                        changed = true;
                    }
                }
                if (migrateEnumLabels(item)) changed = true;
                if (dropFixedPay(item)) changed = true;
                if (item.repayMethod === '比例付') {
                    if (blank(item.periodRatio) || blank(item.storeRate) || blank(item.traderRate)) {
                        var firstPair = null;
                        var rates = item.periodRates && typeof item.periodRates === 'object' ? item.periodRates : {};
                        Object.keys(rates).some(function (key) {
                            firstPair = normalizeRatePair(rates[key]);
                            return true;
                        });
                        if (blank(item.periodRatio)) item.periodRatio = '10.00';
                        if (blank(item.storeRate)) item.storeRate = firstPair && firstPair.store ? firstPair.store : '1.50';
                        if (blank(item.traderRate)) item.traderRate = firstPair && firstPair.trader ? firstPair.trader : '1.40';
                        item.periods = [];
                        item.periodRates = {};
                        changed = true;
                    }
                    if (migrateRateSum(item)) changed = true;
                    if (!(item.settleRatios && item.settleRatios.length)) {
                        item.settleRatios = defaultSettleRatios(item.periodRatio || '10.00');
                        changed = true;
                    }
                    (item.settleRatios || []).forEach(function (channel) {
                        if (channel && channel.rows && channel.rows.length) {
                            channel.rows = [];
                            changed = true;
                        }
                    });
                }
                if (item.feeRule != null || item.feeRate != null) {
                    delete item.feeRule;
                    delete item.feeRate;
                    changed = true;
                }
                if (item.penaltyRule != null || item.penaltyRate != null || item.penaltyAsPercent != null) {
                    delete item.penaltyRule;
                    delete item.penaltyRate;
                    delete item.penaltyAsPercent;
                    changed = true;
                }
                if (typeof item.periods === 'string') {
                    item.periods = item.periods.split(/[、,，]/).map(function (part) { return part.trim(); }).filter(Boolean);
                    changed = true;
                }
                if (blank(item.repayCycle) || REPAY_CYCLES.indexOf(item.repayCycle) < 0) {
                    item.repayCycle = '日结';
                    changed = true;
                }
                var productRename = {
                    FQ00001: { '生鲜周转分期': '开业铺货日结' },
                    FQ00004: { '生鲜周转周还': '开业铺货加价', '生鲜周转比例付': '开业铺货加价' },
                    FQ00005: { '生鲜周转日结': '开业铺货轻量', '生鲜周转日付': '开业铺货轻量' },
                    FQ00002: { '肉类备货分期': '门店形象日结' },
                    FQ00003: { '果蔬短周期': '开业运营日结' }
                };
                var nextName = productRename[item.code] && productRename[item.code][item.name];
                if (nextName) {
                    item.name = nextName;
                    changed = true;
                }
                if (migratePeriodRates(item)) changed = true;
                if (applyDemoAmountFloor(item)) changed = true;
                if (applyOpsPackageCeiling(item)) changed = true;
                if (ensureLogs(item)) changed = true;
            });
            /* 同一商品包可挂多条分期，但同一结算周期+结算方式只能保留最早一条上的关联。 */
            var packageCycleMethodOwner = {};
            list.slice().sort(function (a, b) {
                return String(a && a.code || '').localeCompare(String(b && b.code || ''));
            }).forEach(function (item) {
                if (!item || !Array.isArray(item.packages)) return;
                var cycle = item.repayCycle || '日结';
                var method = item.repayMethod || '比例付';
                var next = [];
                item.packages.forEach(function (name) {
                    if (!name) return;
                    var key = name + '\0' + cycle + '\0' + method;
                    if (packageCycleMethodOwner[key]) return;
                    packageCycleMethodOwner[key] = item.code;
                    next.push(name);
                });
                if (next.length !== item.packages.length) {
                    item.packages = next;
                    changed = true;
                }
            });
            if (changed) sessionStorage.setItem(KEY, JSON.stringify(list));
            return list;
        } catch (e) {
            return seed();
        }
    }

    /* 示例分期的金额下限原来高于商品售价，调低后所选商品可以落在区间内。只改仍是旧示例值的记录。 */
    function applyDemoAmountFloor(item) {
        var floors = {
            FQ00001: { '1000': '20.00', '1000.00': '20.00' },
            FQ00002: { '5000': '50.00', '5000.00': '50.00' },
            FQ00003: { '500': '5.00', '500.00': '5.00' }
        };
        var next = item && floors[item.code] && floors[item.code][String(item.amountMin)];
        if (!next) return false;
        item.amountMin = next;
        return true;
    }

    /* 开业运营服务包商品金额是 30000，货款上限仍停在 20000 时整包下不了单。 */
    function applyOpsPackageCeiling(item) {
        if (!item || item.code !== 'FQ00003') return false;
        var max = String(item.amountMax == null ? '' : item.amountMax);
        if (max !== '20000' && max !== '20000.00') return false;
        item.amountMax = '30000';
        return true;
    }

    function write(list) {
        sessionStorage.setItem(KEY, JSON.stringify(list));
    }

    function nextCode(items) {
        var max = 0;
        items.forEach(function (item) {
            var matched = String(item.code || '').match(/^FQ(\d+)$/);
            if (matched) max = Math.max(max, parseInt(matched[1], 10));
        });
        return 'FQ' + String(max + 1).padStart(5, '0');
    }

    function packageNames() {
        try {
            var raw = sessionStorage.getItem(PACKAGE_KEY);
            var list = raw ? JSON.parse(raw) : null;
            if (Array.isArray(list)) {
                return list.filter(function (item) { return item && item.enabled !== false; }).map(function (item) { return item.name; }).filter(Boolean);
            }
        } catch (e) {}
        return ['汉言开业铺货包', '门店形象配置包', '开业运营服务包'];
    }

    function packageText(row) {
        var value = row && row.packages;
        if (Array.isArray(value)) value = value.filter(Boolean).join('、');
        return show(value);
    }

    function sameMoney(left, right) {
        if (String(left || '') === String(right || '')) return true;
        var a = Number(left);
        var b = Number(right);
        return isFinite(a) && isFinite(b) && a.toFixed(2) === b.toFixed(2);
    }

    function moneyText(value) {
        var amount = Number(String(value).replace(/,/g, ''));
        if (!isFinite(amount)) return '';
        return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function ratePart(value) {
        return !blank(value) && isFinite(Number(value)) ? Number(value).toFixed(2) : '—';
    }

    function ratePairText(pair) {
        return '门店' + ratePart(pair && pair.store) + ' / 贸易商' + ratePart(pair && pair.trader) + ' / 服务商' + ratePart(pair && pair.provider);
    }

    function channelRatioText(row) {
        if (!row || row.repayMethod !== '比例付') return '—';
        var api = window.RbtSettleRatio;
        var text = api && typeof api.summary === 'function' ? api.summary(row.settleRatios) : '';
        return text || '—';
    }

    function rateText(row) {
        if (row && row.repayMethod === '比例付') {
            return ratePairText({ store: row.storeRate, trader: row.traderRate, provider: row.providerRate });
        }
        var periods = orderedPeriods(row && row.periods);
        var rates = row && row.periodRates && typeof row.periodRates === 'object' ? row.periodRates : {};
        var parts = periods.map(function (period) {
            return period + '期 ' + ratePairText(normalizeRatePair(rates[period]));
        }).filter(Boolean);
        return parts.length ? parts.join('；') : '—';
    }

    function amountText(row) {
        if (blank(row.amountMin) || blank(row.amountMax)) return show(row.amountRange);
        return moneyText(row.amountMin) + '元–' + moneyText(row.amountMax) + '元';
    }

    function decimalText(value, digits) {
        var limit = digits || 2;
        var text = String(value == null ? '' : value).replace(/[^\d.]/g, '');
        var dot = text.indexOf('.');
        if (dot >= 0) text = text.slice(0, dot + 1) + text.slice(dot + 1).replace(/\./g, '').slice(0, limit);
        return text;
    }

    function validDecimal(value, digits) {
        var limit = digits || 2;
        if (blank(value)) return false;
        return new RegExp('^\\d+(\\.\\d{1,' + limit + '})?$').test(String(value).trim());
    }

    function cloneRates(rates) {
        var next = {};
        if (!rates || typeof rates !== 'object') return next;
        Object.keys(rates).forEach(function (key) {
            next[key] = normalizeRatePair(rates[key]);
        });
        return next;
    }

    function syncPeriodRates(form) {
        var periods = orderedPeriods(form.periods || []);
        var next = {};
        periods.forEach(function (period) {
            next[period] = form.periodRates && form.periodRates[period]
                ? normalizeRatePair(form.periodRates[period])
                : emptyRatePair();
        });
        form.periodRates = next;
    }

    window.RbtInstallmentData = {
        get: function (code) {
            var found = null;
            read().some(function (item) {
                if (item && item.code === code) {
                    found = item;
                    return true;
                }
                return false;
            });
            return found;
        },
        list: function () {
            return read().filter(function (item) { return item && item.enabled !== false; });
        }
    };

    if (window.OctopusPrototype && document.getElementById('rbtInstallmentApp')) {
    OctopusPrototype.mount({
        setup: function () {
            var table = ref(null);
            var addDialog = ref(null);
            var dialogTitle = ref('新增产品');
            var calcOpen = ref(false);
            var calcChannels = (window.RbtSettleRatio && window.RbtSettleRatio.CHANNELS) || ['POS', '直播', '商城'];
            function emptyCalcChannels() {
                var channels = {};
                calcChannels.forEach(function (name) { channels[name] = { turnover: '', ratio: '' }; });
                return channels;
            }
            var calcForm = ref({
                goods: '50000', storeRate: '', traderRate: '', providerRate: '',
                channels: emptyCalcChannels(), posPick: '', posNewTurnover: '', posNewRatio: '', posSubs: []
            });
            var posSubPick = ref('');
            var posSubRatio = ref('');
            var posSubNames = (window.RbtSettleRatio && window.RbtSettleRatio.POS_SUBS) || ['堂食', '外卖', '团购'];
            var afterSave = 'add';
            var slots = { code: 'cell-code', status: 'cell-enabled' };
            var cycleOptions = REPAY_CYCLES.map(function (name) { return { label: name, value: name }; });
            var repayOptions = REPAY_METHODS.map(function (name) { return { label: name, value: name }; });
            var statusOptions = [{ label: '启用', value: '启用' }, { label: '禁用', value: '禁用' }];
            var packageOptions = [];

            /* 商品包可被多条分期共用；冲突键为「商品包 + 结算周期 + 结算方式」。 */
            function conflictPackages(exceptCode, repayCycle, repayMethod) {
                var taken = {};
                if (blank(repayCycle) || blank(repayMethod)) return taken;
                read().forEach(function (item) {
                    if (!item || item.code === exceptCode) return;
                    if (item.repayCycle !== repayCycle) return;
                    if (item.repayMethod !== repayMethod) return;
                    (item.packages || []).forEach(function (name) {
                        if (name && !taken[name]) taken[name] = item.name || item.code;
                    });
                });
                return taken;
            }

            function syncPackageOptions(extra) {
                var names = packageNames().slice();
                (extra || []).forEach(function (name) {
                    if (name && names.indexOf(name) < 0) names.push(name);
                });
                packageOptions.splice(0, packageOptions.length);
                names.forEach(function (name) { packageOptions.push({ label: name, value: name }); });
            }
            syncPackageOptions();
            var columns = [
                { dataIndex: 'code', title: '产品编码', minWidth: 140, search: { control: 'input' } },
                { dataIndex: 'name', title: '产品名称', minWidth: 160, align: 'left', showOverflowTooltip: true, search: { control: 'input' } },
                { dataIndex: 'statusQuery', title: '产品状态', hideInTable: true, search: { control: 'select', options: statusOptions, placeholder: '请选择' } },
                { dataIndex: 'cycleQuery', title: '结算周期', hideInTable: true, search: { control: 'select', options: cycleOptions, placeholder: '请选择' } },
                { dataIndex: 'methodQuery', title: '结算方式', hideInTable: true, search: { control: 'select', options: repayOptions, placeholder: '请选择' } },
                { dataIndex: 'packageQuery', title: '商品包', hideInTable: true, search: { control: 'select', options: packageOptions, placeholder: '请选择' } },
                { dataIndex: 'enabled', title: '状态', width: 100 },
                { dataIndex: 'repayCycle', title: '结算周期', minWidth: 110, formatter: function (row) { return show(row.repayCycle); } },
                { dataIndex: 'repayMethod', title: '结算方式', minWidth: 120, formatter: function (row) { return show(row.repayMethod); } },
                { dataIndex: 'periodRates', title: '结算系数', minWidth: 360, align: 'left', showOverflowTooltip: true, formatter: rateText },
                { dataIndex: 'settleRatios', title: '渠道结算比例', minWidth: 280, align: 'left', showOverflowTooltip: true, formatter: channelRatioText },
                { dataIndex: 'amountRange', title: '货款区间', minWidth: 220, formatter: amountText },
                { dataIndex: 'packages', title: '适用商品包', minWidth: 200, align: 'left', showOverflowTooltip: true, formatter: packageText },
                { dataIndex: 'creator', title: '创建人', minWidth: 100 },
                { dataIndex: 'createdAt', title: '创建时间', minWidth: 170 },
                { dataIndex: 'updater', title: '更新人', minWidth: 100 },
                { dataIndex: 'updatedAt', title: '更新时间', minWidth: 170 }
            ];
            var addFields = computed(function () {
                return [
                    { field: 'name', label: '产品名称', required: true, placeholder: '请输入产品名称' },
                    { field: 'status', label: '状态', control: 'select', required: true, defaultValue: '启用', options: statusOptions, placeholder: '请选择' },
                    { field: 'repayCycle', label: '结算周期', control: 'select', required: true, defaultValue: '日结', options: cycleOptions, placeholder: '请选择结算周期' },
                    {
                        field: 'repayMethod',
                        label: '结算方式',
                        control: 'select',
                        required: true,
                        options: repayOptions,
                        defaultValue: '比例付',
                        placeholder: '请选择结算方式'
                    },
                    { field: 'ratepair', label: '结算系数', control: 'slot', requiredMark: true },
                    { field: 'channelratio', label: '渠道结算比例', control: 'slot', requiredMark: true },
                    { field: 'amountpair', label: '货款区间', control: 'slot', requiredMark: true },
                    { field: 'packages', label: '适用商品包', control: 'select', multiple: true, required: true, defaultValue: [], options: packageOptions, placeholder: '请选择适用商品包' }
                ];
            });

            function requestRows(params) {
                var matched = read().filter(function (row) {
                    if (!includesText(row.code, params.code)) return false;
                    if (!includesText(row.name, params.name)) return false;
                    if (!blank(params.statusQuery)) {
                        var status = row.enabled === false ? '禁用' : '启用';
                        if (status !== params.statusQuery) return false;
                    }
                    if (!blank(params.cycleQuery) && row.repayCycle !== params.cycleQuery) return false;
                    if (!blank(params.methodQuery) && row.repayMethod !== params.methodQuery) return false;
                    if (!blank(params.packageQuery)) {
                        var names = Array.isArray(row.packages) ? row.packages : [];
                        if (names.indexOf(params.packageQuery) < 0) return false;
                    }
                    return true;
                });
                var pageNum = Number(params.pageNum) || 1;
                var pageSize = Number(params.pageSize) || 20;
                var start = (pageNum - 1) * pageSize;
                return Promise.resolve({ list: matched.slice(start, start + pageSize), total: matched.length });
            }

            function onDecimal(form, key, value, digits) {
                form[key] = decimalText(value, digits);
            }

            function ensureChannel(form, channel) {
                var draft = form.channelratio && typeof form.channelratio === 'object' ? form.channelratio : {};
                var current = draft[channel] || { fallback: '', rows: [], subs: [] };
                return {
                    draft: draft,
                    current: {
                        fallback: current.fallback || '',
                        rows: [],
                        subs: channel === 'POS' ? (current.subs || []).map(function (row) {
                            return { name: row.name, ratio: row.ratio };
                        }) : []
                    }
                };
            }

            function writeChannel(form, channel, nextChannel) {
                var pack = ensureChannel(form, channel);
                var next = {};
                ((window.RbtSettleRatio && window.RbtSettleRatio.CHANNELS) || ['POS', '直播', '商城']).forEach(function (name) {
                    next[name] = name === channel ? nextChannel : (pack.draft[name] || { fallback: '', rows: [] });
                });
                form.channelratio = next;
            }

            function channelFallback(form, channel) {
                var item = form.channelratio && form.channelratio[channel];
                return item ? item.fallback || '' : '';
            }

            function onChannelFallback(form, channel, value) {
                var pack = ensureChannel(form, channel);
                writeChannel(form, channel, { fallback: decimalText(value), rows: [], subs: pack.current.subs });
            }

            function posSubs(form) {
                var item = form.channelratio && form.channelratio.POS;
                return item && item.subs ? item.subs : [];
            }

            function posSubChoices(form) {
                var used = {};
                posSubs(form).forEach(function (row) { if (row && row.name) used[row.name] = true; });
                return posSubNames.filter(function (name) { return !used[name]; });
            }

            function onPosSubPick(value) {
                posSubPick.value = value || '';
            }

            function onPosSubRatio(value) {
                posSubRatio.value = decimalText(value);
            }

            function writePosSubs(form, subs) {
                var pack = ensureChannel(form, 'POS');
                writeChannel(form, 'POS', { fallback: pack.current.fallback, rows: [], subs: subs });
            }

            function addPosSub(form) {
                var name = posSubPick.value;
                var ratio = window.RbtSettleRatio ? window.RbtSettleRatio.parseRatio(posSubRatio.value) : '';
                if (!name) {
                    ElMessage.error('请选择二级渠道');
                    return;
                }
                if (posSubs(form).some(function (row) { return row.name === name; })) {
                    ElMessage.error('该二级渠道已添加');
                    return;
                }
                if (!ratio) {
                    ElMessage.error('二级渠道比例须大于 0 且不超过 100');
                    return;
                }
                writePosSubs(form, posSubs(form).concat([{ name: name, ratio: ratio }]));
                posSubPick.value = '';
                posSubRatio.value = '';
            }

            function onPosSubRow(form, index, value) {
                var subs = posSubs(form).map(function (row, rowIndex) {
                    return rowIndex === index ? { name: row.name, ratio: decimalText(value) } : { name: row.name, ratio: row.ratio };
                });
                writePosSubs(form, subs);
            }

            function removePosSub(form, index) {
                writePosSubs(form, posSubs(form).filter(function (row, rowIndex) { return rowIndex !== index; }));
            }

            function onPeriodRate(form, period, kind, value) {
                var next = cloneRates(form.periodRates);
                var pair = next[period] || emptyRatePair();
                pair[kind] = decimalText(value);
                next[period] = pair;
                form.periodRates = next;
            }

            function onPeriodsInput(form, value) {
                form.periodsText = value;
                var tokens = parsePeriodTokens(value);
                var periods = [];
                tokens.forEach(function (token) {
                    if (!isValidPeriod(token)) return;
                    var period = normalizePeriod(token);
                    if (periods.indexOf(period) < 0) periods.push(period);
                });
                form.periods = orderedPeriods(periods);
                syncPeriodRates(form);
            }

            function periodRateValue(form, period, kind) {
                var pair = form.periodRates && form.periodRates[period];
                if (!pair) return '';
                return pair[kind] != null ? pair[kind] : '';
            }

            function findRow(code) {
                var found = null;
                read().some(function (item) {
                    if (item.code === code) {
                        found = item;
                        return true;
                    }
                    return false;
                });
                return found;
            }

            function openDetail(row) {
                var current = findRow(row.code) || row;
                if (!window.RbtInstallmentDetail) return;
                window.RbtInstallmentDetail.open({
                    code: current.code,
                    name: current.name,
                    status: current.enabled === false ? '禁用' : '启用',
                    repayCycle: show(current.repayCycle),
                    repayMethod: show(current.repayMethod),
                    rateRange: rateText(current),
                    settleRatios: current.settleRatios || [],
                    amountRange: amountText(current),
                    packages: packageText(current),
                    creator: show(current.creator),
                    createdAt: show(current.createdAt),
                    updater: show(current.updater),
                    updatedAt: show(current.updatedAt),
                    logs: current.logs || []
                });
            }

            function openAdd() {
                afterSave = 'add';
                dialogTitle.value = '新增产品';
                syncPackageOptions();
                addDialog.value && addDialog.value.showEdit({
                    status: '启用',
                    repayCycle: '日结',
                    repayMethod: '比例付',
                    periodRatio: '',
                    storeRate: '',
                    traderRate: '',
                    providerRate: '',
                    channelratio: window.RbtSettleRatio ? window.RbtSettleRatio.emptyDraft() : {},
                    periodsText: '',
                    periods: [],
                    periodRates: {}
                });
            }

            function openEdit(row) {
                var current = findRow(row.code) || row;
                afterSave = 'edit';
                dialogTitle.value = '编辑产品';
                syncPackageOptions(current.packages);
                var periods = Array.isArray(current.periods) ? orderedPeriods(current.periods) : [];
                addDialog.value && addDialog.value.showEdit({
                    code: current.code,
                    name: current.name,
                    status: current.enabled === false ? '禁用' : '启用',
                    repayCycle: current.repayCycle || '日结',
                    repayMethod: current.repayMethod || '比例付',
                    periodRatio: current.periodRatio || '',
                    storeRate: current.storeRate || '',
                    traderRate: current.traderRate || '',
                    providerRate: current.providerRate || '',
                    channelratio: window.RbtSettleRatio ? window.RbtSettleRatio.draftFrom({ settleRatios: current.settleRatios }) : {},
                    periodsText: periodsDisplay(periods),
                    periods: periods,
                    periodRates: cloneRates(current.periodRates),
                    amountMin: current.amountMin || '',
                    amountMax: current.amountMax || '',
                    packages: Array.isArray(current.packages) ? current.packages.slice() : []
                });
            }

            function pairError(min, max, emptyText, invalidText, orderText) {
                if (blank(min) || blank(max)) return emptyText;
                if (!validDecimal(min) || !validDecimal(max)) return invalidText;
                if (Number(min) > Number(max)) return orderText;
                return '';
            }

            function beforeSubmit(values) {
                if (blank(values.name)) {
                    ElMessage.error('请输入产品名称');
                    return false;
                }
                if (values.status !== '启用' && values.status !== '禁用') {
                    ElMessage.error('请选择状态');
                    return false;
                }
                if (blank(values.repayCycle) || REPAY_CYCLES.indexOf(values.repayCycle) < 0) {
                    ElMessage.error('请选择结算周期');
                    return false;
                }
                if (blank(values.repayMethod) || REPAY_METHODS.indexOf(values.repayMethod) < 0) {
                    ElMessage.error('请选择结算方式');
                    return false;
                }
                if (values.repayMethod === '比例付') {
                    if (blank(values.storeRate)) {
                        ElMessage.error('请输入门店结算系数');
                        return false;
                    }
                    if (blank(values.traderRate)) {
                        ElMessage.error('请输入贸易商结算系数');
                        return false;
                    }
                    if (blank(values.providerRate)) {
                        ElMessage.error('请输入服务商结算系数');
                        return false;
                    }
                    if (!validDecimal(values.storeRate) || !validDecimal(values.traderRate) || !validDecimal(values.providerRate)) {
                        ElMessage.error('结算系数仅支持数字，最多两位小数');
                        return false;
                    }
                    if (Number(values.storeRate) < 1) {
                        ElMessage.error('门店结算系数不能低于1');
                        return false;
                    }
                    if (Number(values.traderRate) < 1) {
                        ElMessage.error('贸易商结算系数不能低于1');
                        return false;
                    }
                    if (Number(values.providerRate) < 1) {
                        ElMessage.error('服务商结算系数不能低于1');
                        return false;
                    }
                    var quoteApi = window.RbtDemandData;
                    var quote = quoteApi && typeof quoteApi.packageQuote === 'function'
                        ? quoteApi.packageQuote(50000, values.storeRate, values.traderRate, values.providerRate)
                        : null;
                    if (!quote || quote.blocked || !(Number(quote.lengfeng) > 0)) {
                        ElMessage.error(LENG_WARN);
                        return false;
                    }
                    var ratioApi = window.RbtSettleRatio;
                    var channelDraft = values.channelratio || {};
                    Object.keys(channelDraft).forEach(function (name) {
                        if (!channelDraft[name]) return;
                        channelDraft[name] = {
                            fallback: channelDraft[name].fallback || '',
                            rows: [],
                            subs: name === 'POS' ? (channelDraft[name].subs || []) : []
                        };
                    });
                    var settleRatios = ratioApi && typeof ratioApi.collectDraft === 'function'
                        ? ratioApi.collectDraft(channelDraft)
                        : null;
                    if (!settleRatios) {
                        var badSub = !!(ratioApi && (channelDraft.POS && channelDraft.POS.subs || []).some(function (row) {
                            return !row || posSubNames.indexOf(row.name) < 0 || !ratioApi.parseRatio(row.ratio);
                        }));
                        ElMessage.error(badSub ? '二级渠道比例须大于 0 且不超过 100' : '每个渠道都要填写默认比例');
                        return false;
                    }
                    values.settleRatios = settleRatios;
                }
                var amountError = pairError(values.amountMin, values.amountMax, '请输入货款区间', '金额仅支持数字，最多两位小数', '金额下限不能大于上限');
                if (amountError) {
                    ElMessage.error(amountError);
                    return false;
                }
                if (!values.packages || !values.packages.length) {
                    ElMessage.error('请选择适用商品包');
                    return false;
                }
                var taken = conflictPackages(values.code, values.repayCycle, values.repayMethod);
                var duplicated = values.packages.filter(function (name) { return taken[name]; });
                if (duplicated.length) {
                    ElMessage.error(duplicated.map(function (name) {
                        return name + '的' + values.repayCycle + values.repayMethod + '已关联' + taken[name];
                    }).join('；'));
                    return false;
                }
                values.name = String(values.name).trim();
                values.packages = values.packages.filter(function (name, index) {
                    return name && values.packages.indexOf(name) === index;
                });
                values.storeRate = Number(values.storeRate).toFixed(2);
                values.traderRate = Number(values.traderRate).toFixed(2);
                values.providerRate = Number(values.providerRate).toFixed(2);
                values.periods = [];
                values.periodRates = {};
                values.amountMin = Number(values.amountMin).toFixed(2);
                values.amountMax = Number(values.amountMax).toFixed(2);
                return values;
            }

            function addInstallment(values) {
                var items = read();
                var createdAt = nowText();
                var created = {
                    code: nextCode(items),
                    name: values.name,
                    repayCycle: values.repayCycle,
                    repayMethod: values.repayMethod,
                    periodRatio: values.periodRatio || '',
                    storeRate: values.storeRate || '',
                    traderRate: values.traderRate || '',
                    providerRate: values.providerRate || '',
                    settleRatios: values.settleRatios || [],
                    periods: values.periods || [],
                    periodRates: cloneRates(values.periodRates),
                    amountMin: values.amountMin,
                    amountMax: values.amountMax,
                    packages: values.packages || [],
                    enabled: values.status !== '禁用',
                    creator: '用户名',
                    createdAt: createdAt,
                    updater: '用户名',
                    updatedAt: createdAt
                };
                pushLog(created, '新增产品', '用户名', createdAt);
                items.unshift(created);
                write(items);
                return created;
            }

            function updateInstallment(values) {
                var items = read();
                var target = null;
                items.some(function (item) {
                    if (item.code === values.code) {
                        target = item;
                        return true;
                    }
                    return false;
                });
                if (!target) return null;
                ensureLogs(target);
                var changes = [];
                var nextName = String(values.name || '').trim();
                if (nextName !== String(target.name || '').trim()) {
                    changes.push('产品名称：' + (target.name || '无') + ' → ' + (nextName || '无'));
                    target.name = nextName;
                }
                if ((values.repayCycle || '') !== (target.repayCycle || '')) {
                    changes.push('结算周期：' + (target.repayCycle || '无') + ' → ' + (values.repayCycle || '无'));
                    target.repayCycle = values.repayCycle;
                }
                if ((values.repayMethod || '') !== (target.repayMethod || '')) {
                    changes.push('结算方式：' + (target.repayMethod || '无') + ' → ' + (values.repayMethod || '无'));
                    target.repayMethod = values.repayMethod;
                }
                var nextStoreRate = values.storeRate || '';
                var nextTraderRate = values.traderRate || '';
                var nextProviderRate = values.providerRate || '';
                if (nextStoreRate !== (target.storeRate || '') || nextTraderRate !== (target.traderRate || '') || nextProviderRate !== (target.providerRate || '')) {
                    changes.push('结算系数：' + rateText(target) + ' → ' + ratePairText({ store: nextStoreRate, trader: nextTraderRate, provider: nextProviderRate }));
                    target.storeRate = nextStoreRate;
                    target.traderRate = nextTraderRate;
                    target.providerRate = nextProviderRate;
                }
                var nextRatios = values.settleRatios || [];
                if (channelRatioText(target) !== channelRatioText({ repayMethod: target.repayMethod, settleRatios: nextRatios })) {
                    changes.push('渠道结算比例：' + channelRatioText(target) + ' → ' + channelRatioText({ repayMethod: '比例付', settleRatios: nextRatios }));
                    target.settleRatios = nextRatios;
                }
                target.periods = values.periods || [];
                target.periodRates = cloneRates(values.periodRates);
                delete target.feeRule;
                delete target.feeRate;
                delete target.penaltyRule;
                delete target.penaltyRate;
                delete target.penaltyAsPercent;
                if (!sameMoney(values.amountMin, target.amountMin) || !sameMoney(values.amountMax, target.amountMax)) {
                    changes.push('货款区间：' + amountText(target) + ' → ' + moneyText(values.amountMin) + '元–' + moneyText(values.amountMax) + '元');
                    target.amountMin = values.amountMin;
                    target.amountMax = values.amountMax;
                }
                var nextPackages = values.packages || [];
                if (!samePackages(target.packages, nextPackages)) {
                    changes.push('适用商品包：' + packagesLogText(target) + ' → ' + packagesLogText({ packages: nextPackages }));
                    target.packages = nextPackages;
                }
                var nextEnabled = values.status !== '禁用';
                if ((target.enabled === false) !== (nextEnabled === false)) {
                    changes.push('状态：' + (target.enabled === false ? '禁用' : '启用') + ' → ' + (nextEnabled ? '启用' : '禁用'));
                    target.enabled = nextEnabled;
                }
                delete target.rateMin;
                delete target.rateMax;
                delete target.rateRange;
                if (changes.length) {
                    var changedAt = nowText();
                    target.updater = '用户名';
                    target.updatedAt = changedAt;
                    pushLog(target, changes.join('；'), '用户名', changedAt);
                    write(items);
                }
                return target;
            }

            function toggleEnabled(row) {
                var items = read();
                var target = null;
                items.some(function (item) {
                    if (item.code === row.code) {
                        target = item;
                        return true;
                    }
                    return false;
                });
                if (!target) return;
                ensureLogs(target);
                var enabled = target.enabled === false;
                var changedAt = nowText();
                target.enabled = enabled;
                target.updater = '用户名';
                target.updatedAt = changedAt;
                pushLog(target, '状态：' + (enabled ? '禁用 → 启用' : '启用 → 禁用'), '用户名', changedAt);
                write(items);
                ElMessage.success(enabled ? '已启用' : '已禁用');
                table.value && table.value.fetchData();
            }

            function yuanText(value) {
                if (value == null || !isFinite(value)) return '—';
                return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' 元';
            }

            function onCalcField(key, value) {
                calcForm.value[key] = decimalText(value);
            }

            function onCalcChannel(name, field, value) {
                if (!calcForm.value.channels[name]) calcForm.value.channels[name] = { turnover: '', ratio: '' };
                calcForm.value.channels[name][field] = decimalText(value);
            }

            function calcChannel(name, field) {
                var row = calcForm.value.channels[name];
                return row ? row[field] || '' : '';
            }

            /* 已填写自己比例的二级渠道，到账从 POS 合计里拆出，不再乘默认比例。 */
            function splitPosSubs() {
                var own = [];
                (calcForm.value.posSubs || []).forEach(function (row) {
                    if (!row || !validDecimal(row.turnover) || !validDecimal(row.ratio)) return;
                    var ratio = Number(row.ratio);
                    if (ratio <= 0 || ratio > 100) return;
                    own.push({ name: row.name, turnover: Number(row.turnover), ratio: ratio });
                });
                return own;
            }

            function posSplit() {
                var row = calcForm.value.channels.POS || {};
                var own = splitPosSubs();
                var used = own.reduce(function (sum, item) { return sum + item.turnover; }, 0);
                var hasTotal = validDecimal(row.turnover);
                var total = hasTotal ? Number(row.turnover) : null;
                var overflow = !!(hasTotal && used > total + 0.000001);
                var remainder = hasTotal && !overflow ? total - used : null;
                return { own: own, used: used, overflow: overflow, remainder: remainder, split: own.length > 0 };
            }

            function channelDue(name) {
                var row = calcForm.value.channels[name] || {};
                if (!validDecimal(row.ratio)) return null;
                var ratio = Number(row.ratio);
                if (ratio <= 0 || ratio > 100) return null;
                if (name === 'POS') {
                    var split = posSplit();
                    if (split.split) {
                        if (split.remainder == null) return null;
                        return split.remainder * ratio / 100;
                    }
                }
                if (!validDecimal(row.turnover)) return null;
                return Number(row.turnover) * ratio / 100;
            }

            function calcChannelDue(name) {
                return yuanText(channelDue(name));
            }

            function posSplitNote() {
                var split = posSplit();
                if (!split.split || split.remainder == null) return '';
                return '未单独配置 ' + split.remainder.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' 元';
            }

            function posSubDue(row) {
                if (!row || !validDecimal(row.turnover) || !validDecimal(row.ratio)) return null;
                var ratio = Number(row.ratio);
                if (ratio <= 0 || ratio > 100) return null;
                return Number(row.turnover) * ratio / 100;
            }

            function calcPosDue(index) {
                var row = calcForm.value.posSubs[index];
                if (!row) return '—';
                if (validDecimal(row.turnover) && !String(row.ratio || '').trim()) return '按默认比例';
                return yuanText(posSubDue(row));
            }

            function calcPosChoices() {
                var used = {};
                (calcForm.value.posSubs || []).forEach(function (row) { if (row && row.name) used[row.name] = true; });
                return posSubNames.filter(function (name) { return !used[name]; });
            }

            function onCalcPosPick(value) {
                calcForm.value.posPick = value || '';
            }

            function onCalcPosDraft(key, value) {
                calcForm.value[key] = decimalText(value);
            }

            function onCalcPosRow(index, field, value) {
                calcForm.value.posSubs = (calcForm.value.posSubs || []).map(function (row, rowIndex) {
                    if (rowIndex !== index) return row;
                    var next = { name: row.name, turnover: row.turnover, ratio: row.ratio };
                    next[field] = decimalText(value);
                    return next;
                });
            }

            function addCalcPosSub() {
                var name = calcForm.value.posPick;
                if (!name) {
                    ElMessage.error('请选择二级渠道');
                    return;
                }
                if ((calcForm.value.posSubs || []).some(function (row) { return row.name === name; })) {
                    ElMessage.error('该二级渠道已添加');
                    return;
                }
                var ratio = calcForm.value.posNewRatio;
                if (String(ratio || '').trim() && (!validDecimal(ratio) || Number(ratio) <= 0 || Number(ratio) > 100)) {
                    ElMessage.error('二级渠道比例须大于 0 且不超过 100');
                    return;
                }
                calcForm.value.posSubs = (calcForm.value.posSubs || []).concat([{
                    name: name,
                    turnover: calcForm.value.posNewTurnover || '',
                    ratio: ratio || ''
                }]);
                calcForm.value.posPick = '';
                calcForm.value.posNewTurnover = '';
                calcForm.value.posNewRatio = '';
            }

            function removeCalcPosSub(index) {
                calcForm.value.posSubs = (calcForm.value.posSubs || []).filter(function (row, rowIndex) { return rowIndex !== index; });
            }

            function openCalc() {
                calcOpen.value = true;
            }

            var calcResult = computed(function () {
                var form = calcForm.value;
                var notes = [];
                var goodsOk = validDecimal(form.goods);
                var storeOk = validDecimal(form.storeRate);
                var traderOk = validDecimal(form.traderRate);
                var providerOk = validDecimal(form.providerRate);
                var goods = goodsOk ? Number(form.goods) : NaN;
                var store = storeOk ? Number(form.storeRate) : NaN;
                var trader = traderOk ? Number(form.traderRate) : NaN;
                var provider = providerOk ? Number(form.providerRate) : NaN;
                if (storeOk && store < 1) notes.push('门店结算系数不能低于1');
                if (traderOk && trader < 1) notes.push('贸易商结算系数不能低于1');
                if (providerOk && provider < 1) notes.push('服务商结算系数不能低于1');
                var quote = goodsOk && storeOk && traderOk && providerOk && window.RbtDemandData && typeof window.RbtDemandData.packageQuote === 'function'
                    ? window.RbtDemandData.packageQuote(goods, form.storeRate, form.traderRate, form.providerRate)
                    : null;
                if (quote && (quote.blocked || !(Number(quote.lengfeng) > 0))) notes.push(LENG_WARN);
                var quotedGoods = quote && !quote.blocked ? quote.goods : null;
                var fee = quote && !quote.blocked ? quote.fee : null;
                var total = quote && !quote.blocked ? quote.total : null;
                var paid = quote && !quote.blocked ? quote.paid : null;
                var receive = quote && !quote.blocked ? quote.receive : null;
                var profit = quote && !quote.blocked ? quote.profit : null;
                var providerPay = quote && !quote.blocked ? quote.providerPay : null;
                var lengfengReceive = quote && !quote.blocked ? quote.lengfengReceive : null;
                var lengfeng = quote && !quote.blocked ? quote.lengfeng : null;
                var daily = null;
                var split = posSplit();
                if (split.overflow) notes.push('二级渠道到账合计不能超过 POS 当日实际到账');
                calcChannels.forEach(function (name) {
                    var row = form.channels[name] || {};
                    if (validDecimal(row.ratio)) {
                        var ratio = Number(row.ratio);
                        if (ratio <= 0 || ratio > 100) notes.push(name + '结算比例须大于 0 且不超过 100');
                    }
                    var due = channelDue(name);
                    if (due != null) daily = (daily || 0) + due;
                });
                (form.posSubs || []).forEach(function (row) {
                    if (row && String(row.ratio || '').trim() && !validDecimal(row.ratio)) notes.push(row.name + '结算比例须大于 0 且不超过 100');
                    else if (validDecimal(row && row.ratio)) {
                        var subRatio = Number(row.ratio);
                        if (subRatio <= 0 || subRatio > 100) notes.push(row.name + '结算比例须大于 0 且不超过 100');
                    }
                    var subDue = posSubDue(row);
                    if (subDue != null) daily = (daily || 0) + subDue;
                });
                var days = total != null && daily > 0 ? (total / daily).toFixed(2) + ' 天' : '—';
                return {
                    goods: yuanText(quotedGoods),
                    fee: yuanText(fee),
                    total: yuanText(total),
                    paid: yuanText(paid),
                    receive: yuanText(receive),
                    profit: yuanText(profit),
                    providerPay: yuanText(providerPay),
                    lengfengReceive: yuanText(lengfengReceive),
                    lengfeng: yuanText(lengfeng),
                    daily: yuanText(daily),
                    days: days,
                    notes: notes.join('；')
                };
            });

            function refreshTable() {
                if (!table.value) return;
                if (afterSave === 'edit') table.value.fetchData();
                else table.value.queryData();
            }

            return {
                slots: slots,
                table: table,
                addDialog: addDialog,
                dialogTitle: dialogTitle,
                columns: columns,
                addFields: addFields,
                orderedPeriods: orderedPeriods,
                periodsDisplay: periodsDisplay,
                onDecimal: onDecimal,
                channelNames: (window.RbtSettleRatio && window.RbtSettleRatio.CHANNELS) || ['POS', '直播', '商城'],
                channelFallback: channelFallback,
                onChannelFallback: onChannelFallback,
                posSubPick: posSubPick,
                posSubRatio: posSubRatio,
                posSubs: posSubs,
                posSubChoices: posSubChoices,
                onPosSubPick: onPosSubPick,
                onPosSubRatio: onPosSubRatio,
                addPosSub: addPosSub,
                onPosSubRow: onPosSubRow,
                removePosSub: removePosSub,
                onPeriodRate: onPeriodRate,
                onPeriodsInput: onPeriodsInput,
                periodRateValue: periodRateValue,
                requestRows: requestRows,
                openDetail: openDetail,
                openAdd: openAdd,
                openEdit: openEdit,
                calcOpen: calcOpen,
                calcForm: calcForm,
                openCalc: openCalc,
                onCalcField: onCalcField,
                onCalcChannel: onCalcChannel,
                calcChannel: calcChannel,
                calcChannelDue: calcChannelDue,
                posSplitNote: computed(posSplitNote),
                calcPosDue: calcPosDue,
                calcPosChoices: calcPosChoices,
                onCalcPosPick: onCalcPosPick,
                onCalcPosDraft: onCalcPosDraft,
                onCalcPosRow: onCalcPosRow,
                addCalcPosSub: addCalcPosSub,
                removeCalcPosSub: removeCalcPosSub,
                calcResult: calcResult,
                toggleEnabled: toggleEnabled,
                beforeSubmit: beforeSubmit,
                ratePreview: ratePreview,
                tipParts: tipParts,
                addInstallment: addInstallment,
                updateInstallment: updateInstallment,
                refreshTable: refreshTable
            };
        }
    }, '#rbtInstallmentApp', {
        services: {},
        warehouse: { warehouseId: 'demo', warehouseCode: 'DEMO', warehouseName: '演示仓库' },
        permissions: [],
        layoutDensity: 'default'
    });
    }
})();
