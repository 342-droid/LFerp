/**
 * 订单 · 快递截单（全平台零售线快递到家，独立于采购截单）
 */
(function () {
    var STORAGE_KEY = 'lf_order_express_cutoff_v1';

    var defaultRule = {
        enabled: true,
        scenes: { live: true, mall: true },
        cutoffTime: '16:00',
        afterCutoff: 'stop',
        userDesc: ''
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

    function normalizeTime(raw) {
        var text = String(raw || '').trim();
        var match = text.match(/^(\d{1,2}):(\d{2})/);
        if (!match) return '';
        var hour = Number(match[1]);
        var minute = Number(match[2]);
        if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return '';
        return (hour < 10 ? '0' : '') + hour + ':' + (minute < 10 ? '0' : '') + minute;
    }

    function loadRule() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return clone(defaultRule);
            var parsed = JSON.parse(raw);
            var rule = clone(defaultRule);
            if (typeof parsed.enabled === 'boolean') rule.enabled = parsed.enabled;
            if (parsed.scenes) {
                if (typeof parsed.scenes.live === 'boolean') rule.scenes.live = parsed.scenes.live;
                if (typeof parsed.scenes.mall === 'boolean') rule.scenes.mall = parsed.scenes.mall;
            }
            var time = normalizeTime(parsed.cutoffTime);
            if (time) rule.cutoffTime = time;
            if (parsed.afterCutoff === 'stop' || parsed.afterCutoff === 'nextday') {
                rule.afterCutoff = parsed.afterCutoff;
            }
            if (parsed.userDesc != null) rule.userDesc = String(parsed.userDesc);
            return rule;
        } catch (e) {
            return clone(defaultRule);
        }
    }

    function saveRule(rule) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(rule));
    }

    function setRowDisabled(row, disabled) {
        if (!row) return;
        row.classList.toggle('pts-rule-section-disabled', !!disabled);
        row.querySelectorAll('input, select, textarea').forEach(function (input) {
            input.disabled = !!disabled;
        });
    }

    function applyRuleToForm(rule) {
        document.getElementById('cutoffEnabled').checked = !!rule.enabled;
        document.getElementById('cutoffSceneLive').checked = !!(rule.scenes && rule.scenes.live);
        document.getElementById('cutoffSceneMall').checked = !!(rule.scenes && rule.scenes.mall);
        document.getElementById('cutoffTime').value = rule.cutoffTime || defaultRule.cutoffTime;
        document.querySelectorAll('input[name="cutoffAfter"]').forEach(function (el) {
            el.checked = el.value === rule.afterCutoff;
        });
        document.getElementById('cutoffDesc').value = rule.userDesc || '';
        syncUi();
    }

    function syncUi() {
        var on = document.getElementById('cutoffEnabled').checked;
        ['cutoffSceneRow', 'cutoffTimeRow', 'cutoffAfterRow', 'cutoffDescRow'].forEach(function (id) {
            setRowDisabled(document.getElementById(id), !on);
        });
    }

    function readForm() {
        var afterEl = document.querySelector('input[name="cutoffAfter"]:checked');
        return {
            enabled: document.getElementById('cutoffEnabled').checked,
            scenes: {
                live: document.getElementById('cutoffSceneLive').checked,
                mall: document.getElementById('cutoffSceneMall').checked
            },
            cutoffTime: normalizeTime(document.getElementById('cutoffTime').value),
            afterCutoff: afterEl ? afterEl.value : 'stop',
            userDesc: String(document.getElementById('cutoffDesc').value || '').trim()
        };
    }

    function validate(rule) {
        if (!rule.enabled) return '';
        if (!rule.scenes.live && !rule.scenes.mall) return '请至少选择一个适用场景';
        if (!rule.cutoffTime) return '请填写每日截单时间';
        return '';
    }

    document.addEventListener('DOMContentLoaded', function () {
        applyRuleToForm(loadRule());

        document.getElementById('cutoffEnabled').addEventListener('change', syncUi);

        document.getElementById('btnCutoffReset').addEventListener('click', function () {
            applyRuleToForm(clone(defaultRule));
            toast('已重置为默认配置', 'info');
        });

        document.getElementById('btnCutoffSave').addEventListener('click', function () {
            var rule = readForm();
            var err = validate(rule);
            if (err) {
                toast(err, 'warning');
                return;
            }
            saveRule(rule);
            applyRuleToForm(rule);
            toast('快递截单配置已保存');
        });
    });
})();
