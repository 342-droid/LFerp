/* 风控配置：基准开关、预期时长档位和阈值写入本地。异常付款数据和首页按保存后的规则评级。 */
(function () {
    var api = window.RbtRisk;
    var fields = ['watchStreak', 'warnStreak', 'badStreak', 'watchJoin', 'warnJoin', 'badJoin', 'watchProgress', 'warnProgress', 'badProgress', 'watchAlert', 'warnAlert', 'badAlert'];
    function cloneProfile(pack) {
        return JSON.parse(JSON.stringify(pack));
    }

    function modeLabel() {
        return mode === 'dynamic' ? '动态基准' : '静态基准';
    }

    var saved = api.readConfig();
    var profiles = {
        static: cloneProfile(saved.profiles.static),
        dynamic: cloneProfile(saved.profiles.dynamic)
    };
    var mode = saved.baselineMode === 'dynamic' ? 'dynamic' : 'static';
    var editing = '*';
    var shared;
    var productRules;
    var tiers;

    function useMode() {
        var pack = profiles[mode];
        shared = pack;
        productRules = pack.productRules;
        tiers = pack.durationTiers;
    }

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
        document.getElementById('rbtBaselineStatic').classList.toggle('is-on', !dynamic);
        document.getElementById('rbtBaselineDynamic').classList.toggle('is-on', dynamic);
        document.getElementById('rbtDurationField').hidden = dynamic;
        document.getElementById('rbtBaselineFormula').textContent = dynamic
            ? '动态基准日均 = RBT门店的已结款合计 ÷ 对应营业天数总和。'
            : '静态基准日均 = 该产品金额 ÷（该档预期月数 × 30）。';
        paintBaseline();
    }

    function paintBaseline() {
        var box = document.getElementById('rbtBaselineValue');
        var tip = document.getElementById('rbtBaselineValueTip');
        if (!box || !api || typeof api.baselinePreview !== 'function') return;
        var productCode = editing && editing !== '*' ? editing : '';
        var pack = api.baselinePreview(mode, productCode, tiers);
        var rows = pack && pack.rows ? pack.rows : [];
        var columns = pack && pack.columns ? pack.columns : [];
        var moneyAt = pack && pack.moneyAt ? pack.moneyAt : [];
        var head = '';
        var body = '';
        var leadCount = 1;
        if (pack && pack.kind === 'matrix') {
            var lead = pack.lead && pack.lead.length ? pack.lead : [pack.corner || '产品'];
            leadCount = lead.length;
            head = lead.map(function (label) {
                return '<th>' + esc(label) + '</th>';
            }).join('') + columns.map(function (label) {
                return '<th class="is-money">' + esc(label) + '</th>';
            }).join('');
            body = rows.map(function (row) {
                var titles = row.lead && row.lead.length ? row.lead : [row.title || ''];
                return '<tr>' + titles.map(function (title) {
                    return '<td>' + esc(title) + '</td>';
                }).join('') + (row.cells || []).map(function (cell) {
                    return '<td class="is-money">' + esc(cell) + '</td>';
                }).join('') + '</tr>';
            }).join('');
        } else if (rows.length) {
            head = columns.map(function (label, index) {
                return '<th' + (moneyAt.indexOf(index) >= 0 ? ' class="is-money"' : '') + '>' + esc(label) + '</th>';
            }).join('');
            body = rows.map(function (row) {
                return '<tr>' + (row.cells || []).map(function (cell, index) {
                    return '<td' + (moneyAt.indexOf(index) >= 0 ? ' class="is-money"' : '') + '>' + esc(cell) + '</td>';
                }).join('') + '</tr>';
            }).join('');
        }
        box.innerHTML = head
            ? '<div class="erp-table-scroll rbt-baseline-scroll"><table class="rbt-baseline-table"><thead><tr>' + head + '</tr></thead><tbody>' + (body || '<tr><td class="rbt-baseline-table__empty" colspan="' + (columns.length + leadCount) + '">—</td></tr>') + '</tbody></table></div>'
            : '<div class="erp-table-scroll rbt-baseline-scroll"><table class="rbt-baseline-table"><tbody><tr><td class="rbt-baseline-table__empty">—</td></tr></tbody></table></div>';
        if (tip) tip.textContent = pack && pack.tip ? pack.tip : '';
    }

    function paintTiers() {
        document.getElementById('rbtDurationTiers').innerHTML = tiers.map(function (months, index) {
            return '<span class="rbt-duration-chip">' + months + ' 个月<button type="button" data-tier-remove="' + index + '" aria-label="删除' + months + '个月">×</button></span>';
        }).join('');
    }

    function productList() {
        return api && typeof api.products === 'function' ? api.products() : [];
    }

    function productTitle(code) {
        var name = code;
        productList().some(function (item) {
            if (item.code === code) {
                name = item.name;
                return true;
            }
            return false;
        });
        return name;
    }

    function esc(text) {
        return String(text).replace(/[&<>"]/g, function (ch) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch];
        });
    }

    function paintNav() {
        var items = [{ id: '*', name: '通用阈值', meta: '默认', own: false }];
        productList().forEach(function (product) {
            var own = !!productRules[product.code];
            items.push({ id: product.code, name: product.name, meta: own ? '独立' : '通用', own: own });
        });
        document.getElementById('rbtRiskNav').innerHTML = items.map(function (item) {
            return '<button type="button" class="rbt-risk-nav__item' + (item.id === editing ? ' is-active' : '') + '" data-scope="' + esc(item.id) + '">' +
                '<span>' + esc(item.name) + '</span><span class="rbt-risk-nav__meta' + (item.own ? ' is-own' : '') + '">' + item.meta + '</span></button>';
        }).join('');
    }

    function commitEditing() {
        var current = readFields();
        if (editing === '*') {
            fields.forEach(function (key) { shared[key] = current[key]; });
            return;
        }
        if (!productRules[editing]) return;
        productRules[editing] = current;
    }

    function commitMode() {
        commitEditing();
        profiles[mode].durationTiers = tiers.slice();
        tiers = profiles[mode].durationTiers;
    }

    function showEditing() {
        paintNav();
        var btn = document.getElementById('rbtRiskLineOwnBtn');
        var tip = document.getElementById('rbtRiskScopeTip');
        var bar = document.getElementById('rbtRiskScopeBar');
        var form = document.getElementById('rbtRiskGradeForm');
        if (editing === '*') {
            fillFields(shared);
            form.hidden = false;
            btn.hidden = true;
            bar.hidden = false;
            tip.textContent = modeLabel() + '的通用阈值。标记「通用」的产品均用这套。某产品独配，先点产品，再点「独立配置」。';
            paintBaseline();
            return;
        }
        bar.hidden = false;
        var own = !!productRules[editing];
        var title = productTitle(editing);
        btn.hidden = false;
        btn.textContent = own ? '改回通用' : '独立配置';
        btn.className = own ? 'btn btn-secondary' : 'btn btn-primary';
        if (!own) {
            fillFields(shared);
            form.hidden = true;
            tip.textContent = modeLabel() + '下，' + title + '还没有独立阈值，门店按通用阈值评级。支持产品独立配置。';
            paintBaseline();
            return;
        }
        fillFields(productRules[editing]);
        form.hidden = false;
        tip.textContent = '正在配置' + modeLabel() + '的' + title + '。保存后只影响这一边的' + title + '。';
        paintBaseline();
    }

    function payload() {
        commitMode();
        return {
            enabled: document.getElementById('rbtRiskEnabled').getAttribute('aria-pressed') === 'true',
            baselineMode: mode,
            profiles: profiles
        };
    }

    function selectMode(next) {
        if (next === mode) return;
        commitMode();
        mode = next;
        editing = '*';
        useMode();
        paintMode();
        paintTiers();
        showEditing();
        showError('');
    }

    useMode();
    paintMode();
    paintTiers();
    setEnabled(saved.enabled !== false);
    showEditing();

    document.getElementById('rbtRiskEnabled').addEventListener('click', function () {
        setEnabled(this.getAttribute('aria-pressed') !== 'true');
        showError('');
    });
    document.getElementById('rbtBaselineStatic').addEventListener('click', function () {
        selectMode('static');
    });
    document.getElementById('rbtBaselineDynamic').addEventListener('click', function () {
        selectMode('dynamic');
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
        paintBaseline();
        showError('');
    });
    document.getElementById('rbtDurationTiers').addEventListener('click', function (event) {
        var button = event.target.closest('[data-tier-remove]');
        if (!button) return;
        tiers.splice(Number(button.getAttribute('data-tier-remove')), 1);
        paintTiers();
        paintBaseline();
    });
    document.getElementById('rbtRiskNav').addEventListener('click', function (event) {
        var button = event.target.closest('[data-scope]');
        if (!button) return;
        var next = button.getAttribute('data-scope');
        if (next === editing) return;
        commitEditing();
        editing = next;
        showEditing();
        showError('');
    });
    document.getElementById('rbtRiskLineOwnBtn').addEventListener('click', function () {
        if (editing === '*') return;
        if (productRules[editing]) delete productRules[editing];
        else productRules[editing] = readFields();
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
        profiles = {
            static: cloneProfile(base.profiles.static),
            dynamic: cloneProfile(base.profiles.dynamic)
        };
        mode = 'static';
        editing = '*';
        useMode();
        setEnabled(true);
        paintMode();
        paintTiers();
        showEditing();
        showError('');
        if (typeof window.showToast === 'function') window.showToast('静态、动态两边都已恢复默认，保存后生效', 'success');
    });
    document.getElementById('rbtRiskSave').addEventListener('click', function () {
        var issue = api.saveConfig(payload());
        if (issue) {
            showError(issue);
            if (typeof window.showToast === 'function') window.showToast(issue, 'error');
            return;
        }
        saved = api.readConfig();
        profiles = {
            static: cloneProfile(saved.profiles.static),
            dynamic: cloneProfile(saved.profiles.dynamic)
        };
        mode = saved.baselineMode === 'dynamic' ? 'dynamic' : 'static';
        useMode();
        paintMode();
        paintTiers();
        showEditing();
        showError('');
        if (typeof window.showToast === 'function') window.showToast('已保存，异常付款数据按新规则计算', 'success');
    });
})();
