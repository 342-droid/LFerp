/* 付款风险：只看已发生营业日。当天实际付款为 0 才连续计数。单店日均付款额 = 实际付款合计 ÷ 营业日天数，再和生效基准比。不使用百分比进度。 */
(function (global) {
    var GRADES = ['正常', '关注', '预警', '异常'];
    var CONFIG_KEY = 'rbt_risk_config_v3';
    var HANDLE_KEY = 'rbt_risk_handle_v1';
    var HANDLE_STATUSES = ['待处置', '处置中', '已关闭'];
    var STATUS_ALIAS = { '待处理': '待处置', '已核对': '处置中', '已暂停新需求': '已关闭' };
    /* 样例只用来试算规则，不回写每日付款的实际付款。 */
    var SAMPLE_SCRIPTS = [
        { name: '连续 1 天未付款', streak: 1, demandIndex: 0 },
        { name: '连续 3 天未付款', streak: 3, demandIndex: 0 },
        { name: '连续 7 天未付款', streak: 7, demandIndex: 1 },
        { name: '日均付款低于异常线', streak: 0, lowProgress: true, demandIndex: 1 }
    ];

    function blankProfile() {
        return {
            durationTiers: [3, 6, 9, 12],
            lineRules: {},
            watchStreak: 1,
            warnStreak: 3,
            badStreak: 7,
            progressStartDays: 7,
            watchProgress: 33,
            warnProgress: 60,
            badProgress: 80,
            watchJoin: '或',
            warnJoin: '或',
            badJoin: '或',
            watchAlert: '提醒门店核对营业流水、所得佣金、结算比例',
            warnAlert: '提醒门店、贸易商、冷丰；建议暂停该店新的需求',
            badAlert: '提醒门店、贸易商、冷丰、服务商；建议停止该店新的需求，并核对担保金缴纳凭证'
        };
    }

    function defaults() {
        return {
            enabled: true,
            baselineMode: 'static',
            profiles: {
                static: blankProfile(),
                dynamic: blankProfile()
            }
        };
    }

    function percentOf(value, fallback) {
        var num = Number(value);
        if (!isFinite(num) || num <= 0) return fallback;
        if (num <= 1) return Math.round(num * 10000) / 100;
        return num;
    }

    function tiersOf(value) {
        var list = Array.isArray(value) ? value : [];
        var next = [];
        list.forEach(function (item) {
            var months = Number(item);
            if (!/^\d+$/.test(String(item)) || months < 1 || next.indexOf(months) >= 0) return;
            next.push(months);
        });
        next.sort(function (a, b) { return a - b; });
        return next;
    }

    function profileFrom(raw) {
        var pack = blankProfile();
        if (!raw || typeof raw !== 'object') return pack;
        Object.keys(pack).forEach(function (key) {
            if (key === 'durationTiers' || key === 'lineRules') return;
            if (raw[key] == null || raw[key] === '') return;
            pack[key] = raw[key];
        });
        var tiers = tiersOf(raw.durationTiers);
        if (tiers.length) pack.durationTiers = tiers;
        pack.lineRules = {};
        var rules = raw.lineRules && typeof raw.lineRules === 'object' ? raw.lineRules : {};
        Object.keys(rules).forEach(function (name) {
            if (rules[name] && typeof rules[name] === 'object') {
                pack.lineRules[name] = JSON.parse(JSON.stringify(rules[name]));
            }
        });
        pack.watchProgress = percentOf(pack.watchProgress, 33);
        pack.warnProgress = percentOf(pack.warnProgress, 60);
        pack.badProgress = percentOf(pack.badProgress, 80);
        liftShortfall(pack);
        Object.keys(pack.lineRules).forEach(function (name) { liftShortfall(pack.lineRules[name]); });
        return pack;
    }

    /* 旧配置写的是日均占基准的比例，关注 67、预警 40、异常 20，数字递减。
       现改为低于基准的幅度：33、60、80。幅度越大，日均付款额比基准越低。已经是递增的不再折算。 */
    function liftShortfall(rule) {
        if (!rule) return;
        var watch = Number(rule.watchProgress);
        var warn = Number(rule.warnProgress);
        var bad = Number(rule.badProgress);
        if (!(watch > warn && warn > bad)) return;
        rule.watchProgress = Math.round((100 - watch) * 100) / 100;
        rule.warnProgress = Math.round((100 - warn) * 100) / 100;
        rule.badProgress = Math.round((100 - bad) * 100) / 100;
    }

    function applyActive(cfg) {
        var pack = cfg.profiles[cfg.baselineMode] || cfg.profiles.static;
        Object.keys(pack).forEach(function (key) {
            cfg[key] = key === 'lineRules' || key === 'durationTiers' ? pack[key] : pack[key];
        });
        return cfg;
    }

    function readConfig() {
        var base = defaults();
        try {
            var raw = global.localStorage && global.localStorage.getItem(CONFIG_KEY);
            if (!raw) return applyActive(base);
            var saved = JSON.parse(raw);
            if (!saved || typeof saved !== 'object') return applyActive(base);
            base.enabled = saved.enabled !== false;
            base.baselineMode = saved.baselineMode === 'dynamic' ? 'dynamic' : 'static';
            if (saved.profiles && saved.profiles.static && saved.profiles.dynamic) {
                base.profiles.static = profileFrom(saved.profiles.static);
                base.profiles.dynamic = profileFrom(saved.profiles.dynamic);
            } else {
                var flat = profileFrom(saved);
                base.profiles.static = flat;
                base.profiles.dynamic = profileFrom(flat);
            }
        } catch (err) {
            return applyActive(defaults());
        }
        return applyActive(base);
    }

    function issuesOf(cfg) {
        var days = [cfg.watchStreak, cfg.warnStreak, cfg.badStreak];
        var progresses = [cfg.watchProgress, cfg.warnProgress, cfg.badProgress];
        var i;
        for (i = 0; i < days.length; i++) {
            if (!/^\d+$/.test(String(days[i])) || Number(days[i]) < 1) {
                return '连续未付款天数须为大于 0 的整数';
            }
        }
        if (!(Number(cfg.watchStreak) < Number(cfg.warnStreak) && Number(cfg.warnStreak) < Number(cfg.badStreak))) {
            return '连续未付款天数须按关注、预警、异常递增';
        }
        if (!/^\d+$/.test(String(cfg.progressStartDays)) || Number(cfg.progressStartDays) < 1) {
            return '起算天数须为大于 0 的整数';
        }
        for (i = 0; i < progresses.length; i++) {
            var progress = Number(progresses[i]);
            if (!isFinite(progress) || progress <= 0 || progress >= 100) return '低于基准的比例须大于 0，且小于 100';
        }
        if (!(Number(cfg.watchProgress) < Number(cfg.warnProgress) && Number(cfg.warnProgress) < Number(cfg.badProgress))) {
            return '低于基准的比例须按关注、预警、异常递增';
        }
        if (cfg.durationTiers != null && !tiersOf(cfg.durationTiers).length) return '预期时长至少保留一个按月档位';
        var joins = [cfg.watchJoin, cfg.warnJoin, cfg.badJoin];
        for (i = 0; i < joins.length; i++) {
            if (joins[i] !== '或' && joins[i] !== '且') return '条件关系请选择或、且';
        }
        if (!String(cfg.watchAlert || '').trim() || !String(cfg.warnAlert || '').trim() || !String(cfg.badAlert || '').trim()) {
            return '三个等级的异常提醒都要填写';
        }
        return '';
    }

    function issuesOfProfile(pack, label) {
        var issue = issuesOf(pack);
        if (issue) return label + '：' + issue;
        var names = Object.keys(pack.lineRules || {});
        var n;
        for (n = 0; n < names.length; n++) {
            issue = issuesOf(pack.lineRules[names[n]]);
            if (issue) return label + ' · ' + names[n] + '：' + issue;
        }
        return '';
    }

    function saveConfig(cfg) {
        var previous = readConfig();
        var next = defaults();
        next.enabled = !!(cfg && cfg.enabled);
        next.baselineMode = cfg && cfg.baselineMode === 'dynamic' ? 'dynamic' : 'static';
        var given = cfg && cfg.profiles;
        next.profiles.static = profileFrom(given && given.static ? given.static : previous.profiles.static);
        next.profiles.dynamic = profileFrom(given && given.dynamic ? given.dynamic : previous.profiles.dynamic);
        ['watchStreak', 'warnStreak', 'badStreak', 'progressStartDays'].forEach(function (key) {
            next.profiles.static[key] = Number(next.profiles.static[key]);
            next.profiles.dynamic[key] = Number(next.profiles.dynamic[key]);
        });
        var issue = issuesOfProfile(next.profiles.static, '静态基准');
        if (issue) return issue;
        issue = issuesOfProfile(next.profiles.dynamic, '动态基准');
        if (issue) return issue;
        applyActive(next);
        global.localStorage.setItem(CONFIG_KEY, JSON.stringify(next));
        return '';
    }

    function money(value) {
        var num = Number(value);
        if (!isFinite(num)) return '0.00';
        return num.toFixed(2);
    }

    function amountOf(value) {
        var num = Number(String(value == null ? '' : value).replace(/,/g, '').replace(/^¥/, ''));
        return isFinite(num) ? num : 0;
    }

    /* 剩余付款额 = 总金额 − 已付款金额。已付款金额是已发生营业日的实际付款合计。 */
    function remainingOf(total, actual) {
        return money(Math.max(0, Math.round((amountOf(total) - amountOf(actual)) * 100) / 100));
    }

    /* line 是低于基准的幅度。33 表示日均付款额不到基准的 67%。幅度越大，日均越低。 */
    function belowProgress(progress, line) {
        var gap = Number(line);
        if (progress == null || !isFinite(progress) || !isFinite(gap)) return false;
        return progress < 1 - gap / 100;
    }

    function joinMode(value) {
        return value === '且' ? '且' : '或';
    }

    /* 或：连续未付款、日均付款低于基准满足一个即命中。且：两个都要满足。未满起算天数时，基准条件不命中。 */
    function hits(streak, daily, elapsed, days, line, join, startDays) {
        var byDay = streak >= Number(days);
        var byRate = Number(elapsed) >= Number(startDays) && belowProgress(daily, line);
        return joinMode(join) === '且' ? (byDay && byRate) : (byDay || byRate);
    }

    function gradeOf(streak, daily, elapsed, cfg) {
        var rule = cfg || readConfig();
        if (!rule.enabled) return '正常';
        if (hits(streak, daily, elapsed, rule.badStreak, rule.badProgress, rule.badJoin, rule.progressStartDays)) return '异常';
        if (hits(streak, daily, elapsed, rule.warnStreak, rule.warnProgress, rule.warnJoin, rule.progressStartDays)) return '预警';
        if (hits(streak, daily, elapsed, rule.watchStreak, rule.watchProgress, rule.watchJoin, rule.progressStartDays)) return '关注';
        return '正常';
    }

    function alertSentence(grade, cfg) {
        var rule = cfg || readConfig();
        if (grade === '关注') return rule.watchAlert;
        if (grade === '预警') return rule.warnAlert;
        if (grade === '异常') return rule.badAlert;
        return '';
    }

    function dayLine(grade, rule) {
        if (grade === '异常') return Number(rule.badStreak);
        if (grade === '预警') return Number(rule.warnStreak);
        if (grade === '关注') return Number(rule.watchStreak);
        return Infinity;
    }

    function progressLine(grade, rule) {
        if (grade === '异常') return rule.badProgress;
        if (grade === '预警') return rule.warnProgress;
        if (grade === '关注') return rule.watchProgress;
        return 0;
    }

    function joinOf(grade, rule) {
        if (grade === '异常') return joinMode(rule.badJoin);
        if (grade === '预警') return joinMode(rule.warnJoin);
        if (grade === '关注') return joinMode(rule.watchJoin);
        return '或';
    }

    function driverText(grade, streak, daily, elapsed, cfg) {
        var rule = cfg || readConfig();
        var dayText = '连续未付款 ' + streak + ' 天';
        var progressText = '日均付款低于' + (rule.baselineMode === 'dynamic' ? '动态' : '静态') + '基准';
        var byDay = streak >= dayLine(grade, rule);
        var byRate = Number(elapsed) >= Number(rule.progressStartDays) && belowProgress(daily, progressLine(grade, rule));
        if (joinOf(grade, rule) === '且') return dayText + '，且' + progressText;
        if (byDay && !byRate) return dayText;
        if (byRate && !byDay) return progressText;
        return byDay ? dayText : progressText;
    }

    /* 自然日跨度。评级起算用的是已发生营业日天数，不用这段自然日。 */
    function elapsedDays(dates) {
        if (!dates.length) return 0;
        var start = Date.parse(dates[0]);
        var end = Date.parse(dates[dates.length - 1]);
        if (!isFinite(start) || !isFinite(end) || end < start) return dates.length;
        return Math.round((end - start) / 86400000) + 1;
    }

    function baselineModeText(cfg) {
        return (cfg || readConfig()).baselineMode === 'dynamic' ? '动态基准' : '静态基准';
    }

    function bizLineOf(item) {
        var stores = global.RbtStoreData && typeof global.RbtStoreData.list === 'function' ? global.RbtStoreData.list() : [];
        var code = item && item.storeCode;
        var found = null;
        stores.some(function (row) {
            if (row && row.code === code) {
                found = row;
                return true;
            }
            return false;
        });
        return (found && found.bizLine) || (item && item.bizLine) || '';
    }

    function lineRule(bizLine, cfg) {
        var rule = cfg || readConfig();
        var extra = rule.lineRules && bizLine && rule.lineRules[bizLine];
        if (!extra) return rule;
        var next = {};
        Object.keys(rule).forEach(function (key) { next[key] = rule[key]; });
        Object.keys(extra).forEach(function (key) {
            if (extra[key] == null || extra[key] === '') return;
            next[key] = extra[key];
        });
        next.watchProgress = percentOf(next.watchProgress, rule.watchProgress);
        next.warnProgress = percentOf(next.warnProgress, rule.warnProgress);
        next.badProgress = percentOf(next.badProgress, rule.badProgress);
        next.baselineMode = rule.baselineMode;
        next.durationTiers = rule.durationTiers;
        next.enabled = rule.enabled;
        return next;
    }

    function monthsOf(item, tiers) {
        var list = tiersOf(tiers);
        var months = Number(item && item.expectedMonths);
        if (list.indexOf(months) >= 0) return months;
        if (!list.length) return 6;
        var code = String(item && (item.productCode || item.code) || '');
        var n = 0;
        var i;
        for (i = 0; i < code.length; i++) n += code.charCodeAt(i);
        return list[n % list.length];
    }

    /* 静态基准日均 = 产品金额 ÷ 预期付款天数。预期时长跟产品走，一个月按 30 天。 */
    function staticBaseline(item, cfg) {
        var goods = amountOf(item && item.goodsAmount);
        var days = monthsOf(item, (cfg || readConfig()).durationTiers) * 30;
        if (!(goods > 0) || !(days > 0)) return 0;
        return Math.round(goods / days * 100) / 100;
    }

    /* 事业线和产品的对应。结算比例以产品配置为准，页面还没打开过产品配置时用这套默认。 */
    var LINE_PRODUCT = {
        '餐饮': 'FQ00001',
        '康美': 'FQ00002',
        '纯私域': 'FQ00003'
    };
    var PRODUCT_RATIOS = {
        FQ00001: { POS: 10, '直播': 10, '商城': 10 },
        FQ00002: { POS: 8, '直播': 8, '商城': 8 },
        FQ00003: { POS: 10, '直播': 10, '商城': 10 }
    };

    function productRatios(code) {
        var fallback = PRODUCT_RATIOS[code] || null;
        try {
            var raw = global.sessionStorage && global.sessionStorage.getItem('rbt_installment_v3');
            var list = raw ? JSON.parse(raw) : null;
            if (!Array.isArray(list)) return fallback;
            var found = null;
            list.some(function (item) {
                if (item && item.code === code) {
                    found = item;
                    return true;
                }
                return false;
            });
            if (!found || !found.settleRatios) return fallback;
            var out = {};
            found.settleRatios.forEach(function (channel) {
                var ratio = Number(String(channel && channel.fallback || '').replace('%', ''));
                if (channel && channel.channel && isFinite(ratio) && ratio > 0) out[channel.channel] = ratio;
            });
            return Object.keys(out).length ? out : fallback;
        } catch (e) {
            return fallback;
        }
    }

    function storesOfLine(bizLine) {
        var api = global.RbtStoreData;
        var list = api && typeof api.list === 'function' ? api.list() : [];
        var seen = {};
        var rows = [];
        list.forEach(function (store) {
            if (!store || store.bizLine !== bizLine || !store.code || seen[store.code]) return;
            seen[store.code] = 1;
            rows.push(store);
        });
        return rows;
    }

    function storeScale(code) {
        var text = String(code || '');
        var n = 0;
        var i;
        for (i = 0; i < text.length; i++) n += text.charCodeAt(i);
        return 0.82 + (n % 6) * 0.06;
    }

    /* 动态基准日均 = 该事业线全部门店的营收佣金，按该事业线产品的结算规则模拟出应付款合计 ÷ 这些门店的营业日次数总和。
       所得佣金 = 营业流水 × 门店佣金比例。应付款 = 所得佣金 × 渠道结算比例。提前支付不参与。
       营业日按门店分别计数后再相加：同一门店同一天多个渠道算 1 天，不同门店同一天分别计算。 */
    function dynamicBaseline(bizLine) {
        var daily = global.RbtDailyFulfill;
        var facts = daily && typeof daily.revenueFacts === 'function' ? daily.revenueFacts() : [];
        var ratios = productRatios(LINE_PRODUCT[bizLine]);
        if (!bizLine || !facts.length || !ratios) return 0;
        var rate = typeof daily.commissionRate === 'number' ? daily.commissionRate : 0.1;
        var sum = 0;
        var slots = 0;
        storesOfLine(bizLine).forEach(function (store) {
            var scale = storeScale(store.code);
            var dates = {};
            facts.forEach(function (fact) {
                var ratio = ratios[fact.channel];
                if (!fact || !fact.date || !(ratio > 0)) return;
                var turnover = Math.round(Number(fact.turnover) * scale * 100) / 100;
                var commission = Math.round(turnover * rate * 100) / 100;
                sum += Math.round(commission * ratio) / 100;
                dates[fact.date] = 1;
            });
            slots += Object.keys(dates).length;
        });
        if (!slots) return 0;
        return Math.round(sum / slots * 100) / 100;
    }

    function baselineAmount(item, cfg) {
        var rule = cfg || readConfig();
        if (rule.baselineMode === 'dynamic') return dynamicBaseline(bizLineOf(item));
        return staticBaseline(item, rule);
    }

    function baselineText(item, cfg, amount) {
        var rule = cfg || readConfig();
        var mode = baselineModeText(rule);
        if (!(amount > 0)) return mode + ' —';
        var extra = '';
        if (rule.baselineMode !== 'dynamic') extra = ' · ' + monthsOf(item, rule.durationTiers) + '个月';
        return mode + ' ¥' + money(amount) + extra;
    }

    /* 同一天多个渠道先加总。这一天实际付款合计为 0，才算未付款。 */
    function assessDays(days, receivable, totalAmount, item) {
        var sorted = (days || []).slice().sort(function (a, b) {
            return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
        });
        var due = 0;
        var actual = 0;
        var byDate = {};
        var dates = [];
        sorted.forEach(function (row) {
            var date = row.date;
            if (!byDate[date]) {
                byDate[date] = 0;
                dates.push(date);
            }
            due += Number(row.due) || 0;
            actual += Number(row.actual) || 0;
            byDate[date] += Number(row.actual) || 0;
        });
        due = Math.round(due * 100) / 100;
        actual = Math.round(actual * 100) / 100;
        var streak = 0;
        var lastMiss = '';
        var i;
        for (i = dates.length - 1; i >= 0; i--) {
            var dayActual = Math.round(byDate[dates[i]] * 100) / 100;
            if (dayActual <= 0) {
                if (!streak) lastMiss = dates[i];
                streak += 1;
            } else {
                break;
            }
        }
        var businessDays = dates.length;
        var storeDaily = businessDays ? Math.round(actual / businessDays * 100) / 100 : null;
        var rule = lineRule(bizLineOf(item));
        var baseline = baselineAmount(item, rule);
        var ratio = storeDaily != null && baseline > 0 ? storeDaily / baseline : null;
        var grade = gradeOf(streak, ratio, businessDays, rule);
        return {
            due: money(due),
            actual: money(actual),
            gap: remainingOf(totalAmount, actual),
            progress: storeDaily == null ? '—' : ('¥' + money(storeDaily)),
            progressRate: ratio,
            baseline: baselineText(item, rule, baseline),
            elapsed: businessDays,
            streak: streak,
            lastMiss: lastMiss || '—',
            grade: grade,
            bizLine: bizLineOf(item)
        };
    }

    function receivableOf(item) {
        var api = global.RbtDemandData;
        var pack = api && typeof api.receivables === 'function' ? api.receivables(item) : null;
        if (!pack) return 0;
        var total = (Number(pack.trader) || 0) + (Number(pack.lengfeng) || 0) + (Number(pack.provider) || 0);
        return Math.round(total * 100) / 100;
    }

    function activeDemands() {
        var api = global.RbtDemandData;
        var daily = global.RbtDailyFulfill;
        var list = api && typeof api.list === 'function' ? api.list() : [];
        return list.filter(function (item) {
            return item && (item.status === '门店付款中' || item.status === '还款中') && daily && typeof daily.daysOf === 'function' && daily.daysOf(item).length && !(typeof daily.isSettled === 'function' && daily.isSettled(item.code));
        });
    }

    function liveRows() {
        var daily = global.RbtDailyFulfill;
        return activeDemands().map(function (item) {
            var fact = assessDays(daily.daysOf(item), receivableOf(item), item.amount, item);
            return {
                id: item.code,
                storeName: item.storeName || '—',
                storeCode: item.storeCode || '',
                bizLine: fact.bizLine,
                demandCode: item.code,
                streak: fact.streak,
                due: fact.due,
                actual: fact.actual,
                gap: fact.gap,
                progress: fact.progress,
                baseline: fact.baseline,
                grade: fact.grade,
                lastMiss: fact.lastMiss,
                alert: alertText(fact.grade, item.storeName, item.code, fact.streak, fact.gap, fact.progressRate, fact.elapsed, lineRule(fact.bizLine))
            };
        });
    }

    function scenario(script, cfg) {
        var rule = cfg || readConfig();
        var demands = activeDemands();
        var item = demands[script.demandIndex] || demands[0] || null;
        var daily = global.RbtDailyFulfill;
        var days = item && daily && typeof daily.daysOf === 'function' ? daily.daysOf(item) : [];
        var base = receivableOf(item);
        var line = lineRule(bizLineOf(item), rule);
        var fact = assessDays(days, base, item && item.amount, item);
        var progress = fact.progressRate;
        var elapsed = fact.elapsed;
        var due = fact.due;
        var actual = fact.actual;
        var gap = fact.gap;
        var shown = fact.progress;
        var baseline = fact.baseline;
        if (!script.lowProgress) progress = 1;
        if (script.lowProgress) {
            var floor = 1 - Number(line.badProgress) / 100;
            progress = floor > 0 ? floor * 0.8 : 0;
            elapsed = Number(line.progressStartDays);
            var bench = baselineAmount(item, line);
            var storeDaily = bench > 0 ? Math.round(bench * progress * 100) / 100 : 0;
            due = money(storeDaily * elapsed);
            actual = due;
            gap = remainingOf(item && item.amount, actual);
            shown = '¥' + money(storeDaily);
            baseline = baselineText(item, line, bench);
        }
        var grade = gradeOf(script.streak, progress, elapsed, line);
        return {
            name: script.name,
            item: item,
            bizLine: bizLineOf(item),
            streak: script.streak,
            due: due,
            actual: actual,
            gap: gap,
            progress: shown,
            baseline: baseline,
            progressRate: progress,
            grade: grade,
            alert: alertText(grade, item && item.storeName, item && item.code, script.streak, gap, progress, elapsed, line)
        };
    }

    function scenarios() {
        return SAMPLE_SCRIPTS.map(function (script) { return scenario(script); });
    }

    function alertText(grade, storeName, code, streak, gap, daily, elapsed, cfg) {
        if (grade === '正常') return '';
        var who = (storeName || '该门店') + ' ' + (code || '');
        var reason = driverText(grade, streak, daily, elapsed, cfg);
        return who + ' ' + reason + '，剩余付款额 ¥' + gap + '。' + alertSentence(grade, cfg);
    }

    function rules(cfg) {
        var rule = cfg || readConfig();
        return [
            { grade: '正常', rule: '未达到关注的条件', alert: '不提醒' },
            { grade: '关注', rule: '连续未付款达到 ' + rule.watchStreak + ' 天，' + joinMode(rule.watchJoin) + '日均付款比' + baselineModeText(rule) + '低 ' + rule.watchProgress + '%', alert: rule.watchAlert },
            { grade: '预警', rule: '连续未付款达到 ' + rule.warnStreak + ' 天，' + joinMode(rule.warnJoin) + '日均付款比' + baselineModeText(rule) + '低 ' + rule.warnProgress + '%', alert: rule.warnAlert },
            { grade: '异常', rule: '连续未付款达到 ' + rule.badStreak + ' 天，' + joinMode(rule.badJoin) + '日均付款比' + baselineModeText(rule) + '低 ' + rule.badProgress + '%', alert: rule.badAlert }
        ];
    }

    function trialRows(cfg) {
        var rule = cfg || readConfig();
        return SAMPLE_SCRIPTS.map(function (script) {
            var row = scenario(script, rule);
            return {
                name: script.name,
                streak: row.streak,
                progress: row.progress,
                grade: row.grade,
                alert: row.grade === '正常' ? '不提醒' : alertSentence(row.grade, rule)
            };
        });
    }

    function handles() {
        try {
            var raw = global.localStorage && global.localStorage.getItem(HANDLE_KEY);
            var saved = raw ? JSON.parse(raw) : {};
            return saved && typeof saved === 'object' ? saved : {};
        } catch (err) {
            return {};
        }
    }

    function handleOf(id) {
        var saved = handles()[id] || {};
        var status = saved.status;
        if (STATUS_ALIAS[status]) status = STATUS_ALIAS[status];
        return {
            status: HANDLE_STATUSES.indexOf(status) >= 0 ? status : '待处置',
            note: saved.note || '',
            measure: saved.measure || '',
            result: saved.result || '',
            handler: saved.handler || '',
            pauseNew: !!saved.pauseNew,
            at: saved.at || ''
        };
    }

    function saveHandle(id, patch) {
        if (!id) return;
        var all = handles();
        var status = patch && patch.status;
        if (STATUS_ALIAS[status]) status = STATUS_ALIAS[status];
        if (HANDLE_STATUSES.indexOf(status) < 0) status = '待处置';
        all[id] = {
            status: status,
            note: patch && patch.note ? String(patch.note).trim() : '',
            measure: patch && patch.measure ? String(patch.measure).trim() : '',
            result: patch && patch.result ? String(patch.result).trim() : '',
            handler: patch && patch.handler ? String(patch.handler).trim() : '',
            pauseNew: !!(patch && patch.pauseNew),
            at: new Date().toISOString()
        };
        global.localStorage.setItem(HANDLE_KEY, JSON.stringify(all));
    }

    function latestDate(item) {
        var daily = global.RbtDailyFulfill;
        var days = item && daily && typeof daily.daysOf === 'function' ? daily.daysOf(item) : [];
        if (!days.length) return '—';
        return days[days.length - 1].date || '—';
    }

    function sampleRows() {
        var demands = activeDemands();
        return SAMPLE_SCRIPTS.map(function (script, index) {
            var row = scenario(script);
            var item = row.item || demands[script.demandIndex] || demands[0] || null;
            var id = 'sample:' + (item && item.code ? item.code : 'none') + ':' + index;
            var handle = handleOf(id);
            return {
                id: id,
                storeName: item && item.storeName ? item.storeName : '—',
                storeCode: item && item.storeCode ? item.storeCode : '',
                bizLine: row.bizLine || '',
                demandCode: item && item.code ? item.code : '',
                streak: row.streak,
                due: row.due,
                actual: row.actual,
                gap: row.gap,
                progress: row.progress,
                baseline: row.baseline,
                grade: row.grade,
                lastMiss: row.streak ? latestDate(item) : '—',
                alert: row.alert,
                source: '持续未付款样例',
                scene: script.name,
                handleStatus: handle.status,
                handleNote: handle.note,
                handleMeasure: handle.measure,
                handleResult: handle.result,
                handleHandler: handle.handler,
                handlePause: handle.pauseNew,
                handleAt: handle.at
            };
        }).filter(function (row) { return row.grade !== '正常'; });
    }

    function ledgerRows() {
        return liveRows().filter(function (row) { return row.grade !== '正常'; }).map(function (row) {
            var id = 'ledger:' + row.demandCode;
            var handle = handleOf(id);
            return {
                id: id,
                storeName: row.storeName,
                storeCode: row.storeCode,
                bizLine: row.bizLine || '',
                demandCode: row.demandCode,
                streak: row.streak,
                due: row.due,
                actual: row.actual,
                gap: row.gap,
                progress: row.progress,
                baseline: row.baseline,
                grade: row.grade,
                lastMiss: row.lastMiss,
                alert: row.alert,
                source: '当前台账',
                scene: '当前台账',
                handleStatus: handle.status,
                handleNote: handle.note,
                handleMeasure: handle.measure,
                handleResult: handle.result,
                handleHandler: handle.handler,
                handlePause: handle.pauseNew,
                handleAt: handle.at
            };
        });
    }

    function exceptionRows() {
        if (!readConfig().enabled) return [];
        return ledgerRows().concat(sampleRows());
    }

    var LINE_ORDER = ['餐饮', '康美', '纯私域', '集团内部'];

    function lineRank(name) {
        var index = LINE_ORDER.indexOf(name);
        return index < 0 ? LINE_ORDER.length : index;
    }

    /* 产品跟着事业线走，不跟着某一家门店。同一事业线、同一产品、同一金额只留一条。 */
    function staticProducts() {
        var api = global.RbtDemandData;
        var list = api && typeof api.list === 'function' ? api.list() : [];
        var seen = {};
        var rows = [];
        list.forEach(function (item) {
            if (!item || item.repayMethod !== '比例付') return;
            var goods = amountOf(item.goodsAmount);
            if (!(goods > 0)) return;
            var line = bizLineOf(item);
            if (!line) return;
            var name = item.installmentName || item.packageName || '产品';
            var code = item.installmentCode || name;
            var key = line + ':' + code + ':' + goods;
            if (seen[key]) return;
            seen[key] = 1;
            rows.push({ line: line, name: name, goods: goods });
        });
        rows.sort(function (a, b) {
            var diff = lineRank(a.line) - lineRank(b.line);
            if (diff) return diff;
            return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
        });
        return rows;
    }

    function payingDemands() {
        var api = global.RbtDemandData;
        var list = api && typeof api.list === 'function' ? api.list() : [];
        return list.filter(function (item) {
            return item && (item.status === '门店付款中' || item.status === '还款中') && item.repayMethod === '比例付';
        });
    }

    /* 配置页展示当前条件下的基准日均。只读。动态基准按事业线、每个营业日重算。 */
    function baselinePreview(mode, lineName, tiers) {
        var dynamic = mode === 'dynamic';
        var cfg = { baselineMode: dynamic ? 'dynamic' : 'static', durationTiers: tiersOf(tiers) };
        var rows = [];
        if (dynamic) {
            var names = lineName ? [lineName] : LINE_ORDER.slice();
            names.forEach(function (name) {
                var amount = dynamicBaseline(name);
                rows.push({
                    cells: [name, amount > 0 ? ('¥' + money(amount)) : '—']
                });
            });
            return {
                kind: 'list',
                columns: ['事业线', '基准日均'],
                moneyAt: [1],
                tip: '应付款用该事业线全部门店已发生的营收佣金模拟：所得佣金 = 营业流水 × 门店佣金比例，再乘本事业线产品的渠道结算比例。营业日按各门店分别计数后相加，同一门店同一天多个渠道只算 1 天。提前支付不参与。每个营业日重算一次，不能手改。',
                rows: rows
            };
        }
        staticProducts().forEach(function (product) {
            if (lineName && product.line !== lineName) return;
            rows.push({
                lead: lineName ? [product.name] : [product.line, product.name],
                cells: cfg.durationTiers.map(function (months) {
                    var days = months * 30;
                    var amount = product.goods > 0 && days > 0 ? Math.round(product.goods / days * 100) / 100 : 0;
                    return amount > 0 ? ('¥' + money(amount)) : '—';
                })
            });
        });
        return {
            kind: 'matrix',
            lead: lineName ? ['产品'] : ['事业线', '产品'],
            columns: cfg.durationTiers.map(function (months) { return months + '个月'; }),
            tip: lineName
                ? (lineName + '只用本事业线的产品。静态基准 = 产品金额 ÷（该档预期月数 × 30），不按门店拆。每一档各有一个值，不能手改。')
                : '不同事业线对应不同产品。静态基准 = 产品金额 ÷（该档预期月数 × 30），不按门店拆。每一档各有一个值，不能手改。',
            rows: rows
        };
    }

    global.RbtRisk = {
        grades: GRADES,
        handleStatuses: HANDLE_STATUSES,
        defaults: defaults,
        readConfig: readConfig,
        issuesOf: issuesOf,
        saveConfig: saveConfig,
        trialRows: trialRows,
        liveRows: liveRows,
        exceptionRows: exceptionRows,
        saveHandle: saveHandle,
        scenarios: scenarios,
        rules: rules,
        assessDays: assessDays,
        receivableOf: receivableOf,
        bizLineOf: bizLineOf,
        baselineModeText: baselineModeText,
        baselinePreview: baselinePreview
    };
})(window);
