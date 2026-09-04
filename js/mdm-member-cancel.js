/**
 * 会员管理 — 注销审核 / 备注（B 端）
 * 与 C 端 user-app-account-cancel.js 共用 localStorage：mdm_member_cancel_list_v1
 */
(function () {
    var STORAGE_KEY = 'mdm_member_cancel_list_v1';
    var MEMBER_LIST_KEY = 'mdm_member_c_list_v1';

    var SEED = [
        {
            id: 'U10003',
            nickname: '访客C',
            phone: '—',
            registerTime: '2025-11-02 10:18:22',
            channel: '微信小程序',
            platform: 'H5',
            status: '已注销',
            remark: '用户主动申请，已核实无未完成订单',
            reason: '不想用了',
            applyTime: '2026-04-10 16:20:00',
            cancelTime: '2026-04-10 16:42:11'
        },
        {
            id: 'U10005',
            nickname: '演示会员5',
            phone: '137****1005',
            registerTime: '2025-08-16 14:05:11',
            channel: '微信小程序',
            platform: 'Android',
            status: '已注销',
            remark: '',
            reason: '隐私顾虑',
            applyTime: '2026-04-08 09:00:00',
            cancelTime: '2026-04-08 09:18:33'
        },
        {
            id: 'U10012',
            nickname: '待审用户甲',
            phone: '138****6612',
            registerTime: '2026-01-20 09:33:40',
            channel: 'APP',
            platform: 'iOS',
            status: '审核中',
            remark: '',
            reason: '换号重新注册',
            applyTime: '2026-08-02 11:20:15',
            cancelTime: ''
        },
        {
            id: 'U10007',
            nickname: '已注销用户D',
            phone: '135****7707',
            registerTime: '2024-12-01 08:12:00',
            channel: 'APP',
            platform: 'Android',
            status: '已注销',
            remark: '驳回后再申请，二次通过',
            reason: '账号不用了',
            applyTime: '2026-03-28 19:50:00',
            cancelTime: '2026-03-28 20:05:47'
        }
    ];

    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text != null && text !== '') n.textContent = text;
        return n;
    }

    function escapeHtml(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function loadList() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                saveList(SEED.slice());
                return SEED.slice();
            }
            var parsed = JSON.parse(raw);
            if (!Array.isArray(parsed) || !parsed.length) {
                saveList(SEED.slice());
                return SEED.slice();
            }
            return parsed;
        } catch (e) {
            return SEED.slice();
        }
    }

    function saveList(list) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(list || []));
        } catch (e) { /* ignore */ }
    }

    function upsertItem(item) {
        if (!item || !item.id) return;
        var list = loadList();
        var found = false;
        for (var i = 0; i < list.length; i++) {
            if (list[i] && list[i].id === item.id) {
                list[i] = Object.assign({}, list[i], item);
                found = true;
                break;
            }
        }
        if (!found) list.unshift(item);
        saveList(list);
    }

    function findById(id) {
        var list = loadList();
        for (var i = 0; i < list.length; i++) {
            if (list[i] && list[i].id === String(id)) return list[i];
        }
        return null;
    }

    function statusClass(status) {
        var st = String(status || '').trim();
        if (st === '审核中') return 'status cancel-pending';
        if (st === '已注销' || st === '注销') return 'status canceled';
        if (st === '已驳回') return 'status inactive';
        return 'status active';
    }

    function statusLabel(status) {
        var st = String(status || '').trim();
        if (st === '注销') return '已注销';
        return st || '—';
    }

    function syncMemberListStatus(memberId, status) {
        var mapStatus = status === '已注销' ? '注销' : status === '审核中' ? '注销中' : status === '已驳回' ? '正常' : status;
        try {
            var raw = localStorage.getItem(MEMBER_LIST_KEY);
            if (raw) {
                var list = JSON.parse(raw);
                if (Array.isArray(list)) {
                    for (var i = 0; i < list.length; i++) {
                        if (list[i] && list[i].id === memberId) {
                            list[i].status = mapStatus;
                            break;
                        }
                    }
                    localStorage.setItem(MEMBER_LIST_KEY, JSON.stringify(list));
                }
            }
        } catch (e) { /* ignore */ }

        if (window.MdmMemberBlacklist && typeof window.MdmMemberBlacklist.syncMemberListRowStatus === 'function') {
            var rowStatus = mapStatus === '注销中' ? '注销中' : mapStatus;
            window.MdmMemberBlacklist.syncMemberListRowStatus(memberId, rowStatus);
        } else {
            var tbody = document.getElementById('tableBody');
            if (!tbody || !memberId) return;
            tbody.querySelectorAll('tr').forEach(function (tr) {
                var idCell = tr.querySelector('td');
                if (!idCell || idCell.textContent.trim() !== String(memberId)) return;
                tr.setAttribute('data-member-status', mapStatus);
                var cells = tr.querySelectorAll('td');
                if (cells.length < 21) return;
                var st = cells[19].querySelector('.status') || document.createElement('span');
                if (mapStatus === '注销' || mapStatus === '已注销') st.className = 'status canceled';
                else if (mapStatus === '注销中' || mapStatus === '审核中') st.className = 'status cancel-pending';
                else if (mapStatus === '黑名单') st.className = 'status blacklist';
                else if (mapStatus === '冻结') st.className = 'status frozen';
                else st.className = 'status active';
                st.textContent = mapStatus === '已注销' ? '注销' : mapStatus;
                if (!st.parentNode) {
                    cells[19].innerHTML = '';
                    cells[19].appendChild(st);
                }
            });
        }
    }

    function closeBackdrop(backdrop) {
        if (backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
    }

    function openRemarkModal(item) {
        var backdrop = el('div', 'erp-modal-backdrop');
        var modal = el('div', 'erp-modal erp-modal--cancel-remark');
        var header = el('div', 'erp-modal__header');
        header.appendChild(el('h2', 'erp-modal__title', '备注'));
        var bx = el('button', 'erp-modal__header-btn', '×');
        bx.type = 'button';
        var ha = el('div', 'erp-modal__header-actions');
        ha.appendChild(bx);
        header.appendChild(ha);
        modal.appendChild(header);

        var body = el('div', 'erp-modal__body');
        var row = el('div', 'erp-modal-field');
        row.appendChild(el('label', 'erp-modal-field__label', '备注'));
        var ctrl = el('div', 'erp-modal-field__control');
        var ta = document.createElement('textarea');
        ta.className = 'erp-textarea';
        ta.rows = 5;
        ta.maxLength = 500;
        ta.placeholder = '请输入备注（选填，最多500字）';
        ta.value = item.remark || '';
        ctrl.appendChild(ta);
        var count = el('div', 'bl-char-count', String((item.remark || '').length) + '/500');
        ctrl.appendChild(count);
        row.appendChild(ctrl);
        body.appendChild(row);
        modal.appendChild(body);

        var footer = el('div', 'erp-modal__footer');
        var btnCancel = el('button', 'btn btn-secondary', '取消');
        btnCancel.type = 'button';
        var btnOk = el('button', 'btn btn-primary', '确认');
        btnOk.type = 'button';
        footer.appendChild(btnCancel);
        footer.appendChild(btnOk);
        modal.appendChild(footer);
        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);

        ta.addEventListener('input', function () {
            count.textContent = String(ta.value.length) + '/500';
        });

        function close() { closeBackdrop(backdrop); }
        bx.addEventListener('click', close);
        btnCancel.addEventListener('click', close);
        backdrop.addEventListener('click', function (e) {
            if (e.target === backdrop) close();
        });
        btnOk.addEventListener('click', function () {
            item.remark = ta.value.trim();
            upsertItem(item);
            renderCanceledTable();
            close();
            if (typeof showToast === 'function') showToast('备注已保存', 'success');
        });
    }

    function openAuditModal(item) {
        var backdrop = el('div', 'erp-modal-backdrop');
        var modal = el('div', 'erp-modal erp-modal--cancel-audit');
        var header = el('div', 'erp-modal__header');
        header.appendChild(el('h2', 'erp-modal__title', '审核'));
        var bx = el('button', 'erp-modal__header-btn', '×');
        bx.type = 'button';
        var ha = el('div', 'erp-modal__header-actions');
        ha.appendChild(bx);
        header.appendChild(ha);
        modal.appendChild(header);

        var body = el('div', 'erp-modal__body');

        var info = el('div', 'bl-member-card');
        info.appendChild(el('span', 'bl-member-card__avatar', String(item.nickname || '会').charAt(0)));
        var meta = el('div', '');
        meta.appendChild(el('div', 'bl-member-card__name', item.nickname || '—'));
        meta.appendChild(el('div', 'bl-member-card__sub', (item.phone || '—') + '　ID: ' + (item.id || '—')));
        info.appendChild(meta);
        body.appendChild(info);

        if (item.reason) {
            var reasonTip = el('div', 'bl-reason-tip', '用户注销原因：' + item.reason);
            body.appendChild(reasonTip);
        }

        var rowDec = el('div', 'erp-modal-field');
        rowDec.appendChild(el('label', 'erp-modal-field__label', '审核结果'));
        var decCtrl = el('div', 'erp-modal-field__control cancel-audit-radios');
        var idPass = 'cancelAuditPass_' + item.id;
        var idReject = 'cancelAuditReject_' + item.id;
        var labPass = document.createElement('label');
        labPass.innerHTML = '<input type="radio" name="cancelAuditDec" value="pass" id="' + idPass + '" checked> 通过注销';
        var labReject = document.createElement('label');
        labReject.innerHTML = '<input type="radio" name="cancelAuditDec" value="reject" id="' + idReject + '"> 驳回注销';
        decCtrl.appendChild(labPass);
        decCtrl.appendChild(labReject);
        rowDec.appendChild(decCtrl);
        body.appendChild(rowDec);

        var rowRemark = el('div', 'erp-modal-field');
        var labRemark = el('label', 'erp-modal-field__label');
        labRemark.innerHTML = '备注<span style="color:#e53935">*</span>';
        rowRemark.appendChild(labRemark);
        var remarkCtrl = el('div', 'erp-modal-field__control');
        var ta = document.createElement('textarea');
        ta.className = 'erp-textarea';
        ta.rows = 4;
        ta.maxLength = 500;
        ta.placeholder = '审核备注必填，最多500字';
        ta.value = item.remark || '';
        remarkCtrl.appendChild(ta);
        var count = el('div', 'bl-char-count', String((item.remark || '').length) + '/500');
        remarkCtrl.appendChild(count);
        rowRemark.appendChild(remarkCtrl);
        body.appendChild(rowRemark);

        body.appendChild(el('p', 'cancel-audit-warn', '请确认已与用户沟通后再进行此操作。'));
        modal.appendChild(body);

        var footer = el('div', 'erp-modal__footer');
        var btnCancel = el('button', 'btn btn-secondary', '取消');
        btnCancel.type = 'button';
        var btnOk = el('button', 'btn btn-primary', '确认');
        btnOk.type = 'button';
        footer.appendChild(btnCancel);
        footer.appendChild(btnOk);
        modal.appendChild(footer);
        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);

        ta.addEventListener('input', function () {
            count.textContent = String(ta.value.length) + '/500';
        });

        function close() { closeBackdrop(backdrop); }
        bx.addEventListener('click', close);
        btnCancel.addEventListener('click', close);
        backdrop.addEventListener('click', function (e) {
            if (e.target === backdrop) close();
        });

        btnOk.addEventListener('click', function () {
            var remark = ta.value.trim();
            if (!remark) {
                if (typeof showToast === 'function') showToast('请填写审核备注', 'warning');
                else alert('请填写审核备注');
                ta.focus();
                return;
            }
            var decEl = backdrop.querySelector('input[name="cancelAuditDec"]:checked');
            var pass = !decEl || decEl.value === 'pass';
            var now = formatNow();
            item.remark = remark;
            if (pass) {
                item.status = '已注销';
                item.cancelTime = now;
                syncMemberListStatus(item.id, '已注销');
                syncCSideStatus(item.id, 'canceled', remark);
            } else {
                item.status = '已驳回';
                item.cancelTime = '';
                syncMemberListStatus(item.id, '已驳回');
                syncCSideStatus(item.id, 'rejected', remark);
            }
            upsertItem(item);
            renderCanceledTable();
            close();
            if (typeof showToast === 'function') {
                showToast(pass ? '已通过注销申请' : '已驳回注销申请', 'success');
            }
        });
    }

    function syncCSideStatus(memberId, status, remark) {
        try {
            var key = 'ua_account_cancel_v1';
            var raw = localStorage.getItem(key);
            var data = raw ? JSON.parse(raw) : {};
            if (!data || typeof data !== 'object') data = {};
            var activeId = '';
            try {
                activeId = localStorage.getItem('ua_active_member_id_v1') || '';
            } catch (e0) { /* ignore */ }
            /* 同步当前活跃会员或申请中的会员 */
            if (
                !data.memberId ||
                data.memberId === memberId ||
                memberId === activeId ||
                memberId === 'UC10001'
            ) {
                data.memberId = data.memberId || memberId;
                data.status = status;
                data.adminRemark = remark || '';
                data.rejectReason = status === 'rejected' ? (remark || '') : '';
                data.updatedAt = formatNow();
                if (status === 'canceled') {
                    data.cancelTime = formatNow();
                    /* 释放手机号，供再次注册 */
                    try {
                        var phone = String(data.phone || '').replace(/\D/g, '');
                        if (phone) {
                            var relKey = 'ua_cancel_released_phones_v1';
                            var relRaw = localStorage.getItem(relKey);
                            var relList = relRaw ? JSON.parse(relRaw) : [];
                            if (!Array.isArray(relList)) relList = [];
                            var found = false;
                            for (var ri = 0; ri < relList.length; ri++) {
                                if (String((relList[ri] && relList[ri].phone) || '').replace(/\D/g, '') === phone) {
                                    relList[ri].releasedAt = formatNow();
                                    found = true;
                                    break;
                                }
                            }
                            if (!found) relList.push({ phone: phone, releasedAt: formatNow() });
                            localStorage.setItem(relKey, JSON.stringify(relList));
                        }
                    } catch (eRel) { /* ignore */ }
                }
                if (status === 'rejected') data.rejectedAt = formatNow();
                localStorage.setItem(key, JSON.stringify(data));
            }
        } catch (e) { /* ignore */ }
    }

    function formatNow() {
        var d = new Date();
        function p(n) { return n < 10 ? '0' + n : String(n); }
        return (
            d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' +
            p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds())
        );
    }

    function getFilteredList() {
        var list = loadList();
        var qId = ((document.getElementById('qCancelId') || {}).value || '').trim();
        var qNick = ((document.getElementById('qCancelNickname') || {}).value || '').trim();
        var qPhone = ((document.getElementById('qCancelPhone') || {}).value || '').replace(/\D/g, '');
        var qStatus = ((document.getElementById('qCancelStatus') || {}).value || '').trim();
        return list.filter(function (item) {
            if (!item) return false;
            if (qId && String(item.id || '').indexOf(qId) === -1) return false;
            if (qNick && String(item.nickname || '').indexOf(qNick) === -1) return false;
            if (qPhone && String(item.phone || '').replace(/\D/g, '').indexOf(qPhone) === -1) return false;
            if (qStatus) {
                var st = statusLabel(item.status);
                if (st !== qStatus) return false;
            }
            return true;
        });
    }

    function renderCanceledTable() {
        var tbody = document.getElementById('canceledBody');
        if (!tbody) return;
        var list = getFilteredList();
        if (!list.length) {
            tbody.innerHTML =
                '<tr><td colspan="9" style="text-align:center;color:#999;padding:28px 0;">暂无注销记录</td></tr>';
            return;
        }
        tbody.innerHTML = list.map(function (item) {
            var st = statusLabel(item.status);
            var actions = '';
            if (st === '审核中') {
                actions =
                    '<a href="#" class="mdm-cancel-audit" data-id="' + escapeHtml(item.id) + '">审核</a>' +
                    '<a href="#" class="mdm-cancel-remark" data-id="' + escapeHtml(item.id) + '">备注</a>';
            } else {
                actions =
                    '<a href="#" class="mdm-cancel-remark" data-id="' + escapeHtml(item.id) + '">备注</a>' +
                    '<a href="#" class="mdm-mem-detail" data-id="' + escapeHtml(item.id) + '">查看详情</a>';
            }
            return (
                '<tr data-cancel-id="' + escapeHtml(item.id) + '"' +
                ' data-cancel-reason="' + escapeHtml(item.reason || '') + '"' +
                ' data-register-time="' + escapeHtml(item.registerTime || '') + '"' +
                ' data-platform="' + escapeHtml(item.platform || '') + '">' +
                '<td>' + escapeHtml(item.id) + '</td>' +
                '<td>' + escapeHtml(item.nickname || '—') + '</td>' +
                '<td>' + escapeHtml(item.phone || '—') + '</td>' +
                '<td>' + escapeHtml(item.registerTime || '—') + '</td>' +
                '<td>' + escapeHtml(item.channel || '—') + '</td>' +
                '<td>' + escapeHtml(item.platform || '—') + '</td>' +
                '<td><span class="' + statusClass(st) + '">' + escapeHtml(st) + '</span></td>' +
                '<td class="cancel-remark-cell" title="' + escapeHtml(item.remark || '') + '">' +
                escapeHtml(item.remark || '—') + '</td>' +
                '<td class="action-links">' + actions + '</td>' +
                '</tr>'
            );
        }).join('');
    }

    function bindCanceledFilter() {
        var btnQ = document.getElementById('btnCancelQuery');
        var btnR = document.getElementById('btnCancelReset');
        if (btnQ) btnQ.addEventListener('click', renderCanceledTable);
        if (btnR) {
            btnR.addEventListener('click', function () {
                ['qCancelId', 'qCancelNickname', 'qCancelPhone', 'qCancelStatus'].forEach(function (id) {
                    var node = document.getElementById(id);
                    if (node) node.value = '';
                });
                renderCanceledTable();
            });
        }
    }

    function bindCanceledActions() {
        var tbody = document.getElementById('canceledBody');
        if (!tbody || tbody._cancelBound) return;
        tbody._cancelBound = true;
        tbody.addEventListener('click', function (e) {
            var audit = e.target.closest('a.mdm-cancel-audit');
            if (audit) {
                e.preventDefault();
                var itemA = findById(audit.getAttribute('data-id'));
                if (itemA) openAuditModal(itemA);
                return;
            }
            var remark = e.target.closest('a.mdm-cancel-remark');
            if (remark) {
                e.preventDefault();
                var itemR = findById(remark.getAttribute('data-id'));
                if (itemR) openRemarkModal(itemR);
                return;
            }
            var detail = e.target.closest('a.mdm-mem-detail');
            if (detail) {
                e.preventDefault();
                if (window.MdmMemberCUi) {
                    window.MdmMemberCUi.openDetailFromRow(detail.closest('tr'));
                }
            }
        });
    }

    function init() {
        renderCanceledTable();
        bindCanceledFilter();
        bindCanceledActions();
    }

    window.MdmMemberCancel = {
        init: init,
        refresh: renderCanceledTable,
        loadList: loadList,
        saveList: saveList,
        upsertItem: upsertItem,
        findById: findById,
        openAuditModal: openAuditModal,
        openRemarkModal: openRemarkModal
    };
})();
