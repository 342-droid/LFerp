/**
 * 会员等级 — 成长值规则配置（有效期 / 消费获取 / 活跃获取 / 升降级策略说明）
 */
(function () {
    var STORAGE_KEY = 'mdm_member_level_growth_rule_v1';
    /** 活跃获取成长值：待开发，配置项不可操作 */
    var ACTIVITY_PENDING = true;

    var defaultRule = {
        validityType: 'rolling',
        validityDays: 365,
        consumeEnabled: true,
        consumeAmount: 1,
        consumeGrowth: 1,
        activityEnabled: false,
        activities: {
            signin: { enabled: true, growth: 5, dailyLimit: 5 },
            browse: { enabled: true, growth: 1, dailyLimit: 10 },
            share: { enabled: false, growth: 20, dailyLimit: 40 },
            review: { enabled: true, growth: 10, dailyLimit: 30 }
        }
    };

    function toast(msg, type) {
        if (typeof showToast === 'function') {
            showToast(msg, type || 'success');
            return;
        }
        window.alert(msg);
    }

    function clone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    function loadRule() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return clone(defaultRule);
            var parsed = JSON.parse(raw);
            var rule = clone(defaultRule);
            if (parsed.validityType) rule.validityType = parsed.validityType;
            if (parsed.validityDays != null) rule.validityDays = Number(parsed.validityDays) || defaultRule.validityDays;
            if (typeof parsed.consumeEnabled === 'boolean') rule.consumeEnabled = parsed.consumeEnabled;
            if (parsed.consumeAmount != null) rule.consumeAmount = Number(parsed.consumeAmount);
            if (parsed.consumeGrowth != null) rule.consumeGrowth = Number(parsed.consumeGrowth);
            if (typeof parsed.activityEnabled === 'boolean') rule.activityEnabled = parsed.activityEnabled;
            if (parsed.activities) {
                Object.keys(rule.activities).forEach(function (key) {
                    if (parsed.activities[key]) {
                        var src = parsed.activities[key];
                        if (typeof src.enabled === 'boolean') rule.activities[key].enabled = src.enabled;
                        if (src.growth != null) rule.activities[key].growth = Number(src.growth);
                        if (src.dailyLimit != null) rule.activities[key].dailyLimit = Number(src.dailyLimit);
                    }
                });
            }
            if (ACTIVITY_PENDING) rule.activityEnabled = false;
            return rule;
        } catch (e) {
            return clone(defaultRule);
        }
    }

    function saveRule(rule) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(rule));
    }

    function syncValidityUI() {
        var rolling = document.getElementById('validityRolling');
        var daysRow = document.getElementById('validityDaysRow');
        if (!daysRow) return;
        daysRow.style.display = rolling && rolling.checked ? '' : 'none';
    }

    function syncConsumeUI() {
        var enabled = document.getElementById('consumeEnabled');
        var row = document.getElementById('consumeRuleRow');
        if (!row) return;
        row.style.opacity = enabled && enabled.checked ? '1' : '0.45';
        row.querySelectorAll('input').forEach(function (input) {
            input.disabled = !(enabled && enabled.checked);
        });
    }

    function syncActivityUI() {
        var card = document.getElementById('activityRuleCard');
        var enabled = document.getElementById('activityEnabled');
        var row = document.getElementById('activityRuleRow');
        if (ACTIVITY_PENDING) {
            if (enabled) {
                enabled.checked = false;
                enabled.disabled = true;
            }
            if (card) {
                card.querySelectorAll('input').forEach(function (input) {
                    input.disabled = true;
                });
            } else if (row) {
                row.querySelectorAll('input').forEach(function (input) {
                    input.disabled = true;
                });
            }
            return;
        }
        if (!row) return;
        var on = !!(enabled && enabled.checked);
        row.style.opacity = on ? '1' : '0.45';
        row.querySelectorAll('input').forEach(function (input) {
            if (input.id === 'activityEnabled') return;
            input.disabled = !on;
        });
    }

    function fillForm(rule) {
        var permanent = document.getElementById('validityPermanent');
        var rolling = document.getElementById('validityRolling');
        if (rule.validityType === 'permanent') {
            if (permanent) permanent.checked = true;
        } else if (rolling) {
            rolling.checked = true;
        }
        var days = document.getElementById('validityDays');
        if (days) days.value = rule.validityDays;

        var consumeEnabled = document.getElementById('consumeEnabled');
        if (consumeEnabled) consumeEnabled.checked = !!rule.consumeEnabled;
        var consumeAmount = document.getElementById('consumeAmount');
        if (consumeAmount) consumeAmount.value = rule.consumeAmount;
        var consumeGrowth = document.getElementById('consumeGrowth');
        if (consumeGrowth) consumeGrowth.value = rule.consumeGrowth;

        var activityEnabled = document.getElementById('activityEnabled');
        if (activityEnabled) {
            activityEnabled.checked = ACTIVITY_PENDING ? false : !!rule.activityEnabled;
        }

        var list = document.getElementById('activityRuleList');
        if (list) {
            list.querySelectorAll('[data-activity]').forEach(function (row) {
                var key = row.getAttribute('data-activity');
                var conf = rule.activities[key] || {};
                var enableEl = row.querySelector('[data-act-enable]');
                var growthEl = row.querySelector('[data-act-growth]');
                var limitEl = row.querySelector('[data-act-limit]');
                if (enableEl) enableEl.checked = !!conf.enabled;
                if (growthEl) growthEl.value = conf.growth != null ? conf.growth : 0;
                if (limitEl) limitEl.value = conf.dailyLimit != null ? conf.dailyLimit : 0;
            });
        }

        syncValidityUI();
        syncConsumeUI();
        syncActivityUI();
    }

    function readForm() {
        var validityType = document.getElementById('validityRolling') &&
            document.getElementById('validityRolling').checked
            ? 'rolling'
            : 'permanent';
        var validityDays = Number((document.getElementById('validityDays') || {}).value);
        var consumeEnabled = !!(document.getElementById('consumeEnabled') || {}).checked;
        var consumeAmount = Number((document.getElementById('consumeAmount') || {}).value);
        var consumeGrowth = Number((document.getElementById('consumeGrowth') || {}).value);
        var activityEnabled = ACTIVITY_PENDING
            ? false
            : !!(document.getElementById('activityEnabled') || {}).checked;

        var activities = {};
        var list = document.getElementById('activityRuleList');
        if (list) {
            list.querySelectorAll('[data-activity]').forEach(function (row) {
                var key = row.getAttribute('data-activity');
                activities[key] = {
                    enabled: !!(row.querySelector('[data-act-enable]') || {}).checked,
                    growth: Number((row.querySelector('[data-act-growth]') || {}).value),
                    dailyLimit: Number((row.querySelector('[data-act-limit]') || {}).value)
                };
            });
        }

        return {
            validityType: validityType,
            validityDays: validityDays,
            consumeEnabled: consumeEnabled,
            consumeAmount: consumeAmount,
            consumeGrowth: consumeGrowth,
            activityEnabled: activityEnabled,
            activities: activities
        };
    }

    function validate(rule) {
        if (rule.validityType === 'rolling') {
            if (!rule.validityDays || rule.validityDays < 1 || !Number.isInteger(rule.validityDays)) {
                toast('请填写有效的成长值有效天数（正整数）', 'warning');
                return false;
            }
        }
        if (rule.consumeEnabled) {
            if (!(rule.consumeAmount > 0) || isNaN(rule.consumeAmount)) {
                toast('消费金额须大于 0', 'warning');
                return false;
            }
            if (rule.consumeGrowth < 0 || isNaN(rule.consumeGrowth) || !Number.isInteger(rule.consumeGrowth)) {
                toast('消费获得成长值须为非负整数', 'warning');
                return false;
            }
        }
        if (!ACTIVITY_PENDING && rule.activityEnabled) {
            var keys = Object.keys(rule.activities);
            var anyEnabled = false;
            for (var i = 0; i < keys.length; i++) {
                var act = rule.activities[keys[i]];
                if (!act.enabled) continue;
                anyEnabled = true;
                if (act.growth < 0 || isNaN(act.growth) || !Number.isInteger(act.growth)) {
                    toast('活跃成长值须为非负整数', 'warning');
                    return false;
                }
                if (act.dailyLimit < 0 || isNaN(act.dailyLimit) || !Number.isInteger(act.dailyLimit)) {
                    toast('每日上限须为非负整数', 'warning');
                    return false;
                }
            }
            if (!anyEnabled) {
                toast('已开启活跃获成长值，请至少启用一种活跃行为', 'warning');
                return false;
            }
        }
        if (!rule.consumeEnabled && !(rule.activityEnabled && !ACTIVITY_PENDING)) {
            toast(ACTIVITY_PENDING
                ? '请开启消费获成长值'
                : '请至少开启一种成长值获取方式（消费或活跃）', 'warning');
            return false;
        }
        return true;
    }

    function bindEvents() {
        var backBtn = document.getElementById('btnBackLevel');
        if (backBtn) {
            backBtn.addEventListener('click', function () {
                window.location.href = 'mdm_member_level.html';
            });
        }

        document.querySelectorAll('input[name="validityType"]').forEach(function (el) {
            el.addEventListener('change', syncValidityUI);
        });

        var consumeEnabled = document.getElementById('consumeEnabled');
        if (consumeEnabled) consumeEnabled.addEventListener('change', syncConsumeUI);

        var activityEnabled = document.getElementById('activityEnabled');
        if (activityEnabled && !ACTIVITY_PENDING) {
            activityEnabled.addEventListener('change', syncActivityUI);
        }

        var resetBtn = document.getElementById('btnRuleReset');
        if (resetBtn) {
            resetBtn.addEventListener('click', function () {
                fillForm(clone(defaultRule));
                toast('已恢复默认配置（尚未保存）', 'info');
            });
        }

        var saveBtn = document.getElementById('btnRuleSave');
        if (saveBtn) {
            saveBtn.addEventListener('click', function () {
                var rule = readForm();
                if (!validate(rule)) return;
                saveRule(rule);
                toast('成长值规则已保存', 'success');
            });
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        fillForm(loadRule());
        bindEvents();
    });
})();
