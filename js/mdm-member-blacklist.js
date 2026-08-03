/**
 * 会员管理 · 黑名单 / Tab 切换 / 恢复·编辑弹窗
 */
(function () {
    'use strict';

    var STORAGE_KEY = 'mdm_member_blacklist_v1';
    var FUNC_OPTIONS = ['禁止直播评论', '观看直播', '下单', '访问页面'];

    var demoList = [
        {
            seq: 123,
            id: '1233444',
            nickname: '金木甄选',
            avatarText: '金',
            phone: '138****8821',
            funcs: ['访问页面', '下单', '观看直播', '禁止直播评论'],
            reason: '多次恶意刷单、扰乱直播间秩序，经核实后拉黑处理。',
            hasMedia: true,
            operator: '运营-小陈',
            operatedAt: '2026-04-26 10:22:15'
        },
        {
            seq: 122,
            id: 'U10008',
            nickname: '黑名单用户E',
            avatarText: '黑',
            phone: '139****5508',
            funcs: ['下单', '观看直播'],
            reason: '发布违规言论',
            hasMedia: false,
            operator: '客服-阿杰',
            operatedAt: '2026-04-24 18:06:42'
        },
        {
            seq: 121,
            id: 'U10009',
            nickname: '风控用户F',
            avatarText: '风',
            phone: '136****9909',
            funcs: ['访问页面', '禁止直播评论'],
            reason: '疑似黑产账号，暂时限制访问与评论。',
            hasMedia: true,
            operator: '风控-小林',
            operatedAt: '2026-04-21 09:33:07'
        }
    ];

    function loadList() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                var parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length) return parsed;
            }
        } catch (e) { /* ignore */ }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(demoList));
        return demoList.slice();
    }

    function saveList(list) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        } catch (e) { /* ignore */ }
    }

    function el(tag, cls, text) {
        var node = document.createElement(tag);
        if (cls) node.className = cls;
        if (text != null) node.textContent = text;
        return node;
    }

    function statusClass(status) {
        if (status === '黑名单') return 'status blacklist';
        if (status === '注销') return 'status canceled';
        return 'status active';
    }

    function switchTab(tabKey) {
        var tabs = document.querySelectorAll('#memberMainTabs button[data-member-tab]');
        tabs.forEach(function (btn) {
            btn.classList.toggle('active', btn.getAttribute('data-member-tab') === tabKey);
        });
        document.querySelectorAll('.member-tab-panel').forEach(function (panel) {
            panel.classList.toggle('is-active', panel.getAttribute('data-member-panel') === tabKey);
        });
        try {
            var url = new URL(window.location.href);
            if (tabKey === 'list') url.searchParams.delete('tab');
            else url.searchParams.set('tab', tabKey);
            window.history.replaceState({}, '', url.toString());
        } catch (e) { /* ignore */ }
    }

    function bindTabs() {
        var wrap = document.getElementById('memberMainTabs');
        if (!wrap) return;
        wrap.addEventListener('click', function (e) {
            var btn = e.target.closest('button[data-member-tab]');
            if (!btn) return;
            switchTab(btn.getAttribute('data-member-tab'));
        });
        try {
            var params = new URLSearchParams(window.location.search || '');
            var tab = params.get('tab');
            if (tab === 'blacklist' || tab === 'canceled' || tab === 'list') {
                switchTab(tab);
            }
        } catch (e) { /* ignore */ }
    }

    function renderBlacklistRows(list) {
        var tbody = document.getElementById('blacklistBody');
        if (!tbody) return;
        tbody.innerHTML = '';
        list.forEach(function (item, idx) {
            var tr = document.createElement('tr');
            tr.setAttribute('data-bl-id', item.id);

            var tdSeq = el('td', '', String(item.seq != null ? item.seq : idx + 1));
            tr.appendChild(tdSeq);

            var tdInfo = document.createElement('td');
            var info = el('div', 'mem-info-cell');
            info.appendChild(el('span', 'mem-info-cell__avatar', item.avatarText || String(item.nickname || '会').charAt(0)));
            var meta = el('div', 'mem-info-cell__meta');
            meta.appendChild(el('div', 'mem-info-cell__name', item.nickname || '—'));
            meta.appendChild(el('div', 'mem-info-cell__id', 'ID: ' + (item.id || '—')));
            info.appendChild(meta);
            tdInfo.appendChild(info);
            tr.appendChild(tdInfo);

            tr.appendChild(el('td', '', item.phone || '—'));

            var tdFuncs = document.createElement('td');
            var funcsWrap = el('div', 'bl-funcs');
            (item.funcs || []).forEach(function (f) {
                funcsWrap.appendChild(el('div', '', f));
            });
            if (!(item.funcs || []).length) funcsWrap.appendChild(el('div', '', '—'));
            tdFuncs.appendChild(funcsWrap);
            tr.appendChild(tdFuncs);

            var tdReason = document.createElement('td');
            var reasonWrap = el('div', 'bl-reason-cell');
            reasonWrap.appendChild(el('div', 'bl-reason-cell__text', item.reason || '—'));
            if (item.hasMedia) {
                var media0 = (item.media && item.media[0]) || null;
                if (media0 && media0.url) {
                    var thumb = el('div', 'bl-reason-cell__thumb');
                    if (media0.isVideo) {
                        var vv = document.createElement('video');
                        vv.src = media0.url;
                        vv.muted = true;
                        vv.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
                        thumb.appendChild(vv);
                    } else {
                        var ii = document.createElement('img');
                        ii.src = media0.url;
                        ii.alt = '';
                        ii.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
                        thumb.appendChild(ii);
                    }
                    reasonWrap.appendChild(thumb);
                } else {
                    reasonWrap.appendChild(el('div', 'bl-reason-cell__thumb'));
                }
            }
            tdReason.appendChild(reasonWrap);
            tr.appendChild(tdReason);

            tr.appendChild(el('td', '', item.operator || '—'));
            tr.appendChild(el('td', '', item.operatedAt || '—'));

            var tdAct = document.createElement('td');
            tdAct.className = 'action-links';
            tdAct.innerHTML =
                '<a href="#" class="mdm-bl-restore">恢复</a>' +
                '<a href="#" class="mdm-bl-view">查看</a>' +
                '<a href="#" class="mdm-bl-edit">编辑黑名单</a>';
            tr.appendChild(tdAct);

            tbody.appendChild(tr);
        });
    }

    function getFilteredList() {
        var list = loadList();
        var qNick = ((document.getElementById('qBlNickname') || {}).value || '').trim();
        var qPhone = ((document.getElementById('qBlPhone') || {}).value || '').replace(/\D/g, '');
        var qId = ((document.getElementById('qBlId') || {}).value || '').trim();
        var qFunc = ((document.getElementById('qBlFunc') || {}).value || '').trim();
        var qReason = ((document.getElementById('qBlReason') || {}).value || '').trim();
        return list.filter(function (item) {
            if (qNick && String(item.nickname || '').indexOf(qNick) === -1) return false;
            if (qPhone && String(item.phone || '').replace(/\D/g, '').indexOf(qPhone) === -1) return false;
            if (qId && String(item.id || '').indexOf(qId) === -1) return false;
            if (qFunc && (item.funcs || []).indexOf(qFunc) === -1) return false;
            if (qReason && String(item.reason || '').indexOf(qReason) === -1) return false;
            return true;
        });
    }

    function refreshBlacklist() {
        renderBlacklistRows(getFilteredList());
    }

    function closeBackdrop(backdrop) {
        if (backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
    }

    function buildMemberCard(item) {
        var card = el('div', 'bl-member-card');
        card.appendChild(el('span', 'bl-member-card__avatar', item.avatarText || String(item.nickname || '会').charAt(0)));
        var meta = el('div', '');
        meta.appendChild(el('div', 'bl-member-card__name', item.nickname || '—'));
        meta.appendChild(el('div', 'bl-member-card__sub', (item.phone || '—') + '　ID: ' + (item.id || '—')));
        card.appendChild(meta);
        return card;
    }

    function buildMemberListActions(status) {
        var st = String(status || '正常').trim();
        var html =
            '<a href="#" class="mdm-mem-detail">查看详情</a>' +
            '<a href="#" class="mdm-mem-coupon">优惠券</a>' +
            '<a href="#" class="mdm-mem-points">调整积分</a>' +
            '<a href="#" class="mdm-mem-growth">调整成长值</a>';
        if (st === '正常') html += '<a href="#" class="mdm-mem-blacklist">拉黑</a>';
        else if (st === '黑名单') html += '<a href="#" class="mdm-mem-restore">恢复</a>';
        return html;
    }

    function syncMemberListRowStatus(memberId, status) {
        var tbody = document.getElementById('tableBody');
        if (!tbody || !memberId) return;
        tbody.querySelectorAll('tr').forEach(function (tr) {
            var idCell = tr.querySelector('td');
            if (!idCell || idCell.textContent.trim() !== String(memberId)) return;
            tr.setAttribute('data-member-status', status);
            var cells = tr.querySelectorAll('td');
            if (cells.length < 20) return;
            var st = cells[18].querySelector('.status') || document.createElement('span');
            if (status === '黑名单') st.className = 'status blacklist';
            else if (status === '注销') st.className = 'status canceled';
            else st.className = 'status active';
            st.textContent = status;
            if (!st.parentNode) {
                cells[18].innerHTML = '';
                cells[18].appendChild(st);
            }
            cells[19].className = 'action-links';
            cells[19].innerHTML = buildMemberListActions(status);
        });
    }

    function memberFromRow(row) {
        if (!row) return null;
        var cells = row.querySelectorAll('td');
        if (cells.length < 4) return null;
        var id = cells[0].textContent.trim();
        var nickname = cells[1].textContent.trim();
        var phone = cells[3].textContent.trim();
        var avatarEl = cells[2].querySelector('span');
        var avatarText = avatarEl ? avatarEl.textContent.trim() : String(nickname || '会').charAt(0);
        return {
            id: id,
            nickname: nickname,
            phone: phone,
            avatarText: avatarText
        };
    }

    function openRestoreModal(item, onRestored) {
        var backdrop = el('div', 'erp-modal-backdrop');
        var modal = el('div', 'erp-modal erp-modal--bl-restore');
        var header = el('div', 'erp-modal__header');
        header.appendChild(el('h2', 'erp-modal__title', '恢复'));
        var bx = el('button', 'erp-modal__header-btn', '×');
        bx.type = 'button';
        var ha = el('div', 'erp-modal__header-actions');
        ha.appendChild(bx);
        header.appendChild(ha);
        modal.appendChild(header);

        var body = el('div', 'erp-modal__body');
        body.appendChild(buildMemberCard(item));
        body.appendChild(el('p', '', '确定要恢复该用户嘛？'));
        modal.appendChild(body);

        var footer = el('div', 'erp-modal__footer');
        var btnCancel = el('button', 'btn btn-secondary', '取消');
        btnCancel.type = 'button';
        var btnOk = el('button', 'btn btn-primary', '确定');
        btnOk.type = 'button';
        footer.appendChild(btnCancel);
        footer.appendChild(btnOk);
        modal.appendChild(footer);
        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);

        function close() { closeBackdrop(backdrop); }
        bx.addEventListener('click', close);
        btnCancel.addEventListener('click', close);
        backdrop.addEventListener('click', function (e) {
            if (e.target === backdrop) close();
        });
        btnOk.addEventListener('click', function () {
            var list = loadList().filter(function (it) { return it.id !== item.id; });
            saveList(list);
            refreshBlacklist();
            syncMemberListRowStatus(item.id, '正常');
            close();
            if (typeof onRestored === 'function') onRestored(item);
            if (typeof showToast === 'function') {
                showToast('已恢复该用户为正常状态', 'success');
            }
        });
    }

    function createUploadThumb(fileOrUrl, isVideo) {
        var wrap = el('div', 'bl-upload-item');
        wrap.setAttribute('data-bl-media', '1');
        if (typeof fileOrUrl === 'string') {
            if (isVideo) {
                var v0 = document.createElement('video');
                v0.src = fileOrUrl;
                v0.muted = true;
                wrap.appendChild(v0);
                wrap.appendChild(el('span', 'bl-upload-item__badge', '视频'));
            } else {
                var img0 = document.createElement('img');
                img0.src = fileOrUrl;
                img0.alt = '';
                wrap.appendChild(img0);
            }
        } else {
            var url = URL.createObjectURL(fileOrUrl);
            wrap.setAttribute('data-object-url', url);
            if (/^video\//i.test(fileOrUrl.type || '')) {
                var v = document.createElement('video');
                v.src = url;
                v.muted = true;
                wrap.appendChild(v);
                wrap.appendChild(el('span', 'bl-upload-item__badge', '视频'));
            } else {
                var img = document.createElement('img');
                img.src = url;
                img.alt = fileOrUrl.name || '';
                wrap.appendChild(img);
            }
        }
        var rm = el('button', 'bl-upload-item__remove', '×');
        rm.type = 'button';
        rm.setAttribute('aria-label', '删除');
        rm.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            var objUrl = wrap.getAttribute('data-object-url');
            if (objUrl) {
                try { URL.revokeObjectURL(objUrl); } catch (err) { /* ignore */ }
            }
            var row = wrap.parentNode;
            wrap.remove();
            if (row && typeof row._blSyncCount === 'function') row._blSyncCount();
        });
        wrap.appendChild(rm);
        return wrap;
    }

    function bindUploadRow(uploadRow, readonly, existingMedia) {
        var media = Array.isArray(existingMedia) ? existingMedia.slice() : [];
        media.forEach(function (m) {
            if (!m) return;
            if (typeof m === 'string') uploadRow.appendChild(createUploadThumb(m, false));
            else uploadRow.appendChild(createUploadThumb(m.url || m, !!m.isVideo));
        });

        var fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.className = 'bl-upload-file';
        fileInput.accept = 'image/*,video/*';
        fileInput.multiple = true;
        uploadRow.appendChild(fileInput);

        function syncCount() {
            var n = uploadRow.querySelectorAll('.bl-upload-item').length;
            if (uploadRow._blCountEl) uploadRow._blCountEl.textContent = n + '/9';
        }
        uploadRow._blSyncCount = syncCount;

        if (!readonly) {
            var addBtn = el('div', 'bl-upload-add');
            addBtn.appendChild(el('span', 'bl-upload-add__plus', '+'));
            addBtn.appendChild(document.createTextNode('添加照片/视频'));
            addBtn.addEventListener('click', function () {
                var left = 9 - uploadRow.querySelectorAll('.bl-upload-item').length;
                if (left <= 0) {
                    if (typeof showToast === 'function') showToast('最多上传 9 个文件', 'warning');
                    return;
                }
                fileInput.value = '';
                fileInput.click();
            });
            uploadRow.appendChild(addBtn);

            fileInput.addEventListener('change', function () {
                var files = Array.prototype.slice.call(fileInput.files || []);
                if (!files.length) return;
                var left = 9 - uploadRow.querySelectorAll('.bl-upload-item').length;
                files.slice(0, left).forEach(function (file) {
                    if (!/^(image|video)\//i.test(file.type || '')) return;
                    var thumb = createUploadThumb(file);
                    uploadRow.insertBefore(thumb, addBtn);
                });
                if (files.length > left && typeof showToast === 'function') {
                    showToast('最多上传 9 个文件，已截取前 ' + left + ' 个', 'warning');
                }
                syncCount();
            });
        }
        syncCount();
        return syncCount;
    }

    function openEditModal(item, readonly, onSaved) {
        var backdrop = el('div', 'erp-modal-backdrop');
        var modal = el('div', 'erp-modal erp-modal--bl-edit');
        var header = el('div', 'erp-modal__header');
        header.appendChild(el('h2', 'erp-modal__title', readonly ? '查看黑名单' : (item.reason ? '编辑黑名单' : '拉入黑名单')));
        var bx = el('button', 'erp-modal__header-btn', '×');
        bx.type = 'button';
        var ha = el('div', 'erp-modal__header-actions');
        ha.appendChild(bx);
        header.appendChild(ha);
        modal.appendChild(header);

        var body = el('div', 'erp-modal__body');
        body.appendChild(buildMemberCard(item));

        var rowFunc = el('div', 'erp-modal-field');
        rowFunc.appendChild(el('label', 'erp-modal-field__label', '禁用功能'));
        var funcCtrl = el('div', 'erp-modal-field__control');
        var checks = el('div', 'bl-func-checks');
        var selected = (item.funcs || []).slice();
        FUNC_OPTIONS.forEach(function (name) {
            var lab = document.createElement('label');
            var cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.value = name;
            cb.checked = selected.indexOf(name) !== -1;
            cb.disabled = !!readonly;
            lab.appendChild(cb);
            lab.appendChild(document.createTextNode(name));
            checks.appendChild(lab);
        });
        funcCtrl.appendChild(checks);
        rowFunc.appendChild(funcCtrl);
        body.appendChild(rowFunc);

        var rowReason = el('div', 'erp-modal-field');
        var labReason = el('label', 'erp-modal-field__label');
        labReason.innerHTML = '<span class="erp-req">*</span>拉黑原因';
        rowReason.appendChild(labReason);
        var reasonCtrl = el('div', 'erp-modal-field__control');
        var ta = document.createElement('textarea');
        ta.className = 'erp-textarea';
        ta.maxLength = 500;
        ta.placeholder = '500字以内';
        ta.value = item.reason || '';
        ta.readOnly = !!readonly;
        reasonCtrl.appendChild(ta);
        var count = el('div', 'bl-char-count', String((item.reason || '').length) + '/500');
        reasonCtrl.appendChild(count);
        ta.addEventListener('input', function () {
            count.textContent = String(ta.value.length) + '/500';
        });

        var uploadRow = el('div', 'bl-upload-row');
        var existingMedia = item.media || [];
        if (!existingMedia.length && item.hasMedia) {
            existingMedia = [{ url: '', isVideo: false, placeholder: true }];
        }
        /* 占位旧数据：无真实 URL 时不渲染空块，等用户重新上传 */
        existingMedia = existingMedia.filter(function (m) {
            return m && (m.url || (typeof m === 'string' && m));
        });
        var mediaCount = el('div', 'bl-upload-count', '');
        uploadRow._blCountEl = mediaCount;
        bindUploadRow(uploadRow, readonly, existingMedia);
        if (readonly && item.hasMedia && !uploadRow.querySelector('.bl-upload-item')) {
            var ph = el('div', 'bl-upload-item');
            ph.style.background = 'linear-gradient(135deg, #d7e3f4, #b8c7d9)';
            uploadRow.appendChild(ph);
            if (uploadRow._blSyncCount) uploadRow._blSyncCount();
        }
        reasonCtrl.appendChild(uploadRow);
        reasonCtrl.appendChild(mediaCount);

        if (!readonly) {
            reasonCtrl.appendChild(el('div', 'bl-reason-tip', '文字原因必填；图片、视频非必选。'));
        }
        rowReason.appendChild(reasonCtrl);
        body.appendChild(rowReason);
        modal.appendChild(body);

        var footer = el('div', 'erp-modal__footer');
        var btnCancel = el('button', 'btn btn-secondary', readonly ? '关闭' : '取消');
        btnCancel.type = 'button';
        footer.appendChild(btnCancel);
        var btnOk = null;
        if (!readonly) {
            btnOk = el('button', 'btn btn-primary', '确定');
            btnOk.type = 'button';
            footer.appendChild(btnOk);
        }
        modal.appendChild(footer);
        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);

        function close() {
            uploadRow.querySelectorAll('.bl-upload-item[data-object-url]').forEach(function (node) {
                /* 关闭时不立刻 revoke，保存后列表可能仍引用；仅在未保存关闭时释放 */
            });
            closeBackdrop(backdrop);
        }
        bx.addEventListener('click', close);
        btnCancel.addEventListener('click', close);
        backdrop.addEventListener('click', function (e) {
            if (e.target === backdrop) close();
        });

        if (btnOk) {
            btnOk.addEventListener('click', function () {
                var reason = ta.value.trim();
                if (!reason) {
                    if (typeof showToast === 'function') {
                        showToast('请填写拉黑原因', 'error');
                    } else {
                        alert('请填写拉黑原因');
                    }
                    return;
                }
                var funcs = [];
                checks.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
                    if (cb.checked) funcs.push(cb.value);
                });
                var media = [];
                uploadRow.querySelectorAll('.bl-upload-item').forEach(function (node) {
                    var img = node.querySelector('img');
                    var video = node.querySelector('video');
                    var src = (img && img.src) || (video && video.src) || '';
                    if (!src) return;
                    media.push({ url: src, isVideo: !!video });
                });
                var payload = {
                    funcs: funcs,
                    reason: reason,
                    hasMedia: media.length > 0,
                    media: media,
                    operator: '当前账号',
                    operatedAt: formatNow()
                };
                var list = loadList();
                var found = false;
                list = list.map(function (it) {
                    if (it.id !== item.id) return it;
                    found = true;
                    return Object.assign({}, it, payload);
                });
                if (!found) {
                    list.unshift(Object.assign({
                        seq: nextSeq(list),
                        id: item.id,
                        nickname: item.nickname,
                        avatarText: item.avatarText,
                        phone: item.phone
                    }, payload));
                }
                saveList(list);
                refreshBlacklist();
                syncMemberListRowStatus(item.id, '黑名单');
                closeBackdrop(backdrop);
                if (typeof onSaved === 'function') onSaved(item);
                if (typeof showToast === 'function') {
                    showToast('黑名单已更新', 'success');
                }
            });
        }
    }

    function formatNow() {
        var d = new Date();
        function p(n) { return n < 10 ? '0' + n : String(n); }
        return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
            ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
    }

    function nextSeq(list) {
        var max = 120;
        list.forEach(function (it) {
            if (Number(it.seq) > max) max = Number(it.seq);
        });
        return max + 1;
    }

    function findById(id) {
        var list = loadList();
        for (var i = 0; i < list.length; i++) {
            if (list[i].id === id) return list[i];
        }
        return null;
    }

    function bindBlacklistActions() {
        var tbody = document.getElementById('blacklistBody');
        if (!tbody) return;
        tbody.addEventListener('click', function (e) {
            var a = e.target.closest('a');
            if (!a) return;
            e.preventDefault();
            var tr = a.closest('tr');
            if (!tr) return;
            var id = tr.getAttribute('data-bl-id');
            var item = findById(id);
            if (!item) return;
            if (a.classList.contains('mdm-bl-restore')) openRestoreModal(item);
            else if (a.classList.contains('mdm-bl-view')) openEditModal(item, true);
            else if (a.classList.contains('mdm-bl-edit')) openEditModal(item, false);
        });
    }

    function bindBlacklistFilter() {
        var btnQ = document.getElementById('btnBlQuery');
        var btnR = document.getElementById('btnBlReset');
        if (btnQ) btnQ.addEventListener('click', refreshBlacklist);
        if (btnR) {
            btnR.addEventListener('click', function () {
                ['qBlNickname', 'qBlPhone', 'qBlId', 'qBlFunc', 'qBlReason'].forEach(function (id) {
                    var node = document.getElementById(id);
                    if (node) node.value = '';
                });
                refreshBlacklist();
            });
        }
    }

    function bindCanceledFilter() {
        var btnQ = document.getElementById('btnCancelQuery');
        var btnR = document.getElementById('btnCancelReset');
        function apply() {
            var tbody = document.getElementById('canceledBody');
            if (!tbody) return;
            var qId = ((document.getElementById('qCancelId') || {}).value || '').trim();
            var qNick = ((document.getElementById('qCancelNickname') || {}).value || '').trim();
            var qPhone = ((document.getElementById('qCancelPhone') || {}).value || '').replace(/\D/g, '');
            tbody.querySelectorAll('tr').forEach(function (tr) {
                var c = tr.querySelectorAll('td');
                if (c.length < 4) return;
                var ok = true;
                if (qId && c[0].textContent.trim().indexOf(qId) === -1) ok = false;
                if (qNick && c[1].textContent.trim().indexOf(qNick) === -1) ok = false;
                if (qPhone && c[3].textContent.replace(/\D/g, '').indexOf(qPhone) === -1) ok = false;
                tr.style.display = ok ? '' : 'none';
            });
        }
        if (btnQ) btnQ.addEventListener('click', apply);
        if (btnR) {
            btnR.addEventListener('click', function () {
                ['qCancelId', 'qCancelNickname', 'qCancelPhone'].forEach(function (id) {
                    var node = document.getElementById(id);
                    if (node) node.value = '';
                });
                apply();
            });
        }
        var canceledBody = document.getElementById('canceledBody');
        if (canceledBody) {
            canceledBody.addEventListener('click', function (e) {
                var a = e.target.closest('a.mdm-mem-detail');
                if (!a) return;
                e.preventDefault();
                if (window.MdmMemberCUi) {
                    window.MdmMemberCUi.openDetailFromRow(a.closest('tr'));
                }
            });
        }
    }

    /** 从会员列表拉黑 */
    function openBlacklistFromMember(row) {
        var base = memberFromRow(row);
        if (!base) return;
        var existing = findById(base.id) || Object.assign({}, base, {
            funcs: ['禁止直播评论'],
            reason: '',
            hasMedia: false,
            media: []
        });
        openEditModal(existing, false, function () {
            syncMemberListRowStatus(base.id, '黑名单');
            switchTab('blacklist');
        });
    }

    /** 从会员列表恢复黑名单用户 */
    function openRestoreFromMember(row) {
        var base = memberFromRow(row);
        if (!base) return;
        var item = findById(base.id) || base;
        openRestoreModal(item, function () {
            syncMemberListRowStatus(base.id, '正常');
        });
    }

    function init() {
        bindTabs();
        refreshBlacklist();
        bindBlacklistActions();
        bindBlacklistFilter();
        bindCanceledFilter();
    }

    window.MdmMemberBlacklist = {
        init: init,
        switchTab: switchTab,
        refresh: refreshBlacklist,
        openBlacklistFromMember: openBlacklistFromMember,
        openRestoreFromMember: openRestoreFromMember,
        openRestoreModal: openRestoreModal,
        openEditModal: openEditModal,
        statusClass: statusClass,
        buildMemberListActions: buildMemberListActions,
        syncMemberListRowStatus: syncMemberListRowStatus,
        loadList: loadList,
        saveList: saveList
    };
})();
