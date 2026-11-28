/* 全部门店的每日付款。 */
(function () {
    var dailyApi = window.RbtDailyFulfill;

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
        return { list: rows.slice(start, start + size), total: rows.length };
    }

    function yuan(value) {
        return blank(value) ? '—' : ('¥' + value);
    }

    var reactive = OctopusPrototype.reactive;
    var ref = OctopusPrototype.ref;
    var computed = OctopusPrototype.computed;

    OctopusPrototype.mount({
        setup: function () {
            function productOptions() {
                var names = [];
                function add(name) {
                    var text = String(name || '').trim();
                    if (!text || names.indexOf(text) >= 0) return;
                    names.push(text);
                }
                var stored = [];
                try {
                    var raw = sessionStorage.getItem('rbt_installment_v3');
                    var list = raw ? JSON.parse(raw) : null;
                    if (Array.isArray(list)) stored = list;
                } catch (e) {}
                if (stored.length) {
                    stored.forEach(function (item) {
                        if (item && item.enabled !== false) add(item.name);
                    });
                } else {
                    ['开业铺货日结', '开业铺货加价', '开业铺货轻量', '门店形象日结', '开业运营日结'].forEach(add);
                }
                var demands = window.RbtDemandData && window.RbtDemandData.list ? window.RbtDemandData.list() : [];
                demands.forEach(function (item) { add(item && item.installmentName); });
                return names.map(function (name) { return { label: name, value: name }; });
            }

            function moneyFormatter(row, column, cellValue) {
                return yuan(cellValue);
            }

            function ratioFormatter(row, column, cellValue) {
                return blank(cellValue) ? '—' : cellValue;
            }

            function textFormatter(row, column, cellValue) {
                return blank(cellValue) ? '—' : cellValue;
            }

            function matchDaily(row, params) {
                if (!includesText(row.date, params.date)) return false;
                if (!includesText(row.storeName, params.storeName) && !includesText(row.storeCode, params.storeName)) return false;
                if (!includesText(row.demandCode, params.demandCode)) return false;
                if (!blank(params.installmentName) && row.installmentName !== params.installmentName) return false;
                if (!blank(params.payeeRole) && row.payeeRole !== params.payeeRole) return false;
                if (!blank(params.channel) && row.channel !== params.channel) return false;
                if (!blank(params.settleStatus) && row.settleStatus !== params.settleStatus) return false;
                if (!includesText(row.payNo, params.payNo)) return false;
                if (!includesText(row.channelFlow, params.channelFlow)) return false;
                return true;
            }

            function productOf(code) {
                var api = window.RbtDemandData;
                var item = api && api.get ? api.get(code) : null;
                return {
                    installmentName: item && item.installmentName ? item.installmentName : '',
                    installmentCode: item && item.installmentCode ? item.installmentCode : ''
                };
            }

            function collectRows(params) {
                var source = dailyApi && dailyApi.partyRows ? dailyApi.partyRows() : [];
                return source.map(function (row) {
                    var product = productOf(row.demandCode);
                    return {
                        id: row.id,
                        date: row.date,
                        storeName: row.storeName,
                        storeCode: row.storeCode,
                        demandCode: row.demandCode,
                        installmentName: product.installmentName,
                        installmentCode: product.installmentCode,
                        payeeRole: row.payeeRole || '',
                        payeeName: row.payeeName || '',
                        channel: row.channel,
                        payWay: row.payWay || row.channel,
                        payAccount: row.payAccount || '',
                        payNo: row.payNo || '',
                        settleStatus: row.settleStatus || '',
                        channelFlow: row.channelFlow || '',
                        turnover: row.turnover,
                        commission: row.commission,
                        incomePos: row.incomePos,
                        incomeLive: row.incomeLive,
                        incomeMall: row.incomeMall,
                        ratioPos: row.ratioPos,
                        ratioLive: row.ratioLive,
                        ratioMall: row.ratioMall,
                        due: row.due,
                        duePos: row.duePos,
                        dueLive: row.dueLive,
                        dueMall: row.dueMall,
                        actual: row.actual,
                        payMethod: row.payMethod || (row.kind === 'fee' ? '放款划拨' : ((dailyApi && dailyApi.autoPayMethod) || '营业收入自动扣款')),
                        settleAmount: row.settleAmount,
                        goodsPay: row.goodsPay,
                        feePay: row.feePay,
                        kind: row.kind || ''
                    };
                }).filter(function (row) {
                    if (!matchDaily(row, params)) return false;
                    if (!includesText(row.payeeName, params.payeeName)) return false;
                    return true;
                });
            }

            function queryDate() {
                try {
                    var value = new URLSearchParams(window.location.search).get('date');
                    return value ? String(value).trim() : '';
                } catch (err) {
                    return '';
                }
            }

            var query = reactive({
                date: queryDate(),
                storeName: '',
                demandCode: '',
                installmentName: '',
                payeeRole: '',
                payeeName: '',
                channel: '',
                settleStatus: '',
                payNo: '',
                channelFlow: ''
            });
            var expanded = ref(false);
            var page = ref(1);
            var pageSize = ref(20);
            var pageSizes = [20, 50, 100, 200];
            var matched = ref(collectRows(query));
            var total = computed(function () { return matched.value.length; });
            var pageRows = computed(function () {
                return paginate(matched.value, { page: page.value, pageSize: pageSize.value }).list;
            });

            function search() {
                page.value = 1;
                matched.value = collectRows(query);
            }

            function reset() {
                query.date = '';
                query.storeName = '';
                query.demandCode = '';
                query.installmentName = '';
                query.payeeRole = '';
                query.payeeName = '';
                query.channel = '';
                query.settleStatus = '';
                query.payNo = '';
                query.channelFlow = '';
                search();
            }

            function toggleSearch() {
                expanded.value = !expanded.value;
            }

            function onPage(next) {
                page.value = next;
            }

            function onSize(next) {
                pageSize.value = next;
                page.value = 1;
            }

            function copyFlow(value) {
                var text = String(value || '').trim();
                if (!text) return;
                function done() {
                    if (typeof window.showToast === 'function') window.showToast('通道流水已复制', 'success');
                }
                function fallback() {
                    var input = document.createElement('textarea');
                    input.value = text;
                    input.setAttribute('readonly', 'readonly');
                    input.style.position = 'fixed';
                    input.style.left = '-9999px';
                    document.body.appendChild(input);
                    input.select();
                    try { document.execCommand('copy'); done(); } catch (e) {}
                    input.remove();
                }
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text).then(done).catch(fallback);
                    return;
                }
                fallback();
            }

            function demandOf(row) {
                var api = window.RbtDemandData;
                return api && api.get ? api.get(row && row.demandCode) : null;
            }

            function openDemand(row) {
                closeDay();
                var item = demandOf(row);
                if (item && window.RbtDemandDetail && typeof window.RbtDemandDetail.open === 'function') {
                    window.RbtDemandDetail.open(item);
                }
            }

            function esc(value) {
                return String(value == null || value === '' ? '—' : value)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;');
            }

            function moneyText(value) {
                return blank(value) ? '—' : ('¥' + value);
            }

            function dayOf(row) {
                var id = row && row.id;
                var source = dailyApi && dailyApi.partyRows ? dailyApi.partyRows() : [];
                var detail = (source.filter(function (item) { return item.id === id; })[0]) || row || {};
                var product = productOf(detail.demandCode);
                return {
                    date: detail.date || '',
                    payNo: detail.payNo || '',
                    settleStatus: detail.settleStatus || '',
                    channelFlow: detail.channelFlow || '',
                    channel: detail.channel || '',
                    payWay: detail.payWay || detail.channel || '',
                    payAccount: detail.payAccount || '',
                    kind: detail.kind || '',
                    storeName: detail.storeName || '',
                    storeCode: detail.storeCode || '',
                    demandCode: detail.demandCode || '',
                    installmentName: product.installmentName || '',
                    payeeRole: detail.payeeRole || '',
                    payeeName: detail.payeeName || '',
                    turnover: detail.turnover,
                    commission: detail.commission,
                    incomePos: detail.incomePos,
                    incomeLive: detail.incomeLive,
                    incomeMall: detail.incomeMall,
                    ratioPos: detail.ratioPos,
                    ratioLive: detail.ratioLive,
                    ratioMall: detail.ratioMall,
                    due: detail.due,
                    duePos: detail.duePos,
                    dueLive: detail.dueLive,
                    dueMall: detail.dueMall,
                    actual: detail.actual,
                    payMethod: detail.payMethod || (detail.kind === 'fee' ? '放款划拨' : ((dailyApi && dailyApi.autoPayMethod) || '营业收入自动扣款')),
                    settleAmount: detail.settleAmount,
                    goodsPay: detail.goodsPay,
                    feePay: detail.feePay
                };
            }

            function onDayKey(event) {
                if (event.key === 'Escape') closeDay();
            }

            function closeDay() {
                document.querySelectorAll('[data-rbt-day-drawer]').forEach(function (node) {
                    node.remove();
                });
                document.removeEventListener('keydown', onDayKey);
            }

            function field(label, value) {
                return '<div class="supplier-detail-cell"><div class="supplier-detail-cell__label">' + esc(label) +
                    '</div><div class="supplier-detail-cell__body">' + esc(value) + '</div></div>';
            }

            function channelBody(day) {
                if (day.channel !== '自动扣款') return '';
                var lines = [
                    ['POS', day.incomePos, day.ratioPos, day.duePos],
                    ['直播', day.incomeLive, day.ratioLive, day.dueLive],
                    ['商城', day.incomeMall, day.ratioMall, day.dueMall]
                ];
                return '<div class="supplier-detail-section-title">渠道</div>' +
                    '<table class="rbt-day-table"><thead><tr><th>渠道</th><th class="is-money">所得收入</th><th class="is-money">结算比例</th><th class="is-money">应付</th></tr></thead><tbody>' +
                    lines.map(function (line) {
                        return '<tr><td>' + esc(line[0]) + '</td><td class="is-money">' + esc(moneyText(line[1])) +
                            '</td><td class="is-money">' + esc(blank(line[2]) ? '—' : line[2]) +
                            '</td><td class="is-money">' + esc(moneyText(line[3])) + '</td></tr>';
                    }).join('') +
                    '<tr><td>合计</td><td class="is-money">' + esc(moneyText(day.commission)) +
                    '</td><td class="is-money">—</td><td class="is-money">' + esc(moneyText(day.due)) + '</td></tr>' +
                    '</tbody></table>';
            }

            function dayNote(day) {
                if (day.payeeRole === '冷丰') {
                    return '贸易商把货款打给冷丰供应链。采购、转给服务商之后，剩下的货款差额记在这笔货款上。不进门店每日还款。';
                }
                if (day.payeeRole === '服务商' || day.channel === '放款划拨') {
                    return '冷丰供应链收到贸易商货款后，把服务商这笔转出去，记在服务费。不进门店每日还款。';
                }
                if (day.settleStatus === '结款失败') return '付款子单已生成。提交汇付时失败，没有通道流水、实际付款和结款。';
                if (day.settleStatus === '在途') return '付款子单已生成，并据此发起付款申请。钱还在途，到账后才有通道流水、实际付款和结款。';
                return '这笔实付整笔结给贸易商，全部记在货款，不拆服务费。';
            }

            /* 查看这一条结款，不打开需求单。 */
            function openDay(row) {
                var day = dayOf(row);
                closeDay();
                var backdrop = document.createElement('div');
                backdrop.className = 'store-drawer-backdrop';
                backdrop.setAttribute('data-rbt-day-drawer', '1');
                var drawer = document.createElement('aside');
                drawer.className = 'store-drawer store-drawer--interactive';
                drawer.setAttribute('data-rbt-day-drawer', '1');
                drawer.setAttribute('role', 'dialog');
                drawer.setAttribute('aria-modal', 'true');
                drawer.setAttribute('aria-label', '付款明细');
                drawer.innerHTML =
                    '<div class="store-drawer__header"><h2 class="store-drawer__title">付款明细</h2>' +
                    '<button type="button" class="store-drawer__close" data-rbt-day-close aria-label="关闭">&times;</button></div>' +
                    '<div class="store-drawer__body"><div class="rbt-day-sheet">' +
                    '<div class="supplier-detail-grid">' +
                    field('日期', day.date) +
                    field('付款子单号', day.payNo) +
                    field('结款状态', day.settleStatus) +
                    field('通道流水', day.channelFlow) +
                    field('角色', day.payeeRole) +
                    field('收款方名称', day.payeeName) +
                    field('支付方式', day.payWay || day.channel) +
                    field('付款账户', day.payAccount) +
                    field('门店', (day.storeName || '—') + '（' + (day.storeCode || '—') + '）') +
                    field('需求单号', day.demandCode) +
                    field('产品', day.installmentName) +
                    field('营业流水', moneyText(day.turnover)) +
                    field('所得收入', moneyText(day.commission)) +
                    field('应付', moneyText(day.due)) +
                    field('实际付款', moneyText(day.actual)) +
                    field('已结', moneyText(day.settleAmount)) +
                    field('货款', moneyText(day.goodsPay)) +
                    field('服务费', moneyText(day.feePay)) +
                    '</div>' +
                    channelBody(day) +
                    '<p class="rbt-day-note">' + esc(dayNote(day)) + '</p>' +
                    '</div></div>';
                document.body.appendChild(backdrop);
                document.body.appendChild(drawer);
                backdrop.addEventListener('click', closeDay);
                drawer.querySelector('[data-rbt-day-close]').addEventListener('click', closeDay);
                document.addEventListener('keydown', onDayKey);
            }

            return {
                query: query,
                expanded: expanded,
                productOptions: productOptions(),
                page: page,
                pageSize: pageSize,
                pageSizes: pageSizes,
                total: total,
                pageRows: pageRows,
                search: search,
                reset: reset,
                toggleSearch: toggleSearch,
                onPage: onPage,
                onSize: onSize,
                copyFlow: copyFlow,
                moneyFormatter: moneyFormatter,
                ratioFormatter: ratioFormatter,
                textFormatter: textFormatter,
                openDemand: openDemand,
                openDay: openDay
            };
        }
    }, '#rbtDailyApp', {
        services: {},
        warehouse: { warehouseId: 'demo', warehouseCode: 'DEMO', warehouseName: '演示仓库' },
        permissions: [],
        layoutDensity: 'default'
    });
})();
