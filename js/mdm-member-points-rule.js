/**
 * 会员 · 积分规则配置（全局）
 * 总开关 / 有效期 / 说明 + 积分兑换商品规则
 * 消费送积分、积分抵现已拆至独立规则列表
 */
(function () {
    var STORAGE_KEY = 'mdm_member_points_rule_v1';

    var defaultRule = {
        enabled: true,
        validityDays: 365,
        ruleDesc: '',
        exchange: {
            enabled: true,
            refundEnabled: true,
            refundValidity: 'keep_original'
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
            if (typeof parsed.enabled === 'boolean') rule.enabled = parsed.enabled;
            if (parsed.validityDays != null) rule.validityDays = Number(parsed.validityDays) || defaultRule.validityDays;
            if (parsed.ruleDesc != null) rule.ruleDesc = String(parsed.ruleDesc);
            if (parsed.exchange) {
                if (typeof parsed.exchange.enabled === 'boolean') rule.exchange.enabled = parsed.exchange.enabled;
                if (typeof parsed.exchange.refundEnabled === 'boolean') rule.exchange.refundEnabled = parsed.exchange.refundEnabled;
                rule.exchange.refundValidity = 'keep_original';
            }
            return rule;
        } catch (e) {
            return clone(defaultRule);
        }
    }

    function saveRule(rule) {
        /* 保留历史 cash/consume 字段，避免其它页面迁移前读不到旧数据 */
        var merged = clone(rule);
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                var prev = JSON.parse(raw);
                if (prev && prev.cash && !merged.cash) merged.cash = prev.cash;
                if (prev && prev.consume && !merged.consume) merged.consume = prev.consume;
            }
        } catch (e) { /* ignore */ }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    }

    function setBodyDisabled(bodyEl, disabled) {
        if (!bodyEl) return;
        bodyEl.classList.toggle('pts-rule-section-disabled', !!disabled);
        bodyEl.querySelectorAll('input, select, textarea, button').forEach(function (input) {
            input.disabled = !!disabled;
        });
    }

    function applyRuleToForm(rule) {
        document.getElementById('ptsEnabled').checked = !!rule.enabled;
        document.getElementById('ptsValidityDays').value = rule.validityDays;
        document.getElementById('ptsRuleDesc').value = rule.ruleDesc || '';
        document.getElementById('exchangeEnabled').checked = !!rule.exchange.enabled;
        document.getElementById('exchangeRefundEnabled').checked = !!rule.exchange.refundEnabled;
        document.querySelectorAll('input[name="exchangeRefundValidity"]').forEach(function (el) {
            el.checked = el.value === 'keep_original';
        });
        syncAllUi();
    }

    function syncMasterUi() {
        var on = document.getElementById('ptsEnabled').checked;
        ['ptsValidityRow', 'ptsDescRow'].forEach(function (id) {
            var el = document.getElementById(id);
            if (!el) return;
            el.classList.toggle('pts-rule-section-disabled', !on);
            el.querySelectorAll('input, textarea').forEach(function (input) {
                input.disabled = !on;
            });
        });

        var card = document.getElementById('exchangeRuleCard');
        var sw = document.getElementById('exchangeEnabled');
        if (card) card.classList.toggle('pts-rule-section-disabled', !on);
        if (sw) sw.disabled = !on;
        if (!on) setBodyDisabled(document.getElementById('exchangeRuleBody'), true);
        else syncExchangeUi();
    }

    function syncExchangeUi() {
        var masterOn = document.getElementById('ptsEnabled').checked;
        var on = masterOn && document.getElementById('exchangeEnabled').checked;
        var body = document.getElementById('exchangeRuleBody');
        setBodyDisabled(body, !on);
        if (on) {
            var refundOn = document.getElementById('exchangeRefundEnabled').checked;
            var validityRow = document.getElementById('exchangeRefundValidityRow');
            setBodyDisabled(validityRow, !refundOn);
            var refundSw = document.getElementById('exchangeRefundEnabled');
            if (refundSw) refundSw.disabled = false;
        }
    }

    function syncAllUi() {
        syncMasterUi();
    }

    function readForm() {
        return {
            enabled: document.getElementById('ptsEnabled').checked,
            validityDays: Number(document.getElementById('ptsValidityDays').value),
            ruleDesc: String(document.getElementById('ptsRuleDesc').value || '').trim(),
            exchange: {
                enabled: document.getElementById('exchangeEnabled').checked,
                refundEnabled: document.getElementById('exchangeRefundEnabled').checked,
                refundValidity: 'keep_original'
            }
        };
    }

    function validate(rule) {
        if (rule.enabled) {
            if (!rule.validityDays || rule.validityDays < 1 || !Number.isInteger(rule.validityDays)) {
                return '请填写有效的积分有效期（正整数天）';
            }
        }
        return '';
    }

    document.addEventListener('DOMContentLoaded', function () {
        var draft = loadRule();
        applyRuleToForm(draft);

        document.getElementById('ptsEnabled').addEventListener('change', syncAllUi);
        document.getElementById('exchangeEnabled').addEventListener('change', syncExchangeUi);
        document.getElementById('exchangeRefundEnabled').addEventListener('change', syncExchangeUi);

        document.getElementById('btnPtsRuleReset').addEventListener('click', function () {
            applyRuleToForm(clone(defaultRule));
            toast('已重置为默认配置', 'info');
        });

        document.getElementById('btnPtsRuleSave').addEventListener('click', function () {
            var rule = readForm();
            if (rule.enabled) {
                rule.validityDays = Math.floor(Number(rule.validityDays));
            }
            var err = validate(rule);
            if (err) {
                toast(err, 'warning');
                return;
            }
            saveRule(rule);
            draft = clone(rule);
            applyRuleToForm(rule);
            toast('积分规则已保存');
        });

        var hash = String(window.location.hash || '').replace(/^#/, '');
        if (hash) {
            var target = document.getElementById(hash);
            if (target) {
                setTimeout(function () {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 80);
            }
        }
    });
})();
