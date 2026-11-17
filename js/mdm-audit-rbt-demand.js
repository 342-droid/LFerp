/* 审核中心 · RBT审核 · 需求单审核 */
(function () {
    var dataApi = window.RbtDemandData;
    var pageSize = 20;
    var currentPage = 1;
    var filtered = [];

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
                ops += '<a href="#" data-act="audit" data-id="' + row.id + '">审核</a>';
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

    function passReview(id) {
        var audit = dataApi.getAudit(id);
        var demand = audit ? dataApi.get(audit.demandCode) : null;
        if (!audit || !demand) {
            toast('审核记录不存在', 'error');
            return false;
        }
        var result = dataApi.approveAudit(id, '王丽');
        if (!result) {
            toast('审核失败', 'error');
            return false;
        }
        toast('已通过，需求单进入付款中');
        renderTable();
        return true;
    }

    function openAudit(id) {
        var audit = dataApi.getAudit(id);
        var demand = audit ? dataApi.get(audit.demandCode) : null;
        if (!audit || audit.status !== '待审核' || !demand) {
            toast('当前状态不可审核', 'error');
            return;
        }
        if (!window.RbtDemandDetail || typeof window.RbtDemandDetail.open !== 'function') {
            toast('需求单详情打不开', 'error');
            return;
        }
        var stage = auditStage(audit);
        window.RbtDemandDetail.open(demand, {
            audit: {
                stage: stage,
                onPass: function () {
                    return stage === '复核' ? passReview(id) : passFirst(id);
                },
                onReject: function (opinion) {
                    return rejectAudit(id, opinion);
                }
            }
        });
    }

    function passFirst(id) {
        var result = dataApi.approveAudit(id, '王丽');
        if (!result) {
            toast('审核失败', 'error');
            return false;
        }
        toast('已通过，需求单进入待接单');
        renderTable();
        return true;
    }

    function rejectAudit(id, opinion) {
        if (!String(opinion || '').trim()) {
            toast('驳回原因必填', 'error');
            return false;
        }
        var result = dataApi.rejectAudit(id, opinion, '王丽');
        if (!result) {
            toast('驳回失败', 'error');
            return false;
        }
        toast('已驳回，已释放相关门店占用额度');
        renderTable();
        return true;
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
                else if (act === 'audit') openAudit(id);
            });
        }
        document.querySelectorAll('.clear-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var input = btn.parentElement && btn.parentElement.querySelector('input');
                if (input) input.value = '';
            });
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
