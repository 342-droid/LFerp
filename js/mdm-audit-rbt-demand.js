/* 审核中心 · RBT审核 · 需求单审核 */
(function () {
    var dataApi = window.RbtDemandData;
    var pageSize = 20;
    var currentPage = 1;
    var filtered = [];
    var reviewAuditId = '';
    var reviewFile = null;
    var passAuditId = '';
    var passDraft = null;

    function blank(value) {
        return value == null || String(value).trim() === '';
    }

    function show(value) {
        return blank(value) ? '—' : String(value);
    }

    function includesText(value, query) {
        if (blank(query)) return true;
        return String(value == null ? '' : value).toLowerCase().indexOf(String(query).trim().toLowerCase()) >= 0;
    }

    function money(value) {
        if (blank(value) && value !== 0) return '—';
        var text = String(value).replace(/^¥/, '');
        return '¥' + text;
    }

    function statusClass(status) {
        if (status === '审核通过') return 'is-pass';
        if (status === '审核驳回') return 'is-reject';
        return 'is-pending';
    }

    function toast(message, type) {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type || 'success');
            return;
        }
        window.alert(message);
    }

    function queryValues() {
        return {
            demandCode: (document.getElementById('qDemandCode') || {}).value || '',
            store: (document.getElementById('qStore') || {}).value || '',
            status: (document.getElementById('qStatus') || {}).value || ''
        };
    }

    function matchRows() {
        var q = queryValues();
        return (dataApi.listAudits() || []).filter(function (row) {
            if (!includesText(row.demandCode, q.demandCode) && !includesText(row.id, q.demandCode)) return false;
            if (!includesText(row.storeName, q.store) && !includesText(row.storeCode, q.store)) return false;
            if (!blank(q.status) && row.status !== q.status) return false;
            return true;
        });
    }

    function renderPagination() {
        var host = document.getElementById('pagination-container');
        if (!host) return;
        var total = filtered.length;
        var pages = Math.max(1, Math.ceil(total / pageSize) || 1);
        if (currentPage > pages) currentPage = pages;
        if (typeof window.createPagination === 'function') {
            window.createPagination({
                containerId: 'pagination-container',
                totalItems: total,
                currentPage: currentPage,
                pageSize: pageSize,
                pageSizeOptions: [10, 20, 50, 100],
                onPageChange: function (page) {
                    currentPage = page;
                    renderTable();
                },
                onPageSizeChange: function (size) {
                    pageSize = size;
                    currentPage = 1;
                    renderTable();
                }
            });
            return;
        }
        host.innerHTML = '<div style="padding:8px 0;color:#909399;">共 ' + total + ' 条</div>';
    }

    function renderTable() {
        filtered = matchRows();
        var body = document.getElementById('audTableBody');
        if (!body) return;
        var start = (currentPage - 1) * pageSize;
        var rows = filtered.slice(start, start + pageSize);
        if (!rows.length) {
            body.innerHTML = '<tr><td colspan="14" style="text-align:center;color:#909399;padding:28px 12px;">暂无审核记录</td></tr>';
            renderPagination();
            return;
        }
        body.innerHTML = rows.map(function (row) {
            var pending = row.status === '待审核';
            var ops = '<a href="#" data-act="detail" data-id="' + row.id + '">详情</a>';
            if (pending) {
                ops += '<a href="#" data-act="approve" data-id="' + row.id + '">通过</a>' +
                    '<a href="#" class="is-danger" data-act="reject" data-id="' + row.id + '">驳回</a>';
            }
            var stage = row.stage === '复核' ? '复核' : '初审';
            return '<tr>' +
                '<td>' + show(row.id) + '</td>' +
                '<td>' + show(row.demandCode) + '</td>' +
                '<td style="text-align:center;"><span class="rbt-aud-stage' + (stage === '复核' ? ' is-review' : '') + '">' + stage + '</span></td>' +
                '<td>' + show(row.storeName) + '<div style="color:#909399;font-size:12px;">' + show(row.storeCode) + '</div></td>' +
                '<td>' + show(row.packageName) + '</td>' +
                '<td>' + money(row.goodsAmount) + '</td>' +
                '<td>' + money(row.serviceFee) + '</td>' +
                '<td>' + money(row.amount) + '</td>' +
                '<td>' + show(row.submitter) + '</td>' +
                '<td>' + show(row.submittedAt) + '</td>' +
                '<td style="text-align:center;"><span class="rbt-aud-status ' + statusClass(row.status) + '">' + show(row.status) + '</span></td>' +
                '<td>' + show(row.auditor) + '</td>' +
                '<td>' + show(row.auditedAt) + '</td>' +
                '<td class="rbt-aud-ops">' + ops + '</td>' +
                '</tr>';
        }).join('');
        renderPagination();
    }

    function openDetail(id) {
        var audit = dataApi.getAudit(id);
        if (!audit) {
            toast('审核记录不存在', 'error');
            return;
        }
        var demand = dataApi.get(audit.demandCode);
        if (!demand) {
            toast('关联需求单不存在', 'error');
            return;
        }
        if (window.RbtDemandDetail && typeof window.RbtDemandDetail.open === 'function') {
            window.RbtDemandDetail.open(demand);
            return;
        }
        toast('需求单 ' + demand.code + ' / ' + demand.status, 'info');
    }

    function auditStage(audit) {
        return audit && audit.stage === '复核' ? '复核' : '初审';
    }

    function contractsOf(demand) {
        if (!demand || typeof dataApi.signContracts !== 'function') return [];
        return dataApi.signContracts(demand) || [];
    }

    function closeReview() {
        var mask = document.getElementById('rbtReviewMask');
        if (!mask) return;
        mask.hidden = true;
        mask.style.display = 'none';
        reviewAuditId = '';
    }

    function openReview(id) {
        var audit = dataApi.getAudit(id);
        var demand = audit ? dataApi.get(audit.demandCode) : null;
        if (!audit || audit.status !== '待审核' || auditStage(audit) !== '复核' || !demand) {
            toast('当前状态不可审核', 'error');
            return;
        }
        reviewAuditId = id;
        reviewFile = null;
        var title = document.getElementById('rbtReviewTitle');
        if (title) title.textContent = demand.code + ' · ' + (demand.storeName || '');
        var host = document.getElementById('rbtReviewContracts');
        var contracts = contractsOf(demand);
        if (host) {
            /* 原型演示：复核弹窗里的合同状态固定展示已签署，不写入 PRD。正式逻辑按各合同实时签署状态展示。 */
            var rows = contracts.map(function (contract) {
                return '<div>' + show(contract.name) + '（' + show(contract.code) + '）：已签署</div>';
            }).join('');
            host.innerHTML = (rows || '<div>暂无合同</div>') +
                '<div class="rbt-review-note">合同已全部签署完成。</div>';
        }
        document.querySelectorAll('input[name="rbtDeposit"]').forEach(function (node) { node.checked = false; });
        var file = document.getElementById('rbtReviewFile');
        if (file) file.value = '';
        var fileName = document.getElementById('rbtReviewFileName');
        if (fileName) fileName.textContent = '支持图片或 PDF，通过复核时必须上传。';
        var preview = document.getElementById('rbtReviewPreview');
        if (preview) preview.innerHTML = '';
        var opinion = document.getElementById('rbtReviewOpinion');
        if (opinion) opinion.value = '';
        var mask = document.getElementById('rbtReviewMask');
        if (mask) {
            mask.hidden = false;
            mask.style.display = 'flex';
        }
    }

    function depositPaid() {
        var picked = document.querySelector('input[name="rbtDeposit"]:checked');
        return picked ? picked.value : '';
    }

    function passReview() {
        var audit = dataApi.getAudit(reviewAuditId);
        var demand = audit ? dataApi.get(audit.demandCode) : null;
        if (!audit || !demand) {
            toast('审核记录不存在', 'error');
            return;
        }
        if (depositPaid() !== 'yes') {
            toast(depositPaid() === 'no' ? '需求门店担保金未缴纳，不能通过复核' : '请确认需求门店担保金是否缴纳', 'error');
            return;
        }
        if (!reviewFile || !reviewFile.data) {
            toast('请上传需求门店的担保金缴纳凭证', 'error');
            return;
        }
        var result = dataApi.approveAudit(reviewAuditId, '王丽', {
            depositPaid: true,
            voucherName: reviewFile.name,
            voucherType: reviewFile.type,
            voucherData: reviewFile.data
        });
        if (!result) {
            toast('审核失败', 'error');
            return;
        }
        closeReview();
        toast('已通过，需求单进入支付中');
        renderTable();
    }

    function rejectReview() {
        var opinion = (document.getElementById('rbtReviewOpinion') || {}).value || '';
        if (!String(opinion).trim()) {
            toast('驳回原因必填', 'error');
            return;
        }
        var result = dataApi.rejectAudit(reviewAuditId, opinion, '王丽');
        if (!result) {
            toast('驳回失败', 'error');
            return;
        }
        closeReview();
        toast('已驳回，已释放相关门店占用额度');
        renderTable();
    }

    function readReviewFile(file) {
        if (!file) {
            reviewFile = null;
            return;
        }
        if (file.size > 800 * 1024) {
            reviewFile = null;
            toast('凭证文件请控制在 800KB 以内', 'error');
            var input = document.getElementById('rbtReviewFile');
            if (input) input.value = '';
            return;
        }
        var reader = new FileReader();
        reader.onload = function () {
            reviewFile = {
                name: file.name || '缴纳凭证',
                type: file.type || '',
                data: String(reader.result || '')
            };
            var fileName = document.getElementById('rbtReviewFileName');
            if (fileName) fileName.textContent = '已选择：' + reviewFile.name;
            var preview = document.getElementById('rbtReviewPreview');
            if (preview) {
                preview.innerHTML = String(reviewFile.type).indexOf('image/') === 0
                    ? '<img src="' + reviewFile.data + '" alt="担保金缴纳凭证">'
                    : '';
            }
        };
        reader.readAsDataURL(file);
    }

    function approve(id) {
        var audit = dataApi.getAudit(id);
        if (!audit || audit.status !== '待审核') {
            toast('当前状态不可审核', 'error');
            return;
        }
        if (auditStage(audit) === '复核') {
            openReview(id);
            return;
        }
        openPass(id);
    }

    function closePass() {
        var mask = document.getElementById('rbtPassMask');
        if (mask) {
            mask.hidden = true;
            mask.style.display = 'none';
        }
        passAuditId = '';
    }

    function escAttr(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;');
    }

    function emptyPassDraft() {
        var ratioApi = window.RbtSettleRatio;
        var draft = {};
        (ratioApi ? ratioApi.CHANNELS : []).forEach(function (channel) {
            draft[channel] = { fallback: '', rows: [] };
        });
        return draft;
    }

    function syncPassDraft() {
        var ratioApi = window.RbtSettleRatio;
        if (!passDraft || !ratioApi) return;
        ratioApi.CHANNELS.forEach(function (channel) {
            var fallback = document.querySelector('[data-pass-fallback="' + channel + '"]');
            if (fallback) passDraft[channel].fallback = fallback.value;
            document.querySelectorAll('[data-pass-row="' + channel + '"]').forEach(function (input) {
                var index = Number(input.getAttribute('data-index'));
                if (passDraft[channel].rows[index]) passDraft[channel].rows[index].ratio = input.value;
            });
        });
    }

    function renderPassForm() {
        var ratioApi = window.RbtSettleRatio;
        var host = document.getElementById('rbtPassForm');
        if (!host || !ratioApi || !passDraft) return;
        var options = '<option value="">请选择类目</option>' + ratioApi.categoryOptions().map(function (name) {
            return '<option value="' + escAttr(name) + '">' + escAttr(name) + '</option>';
        }).join('');
        host.innerHTML = ratioApi.CHANNELS.map(function (channel) {
            var item = passDraft[channel];
            var rows = item.rows.map(function (row, index) {
                return '<div class="rbt-pass-field"><span class="rbt-pass-label">' + escAttr(row.category) + '</span><input data-pass-row="' + escAttr(channel) + '" data-index="' + index + '" value="' + escAttr(row.ratio) + '" inputmode="decimal" placeholder="请输入"><span>%</span><button type="button" class="rbt-pass-del" data-pass-del="' + escAttr(channel) + '" data-index="' + index + '">删除</button></div>';
            }).join('');
            return '<div class="rbt-pass-channel"><h3>' + escAttr(channel) + '</h3>' +
                '<div class="rbt-pass-field"><span class="rbt-pass-label">兜底利率</span><input data-pass-fallback="' + escAttr(channel) + '" value="' + escAttr(item.fallback) + '" inputmode="decimal" placeholder="请输入"><span>%</span></div>' +
                '<div class="rbt-pass-field"><span class="rbt-pass-label">商品类目</span><select data-pass-pick="' + escAttr(channel) + '">' + options + '</select><input data-pass-new="' + escAttr(channel) + '" inputmode="decimal" placeholder="请输入"><span>%</span><button type="button" class="btn btn-secondary" data-pass-add="' + escAttr(channel) + '">添加</button></div>' +
                rows +
                '<div class="rbt-review-note">需要按类目区分时再添加。未添加的类目使用兜底利率。</div></div>';
        }).join('');
    }

    function addPassCategory(channel) {
        var ratioApi = window.RbtSettleRatio;
        syncPassDraft();
        var pick = document.querySelector('[data-pass-pick="' + channel + '"]');
        var ratioInput = document.querySelector('[data-pass-new="' + channel + '"]');
        var category = pick ? pick.value : '';
        var ratio = ratioApi ? ratioApi.parseRatio(ratioInput && ratioInput.value) : '';
        if (!category) {
            toast('请选择商品类目', 'error');
            return;
        }
        if (passDraft[channel].rows.some(function (row) { return row.category === category; })) {
            toast('该渠道已添加「' + category + '」', 'error');
            return;
        }
        if (!ratio) {
            toast('类目结算比例须大于 0 且不超过 100', 'error');
            return;
        }
        passDraft[channel].rows.push({ category: category, ratio: ratio });
        renderPassForm();
    }

    function removePassCategory(channel, index) {
        syncPassDraft();
        if (passDraft[channel]) passDraft[channel].rows.splice(index, 1);
        renderPassForm();
    }

    function openPass(id) {
        var audit = dataApi.getAudit(id);
        var demand = audit ? dataApi.get(audit.demandCode) : null;
        if (!audit || audit.status !== '待审核' || auditStage(audit) !== '初审' || !demand) {
            toast('当前状态不可审核', 'error');
            return;
        }
        passAuditId = id;
        passDraft = emptyPassDraft();
        var title = document.getElementById('rbtPassTitle');
        if (title) title.textContent = demand.code + ' · ' + (demand.storeName || '');
        renderPassForm();
        var mask = document.getElementById('rbtPassMask');
        if (mask) {
            mask.hidden = false;
            mask.style.display = 'flex';
        }
    }

    function collectPassRatios() {
        var ratioApi = window.RbtSettleRatio;
        if (!ratioApi || !passDraft) return null;
        syncPassDraft();
        var invalid = false;
        var list = ratioApi.CHANNELS.map(function (channel) {
            var item = passDraft[channel];
            var fallback = ratioApi.parseRatio(item.fallback);
            if (String(item.fallback || '').trim() && !fallback) invalid = true;
            if (!fallback) invalid = true;
            var rows = [];
            item.rows.forEach(function (row) {
                var ratio = ratioApi.parseRatio(row.ratio);
                if (!row.category || !ratio) {
                    invalid = true;
                    return;
                }
                rows.push({ category: row.category, ratio: ratio });
            });
            return { channel: channel, fallback: fallback, rows: rows };
        });
        if (invalid) return null;
        return ratioApi.normalize(list);
    }

    function confirmPass() {
        var settleRatios = collectPassRatios();
        if (!settleRatios) {
            toast('每个渠道都要填写兜底利率；已填的类目比例须大于 0 且不超过 100', 'error');
            return;
        }
        var result = dataApi.approveAudit(passAuditId, '王丽', { settleRatios: settleRatios });
        if (!result) {
            toast('审核失败', 'error');
            return;
        }
        closePass();
        toast('已通过，结算比例已记到需求单');
        renderTable();
    }

    function reject(id) {
        var audit = dataApi.getAudit(id);
        if (!audit || audit.status !== '待审核') {
            toast('当前状态不可审核', 'error');
            return;
        }
        if (auditStage(audit) === '复核') {
            openReview(id);
            return;
        }
        var opinion = window.prompt('请输入驳回原因（必填）', '');
        if (opinion == null) return;
        if (!String(opinion).trim()) {
            toast('驳回原因必填', 'error');
            return;
        }
        var result = dataApi.rejectAudit(id, opinion, '王丽');
        if (!result) {
            toast('驳回失败', 'error');
            return;
        }
        toast('已驳回，已释放相关门店占用额度');
        renderTable();
    }

    function bind() {
        var queryBtn = document.getElementById('audFilterQuery');
        var resetBtn = document.getElementById('audFilterReset');
        if (queryBtn) {
            queryBtn.addEventListener('click', function () {
                currentPage = 1;
                renderTable();
            });
        }
        if (resetBtn) {
            resetBtn.addEventListener('click', function () {
                ['qDemandCode', 'qStore'].forEach(function (id) {
                    var node = document.getElementById(id);
                    if (node) node.value = '';
                });
                var status = document.getElementById('qStatus');
                if (status) status.value = '';
                currentPage = 1;
                renderTable();
            });
        }
        var body = document.getElementById('audTableBody');
        if (body) {
            body.addEventListener('click', function (event) {
                var link = event.target.closest('[data-act]');
                if (!link) return;
                event.preventDefault();
                var id = link.getAttribute('data-id');
                var act = link.getAttribute('data-act');
                if (act === 'detail') openDetail(id);
                else if (act === 'approve') approve(id);
                else if (act === 'reject') reject(id);
            });
        }
        document.querySelectorAll('.clear-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var input = btn.parentElement && btn.parentElement.querySelector('input');
                if (input) input.value = '';
            });
        });
        var mask = document.getElementById('rbtReviewMask');
        if (mask) {
            mask.addEventListener('click', function (event) {
                if (event.target === mask || event.target.closest('[data-review-close]')) closeReview();
            });
        }
        var passBtn = document.getElementById('rbtReviewPass');
        var rejectBtn = document.getElementById('rbtReviewReject');
        var fileInput = document.getElementById('rbtReviewFile');
        if (passBtn) passBtn.addEventListener('click', passReview);
        if (rejectBtn) rejectBtn.addEventListener('click', rejectReview);
        if (fileInput) {
            fileInput.addEventListener('change', function () {
                readReviewFile(fileInput.files && fileInput.files[0]);
            });
        }
        var passMask = document.getElementById('rbtPassMask');
        if (passMask) {
            passMask.addEventListener('click', function (event) {
                if (event.target === passMask || event.target.closest('[data-pass-close]')) closePass();
            });
        }
        var passConfirm = document.getElementById('rbtPassConfirm');
        if (passConfirm) passConfirm.addEventListener('click', confirmPass);
        var passForm = document.getElementById('rbtPassForm');
        if (passForm) {
            passForm.addEventListener('click', function (event) {
                var add = event.target.closest('[data-pass-add]');
                var del = event.target.closest('[data-pass-del]');
                if (add) addPassCategory(add.getAttribute('data-pass-add'));
                if (del) removePassCategory(del.getAttribute('data-pass-del'), Number(del.getAttribute('data-index')));
            });
        }
        document.addEventListener('keydown', function (event) {
            if (event.key !== 'Escape') return;
            if (passAuditId) closePass();
            else if (reviewAuditId) closeReview();
        });
        document.addEventListener('visibilitychange', function () {
            if (document.visibilityState === 'visible') renderTable();
        });
        window.addEventListener('focus', renderTable);
    }

    function applyQueryFromUrl() {
        var params = new URLSearchParams(window.location.search || '');
        var demandCode = params.get('demandCode') || params.get('code') || '';
        var status = params.get('status') || '';
        var codeInput = document.getElementById('qDemandCode');
        var statusSelect = document.getElementById('qStatus');
        if (codeInput && demandCode) codeInput.value = demandCode;
        /* 仅当 URL 显式带 status 时写入；去审核跳转不默认带审核状态 */
        if (statusSelect) statusSelect.value = status || '';
    }

    function boot() {
        if (!dataApi || typeof dataApi.listAudits !== 'function') {
            console.error('[mdm-audit-rbt-demand] RbtDemandData missing');
            return;
        }
        dataApi.ensureAuditsSynced();
        bind();
        applyQueryFromUrl();
        currentPage = 1;
        renderTable();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
