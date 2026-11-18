/* 履约风险：只看已发生日期的应履行和实际履行。未履行 = 实际履行低于应履行。阈值在风控配置里改。 */
(function (global) {
    var GRADES = ['正常', '关注', '预警', '异常'];
    var CONFIG_KEY = 'rbt_risk_config_v1';
    var HANDLE_KEY = 'rbt_risk_handle_v1';
    var HANDLE_STATUSES = ['待处理', '已核对', '已暂停新需求'];
    /* 样例只用来试算规则，不回写每日履行的实际履行。 */
    var SAMPLE_SCRIPTS = [
        { name: '连续 1 天未履行', occurred: 6, streak: 1, cover: 5 / 6, demandIndex: 0 },
        { name: '连续 3 天未履行', occurred: 6, streak: 3, cover: 0.5, demandIndex: 0 },
        { name: '连续 7 天未履行', occurred: 7, streak: 7, cover: 0, demandIndex: 1 },
        { name: '履行覆盖率低于 50%', occurred: 6, streak: 1, cover: 0.4, demandIndex: 1 }
    ];

    function defaults() {
        return {
            enabled: true,
            watchStreak: 1,
            warnStreak: 3,
            badStreak: 7,
            watchCover: 100,
            warnCover: 80,
            badCover: 50,
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
        var covers = [cfg.watchCover, cfg.warnCover, cfg.badCover];
        var i;
        for (i = 0; i < days.length; i++) {
            if (!/^\d+$/.test(String(days[i])) || Number(days[i]) < 1) {
                return '连续未履行天数须为大于 0 的整数';
            }
        }
        if (!(Number(cfg.watchStreak) < Number(cfg.warnStreak) && Number(cfg.warnStreak) < Number(cfg.badStreak))) {
            return '连续未履行天数须按关注、预警、异常递增';
        }
        for (i = 0; i < covers.length; i++) {
            var cover = Number(covers[i]);
            if (!isFinite(cover) || cover <= 0 || cover > 100) return '履行覆盖率须大于 0，且不超过 100';
        }
        if (!(Number(cfg.watchCover) > Number(cfg.warnCover) && Number(cfg.warnCover) > Number(cfg.badCover))) {
            return '履行覆盖率须按关注、预警、异常递减';
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
        next.watchCover = Number(next.watchCover);
        next.warnCover = Number(next.warnCover);
        next.badCover = Number(next.badCover);
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

    function gradeOf(streak, cover, cfg) {
        var rule = cfg || readConfig();
        if (!rule.enabled) return '正常';
        if (streak >= Number(rule.badStreak) || cover < Number(rule.badCover) / 100) return '异常';
        if (streak >= Number(rule.warnStreak) || cover < Number(rule.warnCover) / 100) return '预警';
        if (streak >= Number(rule.watchStreak) || cover < Number(rule.watchCover) / 100) return '关注';
        return '正常';
    }

    function alertSentence(grade, cfg) {
        var rule = cfg || readConfig();
        if (grade === '关注') return rule.watchAlert;
        if (grade === '预警') return rule.warnAlert;
        if (grade === '异常') return rule.badAlert;
        return '';
    }

    function driverText(grade, streak, cover) {
        var byCover = (grade === '异常' && streak < 7) || (grade === '预警' && streak < 3) || (grade === '关注' && streak < 1);
        if (byCover) return '履行覆盖率 ' + (cover * 100).toFixed(2) + '%';
        return '连续未履行 ' + streak + ' 天';
    }

    function assessDays(days) {
        var sorted = (days || []).slice().sort(function (a, b) {
            return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
        });
        var due = 0;
        var actual = 0;
        sorted.forEach(function (row) {
            due += Number(row.due) || 0;
            actual += Number(row.actual) || 0;
        });
        due = Math.round(due * 100) / 100;
        actual = Math.round(actual * 100) / 100;
        var streak = 0;
        var lastMiss = '';
        var i;
        for (i = sorted.length - 1; i >= 0; i--) {
            var gap = Math.round(((Number(sorted[i].due) || 0) - (Number(sorted[i].actual) || 0)) * 100) / 100;
            if (gap > 0) {
                streak += 1;
                lastMiss = sorted[i].date;
            } else {
                break;
            }
        }
        var cover = due > 0 ? actual / due : 1;
        return {
            due: money(due),
            actual: money(actual),
            gap: money(Math.max(0, due - actual)),
            cover: due > 0 ? (cover * 100).toFixed(2) + '%' : '—',
            coverRate: cover,
            streak: streak,
            lastMiss: lastMiss || '—',
            grade: gradeOf(streak, cover)
        };
    }

    function activeDemands() {
        var api = global.RbtDemandData;
        var daily = global.RbtDailyFulfill;
        var list = api && typeof api.list === 'function' ? api.list() : [];
        return list.filter(function (item) {
            return item && item.status === '还款中' && daily && typeof daily.daysOf === 'function' && daily.daysOf(item).length;
        });
    }

    function liveRows() {
        var daily = global.RbtDailyFulfill;
        return activeDemands().map(function (item) {
            var fact = assessDays(daily.daysOf(item));
            return {
                id: item.code,
                storeName: item.storeName || '—',
                storeCode: item.storeCode || '',
                demandCode: item.code,
                streak: fact.streak,
                due: fact.due,
                actual: fact.actual,
                gap: fact.gap,
                cover: fact.cover,
                grade: fact.grade,
                lastMiss: fact.lastMiss,
                alert: alertText(fact.grade, item.storeName, item.code, fact.streak, fact.gap, fact.coverRate)
            };
        });
    }

    function unitDue() {
        var daily = global.RbtDailyFulfill;
        var demands = activeDemands();
        if (!demands.length || !daily) return 0;
        var days = daily.daysOf(demands[0]);
        if (!days.length) return 0;
        return Number(days[days.length - 1].due) || 0;
    }

    function scenario(name, occurred, streak, coverRatio, cfg) {
        var unit = unitDue();
        var due = Math.round(unit * occurred * 100) / 100;
        var actual = Math.round(due * coverRatio * 100) / 100;
        var cover = due > 0 ? actual / due : 1;
        var grade = gradeOf(streak, cover, cfg);
        var gap = money(Math.max(0, due - actual));
        return {
            name: name,
            streak: streak,
            due: money(due),
            actual: money(actual),
            gap: gap,
            cover: due > 0 ? (cover * 100).toFixed(2) + '%' : '—',
            grade: grade,
            alert: alertText(grade, '该门店', '该需求', streak, gap, cover, cfg)
        };
    }

    function scenarios() {
        return [
            scenario('连续 1 天未履行', 6, 1, 5 / 6),
            scenario('连续 3 天未履行', 6, 3, 0.5),
            scenario('连续 7 天未履行', 7, 7, 0),
            scenario('履行覆盖率低于 50%', 6, 1, 0.4)
        ];
    }

    function alertText(grade, storeName, code, streak, gap, cover, cfg) {
        if (grade === '正常') return '';
        var who = (storeName || '该门店') + ' ' + (code || '');
        var reason = driverText(grade, streak, cover == null ? 0 : cover);
        return who + reason + '，未履行差额 ¥' + gap + '。' + alertSentence(grade, cfg);
    }

    function rules(cfg) {
        var rule = cfg || readConfig();
        return [
            { grade: '正常', rule: '已发生日期的实际履行都达到应履行', alert: '不提醒' },
            { grade: '关注', rule: '连续未履行达到 ' + rule.watchStreak + ' 天，或履行覆盖率低于 ' + rule.watchCover + '%', alert: rule.watchAlert },
            { grade: '预警', rule: '连续未履行达到 ' + rule.warnStreak + ' 天，或履行覆盖率低于 ' + rule.warnCover + '%', alert: rule.warnAlert },
            { grade: '异常', rule: '连续未履行达到 ' + rule.badStreak + ' 天，或履行覆盖率低于 ' + rule.badCover + '%', alert: rule.badAlert }
        ];
    }

    function trialRows(cfg) {
        var rule = cfg || readConfig();
        return SAMPLE_SCRIPTS.map(function (script) {
            var row = scenario(script.name, script.occurred, script.streak, script.cover, rule);
            return {
                name: script.name,
                streak: row.streak,
                cover: row.cover,
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
            var item = demands[script.demandIndex] || demands[0] || null;
            var row = scenario(script.name, script.occurred, script.streak, script.cover);
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
                cover: row.cover,
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
                cover: row.cover,
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
        assessDays: assessDays
    };
})(window);
