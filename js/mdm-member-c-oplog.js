/**
 * 会员管理操作日志。
 * 单会员操作记一条，会员列写昵称（会员ID）。
 * 一次批量导入只记一条，会员列写「共 N 位会员」，明细里列出每位会员。
 */
(function (global) {
    var KEY = 'mdm_member_c_oplog_v1';
    var MAX = 500;
    var ACTION = {
        'change-store': '变更绑定门店',
        coupon: '发券',
        points: '调整积分',
        growth: '调整成长值',
        blacklist: '拉黑',
        freeze: '冻结',
        'batch-points': '批量调整积分',
        'batch-growth': '批量调整成长值'
    };
    var state = { memberId: '', nickname: '', page: 1, pageSize: 10, bound: false };

    function pad(n) {
        return n < 10 ? '0' + n : String(n);
    }

    function nowStr() {
        var d = new Date();
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
            ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }

    function escapeHtml(text) {
        return String(text == null ? '' : text).replace(/[&<>"']/g, function (ch) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
        });
    }

    function operatorName() {
        try {
            if (typeof getCurrentUser === 'function') {
                var u = getCurrentUser();
                if (u && (u.name || u.username)) return u.name || u.username;
            }
        } catch (e) { /* ignore */ }
        return '演示运营';
    }

    function load() {
        try {
            var raw = localStorage.getItem(KEY);
            var list = raw ? JSON.parse(raw) : [];
            return Array.isArray(list) ? list : [];
        } catch (e) {
            return [];
        }
    }

    function save(list) {
        try {
            localStorage.setItem(KEY, JSON.stringify(list));
        } catch (e) { /* ignore */ }
    }

    function normalizeMembers(list) {
        return (list || []).map(function (m) {
            if (!m || !m.memberId) return null;
            return {
                memberId: String(m.memberId),
                nickname: m.nickname || '',
                phone: m.phone || '',
                summary: m.summary || '',
                before: m.before == null || m.before === '' ? '—' : String(m.before),
                after: m.after == null || m.after === '' ? '—' : String(m.after),
                remark: m.remark || ''
            };
        }).filter(Boolean);
    }

    function record(entry) {
        entry = entry || {};
        var members = normalizeMembers(entry.members);
        if (!entry.memberId && !members.length) return null;
        var action = entry.action || '';
        var row = {
            id: 'mlog-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            time: entry.time || nowStr(),
            action: action,
            content: entry.content || ACTION[action] || action || '操作',
            memberId: entry.memberId ? String(entry.memberId) : '',
            nickname: entry.nickname || '',
            phone: entry.phone || '',
            members: members,
            operator: entry.operator || operatorName(),
            success: entry.success !== false,
            summary: entry.summary || '',
            changes: Array.isArray(entry.changes) ? entry.changes : []
        };
        var list = load();
        list.unshift(row);
        if (list.length > MAX) list.length = MAX;
        save(list);
        return row;
    }

    function filtered() {
        var list = load();
        if (!state.memberId) return list;
        return list.filter(function (row) {
            if (String(row.memberId) === String(state.memberId)) return true;
            return (row.members || []).some(function (m) {
                return String(m.memberId) === String(state.memberId);
            });
        });
    }

    function ensureDrawer() {
        if (document.getElementById('memOplogDrawer')) return;
        var drawer = document.createElement('div');
        drawer.id = 'memOplogDrawer';
        drawer.className = 'mem-oplog-drawer';
        drawer.hidden = true;
        drawer.innerHTML =
            '<div class="mem-oplog-drawer__mask" data-oplog-close></div>' +
            '<aside class="mem-oplog-drawer__panel" role="dialog" aria-modal="true" aria-labelledby="memOplogTitle">' +
            '  <div class="mem-oplog-drawer__header">' +
            '    <div id="memOplogTitle">操作日志</div>' +
            '    <button type="button" class="mem-oplog-drawer__x" data-oplog-close aria-label="关闭">×</button>' +
            '  </div>' +
            '  <div class="mem-oplog-drawer__body">' +
            '    <div class="table-scroll-container">' +
            '      <table class="table">' +
            '        <thead><tr>' +
            '          <th style="width:170px">操作时间</th>' +
            '          <th style="width:180px">会员</th>' +
            '          <th>操作内容</th>' +
            '          <th style="width:110px">操作人</th>' +
            '          <th style="width:80px;text-align:center">结果</th>' +
            '          <th style="width:90px">操作</th>' +
            '        </tr></thead>' +
            '        <tbody id="memOplogBody"></tbody>' +
            '      </table>' +
            '    </div>' +
            '    <div id="memOplogPagination"></div>' +
            '  </div>' +
            '</aside>';
        document.body.appendChild(drawer);

        var detail = document.createElement('div');
        detail.id = 'memOplogDetail';
        detail.className = 'erp-modal-backdrop mem-oplog-detail';
        detail.hidden = true;
        detail.innerHTML =
            '<div class="erp-modal" role="dialog" aria-modal="true">' +
            '  <div class="erp-modal__header">' +
            '    <h2 class="erp-modal__title">操作日志详情</h2>' +
            '    <div class="erp-modal__header-actions"><button type="button" class="erp-modal__header-btn" data-oplog-detail-close aria-label="关闭">&times;</button></div>' +
            '  </div>' +
            '  <div class="erp-modal__body" id="memOplogDetailBody"></div>' +
            '  <div class="erp-modal__footer"><button type="button" class="erp-btn" data-oplog-detail-close>关闭</button></div>' +
            '</div>';
        document.body.appendChild(detail);

        drawer.addEventListener('click', function (ev) {
            if (ev.target.closest('[data-oplog-close]')) close();
            var btn = ev.target.closest('[data-oplog-detail]');
            if (btn) openDetail(btn.getAttribute('data-oplog-detail'));
        });
        detail.addEventListener('click', function (ev) {
            if (ev.target === detail || ev.target.closest('[data-oplog-detail-close]')) {
                detail.hidden = true;
            }
        });
    }

    function memberText(row) {
        if (row.members && row.members.length) return '共 ' + row.members.length + ' 位会员';
        var name = row.nickname || '—';
        return name + '（' + (row.memberId || '—') + '）';
    }

    function batchDetailHtml(row) {
        var members = (row.members || []).slice();
        if (state.memberId) {
            members.sort(function (a, b) {
                var ah = String(a.memberId) === String(state.memberId) ? 0 : 1;
                var bh = String(b.memberId) === String(state.memberId) ? 0 : 1;
                return ah - bh;
            });
        }
        return '<table class="table mem-oplog-members"><thead><tr><th>会员</th><th>手机号</th><th>调整</th><th>变更前</th><th>变更后</th><th>备注</th></tr></thead><tbody>' +
            members.map(function (m) {
                var name = (m.nickname || '—') + '（' + m.memberId + '）';
                return '<tr><td>' + escapeHtml(name) + '</td><td>' + escapeHtml(m.phone || '—') + '</td><td>' + escapeHtml(m.summary || '—') + '</td><td>' + escapeHtml(m.before) + '</td><td>' + escapeHtml(m.after) + '</td><td>' + escapeHtml(m.remark || '—') + '</td></tr>';
            }).join('') +
            '</tbody></table>';
    }

    function render() {
        ensureDrawer();
        var title = document.getElementById('memOplogTitle');
        if (title) {
            title.textContent = state.memberId
                ? '操作日志 · ' + (state.nickname || state.memberId)
                : '操作日志';
        }
        var all = filtered();
        var size = state.pageSize;
        var maxPage = Math.max(1, Math.ceil(all.length / size) || 1);
        if (state.page > maxPage) state.page = maxPage;
        var start = (state.page - 1) * size;
        var slice = all.slice(start, start + size);
        var tbody = document.getElementById('memOplogBody');
        if (!all.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="mem-oplog-empty">暂无操作日志</td></tr>';
        } else {
            tbody.innerHTML = slice.map(function (row) {
                return '<tr>' +
                    '<td>' + escapeHtml(row.time) + '</td>' +
                    '<td>' + escapeHtml(memberText(row)) + '</td>' +
                    '<td>' + escapeHtml(row.content) + '</td>' +
                    '<td>' + escapeHtml(row.operator || '—') + '</td>' +
                    '<td style="text-align:center"><span class="mem-oplog-tag">成功</span></td>' +
                    '<td><button type="button" class="mem-oplog-link" data-oplog-detail="' + escapeHtml(row.id) + '">查看详情</button></td>' +
                    '</tr>';
            }).join('');
        }
        var pager = document.getElementById('memOplogPagination');
        if (pager) {
            if (!all.length || typeof createPagination !== 'function') {
                pager.innerHTML = '';
            } else {
                createPagination({
                    containerId: 'memOplogPagination',
                    totalItems: all.length,
                    currentPage: state.page,
                    pageSize: state.pageSize,
                    pageSizeOptions: [10, 20, 50],
                    onPageChange: function (p) {
                        state.page = p;
                        render();
                    },
                    onPageSizeChange: function (s) {
                        state.pageSize = s;
                        state.page = 1;
                        render();
                    }
                });
            }
        }
    }

    function findLog(id) {
        var list = load();
        for (var i = 0; i < list.length; i++) {
            if (String(list[i].id) === String(id)) return list[i];
        }
        return null;
    }

    function openDetail(id) {
        var row = findLog(id);
        var body = document.getElementById('memOplogDetailBody');
        var backdrop = document.getElementById('memOplogDetail');
        if (!row || !body || !backdrop) return;
        var changes = row.changes || [];
        var changeHtml = changes.length
            ? '<table class="table mem-oplog-change"><thead><tr><th>字段</th><th>变更前</th><th>变更后</th></tr></thead><tbody>' +
                changes.map(function (c) {
                    return '<tr><td>' + escapeHtml(c.field || '—') + '</td>' +
                        '<td>' + escapeHtml(c.oldValue == null || c.oldValue === '' ? '—' : c.oldValue) + '</td>' +
                        '<td>' + escapeHtml(c.newValue == null || c.newValue === '' ? '—' : c.newValue) + '</td></tr>';
                }).join('') +
                '</tbody></table>'
            : '<div class="mem-oplog-empty">无字段变更</div>';
        body.innerHTML =
            '<div class="mem-oplog-detail-line"><span>操作内容</span><strong>' + escapeHtml(row.content) + '</strong></div>' +
            '<div class="mem-oplog-detail-line"><span>操作时间</span><strong>' + escapeHtml(row.time) + '</strong></div>' +
            '<div class="mem-oplog-detail-line"><span>操作人</span><strong>' + escapeHtml(row.operator || '—') + '</strong></div>' +
            '<div class="mem-oplog-detail-line"><span>会员</span><strong>' + escapeHtml(memberText(row)) + '</strong></div>' +
            (row.summary
                ? '<div class="mem-oplog-detail-line"><span>说明</span><strong>' + escapeHtml(row.summary) + '</strong></div>'
                : '') +
            '<div class="mem-oplog-detail-title">变更明细</div>' +
            changeHtml;
        backdrop.hidden = false;
    }

    function open(filter) {
        filter = filter || {};
        state.memberId = filter.memberId ? String(filter.memberId) : '';
        state.nickname = filter.nickname || '';
        state.page = 1;
        ensureDrawer();
        document.getElementById('memOplogDrawer').hidden = false;
        var detail = document.getElementById('memOplogDetail');
        if (detail) detail.hidden = true;
        render();
    }

    function close() {
        var drawer = document.getElementById('memOplogDrawer');
        var detail = document.getElementById('memOplogDetail');
        if (drawer) drawer.hidden = true;
        if (detail) detail.hidden = true;
    }

    global.MdmMemberCOplog = {
        record: record,
        open: open,
        close: close
    };
})(window);
