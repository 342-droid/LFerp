/* 需求单管理：展示门店端发布的需求，默认可见待审核等全量状态。 */
(function () {
    var Vue = OctopusPrototype.Vue;
    var ref = Vue.ref;
    var dataApi = window.RbtDemandData;

    function blank(value) {
        return value == null || String(value).trim() === '';
    }

    function includesText(value, query) {
        if (blank(query)) return true;
        return String(value == null ? '' : value).toLowerCase().indexOf(String(query).trim().toLowerCase()) >= 0;
    }

    function paginate(rows, params) {
        var page = Math.max(1, Number(params && params.page) || 1);
        var size = Math.max(1, Number(params && params.pageSize) || 20);
        var start = (page - 1) * size;
        return {
            list: rows.slice(start, start + size),
            total: rows.length
        };
    }

    function show(value) {
        return blank(value) ? '—' : String(value);
    }

    function esc(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function guarantorText(row) {
        var names = (row.guarantors || []).map(function (item) { return item && item.name; }).filter(Boolean);
        return names.length ? names.join('、') : '—';
    }

    function periodText(row) {
        if (row.repayMethod === '比例付') return show(row.repayPeriod);
        if (blank(row.repayPeriod)) return '—';
        return String(row.repayPeriod).indexOf('期') >= 0 ? String(row.repayPeriod) : String(row.repayPeriod) + '期';
    }

    function statusType(status) {
        if (status === '已完成') return 'success';
        if (status === '已取消' || status === '已驳回') return 'info';
        if (status === '待审核' || status === '待复核') return 'warning';
        if (status === '支付中') return 'danger';
        return '';
    }

    OctopusPrototype.mount({
        setup: function () {
            var table = ref(null);
            var slots = { code: 'cell-code', status: 'cell-status' };
            var statusOptions = (dataApi.STATUSES || []).concat(dataApi.CLOSED_STATUSES || []).map(function (name) {
                return { label: name, value: name };
            });

            var columns = [
                { dataIndex: 'code', title: '需求单号', minWidth: 130, search: { control: 'input' } },
                { dataIndex: 'storeName', title: '门店', minWidth: 150, align: 'left', showOverflowTooltip: true, search: { control: 'input' } },
                { dataIndex: 'packageName', title: '商品包', minWidth: 140, align: 'left', showOverflowTooltip: true, search: { control: 'input' } },
                { dataIndex: 'amount', title: '货款总金额', minWidth: 120, formatter: function (row) { return blank(row.amount) ? '—' : ('¥' + row.amount); } },
                { dataIndex: 'repayCycle', title: '结算周期', minWidth: 100, formatter: function (row) { return show(row.repayCycle); } },
                { dataIndex: 'repayMethod', title: '结算方式', minWidth: 100, formatter: function (row) { return show(row.repayMethod); } },
                { dataIndex: 'repayPeriod', title: '结算期数/比例', minWidth: 130, formatter: periodText },
                { dataIndex: 'dailyAmount', title: '预估每日结算货款', minWidth: 150, formatter: function (row) {
                    if (row.repayMethod === '比例付') return '—';
                    return blank(row.dailyAmount) ? '—' : ('¥' + row.dailyAmount);
                } },
                { dataIndex: 'guarantors', title: '担保门店', minWidth: 160, align: 'left', showOverflowTooltip: true, formatter: guarantorText },
                {
                    dataIndex: 'status',
                    title: '状态',
                    minWidth: 110,
                    search: { control: 'select', options: statusOptions, placeholder: '请选择状态' }
                },
                { dataIndex: 'creator', title: '创建人', minWidth: 100 },
                { dataIndex: 'createdAt', title: '创建时间', minWidth: 170 },
                { dataIndex: 'updater', title: '更新人', minWidth: 100 },
                { dataIndex: 'updatedAt', title: '更新时间', minWidth: 170 }
            ];

            function requestRows(params) {
                var matched = dataApi.list().filter(function (row) {
                    if (!includesText(row.code, params.code)) return false;
                    if (!includesText(row.storeName, params.storeName) && !includesText(row.storeCode, params.storeName)) return false;
                    if (!includesText(row.packageName, params.packageName) && !includesText(row.packageCode, params.packageName)) return false;
                    if (!blank(params.status) && row.status !== params.status) return false;
                    return true;
                });
                return Promise.resolve(paginate(matched, params));
            }

            function refreshTable() {
                var tableVm = table.value;
                if (!tableVm) return;
                if (typeof tableVm.reload === 'function') tableVm.reload();
                else if (typeof tableVm.fetchData === 'function') tableVm.fetchData();
            }

            function openDetail(row) {
                var item = dataApi.get(row && row.code) || row;
                if (window.RbtDemandDetail && typeof window.RbtDemandDetail.open === 'function') {
                    window.RbtDemandDetail.open(item);
                }
            }

            function canGoAudit(row) {
                return !!(row && (row.status === '待审核' || row.status === '待复核'));
            }

            function canGoSign(row) {
                return !!(row && row.status === '待签署');
            }

            function closeSign() {
                document.querySelectorAll('[data-rbt-sign-modal]').forEach(function (node) {
                    node.remove();
                });
                document.removeEventListener('keydown', onSignKey);
            }

            function onSignKey(event) {
                if (event.key !== 'Escape') return;
                event.stopPropagation();
                closeSign();
            }

            var supplyActor = { role: 'supply', name: '冷丰供应链' };

            function signBody(item) {
                return window.RbtContractSign
                    ? window.RbtContractSign.render(item, supplyActor)
                    : '<div class="rbt-sign-empty">合同签署不可用</div>';
            }

            /* 原型演示：一次把三份合同的各方都标成已签署，需求进入待复核。 */
            function signAllDemo(code) {
                var rows = dataApi.list();
                var target = null;
                rows.some(function (row) {
                    if (row && row.code === code) {
                        target = row;
                        return true;
                    }
                    return false;
                });
                if (!target || target.status !== '待签署') return null;
                var now = dataApi.nowText();
                var signed = {};
                target.signings = target.signings || [];
                target.signings.forEach(function (row) {
                    if (row && row.key) signed[row.key] = true;
                });
                dataApi.signContracts(target).forEach(function (contract) {
                    (contract.parties || []).forEach(function (party) {
                        if (!party || signed[party.key]) return;
                        target.signings.push({
                            key: party.key,
                            role: party.role,
                            code: party.code || '',
                            name: party.name || '',
                            contractKey: contract.key,
                            signedAt: now
                        });
                    });
                });
                dataApi.save(rows);
                return dataApi.setStatus(code, '待复核', '冷丰供应链');
            }

            /* 待签署在当前页弹出。冷丰供应链在此确认采购合同，门店和贸易商在各自端签署。 */
            function goSign(row) {
                if (!canGoSign(row) || !row.code) return;
                var item = dataApi.get(row.code) || row;
                closeSign();
                var mask = document.createElement('div');
                mask.className = 'rbt-demand-contract-mask';
                mask.setAttribute('data-rbt-sign-modal', '1');
                mask.innerHTML =
                    '<div class="rbt-demand-contract rbt-sign-modal" role="dialog" aria-modal="true" aria-label="合同签署">' +
                    '<div class="rbt-demand-contract__head">' +
                    '<div><div class="rbt-demand-contract__eyebrow">合同签署</div>' +
                    '<div class="rbt-demand-contract__title">' + esc(item.code) + '</div></div>' +
                    '<span class="rbt-sign-modal__tools">' +
                    '<button type="button" class="rbt-sign-demo" data-rbt-sign-all>一键签署</button>' +
                    '<button type="button" class="rbt-demand-contract__close" data-rbt-sign-close aria-label="关闭">&times;</button></span></div>' +
                    '<div class="rbt-sign-modal__body">' + signBody(item) + '</div></div>';
                document.body.appendChild(mask);
                mask.addEventListener('click', function (event) {
                    var signAll = event.target.closest('[data-rbt-sign-all]');
                    if (signAll) {
                        var saved = signAllDemo(row.code);
                        if (saved) {
                            var nextBody = mask.querySelector('.rbt-sign-modal__body');
                            if (nextBody) nextBody.innerHTML = signBody(saved);
                            signAll.hidden = true;
                            refreshTable();
                        }
                        return;
                    }
                    var confirm = event.target.closest('[data-confirm-sign]');
                    if (confirm) {
                        var result = dataApi.signDemand(
                            confirm.getAttribute('data-confirm-sign'),
                            supplyActor,
                            confirm.getAttribute('data-contract-key')
                        );
                        if (result && result.ok) {
                            var fresh = dataApi.get(row.code) || item;
                            var body = mask.querySelector('.rbt-sign-modal__body');
                            if (body) body.innerHTML = signBody(fresh);
                            refreshTable();
                        }
                        return;
                    }
                    if (event.target === mask) closeSign();
                });
                mask.querySelector('[data-rbt-sign-close]').addEventListener('click', closeSign);
                document.addEventListener('keydown', onSignKey);
            }

            function goAudit(row) {
                if (!canGoAudit(row) || !row.code) return;
                var wp = window.wmsPath || {
                    page: function (file) { return '../MDM/' + file; }
                };
                var url = wp.page('mdm_audit_rbt_demand.html');
                var joiner = url.indexOf('?') >= 0 ? '&' : '?';
                window.location.href = url + joiner + 'demandCode=' + encodeURIComponent(row.code);
            }

            document.addEventListener('visibilitychange', function () {
                if (document.visibilityState === 'visible') refreshTable();
            });
            window.addEventListener('focus', refreshTable);

            return {
                table: table,
                slots: slots,
                columns: columns,
                requestRows: requestRows,
                statusType: statusType,
                openDetail: openDetail,
                canGoAudit: canGoAudit,
                goAudit: goAudit,
                canGoSign: canGoSign,
                goSign: goSign,
                refreshTable: refreshTable
            };
        }
    }, '#rbtDemandApp', {
        services: {},
        warehouse: { warehouseId: 'demo', warehouseCode: 'DEMO', warehouseName: '演示仓库' },
        permissions: [],
        layoutDensity: 'default'
    });
})();
