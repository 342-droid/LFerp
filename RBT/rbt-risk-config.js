/* 风控配置：基准开关、预期时长档位和阈值写入本地。异常付款数据和首页按保存后的规则评级。 */
(function () {
    var api = window.RbtRisk;
    var fields = ['progressStartDays', 'watchStreak', 'warnStreak', 'badStreak', 'watchJoin', 'warnJoin', 'badJoin', 'watchProgress', 'warnProgress', 'badProgress', 'watchAlert', 'warnAlert', 'badAlert'];
    var saved = api.readConfig();
    var shared = saved;
    var lineRules = saved.lineRules || {};
    var tiers = (saved.durationTiers || []).slice();
    var mode = saved.baselineMode === 'dynamic' ? 'dynamic' : 'static';
    var editing = '*';

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

    function readFields() {
        var cfg = {};
        fields.forEach(function (key) {
            cfg[key] = document.getElementById(key).value.trim();
        });
        return cfg;
    }

    function fillFields(cfg) {
        fields.forEach(function (key) {
            document.getElementById(key).value = cfg && cfg[key] != null ? cfg[key] : '';
        });
    }

    function paintMode() {
        var dynamic = mode === 'dynamic';
        document.getElementById('rbtBaselineNow').textContent = '当前生效：' + (dynamic ? '动态基准' : '静态基准');
        document.getElementById('rbtBaselineStatic').className = dynamic ? 'btn btn-secondary' : 'btn btn-primary';
        document.getElementById('rbtBaselineDynamic').className = dynamic ? 'btn btn-primary' : 'btn btn-secondary';
    }

    function paintTiers() {
        document.getElementById('rbtDurationTiers').innerHTML = tiers.map(function (months, index) {
            return '<span class="rbt-duration-chip">' + months + ' 个月<button type="button" data-tier-remove="' + index + '" aria-label="删除' + months + '个月">×</button></span>';
        }).join('');
    }

    function lineNames() {
        var names = [];
        var list = window.RbtStoreData && typeof window.RbtStoreData.list === 'function' ? window.RbtStoreData.list() : [];
        list.forEach(function (row) {
            if (row && row.bizLine && names.indexOf(row.bizLine) < 0) names.push(row.bizLine);
        });
        ['餐饮', '康美', '纯私域', '集团内部'].forEach(function (name) {
            if (names.indexOf(name) < 0) names.push(name);
        });
        return names;
    }

    function paintLines() {
        var select = document.getElementById('rbtRiskLine');
        var names = lineNames();
        select.innerHTML = '<option value="*">全部事业线共用</option>' + names.map(function (name) {
            return '<option value="' + name + '">' + name + '</option>';
        }).join('');
        select.value = editing;
    }

    function commitEditing() {
        var current = readFields();
        if (editing === '*') {
            fields.forEach(function (key) { shared[key] = current[key]; });
            return;
        }
        if (!document.getElementById('rbtRiskLineOwn').checked) {
            delete lineRules[editing];
            return;
        }
        lineRules[editing] = current;
    }

    function showEditing() {
        var own = document.getElementById('rbtRiskLineOwnWrap');
        var box = document.getElementById('rbtRiskLineOwn');
        if (editing === '*') {
            own.hidden = true;
            fillFields(shared);
            return;
        }
        own.hidden = false;
        var rule = lineRules[editing];
        box.checked = !!rule;
        fillFields(rule || shared);
    }

    function payload() {
        commitEditing();
        var next = {};
        Object.keys(shared).forEach(function (key) { next[key] = shared[key]; });
        fields.forEach(function (key) {
            if (next[key] == null) next[key] = shared[key];
        });
        next.enabled = document.getElementById('rbtRiskEnabled').getAttribute('aria-pressed') === 'true';
        next.baselineMode = mode;
        next.durationTiers = tiers.slice();
        next.lineRules = lineRules;
        return next;
    }

    paintMode();
    paintTiers();
    paintLines();
    setEnabled(shared.enabled !== false);
    showEditing();

    document.getElementById('rbtRiskEnabled').addEventListener('click', function () {
        setEnabled(this.getAttribute('aria-pressed') !== 'true');
        showError('');
    });
    document.getElementById('rbtBaselineStatic').addEventListener('click', function () {
        mode = 'static';
        paintMode();
        showError('');
    });
    document.getElementById('rbtBaselineDynamic').addEventListener('click', function () {
        mode = 'dynamic';
        paintMode();
        showError('');
    });
    document.getElementById('rbtDurationAdd').addEventListener('click', function () {
        var input = document.getElementById('rbtDurationInput');
        var months = Number(input.value);
        if (!/^\d+$/.test(input.value.trim()) || months < 1) {
            showError('预期时长须为大于 0 的整数月');
            return;
        }
        if (tiers.indexOf(months) >= 0) {
            showError('这个档位已经有了');
            return;
        }
        tiers.push(months);
        tiers.sort(function (a, b) { return a - b; });
        input.value = '';
        paintTiers();
        showError('');
    });
    document.getElementById('rbtDurationTiers').addEventListener('click', function (event) {
        var button = event.target.closest('[data-tier-remove]');
        if (!button) return;
        tiers.splice(Number(button.getAttribute('data-tier-remove')), 1);
        paintTiers();
    });
    document.getElementById('rbtRiskLine').addEventListener('change', function () {
        commitEditing();
        editing = this.value;
        showEditing();
        showError('');
    });
    document.getElementById('rbtRiskConfigForm').addEventListener('input', function () { showError(''); });
    document.getElementById('rbtRiskConfigForm').addEventListener('change', function () { showError(''); });
    document.getElementById('rbtRiskCancel').addEventListener('click', function () {
        window.location.href = 'rbt_risk_abnormal.html';
    });
    document.getElementById('rbtRiskReset').addEventListener('click', function () {
        var base = api.defaults();
        shared = base;
        lineRules = {};
        tiers = base.durationTiers.slice();
        mode = 'static';
        editing = '*';
        setEnabled(true);
        paintMode();
        paintTiers();
        paintLines();
        showEditing();
        showError('');
        if (typeof window.showToast === 'function') window.showToast('已恢复默认阈值，保存后生效', 'success');
    });
    document.getElementById('rbtRiskSave').addEventListener('click', function () {
        var issue = api.saveConfig(payload());
        if (issue) {
            showError(issue);
            if (typeof window.showToast === 'function') window.showToast(issue, 'error');
            return;
        }
        saved = api.readConfig();
        shared = saved;
        lineRules = saved.lineRules || {};
        tiers = (saved.durationTiers || []).slice();
        mode = saved.baselineMode === 'dynamic' ? 'dynamic' : 'static';
        paintMode();
        paintTiers();
        showEditing();
        showError('');
        if (typeof window.showToast === 'function') window.showToast('已保存，异常付款数据按新规则计算', 'success');
    });
})();
