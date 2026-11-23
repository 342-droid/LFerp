/* 风控配置：阈值写入本地，异常履约数据和首页按保存后的规则评级。 */
(function () {
    var api = window.RbtRisk;
    var fields = ['progressStartDays', 'watchStreak', 'warnStreak', 'badStreak', 'watchJoin', 'warnJoin', 'badJoin', 'watchProgress', 'warnProgress', 'badProgress', 'watchAlert', 'warnAlert', 'badAlert'];

    function showError(message) {
        var node = document.getElementById('rbtRiskError');
        if (!message) {
            node.hidden = true;
            node.textContent = '';
            return;
        }
        node.hidden = false;
        node.textContent = message;
    }

    function setEnabled(on) {
        var btn = document.getElementById('rbtRiskEnabled');
        var text = document.getElementById('rbtRiskEnabledText');
        btn.classList.toggle('is-on', !!on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        if (text) text.textContent = on ? '开' : '关';
    }

    function readForm() {
        var cfg = { enabled: document.getElementById('rbtRiskEnabled').getAttribute('aria-pressed') === 'true' };
        fields.forEach(function (key) {
            cfg[key] = document.getElementById(key).value.trim();
        });
        return cfg;
    }

    function fillForm(cfg) {
        setEnabled(cfg.enabled !== false);
        fields.forEach(function (key) {
            document.getElementById(key).value = cfg[key] == null ? '' : cfg[key];
        });
    }

    fillForm(api.readConfig());
    document.getElementById('rbtRiskEnabled').addEventListener('click', function () {
        setEnabled(this.getAttribute('aria-pressed') !== 'true');
        showError('');
    });
    document.getElementById('rbtRiskConfigForm').addEventListener('input', function () {
        showError('');
    });
    document.getElementById('rbtRiskConfigForm').addEventListener('change', function () {
        showError('');
    });
    document.getElementById('rbtRiskCancel').addEventListener('click', function () {
        window.location.href = 'rbt_risk_abnormal.html';
    });
    document.getElementById('rbtRiskReset').addEventListener('click', function () {
        fillForm(api.defaults());
        showError('');
        if (typeof window.showToast === 'function') window.showToast('已恢复默认阈值，保存后生效', 'success');
    });
    document.getElementById('rbtRiskSave').addEventListener('click', function () {
        var issue = api.saveConfig(readForm());
        if (issue) {
            showError(issue);
            if (typeof window.showToast === 'function') window.showToast(issue, 'error');
            return;
        }
        showError('');
        fillForm(api.readConfig());
        if (typeof window.showToast === 'function') window.showToast('已保存，异常履约数据按新规则计算', 'success');
    });
})();
