/* 履约风险：只看已发生日期。实际履行为 0 的日期从最近一天往前连续计数。日均履行进度 = 累计履行进度 ÷ 已履约天数。未满起算天数不看日均。 */
(function (global) {
    var GRADES = ['正常', '关注', '预警', '异常'];
    var CONFIG_KEY = 'rbt_risk_config_v3';
    var HANDLE_KEY = 'rbt_risk_handle_v1';
    var HANDLE_STATUSES = ['待处理', '已核对', '已暂停新需求'];
    /* 样例只用来试算规则，不回写每日履行的实际履行。 */
    var SAMPLE_SCRIPTS = [
        { name: '连续 1 天未履行', streak: 1, demandIndex: 0 },
        { name: '连续 3 天未履行', streak: 3, demandIndex: 0 },
        { name: '连续 7 天未履行', streak: 7, demandIndex: 1 },
        { name: '日均履行进度低于异常线', streak: 0, lowProgress: true, demandIndex: 1 }
    ];

    function defaults() {
        return {
            enabled: true,
            watchStreak: 1,
            warnStreak: 3,
            badStreak: 7,
            progressStartDays: 7,
            watchProgress: 0.67,
            warnProgress: 0.4,
            badProgress: 0.2,
            watchJoin: '或',
            warnJoin: '或',
            badJoin: '或',
            watchAlert: '提醒门店核对营业流水、所得佣金、结算比例',
            warnAlert: '提醒门店、贸易商、冷丰；建议暂停该店新的需求',
            badAlert: '提醒门店、贸易商、冷丰、服务商；建议停止该店新的需求，并核对担保金缴纳凭证'
        };
    }

    function readConfig() {
        var base = defaults();
        try {
            var raw = global.localStorage && global.localStorage.getItem(CONFIG_KEY);
            if (!raw) return base;
            var saved = JSON.parse(raw);
            if (!saved || typeof saved !== 'object') return base;
            Object.keys(base).forEach(function (key) {
                if (saved[key] == null || saved[key] === '') return;
                base[key] = saved[key];
            });
            base.enabled = saved.enabled !== false;
        } catch (err) {
            return defaults();
        }
        return base;
    }

    function issuesOf(cfg) {
        var days = [cfg.watchStreak, cfg.warnStreak, cfg.badStreak];
        var progresses = [cfg.watchProgress, cfg.warnProgress, cfg.badProgress];
        var i;
        for (i = 0; i < days.length; i++) {
            if (!/^\d+$/.test(String(days[i])) || Number(days[i]) < 1) {
                return '连续未履行天数须为大于 0 的整数';
            }
        }
        if (!(Number(cfg.watchStreak) < Number(cfg.warnStreak) && Number(cfg.warnStreak) < Number(cfg.badStreak))) {
            return '连续未履行天数须按关注、预警、异常递增';
        }
        if (!/^\d+$/.test(String(cfg.progressStartDays)) || Number(cfg.progressStartDays) < 1) {
            return '进度起算天数须为大于 0 的整数';
        }
        for (i = 0; i < progresses.length; i++) {
            var progress = Number(progresses[i]);
            if (!isFinite(progress) || progress <= 0 || progress > 100) return '日均履行进度须大于 0，且不超过 100';
        }
        if (!(Number(cfg.watchProgress) > Number(cfg.warnProgress) && Number(cfg.warnProgress) > Number(cfg.badProgress))) {
            return '日均履行进度须按关注、预警、异常递减';
        }
        var joins = [cfg.watchJoin, cfg.warnJoin, cfg.badJoin];
        for (i = 0; i < joins.length; i++) {
            if (joins[i] !== '或' && joins[i] !== '且') return '条件关系请选择或、且';
        }
        if (!String(cfg.watchAlert || '').trim() || !String(cfg.warnAlert || '').trim() || !String(cfg.badAlert || '').trim()) {
            return '三个等级的异常提醒都要填写';
        }
        return '';
    }

    function saveConfig(cfg) {
        var next = defaults();
        Object.keys(next).forEach(function (key) {
            if (cfg && cfg[key] != null && cfg[key] !== '') next[key] = cfg[key];
        });
        next.enabled = !!(cfg && cfg.enabled);
        next.watchStreak = Number(next.watchStreak);
        next.warnStreak = Number(next.warnStreak);
        next.badStreak = Number(next.badStreak);
        next.progressStartDays = Number(next.progressStartDays);
        next.watchProgress = Number(next.watchProgress);
        next.warnProgress = Number(next.warnProgress);
        next.badProgress = Number(next.badProgress);
        var issue = issuesOf(next);
        if (issue) return issue;
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

    /* 剩余履行额 = 总金额 − 已履行金额。已履行金额是已发生日期的实际履行合计。 */
    function remainingOf(total, actual) {
        return money(Math.max(0, Math.round((amountOf(total) - amountOf(actual)) * 100) / 100));
    }

    function belowProgress(progress, line) {
        return progress != null && isFinite(progress) && progress < Number(line) / 100;
    }

    function joinMode(value) {
        return value === '且' ? '且' : '或';
    }

    /* 或：连续未履行、日均进度满足一个即命中。且：两个都要满足。未满起算天数时，日均条件不命中。 */
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
        var dayText = '连续未履行 ' + streak + ' 天';
        var rate = daily == null || !isFinite(daily) ? 0 : daily;
        var progressText = '日均履行进度 ' + (rate * 100).toFixed(2) + '%';
        var byDay = streak >= dayLine(grade, rule);
        var byRate = Number(elapsed) >= Number(rule.progressStartDays) && belowProgress(daily, progressLine(grade, rule));
        if (joinOf(grade, rule) === '且') return dayText + '，且' + progressText;
        if (byDay && !byRate) return dayText;
        if (byRate && !byDay) return progressText;
        return byDay ? dayText : progressText;
    }

    /* 已履约天数：最早到最晚的已发生日期，含首尾。中间没有流水的日子也算进去。 */
    function elapsedDays(dates) {
        if (!dates.length) return 0;
        var start = Date.parse(dates[0]);
        var end = Date.parse(dates[dates.length - 1]);
        if (!isFinite(start) || !isFinite(end) || end < start) return dates.length;
        return Math.round((end - start) / 86400000) + 1;
    }

    /* 同一天可能有多个渠道。这一天的实际履行合计为 0，才算未履行。 */
    function assessDays(days, receivable, totalAmount) {
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
        var base = Number(receivable);
        var elapsed = elapsedDays(dates);
        var progress = sorted.length && isFinite(base) && base > 0 ? actual / base : null;
        var daily = progress != null && elapsed > 0 ? progress / elapsed : null;
        return {
            due: money(due),
            actual: money(actual),
            gap: remainingOf(totalAmount, actual),
            progress: daily == null ? '—' : (daily * 100).toFixed(2) + '%',
            progressRate: daily,
            elapsed: elapsed,
            streak: streak,
            lastMiss: lastMiss || '—',
            grade: gradeOf(streak, daily, elapsed)
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
            return item && (item.status === '门店付款中' || item.status === '还款中') && daily && typeof daily.daysOf === 'function' && daily.daysOf(item).length;
        });
    }

    function liveRows() {
        var daily = global.RbtDailyFulfill;
        return activeDemands().map(function (item) {
            var fact = assessDays(daily.daysOf(item), receivableOf(item), item.amount);
            return {
                id: item.code,
                storeName: item.storeName || '—',
                storeCode: item.storeCode || '',
                demandCode: item.code,
                streak: fact.streak,
                due: fact.due,
                actual: fact.actual,
                gap: fact.gap,
                progress: fact.progress,
                grade: fact.grade,
                lastMiss: fact.lastMiss,
                alert: alertText(fact.grade, item.storeName, item.code, fact.streak, fact.gap, fact.progressRate, fact.elapsed)
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
        var fact = assessDays(days, base, item && item.amount);
        var progress = fact.progressRate;
        var elapsed = fact.elapsed;
        var due = fact.due;
        var actual = fact.actual;
        var gap = fact.gap;
        if (script.lowProgress) {
            progress = Number(rule.badProgress) / 100 * 0.8;
            elapsed = Number(rule.progressStartDays);
            var amount = base > 0 ? Math.round(base * progress * elapsed * 100) / 100 : 0;
            due = money(amount);
            actual = money(amount);
            gap = remainingOf(item && item.amount, amount);
        }
        var grade = gradeOf(script.streak, progress, elapsed, rule);
        return {
            name: script.name,
            item: item,
            streak: script.streak,
            due: due,
            actual: actual,
            gap: gap,
            progress: progress == null ? '—' : (progress * 100).toFixed(2) + '%',
            progressRate: progress,
            grade: grade,
            alert: alertText(grade, item && item.storeName, item && item.code, script.streak, gap, progress, elapsed, rule)
        };
    }

    function scenarios() {
        return SAMPLE_SCRIPTS.map(function (script) { return scenario(script); });
    }

    function alertText(grade, storeName, code, streak, gap, daily, elapsed, cfg) {
        if (grade === '正常') return '';
        var who = (storeName || '该门店') + ' ' + (code || '');
        var reason = driverText(grade, streak, daily, elapsed, cfg);
        return who + ' ' + reason + '，剩余履行额 ¥' + gap + '。' + alertSentence(grade, cfg);
    }

    function rules(cfg) {
        var rule = cfg || readConfig();
        return [
            { grade: '正常', rule: '未达到关注的条件', alert: '不提醒' },
            { grade: '关注', rule: '连续未履行达到 ' + rule.watchStreak + ' 天，' + joinMode(rule.watchJoin) + '日均履行进度低于 ' + rule.watchProgress + '%', alert: rule.watchAlert },
            { grade: '预警', rule: '连续未履行达到 ' + rule.warnStreak + ' 天，' + joinMode(rule.warnJoin) + '日均履行进度低于 ' + rule.warnProgress + '%', alert: rule.warnAlert },
            { grade: '异常', rule: '连续未履行达到 ' + rule.badStreak + ' 天，' + joinMode(rule.badJoin) + '日均履行进度低于 ' + rule.badProgress + '%', alert: rule.badAlert }
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
        return {
            status: HANDLE_STATUSES.indexOf(saved.status) >= 0 ? saved.status : '待处理',
            note: saved.note || '',
            at: saved.at || ''
        };
    }

    function saveHandle(id, patch) {
        if (!id) return;
        var all = handles();
        var status = patch && HANDLE_STATUSES.indexOf(patch.status) >= 0 ? patch.status : '待处理';
        all[id] = {
            status: status,
            note: patch && patch.note ? String(patch.note).trim() : '',
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
                demandCode: item && item.code ? item.code : '',
                streak: row.streak,
                due: row.due,
                actual: row.actual,
                gap: row.gap,
                progress: row.progress,
                grade: row.grade,
                lastMiss: row.streak ? latestDate(item) : '—',
                alert: row.alert,
                source: '持续未履行样例',
                scene: script.name,
                handleStatus: handle.status,
                handleNote: handle.note
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
                demandCode: row.demandCode,
                streak: row.streak,
                due: row.due,
                actual: row.actual,
                gap: row.gap,
                progress: row.progress,
                grade: row.grade,
                lastMiss: row.lastMiss,
                alert: row.alert,
                source: '当前台账',
                scene: '当前台账',
                handleStatus: handle.status,
                handleNote: handle.note
            };
        });
    }

    function exceptionRows() {
        if (!readConfig().enabled) return [];
        return ledgerRows().concat(sampleRows());
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
        receivableOf: receivableOf
    };
})(window);
