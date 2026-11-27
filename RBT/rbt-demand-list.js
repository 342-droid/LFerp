/* 需求单管理：展示门店端发布的需求，默认可见待审核等全量状态。 */
(function () {
    var Vue = OctopusPrototype.Vue;
    var ref = Vue.ref;
    var computed = Vue.computed;
    var ElMessage = OctopusPrototype.ElementPlus ? OctopusPrototype.ElementPlus.ElMessage : null;
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

    function statusType(status) {
        if (status === '已完成') return 'success';
        if (status === '已作废' || status === '已取消' || status === '已驳回') return 'info';
        if (status === '待确认签约' || status === '待重新确认' || status === '待付款' || status === '发货中') return 'warning';
        if (status === '门店付款中') return 'danger';
        return '';
    }

    OctopusPrototype.mount({
        setup: function () {
            var table = ref(null);
            var slots = { code: 'cell-code', status: 'cell-status', repayperiod: 'cell-repayPeriod' };
            var statusOptions = (dataApi.STATUSES || []).concat(dataApi.CLOSED_STATUSES || []).map(function (name) {
                return { label: name, value: name };
            });

            var columns = [
                { dataIndex: 'code', title: '需求单号', minWidth: 130, search: { control: 'input' } },
                { dataIndex: 'storeName', title: '门店', minWidth: 150, align: 'left', showOverflowTooltip: true, search: { control: 'input' } },
                {
                    dataIndex: 'status',
                    title: '状态',
                    minWidth: 110,
                    search: { control: 'select', options: statusOptions, placeholder: '请选择状态' }
                },
                { dataIndex: 'installmentName', title: '产品', minWidth: 140, align: 'left', showOverflowTooltip: true, search: { control: 'input' }, formatter: function (row) { return show(row.installmentName); } },
                { dataIndex: 'repayCycle', title: '结算周期', minWidth: 100, formatter: function (row) { return show(row.repayCycle); } },
                { dataIndex: 'repayMethod', title: '结算方式', minWidth: 100, formatter: function (row) { return show(row.repayMethod); } },
                { dataIndex: 'repayPeriod', title: '结算比例', minWidth: 140, align: 'left' },
                { dataIndex: 'traderName', title: '贸易商', minWidth: 180, align: 'left', showOverflowTooltip: true, search: { control: 'input' }, formatter: function (row) { return show(row.traderName); } },
                { dataIndex: 'providerName', title: '服务商', minWidth: 180, align: 'left', showOverflowTooltip: true, search: { control: 'input' }, formatter: function (row) { return show(row.providerName); } },
                { dataIndex: 'acceptedAt', title: '接单时间', minWidth: 170, formatter: function (row) { return show(row.acceptedAt); } },
                { dataIndex: 'goodsAmount', title: '商品金额', minWidth: 120, formatter: function (row) { return blank(row.goodsAmount) ? '—' : ('¥' + row.goodsAmount); } },
                { dataIndex: 'serviceFee', title: '服务费', minWidth: 120, formatter: function (row) { return blank(row.serviceFee) ? '—' : ('¥' + row.serviceFee); } },
                { dataIndex: 'amount', title: '总金额', minWidth: 120, formatter: function (row) { return blank(row.amount) ? '—' : ('¥' + row.amount); } },
                { dataIndex: 'withdrawReason', title: '撤回原因', minWidth: 160, align: 'left', showOverflowTooltip: true, formatter: function (row) { return show(row.withdrawReason); } },
                { dataIndex: 'remark', title: '备注', minWidth: 180, align: 'left', showOverflowTooltip: true, formatter: function (row) { return show(row.remark); } },
                { dataIndex: 'creator', title: '创建人', minWidth: 100 },
                { dataIndex: 'createdAt', title: '创建时间', minWidth: 170 },
                { dataIndex: 'updater', title: '更新人', minWidth: 100 },
                { dataIndex: 'updatedAt', title: '更新时间', minWidth: 170 }
            ];

            function requestRows(params) {
                var matched = dataApi.list().filter(function (row) {
                    if (!includesText(row.code, params.code)) return false;
                    if (!includesText(row.storeName, params.storeName) && !includesText(row.storeCode, params.storeName)) return false;
                    if (!includesText(row.installmentName, params.installmentName) && !includesText(row.installmentCode, params.installmentName)) return false;
                    if (!includesText(row.traderName, params.traderName)) return false;
                    if (!includesText(row.providerName, params.providerName) && !includesText(row.providerId, params.providerName)) return false;
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

            function hasRatio(row) {
                var ratioApi = window.RbtSettleRatio;
                if (!row || row.repayMethod !== '比例付' || !ratioApi || typeof ratioApi.viewOf !== 'function') return false;
                var view = ratioApi.viewOf(row);
                return !!(view && view.length);
            }

            function closeRatio() {
                document.querySelectorAll('[data-rbt-ratio-modal]').forEach(function (node) {
                    node.remove();
                });
                document.removeEventListener('keydown', onRatioKey);
            }

            function onRatioKey(event) {
                if (event.key !== 'Escape') return;
                event.stopPropagation();
                closeRatio();
            }

            function canEditRatio(row) {
                var item = dataApi.get(row && row.code) || row;
                var ratioApi = window.RbtSettleRatio;
                return !!(ratioApi && typeof ratioApi.canEdit === 'function' && ratioApi.canEdit(item));
            }

            function afterRatioSaved(saved) {
                refreshTable();
                if (saved && window.RbtDemandDetail && typeof window.RbtDemandDetail.open === 'function') {
                    var drawer = document.querySelector('[data-rbt-demand-drawer]');
                    if (drawer) window.RbtDemandDetail.open(saved, { manage: true });
                }
            }

            function openEditRatio(row) {
                var item = dataApi.get(row && row.code) || row;
                var ratioApi = window.RbtSettleRatio;
                if (!ratioApi || typeof ratioApi.openEditor !== 'function') return;
                closeRatio();
                ratioApi.openEditor(item, { onSaved: afterRatioSaved });
            }

            function openRatio(row) {
                if (!hasRatio(row)) return;
                var item = dataApi.get(row && row.code) || row;
                var ratioApi = window.RbtSettleRatio;
                var html = ratioApi && typeof ratioApi.tableHtml === 'function' ? ratioApi.tableHtml(item) : '';
                if (!html) return;
                closeRatio();
                var editable = canEditRatio(item);
                var mask = document.createElement('div');
                mask.className = 'rbt-demand-contract-mask';
                mask.setAttribute('data-rbt-ratio-modal', '1');
                mask.innerHTML =
                    '<div class="rbt-demand-contract rbt-ratio-dialog" role="dialog" aria-modal="true" aria-label="结算比例详情">' +
                    '<div class="rbt-demand-contract__head">' +
                    '<div><div class="rbt-demand-contract__eyebrow">结算比例</div>' +
                    '<div class="rbt-demand-contract__title">' + esc(item.code) + '</div>' +
                    '<div class="rbt-demand-contract__meta">' + esc(item.storeName || '') + '</div></div>' +
                    '<button type="button" class="rbt-demand-contract__close" data-rbt-ratio-close aria-label="关闭">&times;</button></div>' +
                    '<div class="rbt-ratio-dialog__body">' + html + '</div>' +
                    (editable
                        ? '<div class="rbt-review-foot"><button type="button" class="btn btn-primary" data-rbt-ratio-edit>修改结算比例</button></div>'
                        : '') +
                    '</div>';
                document.body.appendChild(mask);
                mask.addEventListener('click', function (event) {
                    if (event.target === mask) closeRatio();
                    if (event.target.closest('[data-rbt-ratio-edit]')) openEditRatio(item);
                });
                mask.querySelector('[data-rbt-ratio-close]').addEventListener('click', closeRatio);
                document.addEventListener('keydown', onRatioKey);
            }

            function openDetail(row) {
                var item = dataApi.get(row && row.code) || row;
                if (window.RbtDemandDetail && typeof window.RbtDemandDetail.open === 'function') {
                    window.RbtDemandDetail.open(item, { manage: true });
                }
            }

            function canGoAudit(row) {
                return !!(row && row.status === '待审核');
            }

            function canGoSign(row) {
                return !!(row && row.status === '待签署');
            }

            function canVoid(row) {
                return !!(dataApi.canVoidDemand && dataApi.canVoidDemand(row));
            }

            function canRepublish(row) {
                return !!(dataApi.canRepublishDemand && dataApi.canRepublishDemand(row));
            }

            function voidDemand(row) {
                if (!canVoid(row) || !row.code) return;
                if (!window.confirm('确认作废「' + row.code + '」？作废后释放占用额度。')) return;
                if (dataApi.voidDemand(row.code, '平台')) refreshTable();
            }

            /* 待重新确认由平台重新发布，回到待接单后贸易商才可以再接。 */
            function republishDemand(row) {
                if (!canRepublish(row) || !row.code) return;
                if (!window.confirm('确认重新发布「' + row.code + '」？发布后需求回到待接单，可被贸易商继续接单。')) return;
                if (dataApi.republishDemand(row.code, '平台')) refreshTable();
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

            /* 原型演示：一次把销售合同和采购合同的各方都标成已签署，需求进入待付款。 */
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
                return dataApi.setStatus(code, '待付款', '冷丰供应链');
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

            var AUDIT_AUTO_KEY = 'rbt_audit_auto_v1';
            var auditOpen = ref(false);
            var auditForm = ref({ first: '是' });

            function readAuditAuto() {
                try {
                    var raw = sessionStorage.getItem(AUDIT_AUTO_KEY);
                    if (!raw) return { first: true };
                    var data = JSON.parse(raw);
                    return { first: !data || data.first !== false };
                } catch (e) {
                    return { first: true };
                }
            }

            function openAuditConfig() {
                var data = readAuditAuto();
                auditForm.value = { first: data.first ? '是' : '否' };
                auditOpen.value = true;
            }

            function saveAuditConfig() {
                var first = auditForm.value.first;
                if (first !== '是' && first !== '否') {
                    if (ElMessage) ElMessage.error('请选择初审是否自动审核');
                    return;
                }
                sessionStorage.setItem(AUDIT_AUTO_KEY, JSON.stringify({ first: first === '是' }));
                auditOpen.value = false;
                if (ElMessage) ElMessage.success('审核配置已保存');
            }

            var ACCEPT_TIMEOUT_KEY = 'rbt_accept_timeout_v1';
            var acceptOpen = ref(false);
            var acceptForm = ref({ minutes: '' });

            function readAcceptMinutes() {
                try {
                    var raw = sessionStorage.getItem(ACCEPT_TIMEOUT_KEY);
                    if (!raw) return '';
                    var data = JSON.parse(raw);
                    var minutes = Number(data && data.minutes);
                    if (!isFinite(minutes) || minutes <= 0 || Math.floor(minutes) !== minutes) return '';
                    return String(minutes);
                } catch (e) {
                    return '';
                }
            }

            function openAcceptTimeout() {
                acceptForm.value = { minutes: readAcceptMinutes() };
                acceptOpen.value = true;
            }

            function onAcceptMinutes(value) {
                acceptForm.value.minutes = String(value == null ? '' : value).replace(/[^\d]/g, '').replace(/^0+(\d)/, '$1');
            }

            function saveAcceptTimeout() {
                var text = String(acceptForm.value.minutes || '').trim();
                var minutes = Number(text);
                if (!/^\d+$/.test(text) || minutes <= 0) {
                    if (ElMessage) ElMessage.error('请填写大于 0 的整数分钟');
                    return;
                }
                sessionStorage.setItem(ACCEPT_TIMEOUT_KEY, JSON.stringify({ minutes: minutes }));
                acceptOpen.value = false;
                if (ElMessage) ElMessage.success('接单时间配置已保存');
                refreshTable();
            }

            var reasonOpen = ref(false);
            var reasonList = ref([]);
            var reasonDraft = ref('');

            function openWithdrawReasons() {
                var api = window.RbtDemandData;
                reasonList.value = api && typeof api.withdrawReasons === 'function' ? api.withdrawReasons().slice() : [];
                reasonDraft.value = '';
                reasonOpen.value = true;
            }

            function addWithdrawReason() {
                var text = String(reasonDraft.value || '').trim();
                if (!text) {
                    if (ElMessage) ElMessage.error('请填写撤回原因');
                    return;
                }
                if (text.length > 30) {
                    if (ElMessage) ElMessage.error('撤回原因不超过 30 个字');
                    return;
                }
                if (reasonList.value.indexOf(text) >= 0) {
                    if (ElMessage) ElMessage.error('该原因已存在');
                    return;
                }
                reasonList.value = reasonList.value.concat([text]);
                reasonDraft.value = '';
            }

            function removeWithdrawReason(index) {
                reasonList.value = reasonList.value.filter(function (_, itemIndex) { return itemIndex !== index; });
            }

            function saveWithdrawReasonConfig() {
                var draft = String(reasonDraft.value || '').trim();
                if (draft.length > 30) {
                    if (ElMessage) ElMessage.error('撤回原因不超过 30 个字');
                    return;
                }
                var next = reasonList.value.slice();
                if (draft && next.indexOf(draft) < 0) next.push(draft);
                var api = window.RbtDemandData;
                if (api && typeof api.saveWithdrawReasons === 'function') api.saveWithdrawReasons(next);
                reasonOpen.value = false;
                if (ElMessage) ElMessage.success('撤回原因已保存');
            }

            /* 平台代门店发布。单据归该门店，按商品金额占额度，发布后直接待接单。 */
            var createOpen = ref(false);
            var createStoreCode = ref('');
            var createPackageCode = ref('');
            var createLines = ref([]);
            var createCycle = ref('');
            var createMethod = ref('');
            var createPeriod = ref('');
            var createStores = ref([]);
            var createPackages = ref([]);
            var createPlans = ref([]);
            var createDemandCount = ref(0);
            var COUNT_SKIP = { '已作废': true, '已驳回': true, '已取消': true };

            function moneyCents(value) {
                var amount = Number(String(value == null ? '' : value).replace(/,/g, '').replace(/^¥/, ''));
                if (!isFinite(amount)) return NaN;
                return Math.round(amount * 100);
            }

            function centsText(cents) {
                var sign = cents < 0 ? '-' : '';
                var abs = Math.abs(Math.round(cents));
                var whole = String(Math.floor(abs / 100));
                whole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                return sign + whole + '.' + String(abs % 100).padStart(2, '0');
            }

            function yuanText(cents) {
                return isFinite(cents) ? ('¥' + centsText(cents)) : '—';
            }

            function packText(unit, spec) {
                var unitText = unit && unit !== '—' ? unit : '';
                var specText = spec && spec !== '—' ? spec : '';
                if (unitText && specText) return '1' + unitText + ' ' + specText;
                return unitText || specText || '—';
            }

            function cleanQty(value) {
                return String(value == null ? '' : value).replace(/[^\d]/g, '').replace(/^0+(\d)/, '$1').slice(0, 3);
            }

            function cleanPrice(value) {
                var text = String(value == null ? '' : value).replace(/[^\d.]/g, '');
                var parts = text.split('.');
                var whole = parts[0].replace(/^0+(\d)/, '$1');
                if (parts.length === 1) return whole;
                return whole + '.' + parts.slice(1).join('').slice(0, 2);
            }

            function qtyNumber(value) {
                if (!/^\d+$/.test(String(value || ''))) return 0;
                var qty = Number(value);
                if (!isFinite(qty) || qty < 1 || qty > 999) return 0;
                return qty;
            }

            function priceNumber(value) {
                var text = String(value == null ? '' : value).trim();
                if (!/^\d+(\.\d{1,2})?$/.test(text)) return 0;
                var amount = Number(text);
                return isFinite(amount) && amount > 0 ? amount : 0;
            }

            function lineCents(line) {
                var qty = qtyNumber(line && line.qtyInput);
                var price = priceNumber(line && line.priceInput);
                if (!qty || !price) return 0;
                return Math.round(price * 100) * qty;
            }

            function countStoreDemands(storeCode) {
                var count = 0;
                if (!storeCode) return 0;
                dataApi.list().forEach(function (item) {
                    if (!item || item.storeCode !== storeCode || COUNT_SKIP[item.status]) return;
                    count += 1;
                });
                return count;
            }

            function loadCreateStore(code) {
                createStoreCode.value = code || '';
                createPackageCode.value = '';
                createLines.value = [];
                createCycle.value = '';
                createMethod.value = '';
                createPeriod.value = '';
                var packageApi = window.RbtPackageData;
                createPackages.value = code && packageApi && typeof packageApi.forStore === 'function'
                    ? packageApi.forStore(code)
                    : [];
                createDemandCount.value = countStoreDemands(code);
            }

            function plansForPackage(pkg, goodsCents) {
                if (!pkg || !isFinite(goodsCents) || goodsCents <= 0) return [];
                return createPlans.value.filter(function (plan) {
                    var names = plan.packages || [];
                    if (names.indexOf(pkg.name) < 0 && names.indexOf(pkg.code) < 0) return false;
                    var min = moneyCents(plan.amountMin);
                    var max = moneyCents(plan.amountMax);
                    return isFinite(min) && isFinite(max) && goodsCents >= min && goodsCents <= max;
                });
            }

            function plansCoveringPackage(pkg) {
                if (!pkg) return [];
                return createPlans.value.filter(function (plan) {
                    var names = plan.packages || [];
                    return names.indexOf(pkg.name) >= 0 || names.indexOf(pkg.code) >= 0;
                });
            }

            function settleChoice(plans) {
                var cycles = [];
                var seenCycle = {};
                plans.forEach(function (plan) {
                    if (plan.repayCycle && !seenCycle[plan.repayCycle]) {
                        seenCycle[plan.repayCycle] = true;
                        cycles.push(plan.repayCycle);
                    }
                });
                var cycle = cycles.indexOf(createCycle.value) >= 0
                    ? createCycle.value
                    : (cycles.indexOf('日结') >= 0 ? '日结' : (cycles[0] || ''));
                var methods = [];
                var seenMethod = {};
                plans.forEach(function (plan) {
                    if (plan.repayCycle === cycle && plan.repayMethod && !seenMethod[plan.repayMethod]) {
                        seenMethod[plan.repayMethod] = true;
                        methods.push(plan.repayMethod);
                    }
                });
                var method = methods.indexOf(createMethod.value) >= 0 ? createMethod.value : (methods[0] || '');
                var plan = null;
                plans.some(function (item) {
                    if (item.repayCycle === cycle && item.repayMethod === method) {
                        plan = item;
                        return true;
                    }
                    return false;
                });
                var periods = plan && Array.isArray(plan.periods) ? plan.periods.map(String) : [];
                var period = periods.indexOf(String(createPeriod.value)) >= 0 ? String(createPeriod.value) : (periods[0] || '');
                return { cycles: cycles, cycle: cycle, methods: methods, method: method, plan: plan, periods: periods, period: period };
            }

            function storeRateOf(plan, period) {
                if (!plan) return 0;
                var rate = plan.repayMethod === '比例付'
                    ? Number(plan.storeRate)
                    : Number((plan.periodRates || {})[String(period)] || 0);
                return isFinite(rate) && rate > 0 ? rate : 0;
            }

            function channelRatiosOf(plan) {
                var api = window.RbtSettleRatio;
                if (!api || !plan || plan.repayMethod !== '比例付' || typeof api.normalize !== 'function') return null;
                if (plan.settleRatios && plan.settleRatios.length) return api.normalize(plan.settleRatios);
                var fallback = typeof api.parseRatio === 'function' ? api.parseRatio(plan.periodRatio) : '';
                if (!fallback || !api.CHANNELS) return null;
                return api.normalize(api.CHANNELS.map(function (channel) {
                    return { channel: channel, fallback: fallback, rows: [] };
                }));
            }

            var createView = computed(function () {
                var storeApi = window.RbtStoreData;
                var code = createStoreCode.value;
                var store = code && storeApi && typeof storeApi.get === 'function' ? storeApi.get(code) : null;
                var quota = store && typeof storeApi.quotaOf === 'function' ? storeApi.quotaOf(store) : null;
                var paid = store && typeof storeApi.depositPaidOf === 'function' ? storeApi.depositPaidOf(store) : false;
                var limit = store && typeof storeApi.demandLimitOf === 'function' ? storeApi.demandLimitOf(store) : 1;
                var block = '';
                if (store && !paid) block = '保证金未缴纳，无法发布需求';
                else if (store && createDemandCount.value >= limit) block = '需求次数已达上限，无法发布需求';
                else if (store && !(quota && quota.available > 0)) block = '可用额度不足，无法发布需求';
                var pkg = null;
                createPackages.value.some(function (item) {
                    if (item.code === createPackageCode.value) {
                        pkg = item;
                        return true;
                    }
                    return false;
                });
                var lines = createLines.value.map(function (line) {
                    var cents = lineCents(line);
                    var qty = qtyNumber(line.qtyInput);
                    return {
                        code: line.code,
                        name: line.name,
                        pack: line.pack,
                        canEdit: line.canEdit,
                        canDelete: line.canDelete,
                        qtyInput: line.qtyInput,
                        qtyText: qty ? String(qty) : '—',
                        priceInput: line.priceInput,
                        priceText: priceNumber(line.priceInput) ? Number(line.priceInput).toFixed(2) : '—',
                        amount: cents ? yuanText(cents) : '—'
                    };
                });
                var goods = 0;
                var piece = 0;
                var kind = 0;
                var pending = false;
                createLines.value.forEach(function (line) {
                    var cents = lineCents(line);
                    if (!cents) {
                        pending = true;
                        return;
                    }
                    goods += cents;
                    piece += qtyNumber(line.qtyInput);
                    kind += 1;
                });
                var matched = pkg && !pending && goods > 0 ? plansForPackage(pkg, goods) : [];
                var choice = settleChoice(matched);
                var rate = storeRateOf(choice.plan, choice.period);
                var total = choice.plan && rate ? Math.round(goods * rate) : NaN;
                var settleTip = '';
                if (pkg && !createLines.value.length) settleTip = '请至少保留一件商品';
                else if (pkg && pending) settleTip = '请把商品数量和售卖单价填完整';
                else if (pkg && goods > 0 && !plansCoveringPackage(pkg).length) settleTip = '商品未关联产品配置';
                else if (pkg && goods > 0 && !matched.length) settleTip = '售价不在产品配置的货款区间内';
                else if (pkg && quota && goods > moneyCents(quota.available)) settleTip = '商品金额须小于等于可用额度';
                else if (choice.plan && choice.plan.repayMethod === '比例付' && !channelRatiosOf(choice.plan)) settleTip = '请先在产品配置中维护各渠道结算比例';
                return {
                    storeCode: code,
                    stores: createStores.value,
                    quota: store && quota ? {
                        total: centsText(moneyCents(quota.total)),
                        occupied: centsText(moneyCents(quota.occupied)),
                        available: centsText(moneyCents(quota.available)),
                        count: createDemandCount.value + ' / ' + limit,
                        deposit: paid ? '已缴纳' : '未缴纳'
                    } : null,
                    block: block,
                    packageCode: createPackageCode.value,
                    packageDisabled: !store || !!block,
                    packagePlaceholder: !store ? '请先选择门店' : (createPackages.value.length ? '请选择商品包' : '该门店没有可用商品包'),
                    packages: createPackages.value.map(function (item) {
                        return { code: item.code, label: (item.name || item.code) + '（' + item.code + '）' };
                    }),
                    skus: lines,
                    skuEmpty: pkg ? '该商品包暂无商品' : '请先选择商品包',
                    kind: kind,
                    piece: piece,
                    skuAmount: goods ? yuanText(goods) : '¥0.00',
                    product: choice.plan ? ((choice.plan.name || choice.plan.code) + '（' + (choice.plan.code || '—') + '）') : '—',
                    cycles: choice.cycles,
                    cycle: choice.cycle,
                    methods: choice.methods,
                    method: choice.method,
                    showPeriod: !!(choice.method && choice.method !== '比例付'),
                    periods: choice.periods,
                    period: choice.period,
                    goods: goods ? yuanText(goods) : '—',
                    fee: isFinite(total) ? yuanText(total - goods) : '—',
                    total: isFinite(total) ? yuanText(total) : '—',
                    settleTip: block ? '' : settleTip
                };
            });

            function createDemand() {
                var storeApi = window.RbtStoreData;
                var stores = storeApi && typeof storeApi.list === 'function' ? storeApi.list() : [];
                createStores.value = stores.filter(function (item) {
                    return item && item.code && item.enabled !== false;
                }).map(function (item) {
                    return { code: item.code, label: (item.name || item.code) + '（' + item.code + '）' };
                });
                var installmentApi = window.RbtInstallmentData;
                createPlans.value = installmentApi && typeof installmentApi.list === 'function' ? installmentApi.list() : [];
                loadCreateStore('');
                createOpen.value = true;
            }

            function onCreateStore(event) {
                loadCreateStore(event && event.target ? event.target.value : '');
            }

            function onCreatePackage(event) {
                var code = event && event.target ? event.target.value : '';
                createPackageCode.value = code;
                createCycle.value = '';
                createMethod.value = '';
                createPeriod.value = '';
                var pkg = null;
                createPackages.value.some(function (item) {
                    if (item.code === code) {
                        pkg = item;
                        return true;
                    }
                    return false;
                });
                createLines.value = pkg ? (pkg.skus || []).map(function (line) {
                    return {
                        code: line.code,
                        name: line.name || line.code,
                        pack: packText(line.unit, line.spec),
                        canEdit: line.canEdit === '是',
                        canDelete: line.canDelete === '是',
                        qtyInput: line.qty && line.qty !== '—' ? String(line.qty) : '',
                        priceInput: line.salePrice && line.salePrice !== '—' ? String(line.salePrice) : ''
                    };
                }) : [];
            }

            function patchCreateLine(code, field, value) {
                createLines.value = createLines.value.map(function (line) {
                    if (line.code !== code) return line;
                    var next = Object.assign({}, line);
                    next[field] = value;
                    return next;
                });
            }

            function onCreateQty(code, event) {
                patchCreateLine(code, 'qtyInput', cleanQty(event && event.target ? event.target.value : ''));
            }

            function onCreatePrice(code, event) {
                patchCreateLine(code, 'priceInput', cleanPrice(event && event.target ? event.target.value : ''));
            }

            function onCreateRemove(code) {
                createLines.value = createLines.value.filter(function (line) { return line.code !== code; });
            }

            function onCreateCycle(event) {
                createCycle.value = event && event.target ? event.target.value : '';
                createMethod.value = '';
                createPeriod.value = '';
            }

            function onCreateMethod(event) {
                createMethod.value = event && event.target ? event.target.value : '';
                createPeriod.value = '';
            }

            function onCreatePeriod(event) {
                createPeriod.value = event && event.target ? event.target.value : '';
            }

            function nextDemandCode(rows) {
                var max = 0;
                (rows || []).forEach(function (item) {
                    var matched = String(item && item.code || '').match(/^XQ(\d+)$/);
                    if (matched) max = Math.max(max, parseInt(matched[1], 10));
                });
                return 'XQ' + String(max + 1).padStart(5, '0');
            }

            function publishCreate() {
                var view = createView.value;
                if (!createStoreCode.value) {
                    if (ElMessage) ElMessage.error('请选择门店');
                    return;
                }
                if (view.block) {
                    if (ElMessage) ElMessage.error(view.block);
                    return;
                }
                if (!createPackageCode.value) {
                    if (ElMessage) ElMessage.error('请选择商品包');
                    return;
                }
                if (view.settleTip) {
                    if (ElMessage) ElMessage.error(view.settleTip);
                    return;
                }
                if (!view.cycle || !view.method || (view.showPeriod && !view.period)) {
                    if (ElMessage) ElMessage.error('请补齐结算周期、结算方式和结算期数');
                    return;
                }
                var pkg = null;
                createPackages.value.some(function (item) {
                    if (item.code === createPackageCode.value) {
                        pkg = item;
                        return true;
                    }
                    return false;
                });
                var goods = 0;
                createLines.value.forEach(function (line) { goods += lineCents(line); });
                var choice = settleChoice(plansForPackage(pkg, goods));
                var plan = choice.plan;
                var rate = storeRateOf(plan, choice.period);
                var total = Math.round(goods * rate);
                var ratios = plan && plan.repayMethod === '比例付' ? channelRatiosOf(plan) : null;
                var storeApi = window.RbtStoreData;
                var store = storeApi && typeof storeApi.get === 'function' ? storeApi.get(createStoreCode.value) : null;
                if (!store || !plan) {
                    if (ElMessage) ElMessage.error('发布信息不完整');
                    return;
                }
                var when = dataApi.nowText();
                var rows = dataApi.list();
                var created = {
                    code: nextDemandCode(rows),
                    storeCode: store.code,
                    storeName: store.name || store.code,
                    packageCode: pkg.code,
                    packageName: pkg.name || pkg.code,
                    skus: createLines.value.map(function (line) {
                        return {
                            code: line.code,
                            name: line.name,
                            salePrice: priceNumber(line.priceInput).toFixed(2),
                            qty: qtyNumber(line.qtyInput)
                        };
                    }),
                    goodsAmount: centsText(goods).replace(/,/g, ''),
                    serviceFee: centsText(total - goods).replace(/,/g, ''),
                    amount: centsText(total).replace(/,/g, ''),
                    installmentCode: plan.code,
                    installmentName: plan.name || plan.code,
                    repayCycle: choice.cycle,
                    repayMethod: choice.method,
                    repayPeriod: choice.method === '比例付' ? '' : String(choice.period),
                    settleRatios: ratios ? JSON.parse(JSON.stringify(ratios)) : [],
                    dailyAmount: '',
                    status: '待接单',
                    quotaHeld: false,
                    creator: '平台',
                    createdAt: when,
                    updater: '平台',
                    updatedAt: when,
                    logs: [{ time: when, operator: '平台', content: '平台代门店发布需求' }]
                };
                if (typeof dataApi.occupyDemandQuota === 'function') dataApi.occupyDemandQuota(created);
                rows.unshift(created);
                dataApi.save(rows);
                createOpen.value = false;
                refreshTable();
                if (ElMessage) ElMessage.success('需求已发布');
            }

            document.addEventListener('visibilitychange', function () {
                if (document.visibilityState === 'visible') refreshTable();
            });
            window.addEventListener('focus', refreshTable);
            window.setInterval(refreshTable, 30000);

            /* 经营数据中心等外链：?demandCode=XQ00028 打开对应需求详情 */
            window.setTimeout(function () {
                try {
                    var q = new URLSearchParams(window.location.search || '');
                    var code = q.get('demandCode') || q.get('code');
                    if (!code) return;
                    var item = dataApi.get(code);
                    if (item) openDetail(item);
                } catch (e) { /* ignore */ }
            }, 0);

            return {
                table: table,
                slots: slots,
                columns: columns,
                requestRows: requestRows,
                statusType: statusType,
                hasRatio: hasRatio,
                canEditRatio: canEditRatio,
                openRatio: openRatio,
                openEditRatio: openEditRatio,
                openDetail: openDetail,
                canGoAudit: canGoAudit,
                goAudit: goAudit,
                canGoSign: canGoSign,
                goSign: goSign,
                canVoid: canVoid,
                voidDemand: voidDemand,
                canRepublish: canRepublish,
                republishDemand: republishDemand,
                refreshTable: refreshTable,
                auditOpen: auditOpen,
                auditForm: auditForm,
                openAuditConfig: openAuditConfig,
                saveAuditConfig: saveAuditConfig,
                acceptOpen: acceptOpen,
                acceptForm: acceptForm,
                openAcceptTimeout: openAcceptTimeout,
                onAcceptMinutes: onAcceptMinutes,
                saveAcceptTimeout: saveAcceptTimeout,
                reasonOpen: reasonOpen,
                reasonList: reasonList,
                reasonDraft: reasonDraft,
                openWithdrawReasons: openWithdrawReasons,
                addWithdrawReason: addWithdrawReason,
                removeWithdrawReason: removeWithdrawReason,
                saveWithdrawReasonConfig: saveWithdrawReasonConfig,
                createOpen: createOpen,
                createView: createView,
                createDemand: createDemand,
                onCreateStore: onCreateStore,
                onCreatePackage: onCreatePackage,
                onCreateQty: onCreateQty,
                onCreatePrice: onCreatePrice,
                onCreateRemove: onCreateRemove,
                onCreateCycle: onCreateCycle,
                onCreateMethod: onCreateMethod,
                onCreatePeriod: onCreatePeriod,
                publishCreate: publishCreate
            };
        }
    }, '#rbtDemandApp', {
        services: {},
        warehouse: { warehouseId: 'demo', warehouseCode: 'DEMO', warehouseName: '演示仓库' },
        permissions: [],
        layoutDensity: 'default'
    });
})();
