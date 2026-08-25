/**
 * 订单 · 快递截单（多条策略组合，对齐运费配置）
 * 直播 / 商城分开匹配；指定类目优先于全部类目。
 * 截单窗口：本次时刻截「上次该时刻 ～ 本次前一秒」的待发货未填快递单。
 */
(function () {
    var STORAGE_KEY = 'lf_order_express_cutoff_v4';
    var PAGE_SIZE_OPTIONS = [20, 50, 100];
    var SCENE_LABEL = { live: '直播', mall: '商城' };
    var STATUS_LABEL = { draft: '草稿', active: '启动', stopped: '停用' };
    var STATUS_CLASS = { draft: 'is-draft', active: 'is-on', stopped: 'is-off' };

    function statusText(status) {
        return STATUS_LABEL[status] || STATUS_LABEL.draft;
    }

    function statusClass(status) {
        return STATUS_CLASS[status] || STATUS_CLASS.draft;
    }
    var FALLBACK_CATEGORIES = [
        { id: '新鲜蔬菜', name: '新鲜蔬菜' },
        { id: '时令水果', name: '时令水果' },
        { id: '粮油调味', name: '粮油调味' },
        { id: '肉禽蛋品', name: '肉禽蛋品' },
        { id: '酒水饮料', name: '酒水饮料' }
    ];

    var idSeq = 4;
    var SEED_STRATEGIES = [
        {
            id: 's1',
            name: '默认截单',
            scenes: ['live', 'mall'],
            cutoffTime: '10:00:00',
            categoryScope: 'all',
            categories: [],
            status: 'draft',
            userDesc: ''
        },
        {
            id: 's2',
            name: '直播蔬菜截单',
            scenes: ['live'],
            cutoffTime: '08:00:00',
            categoryScope: 'specified',
            categories: [{ id: '新鲜蔬菜', name: '新鲜蔬菜' }],
            status: 'active',
            userDesc: ''
        },
        {
            id: 's3',
            name: '商城水果截单',
            scenes: ['mall'],
            cutoffTime: '14:00:00',
            categoryScope: 'specified',
            categories: [{ id: '时令水果', name: '时令水果' }],
            status: 'stopped',
            userDesc: ''
        }
    ];

    var state = {
        strategies: [],
        keywordName: '',
        filterScene: '',
        filterStatus: '',
        page: 1,
        pageSize: 20,
        selected: {},
        collapsed: false,
        drawer: null,
        editId: null,
        formCategories: []
    };

    function $(id) {
        return document.getElementById(id);
    }

    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text != null && text !== '') n.textContent = text;
        return n;
    }

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

    function pad2(num) {
        return (num < 10 ? '0' : '') + num;
    }

    function escapeHtml(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function normalizeTime(raw) {
        var text = String(raw || '').trim();
        var match = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
        if (!match) return '';
        var hour = Number(match[1]);
        var minute = Number(match[2]);
        var second = match[3] != null ? Number(match[3]) : 0;
        if (hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) {
            return '';
        }
        return pad2(hour) + ':' + pad2(minute) + ':' + pad2(second);
    }

    function subtractOneSecond(hhmmss) {
        var time = normalizeTime(hhmmss);
        if (!time) return '23:59:59';
        var parts = time.split(':');
        var total = Number(parts[0]) * 3600 + Number(parts[1]) * 60 + Number(parts[2]) - 1;
        if (total < 0) total += 24 * 3600;
        return pad2(Math.floor(total / 3600)) + ':' + pad2(Math.floor((total % 3600) / 60)) + ':' + pad2(total % 60);
    }

    function nextId() {
        return 's' + idSeq++;
    }

    function syncIdSeq(list) {
        var max = 0;
        (list || []).forEach(function (row) {
            var m = String(row.id || '').match(/^s(\d+)$/);
            if (m) max = Math.max(max, Number(m[1]));
        });
        if (max >= idSeq) idSeq = max + 1;
    }

    function normalizeScenes(row) {
        var list = [];
        if (row && Array.isArray(row.scenes)) list = row.scenes;
        else if (row && row.scene) list = [row.scene];
        var out = [];
        if (list.indexOf('live') >= 0) out.push('live');
        if (list.indexOf('mall') >= 0) out.push('mall');
        return out;
    }

    function sceneText(row) {
        return normalizeScenes(row)
            .map(function (s) {
                return SCENE_LABEL[s];
            })
            .filter(Boolean)
            .join('、') || '—';
    }

    function scenesOverlap(a, b) {
        var left = normalizeScenes(a);
        var right = normalizeScenes(b);
        return left.some(function (s) {
            return right.indexOf(s) >= 0;
        });
    }

    function overlapSceneLabels(a, b) {
        var left = normalizeScenes(a);
        var right = normalizeScenes(b);
        return left
            .filter(function (s) {
                return right.indexOf(s) >= 0;
            })
            .map(function (s) {
                return SCENE_LABEL[s];
            })
            .join('、');
    }

    function getCatalogCategories() {
        if (
            window.MdmProductCatalog &&
            typeof window.MdmProductCatalog.getCategories === 'function'
        ) {
            var list = window.MdmProductCatalog.getCategories() || [];
            if (list.length) return list;
        }
        return FALLBACK_CATEGORIES.slice();
    }

    function normalizeCategories(list) {
        return (Array.isArray(list) ? list : [])
            .map(function (row) {
                var id = String((row && (row.id || row.name)) || '').trim();
                if (!id) return null;
                return { id: id, name: String((row && row.name) || id).trim() || id };
            })
            .filter(Boolean);
    }

    function normalizeStrategy(row) {
        if (!row) return null;
        var scenes = normalizeScenes(row);
        if (!scenes.length) return null;
        var scope = row.categoryScope === 'specified' ? 'specified' : 'all';
        var cats = scope === 'specified' ? normalizeCategories(row.categories) : [];
        return {
            id: String(row.id || row.code || nextId()),
            name: String(row.name || '').trim(),
            scenes: scenes,
            cutoffTime: normalizeTime(row.cutoffTime) || '10:00:00',
            categoryScope: scope,
            categories: cats,
            status: row.status === 'active' || row.status === 'stopped' ? row.status : 'draft',
            userDesc: row.userDesc != null ? String(row.userDesc) : ''
        };
    }

    function migrateLegacyRule(rule) {
        var scenes = [];
        if (rule.scenes && rule.scenes.live) scenes.push('live');
        if (rule.scenes && rule.scenes.mall) scenes.push('mall');
        if (!scenes.length) scenes = ['live', 'mall'];
        var list = [
            {
                id: nextId(),
                name: '默认截单',
                scenes: scenes,
                cutoffTime: rule.cutoffTime || '10:00:00',
                categoryScope: 'all',
                categories: [],
                status: 'draft',
                userDesc: rule.userDesc || ''
            }
        ];
        (rule.categoryTimes || []).forEach(function (cat) {
            list.push({
                id: nextId(),
                name: String(cat.name || cat.id || '') + '截单',
                scenes: scenes.slice(),
                cutoffTime: cat.cutoffTime,
                categoryScope: 'specified',
                categories: [{ id: cat.id || cat.name, name: cat.name || cat.id }],
                status: 'draft',
                userDesc: ''
            });
        });
        return list.map(normalizeStrategy).filter(Boolean);
    }

    function loadStrategies() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                var parsed = JSON.parse(raw);
                var list = Array.isArray(parsed)
                    ? parsed
                    : parsed && Array.isArray(parsed.strategies)
                      ? parsed.strategies
                      : [];
                var normalized = list.map(normalizeStrategy).filter(Boolean);
                if (normalized.length) {
                    syncIdSeq(normalized);
                    return normalized;
                }
            }
            var legacyKeys = [
                'lf_order_express_cutoff_v3',
                'lf_order_express_cutoff_v2',
                'lf_order_express_cutoff_v1'
            ];
            for (var i = 0; i < legacyKeys.length; i++) {
                var legacy = localStorage.getItem(legacyKeys[i]);
                if (!legacy) continue;
                var old = JSON.parse(legacy);
                var fromList = [];
                if (Array.isArray(old)) fromList = old;
                else if (old && Array.isArray(old.strategies)) fromList = old.strategies;
                var migrated = fromList.length
                    ? fromList.map(normalizeStrategy).filter(Boolean)
                    : migrateLegacyRule(old || {});
                if (migrated.length) {
                    syncIdSeq(migrated);
                    return migrated;
                }
            }
        } catch (e) {
            /* ignore */
        }
        var seed = SEED_STRATEGIES.map(normalizeStrategy).filter(Boolean);
        syncIdSeq(seed);
        return seed;
    }

    function saveStrategies() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ strategies: state.strategies }));
    }

    function categoryText(row) {
        if (!row || row.categoryScope !== 'specified' || !row.categories.length) return '全部类目';
        return row.categories
            .map(function (c) {
                return c.name;
            })
            .join('、');
    }

    function filteredRows() {
        var name = String(state.keywordName || '').trim().toLowerCase();
        var scene = String(state.filterScene || '').trim();
        var status = String(state.filterStatus || '').trim();
        return state.strategies.filter(function (row) {
            if (name && String(row.name).toLowerCase().indexOf(name) < 0) {
                return false;
            }
            if (scene && normalizeScenes(row).indexOf(scene) < 0) return false;
            if (status && (row.status || 'draft') !== status) return false;
            return true;
        });
    }

    function pageRows() {
        var all = filteredRows();
        var start = (state.page - 1) * state.pageSize;
        return { total: all.length, rows: all.slice(start, start + state.pageSize) };
    }

    function selectedCodes() {
        return Object.keys(state.selected).filter(function (k) {
            return state.selected[k];
        });
    }

    function findRow(id) {
        var found = null;
        state.strategies.forEach(function (row) {
            if (row.id === id) found = row;
        });
        return found;
    }

    function syncDeleteBtn() {
        var btn = $('cutoffDeleteBtn');
        if (btn) btn.disabled = selectedCodes().length === 0;
    }

    function overlapError(candidate, ignoreId) {
        for (var i = 0; i < state.strategies.length; i++) {
            var row = state.strategies[i];
            if (ignoreId && row.id === ignoreId) continue;
            if (!scenesOverlap(row, candidate)) continue;
            var sceneLabel = overlapSceneLabels(row, candidate);
            if (row.categoryScope === 'all' && candidate.categoryScope === 'all') {
                return sceneLabel + '已有「全部类目」策略「' + row.name + '」';
            }
            if (row.categoryScope === 'specified' && candidate.categoryScope === 'specified') {
                var seen = {};
                row.categories.forEach(function (c) {
                    seen[c.id] = c.name;
                });
                for (var j = 0; j < candidate.categories.length; j++) {
                    var hit = seen[candidate.categories[j].id];
                    if (hit) {
                        return sceneLabel + '类目「' + hit + '」已在策略「' + row.name + '」中配置';
                    }
                }
            }
        }
        return '';
    }

    function renderTable() {
        var tbody = $('cutoffTableBody');
        var empty = $('cutoffEmpty');
        var pageData = pageRows();
        if (!tbody) return;

        if (!pageData.rows.length) {
            tbody.innerHTML = '';
            if (empty) empty.hidden = false;
        } else {
            if (empty) empty.hidden = true;
            tbody.innerHTML = pageData.rows
                .map(function (row, idx) {
                    var index = (state.page - 1) * state.pageSize + idx + 1;
                    var checked = !!state.selected[row.id];
                    return (
                        '<tr class="' +
                        (checked ? 'is-selected' : '') +
                        '" data-id="' +
                        escapeHtml(row.id) +
                        '">' +
                        '<td class="sf-table__check"><input type="checkbox" class="cutoff-row-check" data-id="' +
                        escapeHtml(row.id) +
                        '"' +
                        (checked ? ' checked' : '') +
                        '></td>' +
                        '<td class="sf-table__index">' +
                        index +
                        '</td>' +
                        '<td><a href="#" class="sf-link js-cutoff-name">' +
                        escapeHtml(row.name) +
                        '</a></td>' +
                        '<td>' +
                        escapeHtml(sceneText(row)) +
                        '</td>' +
                        '<td title="' +
                        escapeHtml(categoryText(row)) +
                        '">' +
                        escapeHtml(categoryText(row)) +
                        '</td>' +
                        '<td>' +
                        escapeHtml(row.cutoffTime) +
                        '</td>' +
                        '<td><span class="cutoff-status ' +
                        statusClass(row.status) +
                        '">' +
                        escapeHtml(statusText(row.status)) +
                        '</span></td>' +
                        '<td class="sf-table__action"><div class="sf-action-cell">' +
                        '<button type="button" class="sf-link js-cutoff-edit">修改</button>' +
                        '<button type="button" class="sf-link js-cutoff-toggle">' +
                        (row.status === 'active' ? '停用' : '启动') +
                        '</button>' +
                        '</div></td>' +
                        '</tr>'
                    );
                })
                .join('');
        }

        var checkAll = $('cutoffCheckAll');
        if (checkAll) {
            var ids = pageData.rows.map(function (r) {
                return r.id;
            });
            var allChecked =
                ids.length > 0 &&
                ids.every(function (id) {
                    return state.selected[id];
                });
            checkAll.checked = allChecked;
            checkAll.indeterminate = !allChecked && ids.some(function (id) {
                return state.selected[id];
            });
        }

        renderPagination(pageData.total);
        syncDeleteBtn();
    }

    function renderPagination(total) {
        var totalEl = $('cutoffPaginationTotal');
        var pagesEl = $('cutoffPaginationPages');
        var sizeEl = $('cutoffPageSize');
        var jumpEl = $('cutoffJumpPage');
        if (totalEl) totalEl.textContent = '共 ' + total + ' 条';
        if (sizeEl && !sizeEl.options.length) {
            PAGE_SIZE_OPTIONS.forEach(function (n) {
                var opt = document.createElement('option');
                opt.value = String(n);
                opt.textContent = n + ' 条/页';
                sizeEl.appendChild(opt);
            });
        }
        if (sizeEl) sizeEl.value = String(state.pageSize);
        if (jumpEl) jumpEl.value = String(state.page);

        var totalPages = Math.max(1, Math.ceil(total / state.pageSize) || 1);
        if (state.page > totalPages) state.page = totalPages;
        if (!pagesEl) return;
        pagesEl.innerHTML =
            '<button type="button" class="sf-page-btn" data-page="' +
            (state.page - 1) +
            '"' +
            (state.page <= 1 ? ' disabled' : '') +
            '>‹</button>' +
            '<button type="button" class="sf-page-btn is-active" data-page="' +
            state.page +
            '">' +
            state.page +
            '</button>' +
            '<button type="button" class="sf-page-btn" data-page="' +
            (state.page + 1) +
            '"' +
            (state.page >= totalPages ? ' disabled' : '') +
            '>›</button>';
    }

    function closeDrawer() {
        if (state.drawer) {
            state.drawer.remove();
            state.drawer = null;
        }
        state.editId = null;
        state.formCategories = [];
    }

    function updateTimeTip(time) {
        var tip = $('cutoffFormTimeTip');
        if (!tip) return;
        var t = normalizeTime(time) || '10:00:00';
        var prev = subtractOneSecond(t);
        tip.textContent =
            '每次截单覆盖「上次该时刻 ～ 本次前一秒」。例：今天 ' + t + ' 截昨天 ' + t + ' 至今天 ' + prev + ' 的订单。';
    }

    function renderFormCategories() {
        var listEl = $('cutoffFormCatList');
        if (!listEl) return;
        var rows = normalizeCategories(state.formCategories);
        state.formCategories = rows;
        if (!rows.length) {
            listEl.innerHTML = '';
            return;
        }
        listEl.innerHTML = rows
            .map(function (row) {
                return (
                    '<div class="cutoff-cat-row" data-cat-id="' +
                    escapeHtml(row.id) +
                    '"><span>' +
                    escapeHtml(row.name) +
                    '</span><button type="button" class="sf-link" data-cat-remove>删除</button></div>'
                );
            })
            .join('');
    }

    function syncCategoryScopeUi() {
        var specified = document.querySelector('input[name="cutoffFormCatScope"]:checked');
        var box = $('cutoffFormCatBox');
        if (!box) return;
        box.hidden = !(specified && specified.value === 'specified');
    }

    function openCategoryPicker() {
        var catalog = getCatalogCategories();
        if (!catalog.length) {
            toast('暂无选品库类目', 'warning');
            return;
        }
        var selectedMap = {};
        state.formCategories.forEach(function (row) {
            selectedMap[row.id] = true;
        });

        var backdrop = document.createElement('div');
        backdrop.className = 'pts-rule-pick-backdrop';
        backdrop.innerHTML =
            '<div class="pts-rule-pick-modal" role="dialog" aria-modal="true">' +
            '  <div class="pts-rule-pick-modal__header">' +
            '    <h3 class="pts-rule-pick-modal__title">选择商品类目</h3>' +
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
            listEl.innerHTML = filtered
                .map(function (it) {
                    return (
                        '<label class="pts-rule-pick-item"><input type="checkbox" value="' +
                        escapeHtml(it.id) +
                        '"' +
                        (selectedMap[it.id] ? ' checked' : '') +
                        '><span>' +
                        escapeHtml(it.name) +
                        '</span></label>'
                    );
                })
                .join('');
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
            state.formCategories = catalog.filter(function (it) {
                return !!selectedMap[it.id];
            });
            renderFormCategories();
            close();
        });
        document.body.appendChild(backdrop);
        filterEl.focus();
    }

    function readDrawerForm() {
        var scenes = [];
        document.querySelectorAll('input[name="cutoffFormScene"]:checked').forEach(function (el) {
            if (el.value === 'live' || el.value === 'mall') scenes.push(el.value);
        });
        var scopeEl = document.querySelector('input[name="cutoffFormCatScope"]:checked');
        var scope = scopeEl && scopeEl.value === 'specified' ? 'specified' : 'all';
        return {
            id: state.editId || nextId(),
            name: ($('cutoffFormName') && $('cutoffFormName').value) || '',
            scenes: scenes,
            cutoffTime: ($('cutoffFormTime') && $('cutoffFormTime').value) || '',
            categoryScope: scope,
            categories: scope === 'specified' ? normalizeCategories(state.formCategories) : [],
            status: 'draft',
            userDesc: ($('cutoffFormDesc') && $('cutoffFormDesc').value) || ''
        };
    }

    function validateStrategy(row, ignoreId) {
        if (!String(row.name || '').trim()) return '请输入策略名称';
        if (!normalizeScenes(row).length) return '请至少选择一个适用场景';
        if (!normalizeTime(row.cutoffTime)) return '请填写截单时间';
        if (row.categoryScope === 'specified' && !row.categories.length) return '请选择商品类目';
        return overlapError(row, ignoreId);
    }

    function openDrawer(row, mode) {
        closeDrawer();
        var isView = mode === 'view';
        var isEdit = !!row && !isView;
        var isCreate = !row;
        state.editId = isEdit || isView ? row.id : null;
        state.formCategories = isCreate ? [] : normalizeCategories(row.categories);

        var backdrop = el('div', 'sf-drawer-backdrop' + (isView ? ' is-view' : ''));
        var drawer = el('aside', 'sf-drawer' + (isView ? ' sf-drawer--view' : ''));
        drawer.setAttribute('role', 'dialog');
        drawer.setAttribute('aria-modal', 'true');

        var header = el('div', 'sf-drawer__header');
        header.appendChild(
            el('h2', 'sf-drawer__title', isView ? '截单策略详情' : isEdit ? '修改截单策略' : '新增截单策略')
        );
        var closeBtn = el('button', 'sf-drawer__close');
        closeBtn.type = 'button';
        closeBtn.setAttribute('aria-label', '关闭');
        closeBtn.innerHTML = '&times;';
        header.appendChild(closeBtn);

        var scenes = isCreate ? ['live', 'mall'] : normalizeScenes(row);
        var scope = isCreate ? 'all' : row.categoryScope;
        var time = isCreate ? '10:00:00' : row.cutoffTime || '10:00:00';

        var body = el('div', 'sf-drawer__body');
        body.innerHTML =
            '<section class="sf-section" id="cutoffBasicSection">' +
            '  <div class="sf-section__head"><h3 class="sf-section__title">基本信息</h3></div>' +
            '  <div class="sf-section__body"><div class="sf-form-grid">' +
            '    <div class="sf-form-item"><div class="sf-form-item__label"><span class="sf-req">*</span>策略名称</div>' +
            '      <div class="sf-form-item__control"><input class="sf-input" id="cutoffFormName" placeholder="请输入策略名称"></div></div>' +
            '    <div class="sf-form-item"><div class="sf-form-item__label"><span class="sf-req">*</span>适用场景</div>' +
            '      <div class="sf-form-item__control"><div class="cutoff-radio-row">' +
            '        <label><input type="checkbox" name="cutoffFormScene" value="live"> 直播</label>' +
            '        <label><input type="checkbox" name="cutoffFormScene" value="mall"> 商城</label>' +
            '      </div><div class="cutoff-form-tip">可同时勾选。同一场景 + 同类目不可与其它策略重叠。保存后为草稿，需在列表手动启动。</div></div></div>' +
            '  </div></div>' +
            '</section>' +
            '<section class="sf-section" id="cutoffRuleSection">' +
            '  <div class="sf-section__head"><h3 class="sf-section__title">截单规则</h3></div>' +
            '  <div class="sf-section__body"><div class="sf-form-grid">' +
            '    <div class="sf-form-item"><div class="sf-form-item__label"><span class="sf-req">*</span>截单时间</div>' +
            '      <div class="sf-form-item__control"><input class="sf-input" id="cutoffFormTime" type="time" step="1">' +
            '      <div class="cutoff-form-tip" id="cutoffFormTimeTip"></div></div></div>' +
            '    <div class="sf-form-item sf-form-item--wide"><div class="sf-form-item__label"><span class="sf-req">*</span>商品类目</div>' +
            '      <div class="sf-form-item__control">' +
            '        <div class="cutoff-radio-row">' +
            '          <label><input type="radio" name="cutoffFormCatScope" value="all"> 全部类目</label>' +
            '          <label><input type="radio" name="cutoffFormCatScope" value="specified"> 指定选品库类目</label>' +
            '        </div>' +
            '        <div id="cutoffFormCatBox" hidden>' +
            '          <div class="cutoff-cat-list" id="cutoffFormCatList"></div>' +
            '          <button type="button" class="sf-btn" id="cutoffFormCatAdd">+ 添加商品类目</button>' +
            '        </div>' +
            '        <div class="cutoff-form-tip">同一场景下指定类目优先于「全部类目」。未单独配置的类目走该场景的全部类目策略。</div>' +
            '      </div></div>' +
            '    <div class="sf-form-item sf-form-item--wide"><div class="sf-form-item__label">用户端说明</div>' +
            '      <div class="sf-form-item__control"><textarea class="sf-input" id="cutoffFormDesc" placeholder="选填，截单后展示给用户（如「商家已截单备货，如需退款请申请售后」）"></textarea></div></div>' +
            '  </div></div>' +
            '</section>' +
            '<section class="sf-section">' +
            '  <div class="sf-section__head"><h3 class="sf-section__title">截单后</h3></div>' +
            '  <div class="sf-section__body">' +
            '    <ul class="cutoff-after-list">' +
            '      <li>用户 APP「取消订单」隐藏</li>' +
            '      <li>「申请退款」截断免审直退，改为走发货后售后审核流</li>' +
            '    </ul>' +
            '    <div class="cutoff-form-tip">各策略统一，相当于把发货后的售后方式提前到截单时刻。供应商已填写快递单的订单按发货后规则，不受本页影响。</div>' +
            '  </div>' +
            '</section>';

        var footer = el('div', 'sf-drawer__footer');
        var saveBtn = null;
        if (!isView) {
            saveBtn = el('button', 'sf-btn sf-btn--primary', '保存');
            saveBtn.type = 'button';
            footer.appendChild(saveBtn);
        }
        var backBtn = el('button', 'sf-btn sf-btn--default', '返回');
        backBtn.type = 'button';
        footer.appendChild(backBtn);

        drawer.appendChild(header);
        drawer.appendChild(body);
        drawer.appendChild(footer);
        backdrop.appendChild(drawer);
        document.body.appendChild(backdrop);
        state.drawer = backdrop;

        $('cutoffFormName').value = isCreate ? '' : row.name || '';
        $('cutoffFormTime').value = time;
        $('cutoffFormDesc').value = isCreate ? '' : row.userDesc || '';
        document.querySelectorAll('input[name="cutoffFormScene"]').forEach(function (r) {
            r.checked = scenes.indexOf(r.value) >= 0;
        });
        document.querySelectorAll('input[name="cutoffFormCatScope"]').forEach(function (r) {
            r.checked = r.value === scope;
        });
        renderFormCategories();
        syncCategoryScopeUi();
        updateTimeTip(time);

        if (isView) {
            backdrop.querySelectorAll('input, textarea, button#cutoffFormCatAdd').forEach(function (input) {
                if (input === closeBtn || input === backBtn) return;
                input.disabled = true;
            });
        }

        function shut() {
            closeDrawer();
        }
        closeBtn.addEventListener('click', shut);
        backBtn.addEventListener('click', shut);
        backdrop.addEventListener('click', function (e) {
            if (e.target === backdrop) shut();
        });

        if (isView) return;

        $('cutoffFormTime').addEventListener('input', function () {
            updateTimeTip($('cutoffFormTime').value);
        });
        $('cutoffFormTime').addEventListener('change', function () {
            updateTimeTip($('cutoffFormTime').value);
        });
        document.querySelectorAll('input[name="cutoffFormCatScope"]').forEach(function (r) {
            r.addEventListener('change', syncCategoryScopeUi);
        });
        var addBtn = $('cutoffFormCatAdd');
        if (addBtn) {
            addBtn.addEventListener('click', openCategoryPicker);
        }
        var listEl = $('cutoffFormCatList');
        if (listEl) {
            listEl.addEventListener('click', function (ev) {
                var btn = ev.target.closest('[data-cat-remove]');
                if (!btn) return;
                var wrap = btn.closest('[data-cat-id]');
                var id = wrap && wrap.getAttribute('data-cat-id');
                state.formCategories = state.formCategories.filter(function (c) {
                    return c.id !== id;
                });
                renderFormCategories();
            });
        }

        saveBtn.addEventListener('click', function () {
            var draft = normalizeStrategy(readDrawerForm());
            if (!draft) {
                toast('请完善策略信息', 'warning');
                return;
            }
            var err = validateStrategy(draft, isEdit ? state.editId : '');
            if (err) {
                toast(err, 'warning');
                return;
            }
            if (isEdit) {
                state.strategies = state.strategies.map(function (item) {
                    return item.id === state.editId ? draft : item;
                });
                toast('已保存为草稿，请手动启动');
            } else {
                state.strategies.unshift(draft);
                toast('已保存为草稿，请手动启动');
            }
            saveStrategies();
            closeDrawer();
            renderTable();
        });
    }

    function bindPage() {
        var queryBtn = $('cutoffFilterQuery');
        var resetBtn = $('cutoffFilterReset');
        var collapseBtn = $('cutoffFilterCollapse');
        var addBtn = $('cutoffAddBtn');
        var deleteBtn = $('cutoffDeleteBtn');
        var checkAll = $('cutoffCheckAll');
        var refreshBtn = $('cutoffRefreshBtn');
        var sizeEl = $('cutoffPageSize');
        var jumpGo = $('cutoffJumpGo');
        var pagesEl = $('cutoffPaginationPages');
        var tbody = $('cutoffTableBody');

        if (queryBtn) {
            queryBtn.addEventListener('click', function () {
                state.keywordName = ($('cutoffFilterName') && $('cutoffFilterName').value) || '';
                state.filterScene = ($('cutoffFilterScene') && $('cutoffFilterScene').value) || '';
                state.filterStatus = ($('cutoffFilterStatus') && $('cutoffFilterStatus').value) || '';
                state.page = 1;
                renderTable();
            });
        }
        if (resetBtn) {
            resetBtn.addEventListener('click', function () {
                if ($('cutoffFilterName')) $('cutoffFilterName').value = '';
                if ($('cutoffFilterScene')) $('cutoffFilterScene').value = '';
                if ($('cutoffFilterStatus')) $('cutoffFilterStatus').value = '';
                state.keywordName = '';
                state.filterScene = '';
                state.filterStatus = '';
                state.page = 1;
                renderTable();
            });
        }
        if (collapseBtn) {
            collapseBtn.addEventListener('click', function () {
                state.collapsed = !state.collapsed;
                var grid = $('cutoffFilterGrid');
                var label = $('cutoffFilterCollapseLabel');
                if (grid) grid.hidden = state.collapsed;
                if (label) label.textContent = state.collapsed ? '展开' : '收起';
            });
        }
        if (addBtn) {
            addBtn.addEventListener('click', function () {
                openDrawer(null);
            });
        }
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function () {
                var ids = selectedCodes();
                if (!ids.length) {
                    toast('请先勾选要删除的策略', 'warning');
                    return;
                }
                if (!window.confirm('确认删除选中的 ' + ids.length + ' 条截单策略吗？')) return;
                state.strategies = state.strategies.filter(function (row) {
                    if (ids.indexOf(row.id) >= 0) {
                        delete state.selected[row.id];
                        return false;
                    }
                    return true;
                });
                saveStrategies();
                state.page = 1;
                renderTable();
                toast('已删除选中策略');
            });
        }
        if (checkAll) {
            checkAll.addEventListener('change', function () {
                pageRows().rows.forEach(function (row) {
                    if (checkAll.checked) state.selected[row.id] = true;
                    else delete state.selected[row.id];
                });
                renderTable();
            });
        }
        if (refreshBtn) {
            refreshBtn.addEventListener('click', function () {
                renderTable();
                toast('列表已刷新', 'info');
            });
        }
        if (sizeEl) {
            sizeEl.addEventListener('change', function () {
                state.pageSize = Number(sizeEl.value) || 20;
                state.page = 1;
                renderTable();
            });
        }
        if (jumpGo) {
            jumpGo.addEventListener('click', function () {
                var page = parseInt(($('cutoffJumpPage') && $('cutoffJumpPage').value) || '1', 10);
                if (!page || page < 1) page = 1;
                state.page = page;
                renderTable();
            });
        }
        if (pagesEl) {
            pagesEl.addEventListener('click', function (ev) {
                var btn = ev.target.closest('[data-page]');
                if (!btn || btn.disabled) return;
                var page = parseInt(btn.getAttribute('data-page'), 10);
                if (!page || page < 1) return;
                state.page = page;
                renderTable();
            });
        }
        if (tbody) {
            tbody.addEventListener('change', function (ev) {
                var box = ev.target.closest('.cutoff-row-check');
                if (!box) return;
                var id = box.getAttribute('data-id');
                if (box.checked) state.selected[id] = true;
                else delete state.selected[id];
                renderTable();
            });
            tbody.addEventListener('click', function (ev) {
                var tr = ev.target.closest('tr[data-id]');
                if (!tr) return;
                var id = tr.getAttribute('data-id');
                var row = findRow(id);
                if (!row) return;
                if (ev.target.closest('.js-cutoff-name')) {
                    ev.preventDefault();
                    openDrawer(row, 'view');
                    return;
                }
                if (ev.target.closest('.js-cutoff-edit')) {
                    openDrawer(row, 'edit');
                    return;
                }
                if (ev.target.closest('.js-cutoff-toggle')) {
                    row.status = row.status === 'active' ? 'stopped' : 'active';
                    saveStrategies();
                    renderTable();
                    toast(row.status === 'active' ? '策略已启动' : '策略已停用');
                }
            });
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        state.strategies = loadStrategies();
        bindPage();
        renderTable();
    });
})();
