/**
 * 会员 · 积分明细列表、按规则计算有效期、手工调整
 */
(function () {
    var RULE_STORAGE_KEY = 'mdm_member_points_rule_v1';
    var DEFAULT_VALIDITY_DAYS = 365;
    var REMARK_MAX = 200;

    var TYPE_LABEL = {
        consume: '消费送积分',
        cash: '积分抵现',
        exchange: '积分兑换',
        refund: '售后退还',
        expire: '积分过期',
        manual: '手工调整'
    };

    var state = {
        page: 1,
        pageSize: 10,
        filter: {
            member: '',
            timeStart: '',
            timeEnd: '',
            changeType: '',
            status: ''
        },
        validityDays: loadValidityDays(),
        list: [
            {
                id: 'PT202604250001',
                memberId: 'U10001',
                nickname: '小程序用户A',
                phone: '138****2211',
                changeType: 'consume',
                change: 86,
                afterValue: 1286,
                refNo: 'ORD-3212689201598341',
                remark: '订单实付 ¥86.00',
                occurAt: '2026-04-25 14:20:03',
                operator: '',
                statusHint: ''
            },
            {
                id: 'PT202604250002',
                memberId: 'U10001',
                nickname: '小程序用户A',
                phone: '138****2211',
                changeType: 'cash',
                change: -50,
                afterValue: 1200,
                refNo: 'ORD-3212689201599001',
                remark: '抵扣 ¥0.50',
                occurAt: '2026-04-25 15:08:41',
                operator: '',
                statusHint: '已消耗'
            },
            {
                id: 'PT202604240001',
                memberId: 'U10002',
                nickname: 'APP会员B',
                phone: '139****9033',
                changeType: 'consume',
                change: 130,
                afterValue: 2450,
                refNo: 'ORD-3212689201588561',
                remark: '订单实付 ¥129.50',
                occurAt: '2026-04-24 19:33:41',
                operator: '',
                statusHint: ''
            },
            {
                id: 'PT202604240002',
                memberId: 'U10002',
                nickname: 'APP会员B',
                phone: '139****9033',
                changeType: 'exchange',
                change: -200,
                afterValue: 2250,
                refNo: 'EX-20260424008',
                remark: '兑换商品：冷丰鲜牛奶',
                occurAt: '2026-04-24 20:11:05',
                operator: '',
                statusHint: '已消耗'
            },
            {
                id: 'PT202604241001',
                memberId: 'U10002',
                nickname: 'APP会员B',
                phone: '139****9033',
                changeType: 'refund',
                change: 200,
                afterValue: 2450,
                refNo: 'AS202604240018',
                remark: '积分兑换售后退还（重新计算有效期）',
                occurAt: '2026-04-24 21:15:08',
                operator: '',
                statusHint: ''
            },
            {
                id: 'PT202604210001',
                memberId: 'U10005',
                nickname: '演示会员5',
                phone: '137****1005',
                changeType: 'manual',
                change: 100,
                afterValue: 420,
                refNo: '—',
                remark: '客服补偿积分',
                occurAt: '2026-04-21 10:00:00',
                operator: '张运营 / admin01',
                statusHint: ''
            },
            {
                id: 'PT202604200001',
                memberId: 'U10003',
                nickname: '访客C',
                phone: '—',
                changeType: 'manual',
                change: -20,
                afterValue: 10,
                refNo: '—',
                remark: '异常行为扣减',
                occurAt: '2026-04-20 15:30:18',
                operator: '李客服 / kf02',
                statusHint: '已消耗'
            },
            {
                id: 'PT202505010001',
                memberId: 'U10001',
                nickname: '小程序用户A',
                phone: '138****2211',
                changeType: 'expire',
                change: -30,
                afterValue: 1200,
                refNo: '—',
                remark: '积分到期自动失效',
                occurAt: '2025-05-01 00:00:00',
                operator: '系统',
                statusHint: '过期'
            },
            {
                id: 'PT202504180001',
                memberId: 'U10002',
                nickname: 'APP会员B',
                phone: '139****9033',
                changeType: 'consume',
                change: 55,
                afterValue: 2320,
                refNo: 'ORD-3212689201588561-B',
                remark: '订单实付 ¥55.00',
                occurAt: '2025-04-18 20:05:36',
                operator: '',
                statusHint: ''
            },
            {
                id: 'PT202603120001',
                memberId: 'U10004',
                nickname: '演示会员4',
                phone: '137****1004',
                changeType: 'consume',
                change: 88,
                afterValue: 1888,
                refNo: 'ORD-3212689201500123',
                remark: '订单实付 ¥88.00',
                occurAt: '2026-03-12 11:22:08',
                operator: '',
                statusHint: ''
            }
        ]
    };

    function loadValidityDays() {
        try {
            var raw = localStorage.getItem(RULE_STORAGE_KEY);
            if (!raw) return DEFAULT_VALIDITY_DAYS;
            var parsed = JSON.parse(raw);
            var days = Number(parsed && parsed.validityDays);
            return days > 0 ? Math.floor(days) : DEFAULT_VALIDITY_DAYS;
        } catch (e) {
            return DEFAULT_VALIDITY_DAYS;
        }
    }

    function escapeHtml(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function toast(msg, type) {
        if (typeof showToast === 'function') {
            showToast(msg, type || 'success');
            return;
        }
        window.alert(msg);
    }

    function pageHref(file) {
        var wp = window.wmsPath;
        if (wp && typeof wp.page === 'function') return wp.page(file);
        return file;
    }

    function pad(n) {
        return n < 10 ? '0' + n : String(n);
    }

    function formatDateTime(d) {
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
            ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }

    function parseDateTime(str) {
        if (!str) return null;
        var s = String(str).trim().replace('T', ' ');
        var m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ ](\d{2}):(\d{2})(?::(\d{2}))?/);
        if (!m) return null;
        return new Date(
            Number(m[1]), Number(m[2]) - 1, Number(m[3]),
            Number(m[4]), Number(m[5]), Number(m[6] || 0)
        );
    }

    function toComparable(str) {
        var d = parseDateTime(str);
        if (!d || isNaN(d.getTime())) return '';
        return formatDateTime(d);
    }

    function addDays(date, days) {
        var d = new Date(date.getTime());
        d.setDate(d.getDate() + days);
        return d;
    }

    function withValidity(item) {
        var copy = Object.assign({}, item);
        if (copy.statusHint === '已消耗' || copy.changeType === 'cash' ||
            copy.changeType === 'exchange' || (copy.change < 0 && copy.changeType !== 'expire' && copy.changeType !== 'manual')) {
            if (copy.change < 0 && copy.changeType !== 'expire') {
                copy.status = '已消耗';
                copy.expireAt = '';
                return copy;
            }
        }
        if (copy.statusHint === '过期' || copy.changeType === 'expire') {
            copy.status = '过期';
            copy.expireAt = copy.occurAt;
            return copy;
        }
        if (copy.change <= 0) {
            copy.status = copy.changeType === 'manual' ? '已消耗' : (copy.statusHint || '已消耗');
            copy.expireAt = '';
            return copy;
        }
        var occur = parseDateTime(copy.occurAt);
        if (!occur) {
            copy.status = '有效';
            copy.expireAt = '';
            return copy;
        }
        var expire = addDays(occur, state.validityDays);
        copy.expireAt = formatDateTime(expire);
        var now = new Date();
        copy.status = expire.getTime() < now.getTime() ? '过期' : '有效';
        if (copy.status === '有效') copy.expireAt = '';
        return copy;
    }

    function getLatestAfterValue(memberId) {
        var rows = state.list.filter(function (it) { return it.memberId === memberId; })
            .sort(function (a, b) {
                return toComparable(b.occurAt).localeCompare(toComparable(a.occurAt));
            });
        return rows.length ? Number(rows[0].afterValue) || 0 : 0;
    }

    function getFilteredList() {
        var f = state.filter;
        var startKey = toComparable(f.timeStart);
        var endKey = toComparable(f.timeEnd);
        var keyword = (f.member || '').trim().toLowerCase();

        return state.list.map(withValidity).filter(function (item) {
            if (keyword) {
                var hit =
                    String(item.memberId).toLowerCase().indexOf(keyword) !== -1 ||
                    String(item.nickname).toLowerCase().indexOf(keyword) !== -1 ||
                    String(item.phone).replace(/\*/g, '').indexOf(keyword.replace(/\*/g, '')) !== -1 ||
                    String(item.phone).indexOf(keyword) !== -1;
                if (!hit) return false;
            }
            if (f.changeType && item.changeType !== f.changeType) return false;
            if (f.status && item.status !== f.status) return false;
            var occurKey = toComparable(item.occurAt);
            if (startKey && occurKey < startKey) return false;
            if (endKey && occurKey > endKey) return false;
            return true;
        }).slice().sort(function (a, b) {
            return toComparable(b.occurAt).localeCompare(toComparable(a.occurAt));
        });
    }

    function formatChange(val) {
        var n = Number(val) || 0;
        if (n > 0) return '<span class="pts-change--plus">+' + n + '</span>';
        if (n < 0) return '<span class="pts-change--minus">' + n + '</span>';
        return '0';
    }

    function formatMemberIdHtml(item) {
        var href = pageHref('mdm_member_c.html') +
            '?memberId=' + encodeURIComponent(item.memberId) +
            '&detail=1';
        return '<a class="subject-name-link" href="' + href + '">' + escapeHtml(item.memberId) + '</a>';
    }

    function formatRefNoHtml(item) {
        if (!item.refNo || item.refNo === '—') return '—';
        var href = '';
        if (item.changeType === 'refund' || String(item.refNo).indexOf('AS') === 0) {
            href = pageHref('mdm_aftersale_ticket_detail.html') + '?id=' + encodeURIComponent(item.refNo);
        } else if (String(item.refNo).indexOf('ORD-') === 0) {
            href = pageHref('mdm_order_retail.html') + '?orderId=' + encodeURIComponent(item.refNo);
        } else {
            return escapeHtml(item.refNo);
        }
        return '<a class="subject-name-link" href="' + href + '">' + escapeHtml(item.refNo) + '</a>';
    }

    function formatExpireDisplay(item) {
        if (item.status === '有效' || item.status === '已消耗') return '—';
        return item.expireAt || '—';
    }

    function renderTable() {
        var list = getFilteredList();
        var total = list.length;
        var totalPages = Math.ceil(total / state.pageSize) || 1;
        if (state.page > totalPages) state.page = totalPages;
        if (state.page < 1) state.page = 1;
        var start = (state.page - 1) * state.pageSize;
        var pageRows = list.slice(start, start + state.pageSize);
        var tbody = document.getElementById('tableBody');
        if (!tbody) return;

        if (!pageRows.length) {
            tbody.innerHTML = '<tr><td colspan="13" style="text-align:center;color:#999;padding:28px 0;">暂无数据</td></tr>';
        } else {
            tbody.innerHTML = pageRows.map(function (item) {
                return (
                    '<tr>' +
                    '<td>' + escapeHtml(item.id) + '</td>' +
                    '<td>' + formatMemberIdHtml(item) + '</td>' +
                    '<td>' + escapeHtml(item.nickname) + '</td>' +
                    '<td>' + escapeHtml(item.phone) + '</td>' +
                    '<td>' + escapeHtml(TYPE_LABEL[item.changeType] || item.changeType) + '</td>' +
                    '<td>' + formatChange(item.change) + '</td>' +
                    '<td>' + escapeHtml(item.afterValue) + '</td>' +
                    '<td>' + formatRefNoHtml(item) + '</td>' +
                    '<td>' + escapeHtml(item.remark || '—') + '</td>' +
                    '<td>' + escapeHtml(item.occurAt) + '</td>' +
                    '<td>' + escapeHtml(formatExpireDisplay(item)) + '</td>' +
                    '<td>' + escapeHtml(item.status) + '</td>' +
                    '<td>' + escapeHtml(item.operator || '—') + '</td>' +
                    '</tr>'
                );
            }).join('');
        }

        if (typeof createPagination === 'function') {
            createPagination({
                containerId: 'pagination-container',
                totalItems: total,
                currentPage: state.page,
                pageSize: state.pageSize,
                onPageChange: function (page) {
                    state.page = page;
                    renderTable();
                },
                onPageSizeChange: function (size) {
                    state.pageSize = size;
                    state.page = 1;
                    renderTable();
                }
            });
        }
    }

    function readFilter() {
        state.filter = {
            member: (document.getElementById('qMember') || {}).value || '',
            timeStart: (document.getElementById('qTimeStart') || {}).value || '',
            timeEnd: (document.getElementById('qTimeEnd') || {}).value || '',
            changeType: (document.getElementById('qChangeType') || {}).value || '',
            status: (document.getElementById('qStatus') || {}).value || ''
        };
    }

    function syncDatetimeClearUi() {
        document.querySelectorAll('[data-datetime-wrap]').forEach(function (wrap) {
            var input = wrap.querySelector('input');
            wrap.classList.toggle('has-value', !!(input && input.value));
        });
    }

    function getCurrentOperator() {
        return '当前账号 / demo';
    }

    function collectMembers() {
        var map = {};
        state.list.forEach(function (item) {
            if (!item.memberId || map[item.memberId]) return;
            map[item.memberId] = {
                memberId: item.memberId,
                nickname: item.nickname,
                phone: item.phone
            };
        });
        [
            { memberId: 'U10001', nickname: '小程序用户A', phone: '138****2211' },
            { memberId: 'U10002', nickname: 'APP会员B', phone: '139****9033' },
            { memberId: 'U10003', nickname: '访客C', phone: '—' },
            { memberId: 'U10004', nickname: '演示会员4', phone: '137****1004' },
            { memberId: 'U10005', nickname: '演示会员5', phone: '137****1005' }
        ].forEach(function (m) {
            if (!map[m.memberId]) map[m.memberId] = m;
        });
        return Object.keys(map).map(function (k) { return map[k]; });
    }

    function searchMembers(keyword) {
        var kw = String(keyword || '').trim().toLowerCase();
        if (!kw) return [];
        return collectMembers().filter(function (m) {
            var phoneDigits = String(m.phone || '').replace(/\D/g, '');
            var kwDigits = kw.replace(/\D/g, '');
            return String(m.memberId).toLowerCase().indexOf(kw) >= 0 ||
                String(m.nickname).toLowerCase().indexOf(kw) >= 0 ||
                String(m.phone).toLowerCase().indexOf(kw) >= 0 ||
                (kwDigits && phoneDigits.indexOf(kwDigits) >= 0);
        }).slice(0, 20);
    }

    function closeAdjustModal() {
        var backdrop = document.querySelector('[data-pts-adjust-modal]');
        if (backdrop) backdrop.remove();
    }

    function nextId() {
        var now = new Date();
        return 'PT' + now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) +
            pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());
    }

    function openAdjustModal() {
        closeAdjustModal();
        var operator = getCurrentOperator();
        var picked = null;

        var backdrop = document.createElement('div');
        backdrop.className = 'erp-modal-backdrop';
        backdrop.setAttribute('data-pts-adjust-modal', '1');
        backdrop.innerHTML =
            '<div class="erp-modal erp-modal--pts-adjust">' +
            '  <div class="erp-modal__header">' +
            '    <h2 class="erp-modal__title">手工调整积分</h2>' +
            '    <div class="erp-modal__header-actions">' +
            '      <button type="button" class="erp-modal__header-btn" data-modal-close aria-label="关闭">&times;</button>' +
            '    </div>' +
            '  </div>' +
            '  <div class="erp-modal__body" id="ptsAdjustBody"></div>' +
            '  <div class="erp-modal__footer" id="ptsAdjustFooter"></div>' +
            '</div>';

        function renderSearchStep() {
            var body = backdrop.querySelector('#ptsAdjustBody');
            var footer = backdrop.querySelector('#ptsAdjustFooter');
            body.innerHTML =
                '<div class="erp-modal-field">' +
                '  <label class="erp-modal-field__label"><span class="erp-req">*</span>搜索会员</label>' +
                '  <div class="erp-modal-field__control">' +
                '    <div class="pts-member-search-box">' +
                '      <input class="erp-input" id="ptsMemberKeyword" type="text" placeholder="会员ID / 手机号 / 昵称" autocomplete="off">' +
                '      <button type="button" class="erp-btn erp-btn--primary" id="ptsMemberSearchBtn">搜索</button>' +
                '    </div>' +
                '    <div class="pts-member-result" id="ptsMemberResult">' +
                '      <div class="pts-member-result-empty">请先搜索并选择会员</div>' +
                '    </div>' +
                '  </div>' +
                '</div>';
            footer.innerHTML = '<button type="button" class="erp-btn" data-modal-cancel>取消</button>';

            function doSearch() {
                var kw = document.getElementById('ptsMemberKeyword').value;
                var result = document.getElementById('ptsMemberResult');
                var rows = searchMembers(kw);
                if (!rows.length) {
                    result.innerHTML = '<div class="pts-member-result-empty">未找到匹配会员</div>';
                    return;
                }
                result.innerHTML = rows.map(function (m) {
                    return (
                        '<div class="pts-member-result-item" data-member-id="' + escapeHtml(m.memberId) + '">' +
                        '<span>' + escapeHtml(m.nickname) + '（' + escapeHtml(m.memberId) + '）</span>' +
                        '<span>' + escapeHtml(m.phone) + '</span>' +
                        '</div>'
                    );
                }).join('');
            }

            document.getElementById('ptsMemberSearchBtn').addEventListener('click', doSearch);
            document.getElementById('ptsMemberKeyword').addEventListener('keydown', function (ev) {
                if (ev.key === 'Enter') {
                    ev.preventDefault();
                    doSearch();
                }
            });
            document.getElementById('ptsMemberResult').addEventListener('click', function (ev) {
                var row = ev.target.closest('[data-member-id]');
                if (!row) return;
                var id = row.getAttribute('data-member-id');
                picked = collectMembers().filter(function (m) { return m.memberId === id; })[0] || null;
                if (picked) renderAdjustStep();
            });
        }

        function renderAdjustStep() {
            var balance = getLatestAfterValue(picked.memberId);
            var body = backdrop.querySelector('#ptsAdjustBody');
            var footer = backdrop.querySelector('#ptsAdjustFooter');
            body.innerHTML =
                '<div class="erp-modal-field">' +
                '  <label class="erp-modal-field__label">会员</label>' +
                '  <div class="erp-modal-field__control">' +
                '    <div class="pts-adjust-member">' + escapeHtml(picked.nickname) +
                '（' + escapeHtml(picked.memberId) + '） · 当前积分 ' + balance + '</div>' +
                '    <button type="button" class="erp-btn" id="ptsChangeMemberBtn" style="margin-top:8px;">重新选择</button>' +
                '  </div>' +
                '</div>' +
                '<div class="erp-modal-field">' +
                '  <label class="erp-modal-field__label"><span class="erp-req">*</span>调整类型</label>' +
                '  <div class="erp-modal-field__control">' +
                '    <div class="pts-adjust-radio-row">' +
                '      <label class="pts-adjust-radio-label"><input type="radio" name="ptsAdjustDir" value="add" checked> 增加</label>' +
                '      <label class="pts-adjust-radio-label"><input type="radio" name="ptsAdjustDir" value="sub"> 减少</label>' +
                '    </div>' +
                '  </div>' +
                '</div>' +
                '<div class="erp-modal-field">' +
                '  <label class="erp-modal-field__label" for="ptsAdjustValue"><span class="erp-req">*</span>调整积分</label>' +
                '  <div class="erp-modal-field__control">' +
                '    <input class="erp-input" id="ptsAdjustValue" type="number" min="1" step="1" placeholder="请输入正整数">' +
                '  </div>' +
                '</div>' +
                '<div class="erp-modal-field">' +
                '  <label class="erp-modal-field__label" for="ptsAdjustRemark">备注</label>' +
                '  <div class="erp-modal-field__control">' +
                '    <textarea class="erp-input" id="ptsAdjustRemark" rows="3" maxlength="' + REMARK_MAX + '" placeholder="选填，最多 ' + REMARK_MAX + ' 字"></textarea>' +
                '    <div class="pts-adjust-tip">操作人：' + escapeHtml(operator) + '</div>' +
                '  </div>' +
                '</div>';
            footer.innerHTML =
                '<button type="button" class="erp-btn" data-modal-cancel>取消</button>' +
                '<button type="button" class="erp-btn erp-btn--primary" id="ptsAdjustSubmit">确定</button>';

            document.getElementById('ptsChangeMemberBtn').addEventListener('click', function () {
                picked = null;
                renderSearchStep();
            });
            document.getElementById('ptsAdjustSubmit').addEventListener('click', function () {
                var dirEl = backdrop.querySelector('input[name="ptsAdjustDir"]:checked');
                var dir = dirEl ? dirEl.value : 'add';
                var raw = document.getElementById('ptsAdjustValue').value;
                var val = Number(raw);
                if (!raw || isNaN(val) || val < 1 || !/^\d+$/.test(String(raw).trim())) {
                    toast('请输入正整数积分', 'warning');
                    return;
                }
                var delta = dir === 'add' ? val : -val;
                var after = balance + delta;
                if (after < 0) {
                    toast('扣减后积分不能为负', 'warning');
                    return;
                }
                var remark = String(document.getElementById('ptsAdjustRemark').value || '').trim();
                state.list.unshift({
                    id: nextId(),
                    memberId: picked.memberId,
                    nickname: picked.nickname,
                    phone: picked.phone,
                    changeType: 'manual',
                    change: delta,
                    afterValue: after,
                    refNo: '—',
                    remark: remark || (dir === 'add' ? '手工增加积分' : '手工减少积分'),
                    occurAt: formatDateTime(new Date()),
                    operator: operator,
                    statusHint: dir === 'sub' ? '已消耗' : ''
                });
                closeAdjustModal();
                state.page = 1;
                renderTable();
                toast('积分调整成功');
            });
        }

        backdrop.addEventListener('click', function (ev) {
            if (ev.target === backdrop) closeAdjustModal();
        });
        backdrop.addEventListener('click', function (ev) {
            if (ev.target.closest('[data-modal-close], [data-modal-cancel]')) {
                closeAdjustModal();
            }
        });

        document.body.appendChild(backdrop);
        renderSearchStep();
    }

    document.addEventListener('DOMContentLoaded', function () {
        var gotoRule = document.getElementById('btnGotoPtsRule');
        if (gotoRule) {
            gotoRule.addEventListener('click', function () {
                window.location.href = pageHref('mdm_member_points_rule.html');
            });
        }

        document.querySelectorAll('[data-clear-datetime]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var id = btn.getAttribute('data-clear-datetime');
                var input = document.getElementById(id);
                if (input) input.value = '';
                syncDatetimeClearUi();
            });
        });
        document.querySelectorAll('#qTimeStart, #qTimeEnd').forEach(function (input) {
            input.addEventListener('change', syncDatetimeClearUi);
            input.addEventListener('input', syncDatetimeClearUi);
        });
        syncDatetimeClearUi();

        document.getElementById('btnFilterReset').addEventListener('click', function () {
            ['qMember', 'qTimeStart', 'qTimeEnd', 'qChangeType', 'qStatus'].forEach(function (id) {
                var el = document.getElementById(id);
                if (el) el.value = '';
            });
            syncDatetimeClearUi();
            readFilter();
            state.page = 1;
            renderTable();
        });

        document.getElementById('btnFilterQuery').addEventListener('click', function () {
            readFilter();
            state.page = 1;
            renderTable();
        });

        document.getElementById('btnAdjustPoints').addEventListener('click', openAdjustModal);

        if (typeof initClearButtons === 'function') initClearButtons();

        readFilter();
        renderTable();
    });
})();
