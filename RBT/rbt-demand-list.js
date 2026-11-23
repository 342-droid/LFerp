/* 需求单管理：展示门店端发布、以及平台代门店新建的需求。发布后直接待接单。 */
(function () {
    var Vue = OctopusPrototype.Vue;
    var ref = Vue.ref;
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

    function receivableText(row, key) {
        var pack = dataApi && typeof dataApi.receivables === 'function' ? dataApi.receivables(row) : null;
        var value = pack && pack[key];
        return blank(value) ? '—' : ('¥' + value);
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
                { dataIndex: 'traderReceivable', title: '贸易商应收', minWidth: 130, formatter: function (row) { return receivableText(row, 'trader'); } },
                { dataIndex: 'lengfengReceivable', title: '冷丰应收', minWidth: 120, formatter: function (row) { return receivableText(row, 'lengfeng'); } },
                { dataIndex: 'providerReceivable', title: '服务商应收', minWidth: 130, formatter: function (row) { return receivableText(row, 'provider'); } },
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
                    if (drawer) window.RbtDemandDetail.open(saved);
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
                    window.RbtDemandDetail.open(item);
                }
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

            /* 原型演示：一次把销售合同和采购合同的各方都标成已签署，系统自动划款并进入发货中。 */
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
                target.payMethod = 'auto';
                target.paidAt = now;
                dataApi.save(rows);
                return dataApi.setStatus(code, '发货中', '系统');
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

            var CREATE_PACKAGE_KEY = 'rbt_product_package_v2';
            var CREATE_PLAN_KEY = 'rbt_installment_v3';
            var CREATE_OPERATOR = '用户名';
            var CREATE_QTY_MAX = 999;
            var CREATE_ACTIVE = ['待接单', '待确认签约', '待重新确认', '待签署', '发货中', '门店付款中', '已完成'];
            var CREATE_CYCLES = ['日结'];
            var CREATE_METHODS = ['比例付'];
            var CREATE_SKUS = {
                SKU10001: { name: '库尔勒香梨 4kg', unit: '箱', spec: '4kg', salePrice: '56.80' },
                SKU10002: { name: '精品黄瓜 2kg', unit: '箱', spec: '2kg', salePrice: '22.80' },
                SKU10003: { name: '冷鲜牛腩 1kg', unit: '件', spec: '1kg', salePrice: '78.00' },
                SKU10004: { name: '山东土豆 5kg', unit: '袋', spec: '5kg', salePrice: '28.90' },
                SKU10005: { name: '云南小番茄 1kg', unit: '箱', spec: '1kg', salePrice: '18.50' },
                SKU10006: { name: '新西兰奇异果 12粒', unit: '盒', spec: '12粒', salePrice: '49.90' },
                SKU10007: { name: '冷冻鸡中翅 2kg', unit: '袋', spec: '2kg', salePrice: '62.00' },
                SKU10008: { name: '江西紫薯 3kg', unit: '箱', spec: '3kg', salePrice: '26.80' },
                SKU10009: { name: '东北黑木耳 500g', unit: '袋', spec: '500g', salePrice: '39.90' },
                SKU10010: { name: '福建空心菜 400g', unit: '把', spec: '400g', salePrice: '9.90' },
                SKU10011: { name: '冷鲜猪里脊 1kg', unit: '件', spec: '1kg', salePrice: '52.80' },
                SKU10012: { name: '海南贝贝南瓜 2kg', unit: '箱', spec: '2kg', salePrice: '24.90' },
                SKU20001: { name: '汉言首批铺货', unit: '套', spec: '首批到店', salePrice: '22000.00' },
                SKU20002: { name: '门店设备辅料包', unit: '套', spec: '开业配置', salePrice: '16000.00' },
                SKU20003: { name: '门店拉新人力', unit: '项', spec: '驻店拉新', salePrice: '12000.00' },
                SKU20004: { name: '开业拉新物料', unit: '份', spec: '300份', salePrice: '30.00' },
                SKU20005: { name: '门头招牌及店内品宣', unit: '项', spec: '门头及店内', salePrice: '18000.00' },
                SKU20006: { name: '门店监控套装', unit: '套', spec: '店内监控', salePrice: '13000.00' },
                SKU20007: { name: 'POS及会员管理系统', unit: '套', spec: '含会员管理', salePrice: '12000.00' },
                SKU20008: { name: '抖音本地生活投放', unit: '项', spec: '本地生活', salePrice: '10000.00' },
                SKU20009: { name: '开业督导服务', unit: '项', spec: '开业辅导', salePrice: '8000.00' }
            };
            var CREATE_SEED_PACKAGES = [
                { code: 'SPB00001', name: '汉言开业铺货包', scopeType: 'tag', tagIds: ['rbt-open-stock'], storeCodes: [], skus: [{ code: 'SKU20001', salePrice: '22000.00', qty: 1, canEdit: '否', canDelete: '否' }, { code: 'SKU20002', salePrice: '16000.00', qty: 1, canEdit: '否', canDelete: '否' }, { code: 'SKU20003', salePrice: '12000.00', qty: 1, canEdit: '否', canDelete: '否' }] },
                { code: 'SPB00002', name: '门店形象配置包', scopeType: 'tag', tagIds: ['rbt-store-image'], storeCodes: [], skus: [{ code: 'SKU20004', salePrice: '30.00', qty: 300, canEdit: '否', canDelete: '否' }, { code: 'SKU20005', salePrice: '18000.00', qty: 1, canEdit: '否', canDelete: '否' }, { code: 'SKU20006', salePrice: '13000.00', qty: 1, canEdit: '否', canDelete: '否' }] },
                { code: 'SPB00003', name: '开业运营服务包', scopeType: 'store', tagIds: [], storeCodes: ['ONS00003'], skus: [{ code: 'SKU20007', salePrice: '12000.00', qty: 1, canEdit: '否', canDelete: '否' }, { code: 'SKU20008', salePrice: '10000.00', qty: 1, canEdit: '否', canDelete: '否' }, { code: 'SKU20009', salePrice: '8000.00', qty: 1, canEdit: '否', canDelete: '否' }] }
            ];
            var CREATE_BIZ_STORES = {
                '餐饮': ['ONS00001', 'ONS00004'],
                '康美': ['ONS00002'],
                '纯私域': ['ONS00003'],
                '集团内部': ['ONS00005']
            };
            var CREATE_SEED_STORES = {
                SPB00001: ['ONS00001', 'ONS00004'],
                SPB00002: ['ONS00002'],
                SPB00003: ['ONS00003']
            };
            var CREATE_SEED_PLANS = [
                { code: 'FQ00001', name: '开业铺货日结', repayCycle: '日结', repayMethod: '比例付', periodRatio: '10.00', storeRate: '1.60', amountMin: '20.00', amountMax: '50000', packages: ['汉言开业铺货包'] },
                { code: 'FQ00002', name: '门店形象日结', repayCycle: '日结', repayMethod: '比例付', periodRatio: '8.00', storeRate: '1.80', amountMin: '50.00', amountMax: '100000', packages: ['门店形象配置包'] },
                { code: 'FQ00003', name: '开业运营日结', repayCycle: '日结', repayMethod: '比例付', periodRatio: '10.00', storeRate: '1.50', amountMin: '5.00', amountMax: '30000', packages: ['开业运营服务包'] }
            ];
            var createOpen = ref(false);
            var createState = { storeCode: '', packageCode: '', lines: [], cycle: '', method: '', period: '', publishing: false };
            var createView = ref(blankCreateView());

            function createMoney(value) {
                var amount = Number(value);
                return isFinite(amount) ? amount.toFixed(2) : '0.00';
            }

            function createYuan(value) {
                return '¥' + createMoney(value);
            }

            function createCents(value) {
                var amount = Number(value);
                return isFinite(amount) ? Math.round(amount * 100) : NaN;
            }

            function createRead(key) {
                try {
                    var list = JSON.parse(sessionStorage.getItem(key) || 'null');
                    return Array.isArray(list) ? list : null;
                } catch (e) {
                    return null;
                }
            }

            function blankCreateView() {
                return {
                    stores: [], storeCode: '', packages: [], packageCode: '', packageDisabled: true,
                    packagePlaceholder: '请先选择门店', quota: null, block: '', skus: [], skuEmpty: '请先选择门店',
                    kind: 0, piece: 0, skuAmount: '¥0.00',
                    product: '—', goods: '—', fee: '—', total: '—', cycles: [], methods: [], periods: [],
                    cycle: '', method: '', period: '', showPeriod: false, settleTip: ''
                };
            }

            function createStores() {
                var api = window.RbtStoreData;
                var list = api && typeof api.list === 'function' ? api.list() : [];
                return list.filter(function (item) { return item && item.enabled !== false; });
            }

            function createStore() {
                var found = null;
                createStores().some(function (item) {
                    if (item.code === createState.storeCode) {
                        found = item;
                        return true;
                    }
                    return false;
                });
                return found;
            }

            var CREATE_DEMO_SCOPE = {
                SPB00001: { scopeType: 'tag', tagIds: ['rbt-open-stock'], stores: ['ONS00001', 'ONS00004'] },
                SPB00002: { scopeType: 'tag', tagIds: ['rbt-store-image'], stores: ['ONS00002'] },
                SPB00003: { scopeType: 'store', tagIds: [], stores: ['ONS00003'] }
            };

            function createEnsureScope(item) {
                if (!item || item.scopeType === 'store' || item.scopeType === 'tag') return false;
                var demo = CREATE_DEMO_SCOPE[item.code];
                var stores = (item.storeCodes || []).slice().sort().join(',');
                if (demo && stores === demo.stores.slice().sort().join(',')) {
                    item.scopeType = demo.scopeType;
                    item.tagIds = demo.tagIds.slice();
                    if (demo.scopeType === 'tag') item.storeCodes = [];
                    return true;
                }
                item.scopeType = 'store';
                if (!Array.isArray(item.tagIds)) item.tagIds = [];
                return true;
            }

            /* 门店直接挂上的包，或门店带了商品包所选 RBT 标签，都算匹配。 */
            function createPackageMatches(item, storeCode) {
                if (!item || !storeCode) return false;
                if (item.scopeType === 'tag') {
                    var api = window.BusinessTagPrototypeStore;
                    var bound = api && typeof api.getBinding === 'function' ? (api.getBinding('RBT_STORE', storeCode) || []) : [];
                    return (item.tagIds || []).some(function (id) { return bound.indexOf(id) >= 0; });
                }
                var codes = Array.isArray(item.storeCodes) ? item.storeCodes : [];
                if (!codes.length && item.bizLine && CREATE_BIZ_STORES[item.bizLine]) codes = CREATE_BIZ_STORES[item.bizLine];
                if (!codes.length) codes = CREATE_SEED_STORES[item.code] || [];
                return codes.indexOf(storeCode) >= 0;
            }

            /* 商品包没写是否可修改 / 是否可删除时，沿用种子明细；再没有就按可改、可删。 */
            function createFlagYes(value, fallback) {
                if (value === true || value === '是') return true;
                if (value === false || value === '否') return false;
                return fallback;
            }

            function createSkuLine(raw, seedLine) {
                var src = raw && typeof raw === 'object' ? raw : { code: raw };
                var seed = seedLine || {};
                var code = src.code || seed.code;
                if (!code) return null;
                var meta = CREATE_SKUS[code] || {};
                var price = src.salePrice != null && src.salePrice !== '' ? src.salePrice : (seed.salePrice != null ? seed.salePrice : meta.salePrice);
                var qty = src.qty != null && src.qty !== '' ? src.qty : (seed.qty != null ? seed.qty : 1);
                qty = Math.floor(Number(qty));
                if (!isFinite(qty) || qty < 1) qty = 1;
                if (qty > CREATE_QTY_MAX) qty = CREATE_QTY_MAX;
                var canEdit = src.canEdit != null && src.canEdit !== '' ? src.canEdit : seed.canEdit;
                var canDelete = src.canDelete != null && src.canDelete !== '' ? src.canDelete : seed.canDelete;
                return {
                    code: code,
                    name: src.name || seed.name || meta.name || code,
                    unit: src.unit || seed.unit || meta.unit || '',
                    spec: src.spec || seed.spec || meta.spec || '',
                    salePrice: createMoney(price),
                    qty: qty,
                    canEdit: createFlagYes(canEdit, true),
                    canDelete: createFlagYes(canDelete, true)
                };
            }

            function createPackages() {
                var list = createRead(CREATE_PACKAGE_KEY);
                var source = list && list.length ? list : CREATE_SEED_PACKAGES;
                var scopeChanged = false;
                source.forEach(function (item) {
                    if (createEnsureScope(item)) scopeChanged = true;
                });
                if (scopeChanged && list && list.length) {
                    try { sessionStorage.setItem(CREATE_PACKAGE_KEY, JSON.stringify(source)); } catch (e) {}
                }
                var seedByCode = {};
                CREATE_SEED_PACKAGES.forEach(function (item) { seedByCode[item.code] = item; });
                return source.filter(function (item) {
                    return item && item.enabled !== false && createPackageMatches(item, createState.storeCode);
                }).map(function (item) {
                    var seedPkg = seedByCode[item.code];
                    var seedSku = {};
                    if (seedPkg) (seedPkg.skus || []).forEach(function (line) { seedSku[line.code] = line; });
                    return {
                        code: item.code,
                        name: item.name || item.code,
                        skus: (item.skus || []).map(function (raw) {
                            var code = typeof raw === 'string' ? raw : raw && raw.code;
                            return createSkuLine(raw, seedSku[code]);
                        }).filter(Boolean)
                    };
                });
            }

            function createPackage() {
                var found = null;
                createPackages().some(function (item) {
                    if (item.code === createState.packageCode) {
                        found = item;
                        return true;
                    }
                    return false;
                });
                return found;
            }

            function validCreateQty(value) {
                var qty = Math.floor(Number(value));
                return isFinite(qty) && qty >= 1 && qty <= CREATE_QTY_MAX;
            }

            function validCreatePrice(value) {
                if (value == null || String(value).trim() === '') return false;
                if (!/^\d+(\.\d{1,2})?$/.test(String(value).trim())) return false;
                return Number(value) > 0;
            }

            function createLineOf(code) {
                var found = null;
                (createState.lines || []).some(function (line) {
                    if (line.code === code) {
                        found = line;
                        return true;
                    }
                    return false;
                });
                return found;
            }

            function copyPackageLines(pkg) {
                createState.lines = (pkg && pkg.skus || []).map(function (line) {
                    return {
                        code: line.code,
                        name: line.name,
                        unit: line.unit,
                        spec: line.spec,
                        salePrice: line.salePrice,
                        qty: line.qty,
                        canEdit: line.canEdit === true,
                        canDelete: line.canDelete === true
                    };
                });
            }

            /* 是否可修改=否时，数量和售卖单价锁在商品包上的值，输入框不会出现。 */
            function createReadyLines() {
                return (createState.lines || []).filter(function (line) {
                    return validCreateQty(line.qty) && validCreatePrice(line.salePrice);
                }).map(function (line) {
                    return {
                        code: line.code,
                        name: line.name,
                        salePrice: createMoney(line.salePrice),
                        qty: Math.floor(Number(line.qty))
                    };
                });
            }

            function createSum(lines) {
                return (lines || []).reduce(function (total, line) {
                    return total + Number(line.salePrice) * (Number(line.qty) || 0);
                }, 0);
            }

            function createPack(line) {
                var unit = line && line.unit && line.unit !== '—' ? line.unit : '';
                var spec = line && line.spec && line.spec !== '—' ? line.spec : '';
                if (unit && spec) return '1' + unit + ' ' + spec;
                return unit || spec || '—';
            }

            function createNormalizePlan(item) {
                if (!item) return null;
                var method = item.repayMethod || '比例付';
                if (method === '定额付' || method === '定额还' || method === '等额本息' || method === '比例还' || method === '等额本金') method = '比例付';
                return {
                    code: item.code || '',
                    name: item.name || item.code || '',
                    repayCycle: item.repayCycle === '日还' || !item.repayCycle ? '日结' : item.repayCycle,
                    repayMethod: method,
                    periods: method === '比例付' ? [] : (Array.isArray(item.periods) ? item.periods.map(String).filter(Boolean) : []),
                    periodRates: item.periodRates && typeof item.periodRates === 'object' ? item.periodRates : {},
                    periodRatio: item.periodRatio == null ? '' : String(item.periodRatio),
                    storeRate: item.storeRate == null ? '' : String(item.storeRate),
                    amountMin: item.amountMin,
                    amountMax: item.amountMax,
                    packages: Array.isArray(item.packages) ? item.packages.slice() : [],
                    settleRatios: Array.isArray(item.settleRatios) ? JSON.parse(JSON.stringify(item.settleRatios)) : []
                };
            }

            function createPlans() {
                var list = createRead(CREATE_PLAN_KEY);
                if (!list || !list.length) list = CREATE_SEED_PLANS;
                var changed = false;
                list.forEach(function (item) {
                    if (!item || item.code !== 'FQ00003') return;
                    if (String(item.amountMax) !== '20000' && String(item.amountMax) !== '20000.00') return;
                    item.amountMax = '30000';
                    changed = true;
                });
                if (changed) {
                    try { sessionStorage.setItem(CREATE_PLAN_KEY, JSON.stringify(list)); } catch (e) {}
                }
                return list.filter(function (item) { return item && item.enabled !== false; }).map(createNormalizePlan).filter(Boolean);
            }

            function createPlanCovers(plan, pkg) {
                var names = plan.packages || [];
                return names.indexOf(pkg.name) >= 0 || names.indexOf(pkg.code) >= 0;
            }

            function createAmountInPlan(plan, amount) {
                var min = createCents(plan.amountMin);
                var max = createCents(plan.amountMax);
                var value = createCents(amount);
                if (!isFinite(min) || !isFinite(max) || !isFinite(value)) return false;
                return value >= min && value <= max;
            }

            function createMatched(pkg, amount) {
                if (!pkg) return [];
                return createPlans().filter(function (plan) {
                    return createPlanCovers(plan, pkg) && createAmountInPlan(plan, amount);
                });
            }

            function createCovered(pkg) {
                if (!pkg) return [];
                return createPlans().filter(function (plan) { return createPlanCovers(plan, pkg); });
            }

            function createOrdered(list, order) {
                var seen = {};
                list.forEach(function (item) { if (item) seen[item] = true; });
                var known = order.filter(function (item) { return seen[item]; });
                var extra = Object.keys(seen).filter(function (item) { return order.indexOf(item) < 0; });
                return known.concat(extra);
            }

            function createPlanOf(plans, cycle, method) {
                var found = null;
                plans.some(function (plan) {
                    if (plan.repayCycle === cycle && plan.repayMethod === method) {
                        found = plan;
                        return true;
                    }
                    return false;
                });
                return found;
            }

            function createEnsureChoice(plans) {
                var cycles = createOrdered(plans.map(function (plan) { return plan.repayCycle; }), CREATE_CYCLES);
                if (!cycles.length) {
                    createState.cycle = '';
                    createState.method = '';
                    createState.period = '';
                    return null;
                }
                if (cycles.indexOf(createState.cycle) < 0) createState.cycle = cycles.indexOf('日结') >= 0 ? '日结' : cycles[0];
                var methods = createOrdered(plans.filter(function (plan) {
                    return plan.repayCycle === createState.cycle;
                }).map(function (plan) { return plan.repayMethod; }), CREATE_METHODS);
                if (!methods.length) {
                    createState.method = '';
                    createState.period = '';
                    return null;
                }
                if (methods.indexOf(createState.method) < 0) createState.method = methods[0];
                var plan = createPlanOf(plans, createState.cycle, createState.method);
                var periods = plan ? plan.periods : [];
                if (!periods.length) createState.period = '';
                else if (periods.indexOf(String(createState.period)) < 0) createState.period = String(periods[0]);
                return plan;
            }

            function createStoreRate(plan, period) {
                if (!plan) return 1;
                var rate = plan.repayMethod === '比例付'
                    ? Number(plan.storeRate)
                    : Number((plan.periodRates || {})[String(period)] || 0);
                if (!isFinite(rate) || rate <= 0) return 1;
                return rate;
            }

            function createPayable(principal, plan, period) {
                var amount = Number(principal);
                if (!isFinite(amount) || amount <= 0 || !plan) return null;
                return Math.round(amount * createStoreRate(plan, period) * 100) / 100;
            }

            function createRatios(plan) {
                var api = window.RbtSettleRatio;
                if (!api || !plan || plan.repayMethod !== '比例付') return null;
                var normalized = typeof api.normalize === 'function' ? api.normalize(plan.settleRatios) : null;
                if (normalized) return normalized;
                var fallback = typeof api.parseRatio === 'function' ? api.parseRatio(plan.periodRatio) : '';
                if (!fallback || !api.CHANNELS) return null;
                return api.normalize(api.CHANNELS.map(function (channel) {
                    return { channel: channel, fallback: fallback, rows: [] };
                }));
            }

            function createActiveCount(storeCode) {
                var list = dataApi && typeof dataApi.list === 'function' ? dataApi.list() : [];
                return list.filter(function (item) {
                    return item && item.storeCode === storeCode && CREATE_ACTIVE.indexOf(item.status) >= 0;
                }).length;
            }

            function createQuota(store) {
                var api = window.RbtStoreData;
                var quota = api && store && typeof api.quotaOf === 'function' ? api.quotaOf(store) : null;
                var limit = api && typeof api.demandLimitOf === 'function' ? api.demandLimitOf(store) : 1;
                return {
                    total: quota ? quota.total : 0,
                    occupied: quota ? quota.occupied : 0,
                    available: quota ? quota.available : 0,
                    used: store ? createActiveCount(store.code) : 0,
                    limit: limit
                };
            }

            function createBlock(store) {
                if (!store) return '';
                var paid = window.RbtStoreData && typeof window.RbtStoreData.depositPaidOf === 'function'
                    ? window.RbtStoreData.depositPaidOf(store)
                    : store.depositPaid === true;
                if (!paid) return '保证金未缴纳，无法发布需求';
                var view = createQuota(store);
                if (!(view.available > 0)) return '可用额度不足，无法发布需求';
                if (view.used >= view.limit) return '需求次数已达上限，无法发布需求';
                return '';
            }

            function paintCreate() {
                var store = createStore();
                var packages = createState.storeCode ? createPackages() : [];
                var pkg = createPackage();
                var draft = pkg ? (createState.lines || []) : [];
                var broken = draft.some(function (line) {
                    return !validCreateQty(line.qty) || !validCreatePrice(line.salePrice);
                });
                var ready = broken ? [] : createReadyLines();
                var amount = createSum(ready);
                var plans = ready.length ? createMatched(pkg, amount) : [];
                var plan = createEnsureChoice(plans);
                var pieces = ready.reduce(function (total, line) { return total + line.qty; }, 0);
                var payable = plan ? createPayable(amount, plan, createState.period) : null;
                var covered = pkg && ready.length ? createCovered(pkg) : [];
                var settleTip = '';
                if (pkg && draft.length && broken) settleTip = '请填写有效的商品数量和售卖单价';
                else if (pkg && ready.length && !covered.length) settleTip = '商品未关联产品配置';
                else if (pkg && ready.length && !plans.length) settleTip = '售价不在产品配置的货款区间内';
                var quota = store ? createQuota(store) : null;
                createView.value = {
                    stores: createStores().map(function (item) {
                        return { code: item.code, label: (item.name || item.code) + '（' + item.code + '）' };
                    }),
                    storeCode: createState.storeCode,
                    packages: packages.map(function (item) {
                        return { code: item.code, label: item.name + '（' + item.code + '）' };
                    }),
                    packageCode: pkg ? createState.packageCode : '',
                    packageDisabled: !createState.storeCode || !packages.length,
                    packagePlaceholder: !createState.storeCode ? '请先选择门店' : (packages.length ? '请选择商品包' : '暂无本门店的商品包'),
                    quota: quota ? {
                        total: createYuan(quota.total),
                        occupied: createYuan(quota.occupied),
                        available: createYuan(quota.available),
                        count: quota.used + ' / ' + quota.limit,
                        deposit: store.depositPaid === true ? '已缴纳' : '未缴纳'
                    } : null,
                    block: createBlock(store),
                    skus: draft.map(function (line) {
                        var qtyOk = validCreateQty(line.qty);
                        var priceOk = validCreatePrice(line.salePrice);
                        var qty = qtyOk ? Math.floor(Number(line.qty)) : 0;
                        var price = priceOk ? Number(line.salePrice) : NaN;
                        var rowAmount = qtyOk && priceOk ? qty * price : NaN;
                        return {
                            code: line.code,
                            name: line.name,
                            pack: createPack(line),
                            canEdit: line.canEdit === true,
                            canDelete: line.canDelete === true,
                            priceText: priceOk ? createYuan(price) : '—',
                            priceInput: line.salePrice == null ? '' : String(line.salePrice),
                            qtyText: qtyOk ? String(qty) : '—',
                            qtyInput: line.qty == null ? '' : String(line.qty),
                            amount: isFinite(rowAmount) ? createYuan(rowAmount) : '—'
                        };
                    }),
                    skuEmpty: !createState.storeCode ? '请先选择门店' : (pkg ? '暂无商品' : '请先选择商品包'),
                    kind: draft.length,
                    piece: pieces,
                    skuAmount: draft.length && !broken ? createYuan(amount) : (draft.length ? '—' : '¥0.00'),
                    product: plan ? plan.name + '（' + plan.code + '）' : '—',
                    goods: ready.length ? createYuan(amount) : '—',
                    fee: payable == null ? '—' : createYuan(payable - amount),
                    total: payable == null ? '—' : createYuan(payable),
                    cycles: createOrdered(plans.map(function (item) { return item.repayCycle; }), CREATE_CYCLES),
                    methods: createOrdered(plans.filter(function (item) {
                        return item.repayCycle === createState.cycle;
                    }).map(function (item) { return item.repayMethod; }), CREATE_METHODS),
                    periods: plan && plan.repayMethod !== '比例付' ? plan.periods.map(String) : [],
                    cycle: createState.cycle,
                    method: createState.method,
                    period: createState.period,
                    showPeriod: !!(plan && plan.repayMethod !== '比例付'),
                    settleTip: settleTip
                };
            }

            function resetCreate() {
                createState.storeCode = '';
                createState.packageCode = '';
                createState.lines = [];
                createState.cycle = '';
                createState.method = '';
                createState.period = '';
                createState.publishing = false;
                paintCreate();
            }

            function createDemand() {
                resetCreate();
                createOpen.value = true;
            }

            function onCreateStore(event) {
                createState.storeCode = event.target.value;
                createState.packageCode = '';
                createState.lines = [];
                createState.cycle = '';
                createState.method = '';
                createState.period = '';
                paintCreate();
            }

            function onCreatePackage(event) {
                createState.packageCode = event.target.value;
                createState.cycle = '';
                createState.method = '';
                createState.period = '';
                copyPackageLines(createPackage());
                paintCreate();
            }

            function onCreateQty(code, event) {
                var line = createLineOf(code);
                if (!line || !line.canEdit) return;
                var raw = String(event.target.value || '').replace(/\D/g, '');
                line.qty = raw === '' ? '' : Math.min(CREATE_QTY_MAX, parseInt(raw, 10));
                paintCreate();
            }

            function onCreatePrice(code, event) {
                var line = createLineOf(code);
                if (!line || !line.canEdit) return;
                var raw = String(event.target.value || '').replace(/[^\d.]/g, '');
                var parts = raw.split('.');
                if (parts.length > 2) raw = parts[0] + '.' + parts.slice(1).join('');
                parts = raw.split('.');
                if (parts[1] && parts[1].length > 2) raw = parts[0] + '.' + parts[1].slice(0, 2);
                line.salePrice = raw;
                paintCreate();
            }

            function onCreateRemove(code) {
                var line = createLineOf(code);
                if (!line || !line.canDelete) return;
                createState.lines = createState.lines.filter(function (item) { return item.code !== code; });
                paintCreate();
            }

            function onCreateCycle(event) {
                createState.cycle = event.target.value;
                createState.method = '';
                createState.period = '';
                paintCreate();
            }

            function onCreateMethod(event) {
                createState.method = event.target.value;
                createState.period = '';
                paintCreate();
            }

            function onCreatePeriod(event) {
                createState.period = event.target.value;
                paintCreate();
            }

            function createFail(message) {
                if (ElMessage) ElMessage.error(message);
            }

            function createNextCode(list) {
                var max = 0;
                (list || []).forEach(function (item) {
                    var matched = String(item && item.code || '').match(/^XQ(\d+)$/);
                    if (matched) max = Math.max(max, parseInt(matched[1], 10));
                });
                return 'XQ' + String(max + 1).padStart(5, '0');
            }

            function publishCreate() {
                if (createState.publishing) return;
                var store = createStore();
                if (!store) {
                    createFail('请选择门店');
                    return;
                }
                var blocked = createBlock(store);
                if (blocked) {
                    createFail(blocked);
                    return;
                }
                var pkg = createPackage();
                var draft = createState.lines || [];
                if (!pkg) {
                    createFail('请选择商品包');
                    return;
                }
                if (!draft.length) {
                    createFail('请至少保留一件商品');
                    return;
                }
                if (draft.some(function (line) { return !validCreateQty(line.qty); })) {
                    createFail('商品数量须为 1 到 999 的整数');
                    return;
                }
                if (draft.some(function (line) { return !validCreatePrice(line.salePrice); })) {
                    createFail('请填写售卖单价');
                    return;
                }
                var lines = createReadyLines();
                var amount = createSum(lines);
                if (!createCovered(pkg).length) {
                    createFail('商品未关联产品配置');
                    return;
                }
                var plans = createMatched(pkg, amount);
                if (!plans.length) {
                    createFail('售价不在产品配置的货款区间内');
                    return;
                }
                var plan = createEnsureChoice(plans);
                if (!plan || !createState.cycle) {
                    createFail('请选择结算周期');
                    return;
                }
                if (!createState.method) {
                    createFail('请选择结算方式');
                    return;
                }
                var isRatio = createState.method === '比例付';
                if (!isRatio && !createState.period) {
                    createFail('请选择结算期数');
                    return;
                }
                var payable = createPayable(amount, plan, isRatio ? '' : createState.period);
                if (payable == null) {
                    createFail('总金额计算失败');
                    return;
                }
                var ratios = isRatio ? createRatios(plan) : null;
                if (isRatio && !ratios) {
                    createFail('请先在产品配置中维护各渠道结算比例');
                    return;
                }
                if (createCents(amount) > createCents(createQuota(store).available)) {
                    createFail('商品金额须小于等于可用额度');
                    return;
                }
                if (!dataApi || typeof dataApi.list !== 'function' || typeof dataApi.save !== 'function') {
                    createFail('需求数据未就绪');
                    return;
                }
                createState.publishing = true;
                var all = dataApi.list();
                var now = typeof dataApi.nowText === 'function' ? dataApi.nowText() : '';
                var created = {
                    code: createNextCode(all),
                    storeCode: store.code,
                    storeName: store.name,
                    packageCode: pkg.code,
                    packageName: pkg.name,
                    skus: lines,
                    goodsAmount: createMoney(amount),
                    serviceFee: createMoney(payable - amount),
                    amount: createMoney(payable),
                    installmentCode: plan.code,
                    installmentName: plan.name,
                    repayCycle: plan.repayCycle,
                    repayMethod: plan.repayMethod,
                    repayPeriod: isRatio ? '' : String(createState.period),
                    settleRatios: ratios ? JSON.parse(JSON.stringify(ratios)) : [],
                    status: '待接单',
                    quotaHeld: false,
                    creator: CREATE_OPERATOR,
                    createdAt: now,
                    updater: CREATE_OPERATOR,
                    updatedAt: now,
                    logs: [{ time: now, operator: CREATE_OPERATOR, content: '平台代门店发布需求单' }]
                };
                if (typeof dataApi.occupyDemandQuota === 'function') dataApi.occupyDemandQuota(created);
                all.unshift(created);
                dataApi.save(all);
                var done = '需求已发布，已进入待接单';
                createState.publishing = false;
                createOpen.value = false;
                refreshTable();
                if (ElMessage) ElMessage.success(done);
            }

            document.addEventListener('visibilitychange', function () {
                if (document.visibilityState === 'visible') refreshTable();
            });
            window.addEventListener('focus', refreshTable);
            window.setInterval(refreshTable, 30000);

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
                canGoSign: canGoSign,
                goSign: goSign,
                canVoid: canVoid,
                voidDemand: voidDemand,
                canRepublish: canRepublish,
                republishDemand: republishDemand,
                refreshTable: refreshTable,
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
