/* 履约风险：只看已发生日期的应履行和实际履行。未履行 = 实际履行低于应履行。 */
(function (global) {
    var GRADES = ['正常', '关注', '预警', '异常'];

    function money(value) {
        var num = Number(value);
        if (!isFinite(num)) return '0.00';
        return num.toFixed(2);
    }

    function gradeOf(streak, cover) {
        if (streak >= 7 || cover < 0.5) return '异常';
        if (streak >= 3 || cover < 0.8) return '预警';
        if (streak >= 1 || cover < 1) return '关注';
        return '正常';
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

    function scenario(name, occurred, streak, coverRatio) {
        var unit = unitDue();
        var due = Math.round(unit * occurred * 100) / 100;
        var actual = Math.round(due * coverRatio * 100) / 100;
        var cover = due > 0 ? actual / due : 1;
        var grade = gradeOf(streak, cover);
        var gap = money(Math.max(0, due - actual));
        return {
            name: name,
            streak: streak,
            due: money(due),
            actual: money(actual),
            gap: gap,
            cover: due > 0 ? (cover * 100).toFixed(2) + '%' : '—',
            grade: grade,
            alert: alertText(grade, '该门店', '该需求', streak, gap, cover)
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

    function alertText(grade, storeName, code, streak, gap, cover) {
        if (grade === '正常') return '';
        var who = (storeName || '该门店') + ' ' + (code || '');
        var reason = driverText(grade, streak, cover == null ? 0 : cover);
        if (grade === '关注') {
            return who + reason + '，未履行差额 ¥' + gap + '。提醒门店核对营业流水、所得佣金和结算比例。';
        }
        if (grade === '预警') {
            return who + reason + '，未履行差额 ¥' + gap + '。提醒门店、贸易商、冷丰。建议暂停该店新的需求。';
        }
        return who + reason + '，未履行差额 ¥' + gap + '。提醒门店、贸易商、冷丰、服务商。建议停止该店新的需求，并核对担保金缴纳凭证。';
    }

    function rules() {
        return [
            { grade: '正常', rule: '已发生日期的实际履行都达到应履行', alert: '不提醒' },
            { grade: '关注', rule: '连续未履行 1–2 天，或履行覆盖率低于 100%', alert: '提醒门店核对营业流水、所得佣金、结算比例' },
            { grade: '预警', rule: '连续未履行 3–6 天，或履行覆盖率低于 80%', alert: '提醒门店、贸易商、冷丰；建议暂停该店新的需求' },
            { grade: '异常', rule: '连续未履行达到 7 天，或履行覆盖率低于 50%', alert: '提醒门店、贸易商、冷丰、服务商；建议停止该店新的需求，并核对担保金缴纳凭证' }
        ];
    }

    global.RbtRisk = {
        grades: GRADES,
        liveRows: liveRows,
        scenarios: scenarios,
        rules: rules,
        assessDays: assessDays
    };
})(window);
