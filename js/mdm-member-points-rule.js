/**
 * 会员 · 积分规则配置
 * 总开关 / 有效期 / 说明 + 抵现 / 兑换商品 / 消费送积分
 */
(function () {
    var STORAGE_KEY = 'mdm_member_points_rule_v1';
    var Data = window.MdmMemberLevelData || {};

    var defaultRule = {
        enabled: true,
        validityDays: 365,
        ruleDesc: '',
        cash: {
            enabled: true,
            perPointAmount: 0.01,
            maxRatio: 50,
            maxAmount: 100,
            scope: { type: 'all', products: [], categories: [] }
        },
        exchange: {
            enabled: true,
            refundEnabled: true,
            refundValidity: 'keep_original'
        },
        consume: {
            enabled: true,
            amountPerPoint: 1
        }
    };

    var scopeState = {
        type: 'all',
        products: [],
        categories: []
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

    function escapeHtml(str) {
        if (Data.escapeHtml) return Data.escapeHtml(str);
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function normalizeScope(scope) {
        if (Data.normalizeDiscountScope) return Data.normalizeDiscountScope(scope);
        scope = scope || {};
        var type = scope.type || 'all';
        if (['all', 'include_product', 'include_category', 'exclude_product', 'exclude_category'].indexOf(type) === -1) {
            type = 'all';
        }
        return {
            type: type,
            products: Array.isArray(scope.products) ? scope.products : [],
            categories: Array.isArray(scope.categories) ? scope.categories : []
        };
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
            if (parsed.cash) {
                if (typeof parsed.cash.enabled === 'boolean') rule.cash.enabled = parsed.cash.enabled;
                if (parsed.cash.perPointAmount != null) rule.cash.perPointAmount = Number(parsed.cash.perPointAmount);
                if (parsed.cash.maxRatio != null) rule.cash.maxRatio = Number(parsed.cash.maxRatio);
                if (parsed.cash.maxAmount != null) rule.cash.maxAmount = Number(parsed.cash.maxAmount);
                rule.cash.scope = normalizeScope(parsed.cash.scope);
            }
            if (parsed.exchange) {
                if (typeof parsed.exchange.enabled === 'boolean') rule.exchange.enabled = parsed.exchange.enabled;
                if (typeof parsed.exchange.refundEnabled === 'boolean') rule.exchange.refundEnabled = parsed.exchange.refundEnabled;
                if (parsed.exchange.refundValidity === 'keep_original' || parsed.exchange.refundValidity === 'recalc') {
                    /* recalc 为历史值，统一归一为保留原有效期 */
                    rule.exchange.refundValidity = 'keep_original';
                }
            }
            if (parsed.consume) {
                if (typeof parsed.consume.enabled === 'boolean') rule.consume.enabled = parsed.consume.enabled;
                if (parsed.consume.amountPerPoint != null) rule.consume.amountPerPoint = Number(parsed.consume.amountPerPoint);
            }
            return rule;
        } catch (e) {
            return clone(defaultRule);
        }
    }

    function saveRule(rule) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(rule));
    }

    function setBodyDisabled(bodyEl, disabled) {
        if (!bodyEl) return;
        bodyEl.classList.toggle('pts-rule-section-disabled', !!disabled);
        bodyEl.querySelectorAll('input, select, textarea, button').forEach(function (input) {
            input.disabled = !!disabled;
        });
    }

    function isProductScope(type) {
        return type === 'include_product' || type === 'exclude_product';
    }

    function isCategoryScope(type) {
        return type === 'include_category' || type === 'exclude_category';
    }

    function getScopeSelectedItems() {
        if (isProductScope(scopeState.type)) return scopeState.products || [];
        if (isCategoryScope(scopeState.type)) return scopeState.categories || [];
        return [];
    }

    function renderScopeChips() {
        var chipsEl = document.getElementById('cashScopeChips');
        var emptyEl = document.getElementById('cashScopeEmpty');
        if (!chipsEl) return;
        var items = getScopeSelectedItems();
        if (!items.length) {
            chipsEl.innerHTML = '';
            if (emptyEl) emptyEl.hidden = scopeState.type === 'all';
            return;
        }
        if (emptyEl) emptyEl.hidden = true;
        chipsEl.innerHTML = items.map(function (it) {
            return (
                '<span class="pts-rule-scope-chip" data-id="' + escapeHtml(it.id) + '">' +
                '<span>' + escapeHtml(it.name) + '</span>' +
                '<button type="button" class="pts-rule-scope-chip__remove" data-scope-remove aria-label="移除">&times;</button>' +
                '</span>'
            );
        }).join('');
    }

    function syncScopeUi() {
        var typeEl = document.querySelector('input[name="cashScopeType"]:checked');
        var type = typeEl ? typeEl.value : 'all';
        scopeState.type = type;
        if (type === 'all') {
            scopeState.products = [];
            scopeState.categories = [];
        } else if (isProductScope(type)) {
            scopeState.categories = [];
        } else if (isCategoryScope(type)) {
            scopeState.products = [];
        }

        var pickWrap = document.getElementById('cashScopePickWrap');
        var pickBtn = document.getElementById('cashScopePickBtn');
        var hint = document.getElementById('cashScopePickHint');
        var chipsEl = document.getElementById('cashScopeChips');
        var emptyEl = document.getElementById('cashScopeEmpty');
        var needPick = type !== 'all';
        if (pickWrap) pickWrap.hidden = !needPick;
        if (chipsEl) chipsEl.hidden = !needPick;
        if (emptyEl && !needPick) emptyEl.hidden = true;
        if (pickBtn) {
            if (isProductScope(type)) pickBtn.textContent = '选择商品';
            else if (isCategoryScope(type)) pickBtn.textContent = '选择类目';
        }
        if (hint) {
            hint.textContent = isProductScope(type)
                ? '可多选商品'
                : (isCategoryScope(type) ? '可多选类目' : '');
        }
        if (needPick) renderScopeChips();
        else if (chipsEl) chipsEl.innerHTML = '';
    }

    function formatProductPrice(product) {
        var skus = product.skus || [];
        if (!skus.length) return '—';
        var prices = skus.map(function (s) { return Number(s.price); }).filter(function (n) {
            return !isNaN(n);
        });
        if (!prices.length) return '—';
        var min = Math.min.apply(null, prices);
        var max = Math.max.apply(null, prices);
        function fmt(n) {
            return '¥' + (Math.round(n * 100) / 100).toFixed(2);
        }
        if (min === max) return fmt(min);
        return fmt(min) + ' ~ ' + fmt(max);
    }

    function formatProductSkuCodes(product) {
        var skus = product.skus || [];
        if (!skus.length) return '—';
        return skus.map(function (s) { return s.code; }).join(' / ');
    }

    function openCategoryScopePicker(selectedMap) {
        var catalog = Data.DEMO_CATEGORIES || [];
        var backdrop = document.createElement('div');
        backdrop.className = 'pts-rule-pick-backdrop';
        backdrop.innerHTML =
            '<div class="pts-rule-pick-modal" role="dialog" aria-modal="true">' +
            '  <div class="pts-rule-pick-modal__header">' +
            '    <h3 class="pts-rule-pick-modal__title">选择类目</h3>' +
            '    <button type="button" class="pts-rule-pick-modal__close" data-pick-close aria-label="关闭">&times;</button>' +
            '  </div>' +
            '  <div class="pts-rule-pick-modal__body">' +
            '    <input class="erp-input pts-rule-pick-filter" type="text" placeholder="输入类目名称筛选" data-pick-filter>' +
            '    <div class="pts-rule-pick-list" data-pick-list></div>' +
            '  </div>' +
            '  <div class="pts-rule-pick-modal__footer">' +
            '    <button type="button" class="erp-btn" data-pick-close>取消</button>' +
            '    <button type="button" class="erp-btn erp-btn--primary" data-pick-ok>确定</button>' +
            '  </div>' +
            '</div>';

        var listEl = backdrop.querySelector('[data-pick-list]');
        var filterEl = backdrop.querySelector('[data-pick-filter]');

        function renderList(keyword) {
            var kw = String(keyword || '').trim().toLowerCase();
            var filtered = catalog.filter(function (it) {
                if (!kw) return true;
                return String(it.name).toLowerCase().indexOf(kw) !== -1;
            });
            if (!filtered.length) {
                listEl.innerHTML = '<div class="pts-rule-pick-empty">无匹配项</div>';
                return;
            }
            listEl.innerHTML = filtered.map(function (it) {
                return (
                    '<label class="pts-rule-pick-item">' +
                    '<input type="checkbox" value="' + escapeHtml(it.id) + '"' +
                    (selectedMap[it.id] ? ' checked' : '') + '>' +
                    '<span>' + escapeHtml(it.name) + '</span>' +
                    '</label>'
                );
            }).join('');
        }

        renderList('');
        filterEl.addEventListener('input', function () {
            renderList(filterEl.value);
        });
        listEl.addEventListener('change', function (ev) {
            var input = ev.target;
            if (!input || input.type !== 'checkbox') return;
            if (input.checked) selectedMap[input.value] = true;
            else delete selectedMap[input.value];
        });

        function close() {
            backdrop.remove();
        }

        backdrop.addEventListener('click', function (ev) {
            if (ev.target === backdrop) close();
        });
        backdrop.querySelectorAll('[data-pick-close]').forEach(function (btn) {
            btn.addEventListener('click', close);
        });
        backdrop.querySelector('[data-pick-ok]').addEventListener('click', function () {
            scopeState.categories = catalog.filter(function (it) {
                return !!selectedMap[it.id];
            }).map(function (it) {
                return { id: it.id, name: it.name };
            });
            scopeState.products = [];
            renderScopeChips();
            close();
        });

        document.body.appendChild(backdrop);
        filterEl.focus();
    }

    function openProductScopePicker(selectedMap) {
        var catalog = Data.DEMO_PRODUCTS || [];
        var cats = Data.DEMO_CATEGORIES || [];
        var filterState = { categoryId: '', name: '', sku: '' };
        var catOptions = cats.map(function (c) {
            return '<option value="' + escapeHtml(c.id) + '">' + escapeHtml(c.name) + '</option>';
        }).join('');

        var backdrop = document.createElement('div');
        backdrop.className = 'pts-rule-pick-backdrop';
        backdrop.innerHTML =
            '<div class="pts-rule-pick-modal pts-rule-pick-modal--product" role="dialog" aria-modal="true">' +
            '  <div class="pts-rule-pick-modal__header">' +
            '    <h3 class="pts-rule-pick-modal__title">选择商品</h3>' +
            '    <button type="button" class="pts-rule-pick-modal__close" data-pick-close aria-label="关闭">&times;</button>' +
            '  </div>' +
            '  <div class="pts-rule-pick-modal__body">' +
            '    <div class="pts-rule-product-filter">' +
            '      <select class="erp-select pts-rule-product-filter__cat" data-pick-cat>' +
            '        <option value="">全部类目</option>' + catOptions +
            '      </select>' +
            '      <input class="erp-input" type="text" placeholder="商品名称" data-pick-name>' +
            '      <input class="erp-input" type="text" placeholder="SKU 编码" data-pick-sku>' +
            '      <button type="button" class="erp-btn" data-pick-search>搜索</button>' +
            '    </div>' +
            '    <div class="pts-rule-product-table-wrap">' +
            '      <table class="pts-rule-product-table">' +
            '        <thead><tr>' +
            '          <th style="width:40px;"></th>' +
            '          <th style="width:64px;">图片</th>' +
            '          <th>商品名称</th>' +
            '          <th>SKU 编码</th>' +
            '          <th style="width:120px;">价格</th>' +
            '        </tr></thead>' +
            '        <tbody data-pick-list></tbody>' +
            '      </table>' +
            '    </div>' +
            '  </div>' +
            '  <div class="pts-rule-pick-modal__footer">' +
            '    <span class="pts-rule-tip" data-pick-count style="margin:0;margin-right:auto;"></span>' +
            '    <button type="button" class="erp-btn" data-pick-close>取消</button>' +
            '    <button type="button" class="erp-btn erp-btn--primary" data-pick-ok>确定</button>' +
            '  </div>' +
            '</div>';

        var listEl = backdrop.querySelector('[data-pick-list]');
        var catEl = backdrop.querySelector('[data-pick-cat]');
        var nameEl = backdrop.querySelector('[data-pick-name]');
        var skuEl = backdrop.querySelector('[data-pick-sku]');
        var countEl = backdrop.querySelector('[data-pick-count]');

        function syncCount() {
            var n = Object.keys(selectedMap).length;
            if (countEl) countEl.textContent = n ? ('已选 ' + n + ' 件商品') : '';
        }

        function matchProduct(it) {
            if (filterState.categoryId && it.categoryId !== filterState.categoryId) return false;
            var nameKw = filterState.name.trim().toLowerCase();
            if (nameKw && String(it.name).toLowerCase().indexOf(nameKw) === -1) return false;
            var skuKw = filterState.sku.trim().toLowerCase();
            if (skuKw) {
                var codes = (it.skus || []).map(function (s) { return String(s.code || '').toLowerCase(); }).join(' ');
                if (codes.indexOf(skuKw) === -1) return false;
            }
            return true;
        }

        function renderList() {
            var filtered = catalog.filter(matchProduct);
            if (!filtered.length) {
                listEl.innerHTML = '<tr><td colspan="5" class="pts-rule-pick-empty">无匹配商品</td></tr>';
                syncCount();
                return;
            }
            listEl.innerHTML = filtered.map(function (it) {
                var checked = !!selectedMap[it.id];
                return (
                    '<tr class="pts-rule-product-row' + (checked ? ' is-checked' : '') + '" data-id="' + escapeHtml(it.id) + '">' +
                    '<td><input type="checkbox" value="' + escapeHtml(it.id) + '"' + (checked ? ' checked' : '') + '></td>' +
                    '<td><img class="pts-rule-product-thumb" src="' + escapeHtml(it.image || '') + '" alt=""></td>' +
                    '<td>' + escapeHtml(it.name) + '</td>' +
                    '<td>' + escapeHtml(formatProductSkuCodes(it)) + '</td>' +
                    '<td>' + escapeHtml(formatProductPrice(it)) + '</td>' +
                    '</tr>'
                );
            }).join('');
            syncCount();
        }

        function applyFilter() {
            filterState.categoryId = catEl.value;
            filterState.name = nameEl.value;
            filterState.sku = skuEl.value;
            renderList();
        }

        renderList();
        backdrop.querySelector('[data-pick-search]').addEventListener('click', applyFilter);
        listEl.addEventListener('change', function (ev) {
            var input = ev.target;
            if (!input || input.type !== 'checkbox') return;
            var tr = input.closest('tr');
            if (input.checked) {
                selectedMap[input.value] = true;
                if (tr) tr.classList.add('is-checked');
            } else {
                delete selectedMap[input.value];
                if (tr) tr.classList.remove('is-checked');
            }
            syncCount();
        });

        function close() {
            backdrop.remove();
        }
        backdrop.addEventListener('click', function (ev) {
            if (ev.target === backdrop) close();
        });
        backdrop.querySelectorAll('[data-pick-close]').forEach(function (btn) {
            btn.addEventListener('click', close);
        });
        backdrop.querySelector('[data-pick-ok]').addEventListener('click', function () {
            scopeState.products = catalog.filter(function (it) {
                return !!selectedMap[it.id];
            }).map(function (it) {
                return { id: it.id, name: it.name };
            });
            scopeState.categories = [];
            renderScopeChips();
            close();
        });

        document.body.appendChild(backdrop);
    }

    function openScopePicker() {
        if (scopeState.type === 'all') return;
        var selectedMap = {};
        getScopeSelectedItems().forEach(function (it) {
            selectedMap[it.id] = true;
        });
        if (isProductScope(scopeState.type)) openProductScopePicker(selectedMap);
        else openCategoryScopePicker(selectedMap);
    }

    function applyRuleToForm(rule) {
        document.getElementById('ptsEnabled').checked = !!rule.enabled;
        document.getElementById('ptsValidityDays').value = rule.validityDays;
        document.getElementById('ptsRuleDesc').value = rule.ruleDesc || '';

        document.getElementById('cashEnabled').checked = !!rule.cash.enabled;
        document.getElementById('cashPerPoint').value = Number(rule.cash.perPointAmount).toFixed(2);
        document.getElementById('cashMaxRatio').value = rule.cash.maxRatio;
        document.getElementById('cashMaxAmount').value = Number(rule.cash.maxAmount).toFixed(2);

        var scope = normalizeScope(rule.cash.scope);
        scopeState = {
            type: scope.type,
            products: scope.products.slice(),
            categories: scope.categories.slice()
        };
        document.querySelectorAll('input[name="cashScopeType"]').forEach(function (el) {
            el.checked = el.value === scope.type;
        });

        document.getElementById('exchangeEnabled').checked = !!rule.exchange.enabled;
        document.getElementById('exchangeRefundEnabled').checked = !!rule.exchange.refundEnabled;
        document.querySelectorAll('input[name="exchangeRefundValidity"]').forEach(function (el) {
            el.checked = el.value === 'keep_original';
        });

        document.getElementById('consumeEnabled').checked = !!rule.consume.enabled;
        document.getElementById('consumeAmount').value = Number(rule.consume.amountPerPoint).toFixed(2);

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

        var cardMap = [
            { card: 'cashRuleCard', switchId: 'cashEnabled', body: 'cashRuleBody' },
            { card: 'exchangeRuleCard', switchId: 'exchangeEnabled', body: 'exchangeRuleBody' },
            { card: 'consumeRuleCard', switchId: 'consumeEnabled', body: 'consumeRuleBody' }
        ];
        cardMap.forEach(function (item) {
            var card = document.getElementById(item.card);
            var sw = document.getElementById(item.switchId);
            if (card) card.classList.toggle('pts-rule-section-disabled', !on);
            if (sw) sw.disabled = !on;
            if (!on) setBodyDisabled(document.getElementById(item.body), true);
        });

        if (on) {
            syncCashUi();
            syncExchangeUi();
            syncConsumeUi();
        }
    }

    function syncCashUi() {
        var masterOn = document.getElementById('ptsEnabled').checked;
        var on = masterOn && document.getElementById('cashEnabled').checked;
        var body = document.getElementById('cashRuleBody');
        setBodyDisabled(body, !on);
        if (on) syncScopeUi();
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
            // 退还开关本身在 body 启用时应可点
            var refundSw = document.getElementById('exchangeRefundEnabled');
            if (refundSw) refundSw.disabled = false;
        }
    }

    function syncConsumeUi() {
        var masterOn = document.getElementById('ptsEnabled').checked;
        var on = masterOn && document.getElementById('consumeEnabled').checked;
        setBodyDisabled(document.getElementById('consumeRuleBody'), !on);
    }

    function syncAllUi() {
        syncMasterUi();
        if (document.getElementById('ptsEnabled').checked) {
            syncCashUi();
            syncExchangeUi();
            syncConsumeUi();
            syncScopeUi();
        }
    }

    function readForm() {
        return {
            enabled: document.getElementById('ptsEnabled').checked,
            validityDays: Number(document.getElementById('ptsValidityDays').value),
            ruleDesc: String(document.getElementById('ptsRuleDesc').value || '').trim(),
            cash: {
                enabled: document.getElementById('cashEnabled').checked,
                perPointAmount: Number(document.getElementById('cashPerPoint').value),
                maxRatio: Number(document.getElementById('cashMaxRatio').value),
                maxAmount: Number(document.getElementById('cashMaxAmount').value),
                scope: {
                    type: scopeState.type,
                    products: (scopeState.products || []).slice(),
                    categories: (scopeState.categories || []).slice()
                }
            },
            exchange: {
                enabled: document.getElementById('exchangeEnabled').checked,
                refundEnabled: document.getElementById('exchangeRefundEnabled').checked,
                refundValidity: (function () {
                    var el = document.querySelector('input[name="exchangeRefundValidity"]:checked');
                    return el && el.value ? el.value : 'keep_original';
                })()
            },
            consume: {
                enabled: document.getElementById('consumeEnabled').checked,
                amountPerPoint: Number(document.getElementById('consumeAmount').value)
            }
        };
    }

    function validate(rule) {
        if (rule.enabled) {
            if (!rule.validityDays || rule.validityDays < 1 || !Number.isInteger(rule.validityDays)) {
                return '请填写有效的积分有效期（正整数天）';
            }
        }
        if (rule.enabled && rule.cash.enabled) {
            if (!(rule.cash.perPointAmount > 0)) return '请填写每 1 积分可抵扣金额（大于 0，保留 2 位小数）';
            if (!(rule.cash.maxRatio >= 1 && rule.cash.maxRatio <= 100) || !Number.isInteger(rule.cash.maxRatio)) {
                return '每笔订单最大可抵扣比例须为 1~100 的整数';
            }
            if (!(rule.cash.maxAmount > 0)) return '请填写最大可抵扣金额（大于 0）';
            if (rule.cash.scope.type !== 'all') {
                var items = isProductScope(rule.cash.scope.type)
                    ? rule.cash.scope.products
                    : rule.cash.scope.categories;
                if (!items || !items.length) {
                    return isProductScope(rule.cash.scope.type) ? '请选择适用/排除商品' : '请选择适用/排除类目';
                }
            }
        }
        if (rule.enabled && rule.consume.enabled) {
            if (!(rule.consume.amountPerPoint > 0)) return '请填写消费送积分金额门槛（大于 0）';
        }
        return '';
    }

    function round2(n) {
        return Math.round(Number(n) * 100) / 100;
    }

    document.addEventListener('DOMContentLoaded', function () {
        var draft = loadRule();
        applyRuleToForm(draft);

        document.getElementById('ptsEnabled').addEventListener('change', syncAllUi);
        document.getElementById('cashEnabled').addEventListener('change', syncCashUi);
        document.getElementById('exchangeEnabled').addEventListener('change', syncExchangeUi);
        document.getElementById('exchangeRefundEnabled').addEventListener('change', syncExchangeUi);
        document.getElementById('consumeEnabled').addEventListener('change', syncConsumeUi);

        document.querySelectorAll('input[name="cashScopeType"]').forEach(function (el) {
            el.addEventListener('change', syncScopeUi);
        });

        var pickBtn = document.getElementById('cashScopePickBtn');
        if (pickBtn) pickBtn.addEventListener('click', openScopePicker);

        var chipsEl = document.getElementById('cashScopeChips');
        if (chipsEl) {
            chipsEl.addEventListener('click', function (ev) {
                var btn = ev.target.closest('[data-scope-remove]');
                if (!btn) return;
                var chip = btn.closest('[data-id]');
                if (!chip) return;
                var id = chip.getAttribute('data-id');
                if (isProductScope(scopeState.type)) {
                    scopeState.products = (scopeState.products || []).filter(function (it) {
                        return it.id !== id;
                    });
                } else {
                    scopeState.categories = (scopeState.categories || []).filter(function (it) {
                        return it.id !== id;
                    });
                }
                renderScopeChips();
            });
        }

        // 金额输入失焦时规范为 2 位小数
        ['cashPerPoint', 'cashMaxAmount', 'consumeAmount'].forEach(function (id) {
            var el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('blur', function () {
                var n = Number(el.value);
                if (!isNaN(n) && n > 0) el.value = round2(n).toFixed(2);
            });
        });

        document.getElementById('btnPtsRuleReset').addEventListener('click', function () {
            applyRuleToForm(clone(defaultRule));
            toast('已重置为默认配置', 'info');
        });

        document.getElementById('btnPtsRuleSave').addEventListener('click', function () {
            var rule = readForm();
            if (rule.enabled) {
                rule.validityDays = Math.floor(Number(rule.validityDays));
                rule.cash.perPointAmount = round2(rule.cash.perPointAmount);
                rule.cash.maxRatio = Math.floor(Number(rule.cash.maxRatio));
                rule.cash.maxAmount = round2(rule.cash.maxAmount);
                rule.consume.amountPerPoint = round2(rule.consume.amountPerPoint);
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

        /* 从积分商城「去配置」带 hash 定位到兑换规则卡片 */
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
