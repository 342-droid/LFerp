/* RBT 产品配置：查询、新增、编辑、启用禁用，产品编码弹出详情。 */
(function () {
    var Vue = OctopusPrototype.Vue;
    var ref = Vue.ref;
    var computed = Vue.computed;
    var ElMessage = OctopusPrototype.ElementPlus.ElMessage;
    var KEY = 'rbt_installment_v3';
    var PACKAGE_KEY = 'rbt_product_package_v1';
    var REPAY_CYCLES = ['日付'];
    var REPAY_METHODS = ['定额付', '比例付'];

    function migrateEnumLabels(item) {
        if (!item) return false;
        var changed = false;
        var cycleMap = { '日还': '日付' };
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

    function seed() {
        return [
            {
                code: 'FQ00001',
                name: '生鲜周转分期',
                repayCycle: '日付',
                repayMethod: '定额付',
                periods: ['3', '6', '12'],
                periodRates: {
                    '3': { store: '1.60', trader: '1.50' },
                    '6': { store: '1.90', trader: '1.80' },
                    '12': { store: '2.20', trader: '2.10' }
                },
                amountMin: '20.00',
                amountMax: '50000',
                packages: ['周末生鲜包'],
                creator: '王丽',
                createdAt: '2026-08-02 10:12:00',
                updater: '王丽',
                updatedAt: '2026-08-12 09:20:00'
            },
            {
                code: 'FQ00004',
                name: '生鲜周转周还',
                repayCycle: '日付',
                repayMethod: '比例付',
                periodRatio: '10.00',
                storeRate: '1.70',
                traderRate: '1.60',
                periods: [],
                periodRates: {},
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
                name: '生鲜周转日付',
                repayCycle: '日付',
                repayMethod: '定额付',
                periods: ['7', '15', '30'],
                periodRates: {
                    '7': { store: '1.30', trader: '1.20' },
                    '15': { store: '1.45', trader: '1.35' },
                    '30': { store: '1.60', trader: '1.50' }
                },
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
                name: '肉类备货分期',
                repayCycle: '日付',
                repayMethod: '比例付',
                periodRatio: '8.00',
                storeRate: '1.80',
                traderRate: '1.70',
                periods: [],
                periodRates: {},
                amountMin: '50.00',
                amountMax: '100000',
                packages: ['肉类组合包'],
                creator: '张宁',
                createdAt: '2026-08-04 14:30:00',
                updater: '张宁',
                updatedAt: '2026-08-14 16:05:00'
            },
            {
                code: 'FQ00003',
                name: '果蔬短周期',
                repayCycle: '日付',
                repayMethod: '定额付',
                periods: ['3'],
                periodRates: {
                    '3': { store: '1.50', trader: '1.40' }
                },
                amountMin: '5.00',
                amountMax: '20000',
                packages: ['果蔬尝鲜包'],
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
        return { store: '', trader: '' };
    }

    function isRatePair(value) {
        return !!(value && typeof value === 'object' && !Array.isArray(value) && ('store' in value || 'trader' in value));
    }

    /* 旧单值结算系数迁成门店/贸易商双值；旧费率区间仍先按期插值。 */
    function normalizeRatePair(value) {
        if (isRatePair(value)) {
            return {
                store: value.store == null ? '' : String(value.store),
                trader: value.trader == null ? '' : String(value.trader)
            };
        }
        if (value == null || value === '') return emptyRatePair();
        var text = String(value);
        return { store: text, trader: text };
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
                rates[period] = { store: text, trader: text };
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
            if (!isRatePair(current) || String(current.store || '') !== pair.store || String(current.trader || '') !== pair.trader) {
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
            list.forEach(function (item) {
                if (!item) return;
                if (migrateEnumLabels(item)) changed = true;
                if (blank(item.repayMethod) || REPAY_METHODS.indexOf(item.repayMethod) < 0) {
                    item.repayMethod = '定额付';
                    changed = true;
                }
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
                } else if (!blank(item.periodRatio) || !blank(item.storeRate) || !blank(item.traderRate)) {
                    item.periodRatio = '';
                    item.storeRate = '';
                    item.traderRate = '';
                    changed = true;
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
                    item.repayCycle = '日付';
                    changed = true;
                }
                if (migratePeriodRates(item)) changed = true;
                if (applyDemoAmountFloor(item)) changed = true;
            });
            /* 同一商品包可挂多条分期，但同一结算周期+结算方式只能保留最早一条上的关联。 */
            var packageCycleMethodOwner = {};
            list.slice().sort(function (a, b) {
                return String(a && a.code || '').localeCompare(String(b && b.code || ''));
            }).forEach(function (item) {
                if (!item || !Array.isArray(item.packages)) return;
                var cycle = item.repayCycle || '日付';
                var method = item.repayMethod || '定额付';
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
        return ['周末生鲜包', '肉类组合包', '果蔬尝鲜包'];
    }

    function packageText(row) {
        var value = row && row.packages;
        if (Array.isArray(value)) value = value.filter(Boolean).join('、');
        return show(value);
    }

    function periodText(row) {
        if (row && row.repayMethod === '比例付') {
            if (blank(row.periodRatio) || !isFinite(Number(row.periodRatio))) return '—';
            return Number(row.periodRatio).toFixed(2) + '%';
        }
        var value = row && row.periods;
        if (!Array.isArray(value)) return show(value);
        return show(periodsDisplay(value));
    }

    function moneyText(value) {
        var amount = Number(String(value).replace(/,/g, ''));
        if (!isFinite(amount)) return '';
        return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function ratePairText(pair) {
        var store = pair && !blank(pair.store) && isFinite(Number(pair.store)) ? Number(pair.store).toFixed(2) : '—';
        var trader = pair && !blank(pair.trader) && isFinite(Number(pair.trader)) ? Number(pair.trader).toFixed(2) : '—';
        return '门店' + store + ' / 贸易商' + trader;
    }

    function rateText(row) {
        if (row && row.repayMethod === '比例付') {
            return ratePairText({ store: row.storeRate, trader: row.traderRate });
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

    OctopusPrototype.mount({
        setup: function () {
            var table = ref(null);
            var addDialog = ref(null);
            var dialogTitle = ref('新增分期');
            var periodsFieldLabel = ref('结算期数');
            var afterSave = 'add';
            var slots = { code: 'cell-code', status: 'cell-enabled' };
            var cycleOptions = REPAY_CYCLES.map(function (name) { return { label: name, value: name }; });
            var repayOptions = REPAY_METHODS.map(function (name) { return { label: name, value: name }; });
            var statusOptions = [{ label: '启用', value: '启用' }, { label: '禁用', value: '禁用' }];
            var packageOptions = [];

            function syncPeriodsLabel(method) {
                periodsFieldLabel.value = method === '比例付' ? '结算比例' : '结算期数';
            }
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
                { dataIndex: 'enabled', title: '状态', width: 100 },
                { dataIndex: 'repayCycle', title: '结算周期', minWidth: 110, formatter: function (row) { return show(row.repayCycle); } },
                { dataIndex: 'repayMethod', title: '结算方式', minWidth: 120, formatter: function (row) { return show(row.repayMethod); } },
                { dataIndex: 'periods', title: '结算期数/结算比例', minWidth: 160, formatter: periodText },
                { dataIndex: 'periodRates', title: '结算系数', minWidth: 240, align: 'left', showOverflowTooltip: true, formatter: rateText },
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
                    { field: 'repayCycle', label: '结算周期', control: 'select', required: true, defaultValue: '日付', options: cycleOptions, placeholder: '请选择结算周期' },
                    {
                        field: 'repayMethod',
                        label: '结算方式',
                        control: 'select',
                        required: true,
                        options: repayOptions,
                        placeholder: '请选择结算方式',
                        dependency: {
                            onChange: function (value) {
                                syncPeriodsLabel(value);
                            }
                        }
                    },
                    { field: 'periods', label: periodsFieldLabel.value, control: 'slot', requiredMark: true },
                    { field: 'ratepair', label: '结算系数', control: 'slot', requiredMark: true },
                    { field: 'amountpair', label: '货款区间', control: 'slot', requiredMark: true },
                    { field: 'packages', label: '适用商品包', control: 'select', multiple: true, required: true, defaultValue: [], options: packageOptions, placeholder: '请选择适用商品包' }
                ];
            });

            function requestRows(params) {
                var matched = read().filter(function (row) {
                    if (!includesText(row.code, params.code)) return false;
                    if (!includesText(row.name, params.name)) return false;
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
                    periodsLabel: current.repayMethod === '比例付' ? '结算比例' : '结算期数',
                    periods: periodText(current),
                    rateRange: rateText(current),
                    amountRange: amountText(current),
                    packages: packageText(current),
                    creator: show(current.creator),
                    createdAt: show(current.createdAt),
                    updater: show(current.updater),
                    updatedAt: show(current.updatedAt)
                });
            }

            function openAdd() {
                afterSave = 'add';
                dialogTitle.value = '新增分期';
                syncPeriodsLabel('');
                syncPackageOptions();
                addDialog.value && addDialog.value.showEdit({
                    status: '启用',
                    repayCycle: '日付',
                    repayMethod: '',
                    periodRatio: '',
                    storeRate: '',
                    traderRate: '',
                    periodsText: '',
                    periods: [],
                    periodRates: {}
                });
            }

            function openEdit(row) {
                var current = findRow(row.code) || row;
                afterSave = 'edit';
                dialogTitle.value = '编辑分期';
                syncPeriodsLabel(current.repayMethod);
                syncPackageOptions(current.packages);
                var periods = Array.isArray(current.periods) ? orderedPeriods(current.periods) : [];
                addDialog.value && addDialog.value.showEdit({
                    code: current.code,
                    name: current.name,
                    status: current.enabled === false ? '禁用' : '启用',
                    repayCycle: current.repayCycle || '日付',
                    repayMethod: current.repayMethod || '定额付',
                    periodRatio: current.periodRatio || '',
                    storeRate: current.storeRate || '',
                    traderRate: current.traderRate || '',
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
                    if (blank(values.periodRatio)) {
                        ElMessage.error('请输入结算比例');
                        return false;
                    }
                    if (!validDecimal(values.periodRatio)) {
                        ElMessage.error('结算比例仅支持数字，最多两位小数');
                        return false;
                    }
                    if (Number(values.periodRatio) <= 0) {
                        ElMessage.error('结算比例须大于0');
                        return false;
                    }
                    if (blank(values.storeRate)) {
                        ElMessage.error('请输入门店结算系数');
                        return false;
                    }
                    if (blank(values.traderRate)) {
                        ElMessage.error('请输入贸易商结算系数');
                        return false;
                    }
                    if (!validDecimal(values.storeRate) || !validDecimal(values.traderRate)) {
                        ElMessage.error('结算系数仅支持数字，最多两位小数');
                        return false;
                    }
                    if (Number(values.storeRate) < 1 || Number(values.traderRate) < 1) {
                        ElMessage.error('结算系数不能低于1');
                        return false;
                    }
                    if (Number(values.traderRate) > Number(values.storeRate)) {
                        ElMessage.error('贸易商结算系数不能大于门店结算系数');
                        return false;
                    }
                } else {
                    var periodTokens = parsePeriodTokens(values.periodsText != null ? values.periodsText : periodsDisplay(values.periods));
                    if (!periodTokens.length) {
                        ElMessage.error('请输入结算期数');
                        return false;
                    }
                    var invalidToken = periodTokens.find(function (token) { return !isValidPeriod(token); });
                    if (invalidToken) {
                        ElMessage.error('期数仅支持正整数');
                        return false;
                    }
                    var seenPeriod = {};
                    var duplicatedPeriods = periodTokens.some(function (token) {
                        var period = normalizePeriod(token);
                        if (seenPeriod[period]) return true;
                        seenPeriod[period] = true;
                        return false;
                    });
                    if (duplicatedPeriods) {
                        ElMessage.error('期数不能重复');
                        return false;
                    }
                    var periods = orderedPeriods(periodTokens.map(normalizePeriod));
                    var rates = values.periodRates && typeof values.periodRates === 'object' ? values.periodRates : {};
                    var missingStore = periods.find(function (period) {
                        var pair = normalizeRatePair(rates[period]);
                        return blank(pair.store);
                    });
                    if (missingStore) {
                        ElMessage.error('请输入' + missingStore + '期门店结算系数');
                        return false;
                    }
                    var missingTrader = periods.find(function (period) {
                        var pair = normalizeRatePair(rates[period]);
                        return blank(pair.trader);
                    });
                    if (missingTrader) {
                        ElMessage.error('请输入' + missingTrader + '期贸易商结算系数');
                        return false;
                    }
                    var invalidPeriod = periods.find(function (period) {
                        var pair = normalizeRatePair(rates[period]);
                        return !validDecimal(pair.store) || !validDecimal(pair.trader);
                    });
                    if (invalidPeriod) {
                        ElMessage.error('结算系数仅支持数字，最多两位小数');
                        return false;
                    }
                    var rateBelowOne = periods.find(function (period) {
                        var pair = normalizeRatePair(rates[period]);
                        return Number(pair.store) < 1 || Number(pair.trader) < 1;
                    });
                    if (rateBelowOne) {
                        ElMessage.error(rateBelowOne + '期结算系数不能低于1');
                        return false;
                    }
                    var traderOverStore = periods.find(function (period) {
                        var pair = normalizeRatePair(rates[period]);
                        return Number(pair.trader) > Number(pair.store);
                    });
                    if (traderOverStore) {
                        ElMessage.error(traderOverStore + '期贸易商结算系数不能大于门店结算系数');
                        return false;
                    }
                    values.periods = periods;
                    values.periodRates = {};
                    periods.forEach(function (period) {
                        var pair = normalizeRatePair(rates[period]);
                        values.periodRates[period] = {
                            store: Number(pair.store).toFixed(2),
                            trader: Number(pair.trader).toFixed(2)
                        };
                    });
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
                if (values.repayMethod === '比例付') {
                    values.periodRatio = Number(values.periodRatio).toFixed(2);
                    values.storeRate = Number(values.storeRate).toFixed(2);
                    values.traderRate = Number(values.traderRate).toFixed(2);
                    values.periods = [];
                    values.periodRates = {};
                } else {
                    values.periodRatio = '';
                    values.storeRate = '';
                    values.traderRate = '';
                }
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
                target.name = values.name;
                target.repayCycle = values.repayCycle;
                target.repayMethod = values.repayMethod;
                target.periodRatio = values.periodRatio || '';
                target.storeRate = values.storeRate || '';
                target.traderRate = values.traderRate || '';
                target.periods = values.periods || [];
                target.periodRates = cloneRates(values.periodRates);
                delete target.feeRule;
                delete target.feeRate;
                delete target.penaltyRule;
                delete target.penaltyRate;
                delete target.penaltyAsPercent;
                target.amountMin = values.amountMin;
                target.amountMax = values.amountMax;
                target.packages = values.packages || [];
                target.enabled = values.status !== '禁用';
                target.updater = '用户名';
                target.updatedAt = nowText();
                delete target.rateMin;
                delete target.rateMax;
                delete target.rateRange;
                write(items);
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
                var enabled = target.enabled === false;
                target.enabled = enabled;
                target.updater = '用户名';
                target.updatedAt = nowText();
                write(items);
                ElMessage.success(enabled ? '已启用' : '已禁用');
                table.value && table.value.fetchData();
            }

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
                onPeriodRate: onPeriodRate,
                onPeriodsInput: onPeriodsInput,
                periodRateValue: periodRateValue,
                requestRows: requestRows,
                openDetail: openDetail,
                openAdd: openAdd,
                openEdit: openEdit,
                toggleEnabled: toggleEnabled,
                beforeSubmit: beforeSubmit,
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
})();
