/**
 * 会员标签 — 列表筛选、新增/编辑弹窗、启禁用、删除、查看关联用户
 */
(function () {
    var TAG_VALUE_MAX = 50;
    var TAG_GROUP_MAX = 50;

    var state = {
        page: 1,
        pageSize: 10,
        filter: {
            tagValue: '',
            tagGroup: '',
            tagRule: '',
            status: ''
        },
        list: [
            {
                id: 'TV10001',
                groupId: 'TG10001',
                tagValue: '高活跃',
                tagGroup: '活跃度',
                tagRule: '单选',
                userCount: 128,
                createdAt: '2026-04-20 10:22:11',
                status: '启用'
            },
            {
                id: 'TV10002',
                groupId: 'TG10001',
                tagValue: '中活跃',
                tagGroup: '活跃度',
                tagRule: '单选',
                userCount: 86,
                createdAt: '2026-04-20 10:22:11',
                status: '启用'
            },
            {
                id: 'TV10003',
                groupId: 'TG10001',
                tagValue: '低活跃',
                tagGroup: '活跃度',
                tagRule: '单选',
                userCount: 0,
                createdAt: '2026-04-20 10:22:11',
                status: '禁用'
            },
            {
                id: 'TV10004',
                groupId: 'TG10002',
                tagValue: '储值',
                tagGroup: '消费偏好',
                tagRule: '多选',
                userCount: 42,
                createdAt: '2026-04-18 15:30:44',
                status: '启用'
            },
            {
                id: 'TV10005',
                groupId: 'TG10002',
                tagValue: '复购',
                tagGroup: '消费偏好',
                tagRule: '多选',
                userCount: 35,
                createdAt: '2026-04-18 15:30:44',
                status: '启用'
            },
            {
                id: 'TV10006',
                groupId: 'TG10003',
                tagValue: '新客',
                tagGroup: '生命周期',
                tagRule: '单选',
                userCount: 0,
                createdAt: '2026-04-15 09:12:08',
                status: '启用'
            }
        ]
    };

    function escapeHtml(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function nowStr() {
        var d = new Date();
        function pad(n) { return n < 10 ? '0' + n : String(n); }
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
            ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }

    function genId(prefix) {
        return prefix + String(Date.now()).slice(-8) + String(Math.floor(Math.random() * 90) + 10);
    }

    function toast(msg, type) {
        if (typeof showToast === 'function') {
            showToast(msg, type || 'success');
            return;
        }
        window.alert(msg);
    }

    function getFilteredList() {
        var f = state.filter;
        return state.list.filter(function (item) {
            if (f.tagValue && item.tagValue.indexOf(f.tagValue) === -1) return false;
            if (f.tagGroup && item.tagGroup.indexOf(f.tagGroup) === -1) return false;
            if (f.tagRule && item.tagRule !== f.tagRule) return false;
            if (f.status && item.status !== f.status) return false;
            return true;
        });
    }

    function findById(id) {
        for (var i = 0; i < state.list.length; i++) {
            if (state.list[i].id === id) return state.list[i];
        }
        return null;
    }

    function getGroupItems(groupId) {
        return state.list.filter(function (item) {
            return item.groupId === groupId;
        });
    }

    function closeModal() {
        var backdrop = document.querySelector('[data-member-tag-modal]');
        if (backdrop) backdrop.remove();
    }

    function closeWarmConfirm() {
        var backdrop = document.querySelector('[data-member-tag-warm]');
        if (backdrop) backdrop.remove();
    }

    function openWarmConfirm(message, onConfirm) {
        closeWarmConfirm();
        var backdrop = document.createElement('div');
        backdrop.className = 'erp-modal-backdrop mdm-people-warm-confirm-backdrop';
        backdrop.setAttribute('data-member-tag-warm', '1');
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
            '      <div class="erp-modal-confirm__msg">' + escapeHtml(message) + '</div>' +
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

    function buildOptionRowHtml(index, value) {
        return (
            '<div class="member-tag-option-row" data-option-row>' +
            '  <span class="member-tag-option-row__label">选项' + (index + 1) + '</span>' +
            '  <input class="erp-input" type="text" maxlength="' + TAG_VALUE_MAX + '" placeholder="50字内" value="' + escapeHtml(value || '') + '" data-option-input>' +
            (index > 0
                ? '  <button type="button" class="member-tag-option-row__remove" data-option-remove>删除</button>'
                : '') +
            '</div>'
        );
    }

    function renumberOptions(listEl) {
        if (!listEl) return;
        var rows = listEl.querySelectorAll('[data-option-row]');
        rows.forEach(function (row, idx) {
            var label = row.querySelector('.member-tag-option-row__label');
            if (label) label.textContent = '选项' + (idx + 1);
            var removeBtn = row.querySelector('[data-option-remove]');
            if (idx === 0) {
                if (removeBtn) removeBtn.remove();
            } else if (!removeBtn) {
                var btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'member-tag-option-row__remove';
                btn.setAttribute('data-option-remove', '1');
                btn.textContent = '删除';
                row.appendChild(btn);
            }
        });
    }

    function collectOptionValues(listEl) {
        var values = [];
        listEl.querySelectorAll('[data-option-input]').forEach(function (input) {
            values.push((input.value || '').trim());
        });
        return values;
    }

    function openTagModal(options) {
        closeModal();
        options = options || {};
        var editItem = options.item || null;
        var isEdit = !!editItem;
        var groupItems = isEdit ? getGroupItems(editItem.groupId) : [];
        var initialGroupName = isEdit ? editItem.tagGroup : '';
        var initialRule = isEdit ? editItem.tagRule : '';
        var initialValues = isEdit
            ? groupItems.map(function (it) { return it.tagValue; })
            : [''];

        var optionHtml = initialValues.map(function (v, i) {
            return buildOptionRowHtml(i, v);
        }).join('');

        var backdrop = document.createElement('div');
        backdrop.className = 'erp-modal-backdrop';
        backdrop.setAttribute('data-member-tag-modal', '1');
        backdrop.innerHTML =
            '<div class="erp-modal erp-modal--member-tag">' +
            '  <div class="erp-modal__header">' +
            '    <h2 class="erp-modal__title">新增/编辑标签</h2>' +
            '    <div class="erp-modal__header-actions">' +
            '      <button type="button" class="erp-modal__header-btn" data-modal-close aria-label="关闭">&times;</button>' +
            '    </div>' +
            '  </div>' +
            '  <div class="erp-modal__body">' +
            '    <div class="erp-modal-field">' +
            '      <label class="erp-modal-field__label" for="memberTagGroupName">标签组名称</label>' +
            '      <div class="erp-modal-field__control">' +
            '        <input class="erp-input" id="memberTagGroupName" type="text" maxlength="' + TAG_GROUP_MAX + '" placeholder="50字以内" value="' + escapeHtml(initialGroupName) + '">' +
            '      </div>' +
            '    </div>' +
            '    <div class="erp-modal-field">' +
            '      <label class="erp-modal-field__label" for="memberTagGroupType">标签组类型</label>' +
            '      <div class="erp-modal-field__control">' +
            '        <select class="erp-select" id="memberTagGroupType">' +
            '          <option value="">请选择</option>' +
            '          <option value="单选"' + (initialRule === '单选' ? ' selected' : '') + '>单选</option>' +
            '          <option value="多选"' + (initialRule === '多选' ? ' selected' : '') + '>多选</option>' +
            '        </select>' +
            '      </div>' +
            '    </div>' +
            '    <div class="erp-modal-field">' +
            '      <label class="erp-modal-field__label">标签值</label>' +
            '      <div class="erp-modal-field__control">' +
            '        <div class="member-tag-option-list" id="memberTagOptionList">' + optionHtml + '</div>' +
            '        <button type="button" class="member-tag-option-add" id="memberTagOptionAdd">+ 新增选项</button>' +
            '      </div>' +
            '    </div>' +
            '  </div>' +
            '  <div class="erp-modal__footer">' +
            '    <button type="button" class="erp-btn" data-modal-cancel>取消</button>' +
            '    <button type="button" class="erp-btn erp-btn--primary" data-modal-ok>确定</button>' +
            '  </div>' +
            '</div>';

        var listEl = backdrop.querySelector('#memberTagOptionList');

        backdrop.addEventListener('click', function (ev) {
            if (ev.target === backdrop) closeModal();
        });
        backdrop.querySelectorAll('[data-modal-close], [data-modal-cancel]').forEach(function (btn) {
            btn.addEventListener('click', closeModal);
        });

        backdrop.querySelector('#memberTagOptionAdd').addEventListener('click', function () {
            var idx = listEl.querySelectorAll('[data-option-row]').length;
            listEl.insertAdjacentHTML('beforeend', buildOptionRowHtml(idx, ''));
        });

        listEl.addEventListener('click', function (ev) {
            var removeBtn = ev.target.closest('[data-option-remove]');
            if (!removeBtn) return;
            var row = removeBtn.closest('[data-option-row]');
            if (row) row.remove();
            renumberOptions(listEl);
        });

        backdrop.querySelector('[data-modal-ok]').addEventListener('click', function () {
            var groupName = (backdrop.querySelector('#memberTagGroupName').value || '').trim();
            var groupType = backdrop.querySelector('#memberTagGroupType').value;
            var values = collectOptionValues(listEl);

            if (!groupName) {
                toast('请输入标签组名称', 'warning');
                return;
            }
            if (!groupType) {
                toast('请选择标签组类型', 'warning');
                return;
            }
            var filled = values.filter(function (v) { return !!v; });
            if (!filled.length) {
                toast('请至少填写一个标签值', 'warning');
                return;
            }
            for (var i = 0; i < filled.length; i++) {
                for (var j = i + 1; j < filled.length; j++) {
                    if (filled[i] === filled[j]) {
                        toast('标签值不能重复', 'warning');
                        return;
                    }
                }
            }

            if (isEdit) {
                var oldItems = getGroupItems(editItem.groupId);
                var keepMap = {};
                filled.forEach(function (val, idx) {
                    var old = oldItems[idx];
                    if (old) {
                        old.tagValue = val;
                        old.tagGroup = groupName;
                        old.tagRule = groupType;
                        keepMap[old.id] = true;
                    } else {
                        var newItem = {
                            id: genId('TV'),
                            groupId: editItem.groupId,
                            tagValue: val,
                            tagGroup: groupName,
                            tagRule: groupType,
                            userCount: 0,
                            createdAt: nowStr(),
                            status: '启用'
                        };
                        state.list.push(newItem);
                        keepMap[newItem.id] = true;
                    }
                });
                // 未保留且无关联用户的选项可移除；有关联用户则保留原值并提示
                var blocked = [];
                oldItems.forEach(function (old) {
                    if (keepMap[old.id]) return;
                    if (old.userCount > 0) {
                        blocked.push(old.tagValue);
                        old.tagGroup = groupName;
                        old.tagRule = groupType;
                        return;
                    }
                    state.list = state.list.filter(function (it) { return it.id !== old.id; });
                });
                if (blocked.length) {
                    toast('以下标签已关联用户，无法删除：' + blocked.join('、'), 'warning');
                } else {
                    toast('标签已更新', 'success');
                }
            } else {
                var groupId = genId('TG');
                var createdAt = nowStr();
                filled.forEach(function (val) {
                    state.list.unshift({
                        id: genId('TV'),
                        groupId: groupId,
                        tagValue: val,
                        tagGroup: groupName,
                        tagRule: groupType,
                        userCount: 0,
                        createdAt: createdAt,
                        status: '启用'
                    });
                });
                toast('标签已新增', 'success');
            }

            closeModal();
            state.page = 1;
            render();
        });

        document.body.appendChild(backdrop);
        var nameInput = backdrop.querySelector('#memberTagGroupName');
        if (nameInput) nameInput.focus();
    }

    function renderTable(pageItems, startIndex) {
        var tbody = document.getElementById('tableBody');
        if (!tbody) return;

        if (!pageItems.length) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#999;padding:24px;">暂无数据</td></tr>';
            return;
        }

        tbody.innerHTML = pageItems.map(function (item, idx) {
            var statusClass = item.status === '启用' ? 'active' : 'inactive';
            var toggleText = item.status === '启用' ? '禁用' : '启用';
            return (
                '<tr data-id="' + escapeHtml(item.id) + '">' +
                '<td>' + (startIndex + idx + 1) + '</td>' +
                '<td>' + escapeHtml(item.tagValue) + '</td>' +
                '<td>' + escapeHtml(item.tagGroup) + '</td>' +
                '<td>' + escapeHtml(item.tagRule) + '</td>' +
                '<td>' + (item.userCount > 0
                    ? '<a href="#" class="subject-name-link" data-action="users">' + item.userCount + '</a>'
                    : '0') + '</td>' +
                '<td>' + escapeHtml(item.createdAt) + '</td>' +
                '<td><span class="status ' + statusClass + '">' + escapeHtml(item.status) + '</span></td>' +
                '<td class="action-links">' +
                '<a href="#" data-action="edit">编辑</a>' +
                '<a href="#" data-action="toggle">' + toggleText + '</a>' +
                '<a href="#" data-action="delete">删除</a>' +
                '<a href="#" data-action="users">查看关联用户</a>' +
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
        state.filter.tagValue = (document.getElementById('qTagValue').value || '').trim();
        state.filter.tagGroup = (document.getElementById('qTagGroup').value || '').trim();
        state.filter.tagRule = document.getElementById('qTagRule').value || '';
        state.filter.status = document.getElementById('qStatus').value || '';
    }

    function bindEvents() {
        var addBtn = document.getElementById('btnAddTag');
        if (addBtn) {
            addBtn.addEventListener('click', function () {
                openTagModal();
            });
        }

        var batchLink = document.getElementById('btnBatchTag');
        if (batchLink && window.wmsPath && typeof window.wmsPath.page === 'function') {
            batchLink.setAttribute('href', window.wmsPath.page('mdm_member_batch_tag_form.html'));
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
                var form = document.getElementById('memberTagSearchForm');
                if (form) form.reset();
                state.filter = { tagValue: '', tagGroup: '', tagRule: '', status: '' };
                render(true);
            });
        }

        var tbody = document.getElementById('tableBody');
        if (!tbody) return;

        tbody.addEventListener('click', function (ev) {
            var link = ev.target.closest('a[data-action]');
            if (!link) return;
            ev.preventDefault();
            var row = link.closest('tr[data-id]');
            if (!row) return;
            var item = findById(row.getAttribute('data-id'));
            if (!item) return;
            var action = link.getAttribute('data-action');

            if (action === 'edit') {
                openTagModal({ item: item });
                return;
            }

            if (action === 'toggle') {
                var next = item.status === '启用' ? '禁用' : '启用';
                openWarmConfirm('确认将标签「' + item.tagValue + '」' + next + '？', function () {
                    item.status = next;
                    toast('已' + next, 'success');
                    render(false);
                });
                return;
            }

            if (action === 'delete') {
                if (item.userCount > 0) {
                    toast('没有被用户关联的标签才可以删除', 'warning');
                    return;
                }
                openWarmConfirm('确认删除标签「' + item.tagValue + '」？', function () {
                    state.list = state.list.filter(function (it) { return it.id !== item.id; });
                    toast('已删除', 'success');
                    render(false);
                });
                return;
            }

            if (action === 'users') {
                // 跳转会员列表查询（按标签值筛选演示）
                window.location.href = 'mdm_member_c.html?tag=' + encodeURIComponent(item.tagValue);
            }
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        bindEvents();
        render(true);
    });
})();
