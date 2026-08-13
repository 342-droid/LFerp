/**
 * 会员等级 — 列表（按成长值升序）、启禁用、删除；新增/编辑跳转配置页
 */
(function () {
    var Data = window.MdmMemberLevelData;
    if (!Data) return;

    var state = {
        page: 1,
        pageSize: 10,
        filter: { levelName: '', status: '' },
        list: Data.loadLevelList()
    };

    function toast(msg, type) {
        if (typeof showToast === 'function') {
            showToast(msg, type || 'success');
            return;
        }
        window.alert(msg);
    }

    function nowStr() {
        var d = new Date();
        function pad(n) { return n < 10 ? '0' + n : String(n); }
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
            ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }

    function sortByGrowthAsc(list) {
        return list.slice().sort(function (a, b) {
            if (a.growthValue !== b.growthValue) return a.growthValue - b.growthValue;
            return String(a.name).localeCompare(String(b.name), 'zh-CN');
        });
    }

    function getFilteredList() {
        var f = state.filter;
        return sortByGrowthAsc(state.list.filter(function (item) {
            if (f.levelName && item.name.indexOf(f.levelName) === -1) return false;
            if (f.status && item.status !== f.status) return false;
            return true;
        }));
    }

    function findById(id) {
        var sid = String(id == null ? '' : id);
        for (var i = 0; i < state.list.length; i++) {
            if (String(state.list[i].id) === sid) return state.list[i];
        }
        return null;
    }

    function updateCountHint() {
        var el = document.getElementById('levelCountHint');
        if (el) el.textContent = '(' + state.list.length + '/' + Data.LEVEL_MAX + ')';
    }

    function closeWarmConfirm() {
        var backdrop = document.querySelector('[data-member-level-warm]');
        if (backdrop) backdrop.remove();
    }

    function openWarmConfirm(message, onConfirm) {
        closeWarmConfirm();
        var backdrop = document.createElement('div');
        backdrop.className = 'erp-modal-backdrop mdm-people-warm-confirm-backdrop';
        backdrop.setAttribute('data-member-level-warm', '1');
        backdrop.innerHTML =
            '<div class="erp-modal erp-modal--confirm">' +
            '  <div class="erp-modal__header">' +
            '    <h2 class="erp-modal__title">温馨提示</h2>' +
            '    <div class="erp-modal__header-actions">' +
            '      <button type="button" class="erp-modal__header-btn" data-warm-close aria-label="关闭">&times;</button>' +
            '    </div>' +
            '  </div>' +
            '  <div class="erp-modal__body">' +
            '    <div class="erp-modal-confirm__row">' +
            '      <div class="erp-modal-confirm__icon">!</div>' +
            '      <div class="erp-modal-confirm__msg">' + Data.escapeHtml(message) + '</div>' +
            '    </div>' +
            '  </div>' +
            '  <div class="erp-modal__footer">' +
            '    <button type="button" class="erp-btn" data-warm-cancel>取消</button>' +
            '    <button type="button" class="erp-btn erp-btn--primary" data-warm-ok>确定</button>' +
            '  </div>' +
            '</div>';

        backdrop.addEventListener('click', function (ev) {
            if (ev.target === backdrop) closeWarmConfirm();
        });
        backdrop.querySelectorAll('[data-warm-close], [data-warm-cancel]').forEach(function (btn) {
            btn.addEventListener('click', closeWarmConfirm);
        });
        backdrop.querySelector('[data-warm-ok]').addEventListener('click', function () {
            closeWarmConfirm();
            if (typeof onConfirm === 'function') onConfirm();
        });
        document.body.appendChild(backdrop);
    }

    function renderLevelIconCell(item) {
        if (item.icon) {
            return (
                '<span class="member-level-icon-cell">' +
                '<img src="' + Data.escapeHtml(item.icon) + '" alt="">' +
                '</span>'
            );
        }
        var initial = (item.name || '等').charAt(0);
        return '<span class="member-level-icon-cell member-level-icon-cell--empty">' + Data.escapeHtml(initial) + '</span>';
    }

    function renderTable(pageItems, startIndex) {
        var tbody = document.getElementById('tableBody');
        if (!tbody) return;

        if (!pageItems.length) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:#999;padding:24px;">暂无数据</td></tr>';
            return;
        }

        tbody.innerHTML = pageItems.map(function (item, idx) {
            var statusClass = item.status === '启用' ? 'active' : 'inactive';
            var toggleText = item.status === '启用' ? '禁用' : '启用';
            var preset = Data.isSystemPreset(item);
            var growthLabel = preset
                ? '<span class="member-level-growth-cell">' + item.growthValue +
                  ' <span class="member-level-preset-tag" title="默认等级，成长值不可修改">默认</span></span>'
                : '<span class="member-level-growth-cell">' + item.growthValue + '</span>';
            var deleteLink = preset
                ? '<span class="action-link-disabled" title="默认等级，不支持删除">删除</span>'
                : '<a href="#" data-action="delete">删除</a>';
            var forceDeleteLink = preset
                ? ''
                : '<a href="#" data-action="force-delete" class="action-link-danger">强制删除等级</a>';
            var toggleLink = preset
                ? '<span class="action-link-disabled" title="默认等级，不支持禁用">禁用</span>'
                : '<a href="#" data-action="toggle">' + toggleText + '</a>';
            return (
                '<tr data-id="' + Data.escapeHtml(item.id) + '">' +
                '<td>' + (startIndex + idx + 1) + '</td>' +
                '<td>' + renderLevelIconCell(item) + '</td>' +
                '<td>' + Data.escapeHtml(item.name) + '</td>' +
                '<td>' + growthLabel + '</td>' +
                '<td class="member-level-benefit-cell"><div class="member-level-benefit-summary">' + Data.formatBenefitSummary(item) + '</div></td>' +
                '<td><a href="mdm_member_c.html?level=' + encodeURIComponent(item.name) + '" class="subject-name-link" data-action="members">' + item.memberCount + '</a></td>' +
                '<td>' + Data.escapeHtml(item.updatedAt) + '</td>' +
                '<td><span class="status ' + statusClass + '">' + Data.escapeHtml(item.status) + '</span></td>' +
                '<td class="action-links">' +
                '<a href="#" data-action="edit">编辑</a>' +
                toggleLink +
                deleteLink +
                forceDeleteLink +
                '</td>' +
                '</tr>'
            );
        }).join('');
    }

    function renderPagination(total) {
        if (typeof createPagination !== 'function') return;
        createPagination({
            containerId: 'pagination-container',
            totalItems: total,
            currentPage: state.page,
            pageSize: state.pageSize,
            onPageChange: function (page) {
                state.page = page;
                render(false);
            },
            onPageSizeChange: function (size) {
                state.pageSize = size;
                state.page = 1;
                render(false);
            }
        });
    }

    function render(resetPage) {
        if (resetPage) state.page = 1;
        Data.saveLevelList(state.list);
        updateCountHint();
        var filtered = getFilteredList();
        var total = filtered.length;
        var totalPages = Math.ceil(total / state.pageSize) || 1;
        if (state.page > totalPages) state.page = totalPages;
        var start = (state.page - 1) * state.pageSize;
        var pageItems = filtered.slice(start, start + state.pageSize);
        renderTable(pageItems, start);
        renderPagination(total);
    }

    function readFilter() {
        state.filter.levelName = (document.getElementById('qLevelName').value || '').trim();
        state.filter.status = document.getElementById('qStatus').value || '';
    }

    function bindEvents() {
        var addBtn = document.getElementById('btnAddLevel');
        if (addBtn) {
            addBtn.addEventListener('click', function () {
                if (state.list.length >= Data.LEVEL_MAX) {
                    toast('最多可设置 ' + Data.LEVEL_MAX + ' 个会员等级', 'warning');
                    return;
                }
                try {
                    sessionStorage.removeItem('mdm_member_level_edit_v1');
                } catch (e) { /* ignore */ }
                window.location.href = (window.wmsPath && typeof window.wmsPath.page === 'function')
                    ? window.wmsPath.page('mdm_member_level_form.html')
                    : 'mdm_member_level_form.html';
            });
        }

        var ruleBtn = document.getElementById('btnGotoRule');
        if (ruleBtn) {
            ruleBtn.addEventListener('click', function () {
                window.location.href = 'mdm_member_level_rule.html';
            });
        }

        var growthBtn = document.getElementById('btnGotoGrowth');
        if (growthBtn) {
            growthBtn.addEventListener('click', function () {
                window.location.href = 'mdm_member_level_growth.html';
            });
        }

        var descBtn = document.getElementById('btnGotoDesc');
        if (descBtn) {
            descBtn.addEventListener('click', function () {
                window.location.href = 'mdm_member_level_desc.html';
            });
        }

        var queryBtn = document.getElementById('btnFilterQuery');
        if (queryBtn) {
            queryBtn.addEventListener('click', function () {
                readFilter();
                render(true);
            });
        }

        var resetBtn = document.getElementById('btnFilterReset');
        if (resetBtn) {
            resetBtn.addEventListener('click', function () {
                var form = document.getElementById('memberLevelSearchForm');
                if (form) form.reset();
                state.filter = { levelName: '', status: '' };
                render(true);
            });
        }

        var tbody = document.getElementById('tableBody');
        if (!tbody) return;

        tbody.addEventListener('click', function (ev) {
            var link = ev.target.closest('a[data-action]');
            if (!link) return;
            var action = link.getAttribute('data-action');
            if (action === 'members') return;
            ev.preventDefault();
            var row = link.closest('tr[data-id]');
            if (!row) return;
            var item = findById(row.getAttribute('data-id'));
            if (!item) return;

            if (action === 'edit') {
                try {
                    sessionStorage.setItem('mdm_member_level_edit_v1', JSON.stringify(item));
                } catch (e) { /* ignore */ }
                var editUrl = 'mdm_member_level_form.html?id=' + encodeURIComponent(String(item.id));
                if (window.wmsPath && typeof window.wmsPath.page === 'function') {
                    editUrl = window.wmsPath.page('mdm_member_level_form.html') +
                        '?id=' + encodeURIComponent(String(item.id));
                }
                window.location.href = editUrl;
                return;
            }

            if (action === 'toggle') {
                if (Data.isSystemPreset(item)) {
                    toast('默认等级不支持禁用', 'warning');
                    return;
                }
                var next = item.status === '启用' ? '禁用' : '启用';
                /* 当前等级下有会员时不允许禁用 */
                if (next === '禁用' && Number(item.memberCount || 0) > 0) {
                    openWarmConfirm('当前等级下存在会员不允许禁用/删除', function () {});
                    return;
                }
                openWarmConfirm('确认将等级「' + item.name + '」' + next + '？', function () {
                    item.status = next;
                    item.updatedAt = nowStr();
                    toast('已' + next, 'success');
                    render(false);
                });
                return;
            }

            if (action === 'delete') {
                if (Data.isSystemPreset(item)) {
                    toast('默认等级（成长值为 0）不支持删除', 'warning');
                    return;
                }
                /* 当前等级下有会员时不允许普通删除 */
                if (Number(item.memberCount || 0) > 0) {
                    openWarmConfirm('当前等级下存在会员不允许禁用/删除', function () {});
                    return;
                }
                openWarmConfirm('确认删除等级「' + item.name + '」？', function () {
                    state.list = state.list.filter(function (it) { return it.id !== item.id; });
                    toast('已删除', 'success');
                    render(false);
                });
                return;
            }

            if (action === 'force-delete') {
                if (Data.isSystemPreset(item)) {
                    toast('默认等级不支持删除', 'warning');
                    return;
                }
                openWarmConfirm(
                    '确定要删除此等级，并将该等级下的会员根据成长值重新分配？',
                    function () {
                        forceDeleteLevel(item);
                    }
                );
            }
        });
    }

    /** 强制删除：按剩余等级成长值阈值，将会员数归入匹配等级（原型按人数演示） */
    function forceDeleteLevel(item) {
        var count = Number(item.memberCount || 0);
        var remain = state.list.filter(function (it) { return it.id !== item.id; });
        if (count > 0) {
            var targets = remain
                .filter(function (it) { return it.status !== '禁用'; })
                .slice()
                .sort(function (a, b) {
                    return Number(a.growthValue || 0) - Number(b.growthValue || 0);
                });
            /* 按被删等级成长值，归入「仍满足的最高等级」；找不到则归默认（成长值最低） */
            var threshold = Number(item.growthValue || 0);
            var dest = null;
            for (var i = 0; i < targets.length; i++) {
                if (Number(targets[i].growthValue || 0) <= threshold) {
                    dest = targets[i];
                }
            }
            if (!dest && targets.length) dest = targets[0];
            if (dest) {
                dest.memberCount = Number(dest.memberCount || 0) + count;
                dest.updatedAt = nowStr();
            }
        }
        state.list = remain;
        toast(count > 0 ? '已强制删除，会员已按成长值重新分配' : '已强制删除', 'success');
        render(false);
    }

    document.addEventListener('DOMContentLoaded', function () {
        bindEvents();
        render(true);
    });
})();
