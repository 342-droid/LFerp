/* 门店端登录后查看本店需求。发布需求入口已隐藏，由平台在需求单管理代门店新建。 */
(function () {
    var PACKAGE_KEY = 'rbt_product_package_v2';
    var DEMAND_KEY = 'rbt_h5_fund_demand_v2';
    var INSTALLMENT_KEY = 'rbt_installment_v3';
    var SKUS = {
        SKU10001: { name: '库尔勒香梨 4kg', barcode: '6901234567001', unit: '箱', spec: '4kg', salePrice: '56.80' },
        SKU10002: { name: '精品黄瓜 2kg', barcode: '6901234567002', unit: '箱', spec: '2kg', salePrice: '22.80' },
        SKU10003: { name: '冷鲜牛腩 1kg', barcode: '6901234567003', unit: '件', spec: '1kg', salePrice: '78.00' },
        SKU10004: { name: '山东土豆 5kg', barcode: '6901234567004', unit: '袋', spec: '5kg', salePrice: '28.90' },
        SKU10005: { name: '云南小番茄 1kg', barcode: '6901234567005', unit: '箱', spec: '1kg', salePrice: '18.50' },
        SKU10006: { name: '新西兰奇异果 12粒', barcode: '6901234567006', unit: '盒', spec: '12粒', salePrice: '49.90' },
        SKU10007: { name: '冷冻鸡中翅 2kg', barcode: '6901234567007', unit: '袋', spec: '2kg', salePrice: '62.00' },
        SKU10008: { name: '江西紫薯 3kg', barcode: '6901234567008', unit: '箱', spec: '3kg', salePrice: '26.80' },
        SKU10009: { name: '东北黑木耳 500g', barcode: '6901234567009', unit: '袋', spec: '500g', salePrice: '39.90' },
        SKU10010: { name: '福建空心菜 400g', barcode: '6901234567010', unit: '把', spec: '400g', salePrice: '9.90' },
        SKU10011: { name: '冷鲜猪里脊 1kg', barcode: '6901234567011', unit: '件', spec: '1kg', salePrice: '52.80' },
        SKU10012: { name: '海南贝贝南瓜 2kg', barcode: '6901234567012', unit: '箱', spec: '2kg', salePrice: '24.90' },
        SKU20001: { name: '汉言首批铺货', barcode: '6901234568001', unit: '套', spec: '首批到店', salePrice: '22000.00' },
        SKU20002: { name: '门店设备辅料包', barcode: '6901234568002', unit: '套', spec: '开业配置', salePrice: '16000.00' },
        SKU20003: { name: '门店拉新人力', barcode: '6901234568003', unit: '项', spec: '驻店拉新', salePrice: '12000.00' },
        SKU20004: { name: '开业拉新物料', barcode: '6901234568004', unit: '份', spec: '300份', salePrice: '30.00' },
        SKU20005: { name: '门头招牌及店内品宣', barcode: '6901234568005', unit: '项', spec: '门头及店内', salePrice: '18000.00' },
        SKU20006: { name: '门店监控套装', barcode: '6901234568006', unit: '套', spec: '店内监控', salePrice: '13000.00' },
        SKU20007: { name: 'POS及会员管理系统', barcode: '6901234568007', unit: '套', spec: '含会员管理', salePrice: '12000.00' },
        SKU20008: { name: '抖音本地生活投放', barcode: '6901234568008', unit: '项', spec: '本地生活', salePrice: '10000.00' },
        SKU20009: { name: '开业督导服务', barcode: '6901234568009', unit: '项', spec: '开业辅导', salePrice: '8000.00' }
    };
    /* 与商品包种子一致：铺货 50000、形象 40000、运营 30000。拉新物料 300 份，行都不可改、不可删。 */
    var SEED_PACKAGES = [
        { code: 'SPB00001', name: '汉言开业铺货包', scopeType: 'tag', tagIds: ['rbt-open-stock'], storeCodes: [], skus: [{ code: 'SKU20001', salePrice: '22000.00', qty: 1, canEdit: '否', canDelete: '否' }, { code: 'SKU20002', salePrice: '16000.00', qty: 1, canEdit: '否', canDelete: '否' }, { code: 'SKU20003', salePrice: '12000.00', qty: 1, canEdit: '否', canDelete: '否' }] },
        { code: 'SPB00002', name: '门店形象配置包', scopeType: 'tag', tagIds: ['rbt-store-image'], storeCodes: [], skus: [{ code: 'SKU20004', salePrice: '30.00', qty: 300, canEdit: '否', canDelete: '否' }, { code: 'SKU20005', salePrice: '18000.00', qty: 1, canEdit: '否', canDelete: '否' }, { code: 'SKU20006', salePrice: '13000.00', qty: 1, canEdit: '否', canDelete: '否' }] },
        { code: 'SPB00003', name: '开业运营服务包', scopeType: 'store', tagIds: [], storeCodes: ['ONS00003'], skus: [{ code: 'SKU20007', salePrice: '12000.00', qty: 1, canEdit: '否', canDelete: '否' }, { code: 'SKU20008', salePrice: '10000.00', qty: 1, canEdit: '否', canDelete: '否' }, { code: 'SKU20009', salePrice: '8000.00', qty: 1, canEdit: '否', canDelete: '否' }] }
    ];
    var BIZ_LINE_STORES = {
        '餐饮': ['ONS00001', 'ONS00004'],
        '康美': ['ONS00002'],
        '纯私域': ['ONS00003'],
        '集团内部': ['ONS00005']
    };
    var SEED_STORES = {
        SPB00001: ['ONS00001', 'ONS00004'],
        SPB00002: ['ONS00002'],
        SPB00003: ['ONS00003']
    };
    /* 主链路：待接单 → 待确认签约 → 待签署 → 发货中 → 门店付款中 → 已完成。签完进入发货中。 */
    var DEMAND_STATUSES = ['待接单', '待确认签约', '待重新确认', '待签署', '发货中', '门店付款中', '已完成'];
    var ACTIVE_DEMAND_STATUSES = ['待接单', '待确认签约', '待重新确认', '待签署', '发货中', '门店付款中', '已完成'];
    var CANCELABLE_DEMAND_STATUSES = [];
    var CLOSED_DEMAND_STATUSES = ['已作废', '已驳回'];
    var STATUS_MIGRATE = {
        '已发布': '待接单',
        '待报价': '待接单',
        '待审核': '待接单',
        '已报价': '待接单',
        '待还款': '门店付款中',
        '支付中': '门店付款中',
        '还款中': '门店付款中',
        '付款中': '门店付款中',
        '待支付': '门店付款中',
        '待付款': '门店付款中',
        '已取消': '已作废'
    };

    var account = null;
    var screen = 'list';
    var tab = 'home';
    var repayFilter = 'pending';
    var billCode = '';
    var billTab = 'base';
    var signCode = '';
    var receiveCode = '';
    var detailCode = '';
    var detailFocusShip = false;
    var packageCode = '';
    var pickedQty = {};
    var repayCycle = '';
    var repayMethod = '';
    var repayPeriod = '';
    var QTY_MAX = 999;
    var CYCLE_ORDER = ['日结'];
    var METHOD_ORDER = ['比例付'];

    function toast(message) {
        var node = document.getElementById('rbtH5Toast');
        if (!node) return;
        node.textContent = message;
        node.classList.add('is-on');
        clearTimeout(toast._t);
        toast._t = setTimeout(function () { node.classList.remove('is-on'); }, 2200);
    }

    function esc(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function pad(n) {
        return n < 10 ? '0' + n : String(n);
    }

    function nowText() {
        var d = new Date();
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' +
            pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }

    function money(value) {
        var amount = Number(value);
        if (!isFinite(amount)) return '0.00';
        return amount.toFixed(2);
    }

    function readJson(key) {
        try {
            var raw = sessionStorage.getItem(key);
            var list = raw ? JSON.parse(raw) : null;
            return Array.isArray(list) ? list : null;
        } catch (e) {
            return null;
        }
    }

    function skuLine(item) {
        var code = typeof item === 'string' ? item : item && item.code;
        var known = SKUS[code] || {};
        var sale = item && item.salePrice !== undefined && item.salePrice !== '' ? item.salePrice : known.salePrice;
        var qty = item && item.qty != null && item.qty !== '' ? item.qty : 1;
        return {
            code: code,
            name: (item && item.name) || known.name || code || '—',
            barcode: (item && item.barcode) || known.barcode || '—',
            unit: (item && item.unit) || known.unit || '—',
            spec: (item && item.spec) || known.spec || '—',
            image: typeof getWmsSkuImage === 'function' ? getWmsSkuImage(code) : '',
            salePrice: money(sale),
            qty: qty,
            canEdit: item && item.canEdit ? item.canEdit : '否',
            canDelete: item && item.canDelete ? item.canDelete : '否'
        };
    }

    function codesFromBizLine(line) {
        var stores = window.RbtStoreData && window.RbtStoreData.list ? window.RbtStoreData.list() : [];
        var matched = stores.filter(function (store) {
            return store && store.bizLine === line && store.code;
        }).map(function (store) { return store.code; });
        if (matched.length) return matched;
        return (BIZ_LINE_STORES[line] || []).slice();
    }

    function ensureStores(item) {
        if (!item) return false;
        if (Array.isArray(item.storeCodes)) {
            if (!item.bizLine) return false;
            delete item.bizLine;
            return true;
        }
        item.storeCodes = item.bizLine
            ? codesFromBizLine(item.bizLine)
            : (SEED_STORES[item.code] || []).slice();
        delete item.bizLine;
        return true;
    }

    var DEMO_SCOPE = {
        SPB00001: { scopeType: 'tag', tagIds: ['rbt-open-stock'], stores: ['ONS00001', 'ONS00004'] },
        SPB00002: { scopeType: 'tag', tagIds: ['rbt-store-image'], stores: ['ONS00002'] },
        SPB00003: { scopeType: 'store', tagIds: [], stores: ['ONS00003'] }
    };

    function ensureScope(item) {
        if (!item || item.scopeType === 'store' || item.scopeType === 'tag') return false;
        var demo = DEMO_SCOPE[item.code];
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

    function packageMatchesStore(item, storeCode) {
        if (!item || !storeCode) return false;
        if (item.scopeType === 'tag') {
            var api = window.BusinessTagPrototypeStore;
            var bound = api && typeof api.getBinding === 'function' ? (api.getBinding('RBT_STORE', storeCode) || []) : [];
            return (item.tagIds || []).some(function (id) { return bound.indexOf(id) >= 0; });
        }
        return (item.storeCodes || []).indexOf(storeCode) >= 0;
    }

    function packages() {
        var list = readJson(PACKAGE_KEY);
        var source = list && list.length ? list : SEED_PACKAGES.slice();
        var changed = false;
        source.forEach(function (item) {
            if (ensureStores(item)) changed = true;
            if (ensureScope(item)) changed = true;
        });
        if (changed && list && list.length) sessionStorage.setItem(PACKAGE_KEY, JSON.stringify(source));
        var storeCode = account && account.code;
        return source.filter(function (item) {
            return item.enabled !== false && packageMatchesStore(item, storeCode);
        }).map(function (item) {
            return {
                code: item.code,
                name: item.name || item.code,
                skus: (item.skus || []).map(skuLine).filter(function (line) { return line.code; })
            };
        });
    }

    function findPackage(code) {
        var found = null;
        packages().some(function (item) {
            if (item.code === code) {
                found = item;
                return true;
            }
            return false;
        });
        return found;
    }

    function isActiveDemand(item) {
        return !!(item && ACTIVE_DEMAND_STATUSES.indexOf(item.status) >= 0);
    }

    function canCancelDemand(item) {
        return !!(item && CANCELABLE_DEMAND_STATUSES.indexOf(item.status) >= 0);
    }

    function demands() {
        if (window.RbtDemandData && typeof window.RbtDemandData.list === 'function') {
            return window.RbtDemandData.list();
        }
        var list = readJson(DEMAND_KEY) || [];
        var changed = false;
        list.forEach(function (item) {
            if (!item) return;
            if (STATUS_MIGRATE[item.status]) {
                item.status = STATUS_MIGRATE[item.status];
                changed = true;
                return;
            }
            if (DEMAND_STATUSES.indexOf(item.status) < 0 && CLOSED_DEMAND_STATUSES.indexOf(item.status) < 0) {
                item.status = '待接单';
                changed = true;
            }
        });
        if (changed) saveDemands(list);
        return list;
    }

    function saveDemands(list) {
        if (window.RbtDemandData && typeof window.RbtDemandData.save === 'function') {
            window.RbtDemandData.save(list);
            return;
        }
        sessionStorage.setItem(DEMAND_KEY, JSON.stringify(list));
    }

    /* 列表只保留当前门店作为需求门店的单据。 */
    function storeDemands() {
        if (!account) return [];
        return demands().filter(function (item) {
            return item && item.storeCode === account.code;
        });
    }

    function accountQuota() {
        var dataApi = window.RbtStoreData;
        if (!dataApi || !account || typeof dataApi.get !== 'function' || typeof dataApi.quotaOf !== 'function') {
            return null;
        }
        var store = dataApi.get(account.code);
        if (!store) return null;
        return dataApi.quotaOf(store);
    }

    /* 未结束的需求达到准入配置的需求次数后，不能再发布。已完成仍占次数。已作废、已驳回不占次数。 */
    function blockDemandCount() {
        var dataApi = window.RbtStoreData;
        var store = dataApi && account && typeof dataApi.get === 'function' ? dataApi.get(account.code) : null;
        var limit = dataApi && typeof dataApi.demandLimitOf === 'function' ? dataApi.demandLimitOf(store) : 1;
        var active = storeDemands().filter(function (item) {
            return ACTIVE_DEMAND_STATUSES.indexOf(item.status) >= 0;
        }).length;
        if (active >= limit) {
            toast('需求次数已达上限，无法发布需求');
            return true;
        }
        return false;
    }

    /* 门店准入保证金未缴纳，或还没选择时，不能发布。 */
    function blockUnpaidDeposit() {
        var dataApi = window.RbtStoreData;
        var store = dataApi && account && typeof dataApi.get === 'function' ? dataApi.get(account.code) : null;
        var paid = dataApi && typeof dataApi.depositPaidOf === 'function'
            ? dataApi.depositPaidOf(store)
            : !!(store && store.depositPaid === true);
        if (!paid) {
            toast('保证金未缴纳，无法发布需求');
            return true;
        }
        return false;
    }

    /* 有可用额度即可再发需求，同时受准入配置的需求次数限制。 */
    function blockNoAvailableQuota() {
        var quota = accountQuota();
        if (!quota || !(quota.available > 0)) {
            toast('可用额度不足，无法发布需求');
            return true;
        }
        return false;
    }

    function occupyDemandQuota(demand) {
        if (window.RbtDemandData && typeof window.RbtDemandData.occupyDemandQuota === 'function') {
            window.RbtDemandData.occupyDemandQuota(demand);
        }
    }

    function releaseDemandQuota(demand) {
        if (window.RbtDemandData && typeof window.RbtDemandData.releaseDemandQuota === 'function') {
            window.RbtDemandData.releaseDemandQuota(demand);
        }
    }

    function nextCode(list) {
        var max = 0;
        list.forEach(function (item) {
            var matched = String(item.code || '').match(/^XQ(\d+)$/);
            if (matched) max = Math.max(max, parseInt(matched[1], 10));
        });
        return 'XQ' + String(max + 1).padStart(5, '0');
    }

    function setHead(title) {
        var head = document.getElementById('rbtH5HeadText');
        var name = document.querySelector('.rbt-h5-phone__head h1');
        var storeName = account && account.name ? account.name : '门店端';
        if (name) {
            name.textContent = screen === 'list'
                ? '需求列表'
                : (screen === 'detail'
                    ? '需求详情'
                    : (screen === 'skus' ? '选择商品' : (screen === 'installment' ? '确认发布信息' : storeName)));
        }
        if (head) head.textContent = title;
    }

    function clearPicked() {
        pickedQty = {};
    }

    function qtyOf(code) {
        var qty = Number(pickedQty[code]);
        if (!isFinite(qty) || qty < 1) return 0;
        return Math.min(QTY_MAX, Math.floor(qty));
    }

    function isPicked(code) {
        return qtyOf(code) > 0;
    }

    function setQty(code, value) {
        var qty = Math.floor(Number(value));
        if (!isFinite(qty) || qty < 1) {
            delete pickedQty[code];
            return;
        }
        pickedQty[code] = Math.min(QTY_MAX, qty);
    }

    function selectedLines(pkg) {
        return (pkg.skus || []).filter(function (line) { return isPicked(line.code); }).map(function (line) {
            return {
                code: line.code,
                name: line.name,
                barcode: line.barcode,
                unit: line.unit,
                spec: line.spec,
                image: line.image,
                salePrice: line.salePrice,
                qty: qtyOf(line.code)
            };
        });
    }

    function sumLines(lines) {
        return lines.reduce(function (total, line) {
            return total + Number(line.salePrice) * (Number(line.qty) || 1);
        }, 0);
    }

    /* 卡片规格行按「1箱 4kg」展示，单位和规格都有才拼在一起。 */
    function skuPackText(line) {
        var unit = line && line.unit && line.unit !== '—' ? line.unit : '';
        var spec = line && line.spec && line.spec !== '—' ? line.spec : '';
        if (unit && spec) return '1' + unit + ' ' + spec;
        return unit || spec || '—';
    }

    function confirmChoice(options, current, kind) {
        var list = options || [];
        if (!list.length) return '—';
        if (list.length === 1) return esc(kind === 'period' ? list[0] + '期' : list[0]);
        return '<div class="rbt-h5-inst__chips">' + list.map(function (item) {
            var on = String(item) === String(current);
            var label = kind === 'period' ? item + '期' : item;
            var attr = kind === 'cycle' ? 'data-cycle' : (kind === 'method' ? 'data-method' : 'data-period');
            return '<button type="button" class="rbt-h5-chip' + (on ? ' is-on' : '') + '" ' + attr + '="' + esc(item) + '">' + esc(label) + '</button>';
        }).join('') + '</div>';
    }

    function confirmRow(label, valueHtml, emphasize) {
        return '<div class="rbt-confirm__row' + (emphasize ? ' is-total' : '') + '"><span>' + esc(label) + '</span><div class="rbt-confirm__value">' + valueHtml + '</div></div>';
    }

    function fillPublishBar(show) {
        var bar = document.getElementById('rbtH5PublishBar');
        if (!bar) return;
        bar.hidden = !show;
        if (show && !bar.querySelector('[data-publish]')) {
            bar.innerHTML = '<button type="button" class="rbt-publish-bar__btn" data-publish>确认发布</button>';
        }
    }

    function fillSkuBar(pkg, allOn, kindCount, pieceCount) {
        var bar = document.getElementById('rbtH5SkuBar');
        if (!bar) return;
        if (!pkg) {
            bar.hidden = true;
            bar.innerHTML = '';
            return;
        }
        var amount = money(sumLines(selectedLines(pkg)));
        bar.hidden = false;
        bar.innerHTML = '<label class="rbt-sku-bar__all"><input type="checkbox" data-all ' + (allOn ? 'checked' : '') + '><span>全选</span></label>' +
            '<div class="rbt-sku-bar__sum"><p>已选' + kindCount + '种 共' + pieceCount + '件</p>' +
            '<p>商品金额 <b>¥' + esc(amount) + '</b></p></div>' +
            '<button type="button" class="rbt-sku-bar__next" data-next>下一步</button>';
    }

    function cents(value) {
        var amount = Number(value);
        if (!isFinite(amount)) return NaN;
        return Math.round(amount * 100);
    }

    var DEMO_INSTALLMENTS = [
        {
            code: 'FQ00001', name: '开业铺货日结', repayCycle: '日结', periods: [],
            periodRatio: '10.00', storeRate: '1.60', repayMethod: '比例付',
            amountMin: '20.00', amountMax: '50000', packages: ['汉言开业铺货包']
        },
        {
            code: 'FQ00004', name: '开业铺货加价', repayCycle: '日结', periods: [],
            periodRatio: '10.00', storeRate: '1.70', repayMethod: '比例付',
            amountMin: '20.00', amountMax: '50000', packages: []
        },
        {
            code: 'FQ00005', name: '开业铺货轻量', repayCycle: '日结', periods: [],
            periodRatio: '10.00', storeRate: '1.30', repayMethod: '比例付',
            amountMin: '20.00', amountMax: '50000', packages: []
        },
        {
            code: 'FQ00002', name: '门店形象日结', repayCycle: '日结', periods: [],
            periodRatio: '8.00', storeRate: '1.80', repayMethod: '比例付',
            amountMin: '50.00', amountMax: '100000', packages: ['门店形象配置包']
        },
        {
            code: 'FQ00003', name: '开业运营日结', repayCycle: '日结', periods: [],
            periodRatio: '10.00', storeRate: '1.50', repayMethod: '比例付',
            amountMin: '5.00', amountMax: '30000', packages: ['开业运营服务包']
        }
    ];

    function orderedPeriods(value) {
        if (!Array.isArray(value)) return [];
        return value.map(function (item) { return String(item); }).filter(Boolean).sort(function (a, b) {
            return Number(a) - Number(b);
        });
    }

    function normalizeInstallment(item) {
        if (!item) return null;
        var sourceMethod = item.repayMethod || '比例付';
        var repayMethod = sourceMethod;
        if (repayMethod === '定额付' || repayMethod === '定额还' || repayMethod === '等额本息') repayMethod = '比例付';
        if (repayMethod === '比例还' || repayMethod === '等额本金') repayMethod = '比例付';
        var sourcePeriods = orderedPeriods(item.periods || []);
        var periods = repayMethod === '比例付' ? [] : sourcePeriods;
        var rates = item.periodRates && typeof item.periodRates === 'object' ? item.periodRates : {};
        var filled = {};
        periods.forEach(function (period) {
            var rate = rates[period];
            if (rate && typeof rate === 'object' && !Array.isArray(rate)) {
                rate = rate.store != null && rate.store !== '' ? rate.store : rate.trader;
            }
            filled[period] = rate == null || rate === '' ? '1.00' : String(rate);
        });
        var periodRatio = item.periodRatio;
        if (repayMethod === '比例付' && (periodRatio == null || periodRatio === '')) periodRatio = '10.00';
        return {
            code: item.code || '',
            name: item.name || item.code || '',
            repayCycle: (function () {
                var cycle = item.repayCycle || '日结';
                if (cycle === '日还' || cycle === '周还' || cycle === '月还' || cycle === '年还' || cycle === '日付') cycle = '日结';
                return cycle;
            })(),
            periods: periods,
            periodRates: filled,
            periodRatio: periodRatio == null || periodRatio === '' ? '' : String(periodRatio),
            storeRate: (function () {
                if (item.storeRate != null && item.storeRate !== '') return String(item.storeRate);
                if (repayMethod !== '比例付') return '';
                var first = sourcePeriods.length ? rates[sourcePeriods[0]] : null;
                if (first && typeof first === 'object' && !Array.isArray(first)) {
                    first = first.store != null && first.store !== '' ? first.store : first.trader;
                }
                return first == null || first === '' ? '' : String(first);
            })(),
            repayMethod: repayMethod,
            amountMin: item.amountMin,
            amountMax: item.amountMax,
            packages: Array.isArray(item.packages) ? item.packages.slice() : [],
            settleRatios: Array.isArray(item.settleRatios) ? JSON.parse(JSON.stringify(item.settleRatios)) : []
        };
    }

    /* 比例付发布时抄产品上的渠道比例。产品还没单独维护时，用该产品的默认比例补三个渠道。 */
    function channelRatiosOf(plan) {
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

    function periodsFieldLabel(method) {
        return method === '比例付' ? '结算比例' : '结算期数';
    }

    function periodRatioText(plan) {
        if (!plan || plan.periodRatio == null || plan.periodRatio === '') return '—';
        var num = Number(plan.periodRatio);
        if (!isFinite(num)) return '—';
        return num.toFixed(2) + '%';
    }

    /* 启用中的分期配置。适用商品包按商品包名称或编码匹配。刷新后没有缓存时用初始分期。 */
    function enabledInstallments() {
        var list = readJson(INSTALLMENT_KEY);
        if (!list || !list.length) {
            list = DEMO_INSTALLMENTS.map(function (item) {
                return JSON.parse(JSON.stringify(item));
            });
        }
        var exists = {};
        list.forEach(function (item) {
            if (item && item.code) exists[item.code] = true;
        });
        var changed = false;
        DEMO_INSTALLMENTS.forEach(function (item) {
            if (exists[item.code]) return;
            list.push(JSON.parse(JSON.stringify(item)));
            exists[item.code] = true;
            changed = true;
        });
        var floors = {
            FQ00001: { '1000': '20.00', '1000.00': '20.00' },
            FQ00002: { '5000': '50.00', '5000.00': '50.00' },
            FQ00003: { '500': '5.00', '500.00': '5.00' }
        };
        list.forEach(function (item) {
            var next = item && floors[item.code] && floors[item.code][String(item.amountMin)];
            if (next) {
                item.amountMin = next;
                changed = true;
            }
            if (item && (item.repayCycle === '日付' || item.repayCycle === '日还' || item.repayCycle === '周还' || item.repayCycle === '月还' || item.repayCycle === '年还' || !item.repayCycle)) {
                item.repayCycle = '日结';
                changed = true;
            }
            var productRename = {
                FQ00001: { '生鲜周转分期': '开业铺货日结' },
                FQ00004: { '生鲜周转周还': '开业铺货加价', '生鲜周转比例付': '开业铺货加价' },
                FQ00005: { '生鲜周转日结': '开业铺货轻量', '生鲜周转日付': '开业铺货轻量' },
                FQ00002: { '肉类备货分期': '门店形象日结' },
                FQ00003: { '果蔬短周期': '开业运营日结' }
            };
            var nextName = item && productRename[item.code] && productRename[item.code][item.name];
            if (nextName) {
                item.name = nextName;
                changed = true;
            }
            if (item && item.code === 'FQ00003' && (String(item.amountMax) === '20000' || String(item.amountMax) === '20000.00')) {
                item.amountMax = '30000';
                changed = true;
            }
            /* 加价、轻量在产品配置里不挂商品包。旧演示曾把铺货包挂上去，这里只清掉这一条。 */
            if (item && (item.code === 'FQ00004' || item.code === 'FQ00005')) {
                var pkgs = item.packages || [];
                if (pkgs.length === 1 && (pkgs[0] === '汉言开业铺货包' || pkgs[0] === '周末生鲜包')) {
                    item.packages = [];
                    changed = true;
                }
            }
        });
        if (changed) sessionStorage.setItem(INSTALLMENT_KEY, JSON.stringify(list));
        return list.filter(function (item) { return item && item.enabled !== false; }).map(normalizeInstallment).filter(Boolean);
    }

    function installmentCoversPackage(plan, pkg) {
        var names = plan.packages || [];
        return names.indexOf(pkg.name) >= 0 || names.indexOf(pkg.code) >= 0;
    }

    function amountInPlan(plan, amount) {
        var min = cents(plan.amountMin);
        var max = cents(plan.amountMax);
        var value = cents(amount);
        if (!isFinite(min) || !isFinite(max) || !isFinite(value)) return false;
        return value >= min && value <= max;
    }

    function matchedInstallments(pkg, amount) {
        return enabledInstallments().filter(function (plan) {
            return installmentCoversPackage(plan, pkg) && amountInPlan(plan, amount);
        });
    }

    /* 所选商品包需已配置启用的分期，且所选商品售价合计落在其中一条分期的货款区间内。 */
    function publishInstallmentError(pkg, lines) {
        var matched = enabledInstallments().filter(function (plan) {
            return installmentCoversPackage(plan, pkg);
        });
        if (!matched.length) return '商品未关联产品配置';
        var amount = sumLines(lines);
        var covered = matched.some(function (plan) { return amountInPlan(plan, amount); });
        if (!covered) return '售价不在产品配置的货款区间内';
        return '';
    }

    function clearInstallmentChoice() {
        repayCycle = '';
        repayMethod = '';
        repayPeriod = '';
    }

    function availableCycles(plans) {
        var seen = {};
        plans.forEach(function (plan) {
            if (plan.repayCycle) seen[plan.repayCycle] = true;
        });
        return CYCLE_ORDER.filter(function (cycle) { return seen[cycle]; });
    }

    function availableMethods(plans, cycle) {
        var seen = {};
        plans.forEach(function (plan) {
            if (plan.repayCycle === cycle && plan.repayMethod) seen[plan.repayMethod] = true;
        });
        return METHOD_ORDER.filter(function (method) { return seen[method]; });
    }

    function planByCycleAndMethod(plans, cycle, method) {
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

    function ensureInstallmentChoice(plans) {
        var cycles = availableCycles(plans);
        if (!cycles.length) {
            clearInstallmentChoice();
            return null;
        }
        if (cycles.indexOf(repayCycle) < 0) {
            repayCycle = cycles.indexOf('日结') >= 0 ? '日结' : cycles[0];
        }
        var methods = availableMethods(plans, repayCycle);
        if (!methods.length) {
            repayMethod = '';
            repayPeriod = '';
            return null;
        }
        if (methods.indexOf(repayMethod) < 0) repayMethod = methods[0];
        var plan = planByCycleAndMethod(plans, repayCycle, repayMethod);
        var periods = plan ? plan.periods : [];
        if (!periods.length) {
            repayPeriod = '';
            return plan;
        }
        if (periods.indexOf(String(repayPeriod)) < 0) repayPeriod = periods[0];
        return plan;
    }

    function roundMoney(value) {
        return Math.round(Number(value) * 100) / 100;
    }

    /* 门店倍率：定额付取当期倍率，比例付取直接门店倍率。 */
    function storeRateOf(plan, period) {
        if (!plan) return 1;
        var rate;
        if (plan.repayMethod === '比例付') rate = Number(plan.storeRate);
        else rate = Number((plan.periodRates || {})[String(period)] || 0);
        if (!isFinite(rate) || rate <= 0) return 1;
        return rate;
    }

    /* 总金额 = 商品售价合计 × 门店倍率。 */
    function payableAmount(principal, plan, period) {
        var P = Number(principal);
        if (!isFinite(P) || P <= 0) return null;
        return roundMoney(P * storeRateOf(plan, period));
    }

    /* 定额付预估每日结算货款：总金额（已含门店倍率）÷ 结算期数。 */
    function estimateDailyPay(principal, plan, period) {
        var n = Number(period);
        var total = payableAmount(principal, plan, period);
        if (!isFinite(n) || n < 1 || total == null) return null;
        return money(roundMoney(total / n));
    }

    function yuanText(value) {
        var text = String(value == null ? '' : value).trim();
        if (!text || text === '—') return '—';
        return text.charAt(0) === '¥' ? text : '¥' + text;
    }

    function ratioPercent(value) {
        var num = Number(String(value == null ? '' : value).replace(/%/g, ''));
        if (!isFinite(num)) return '';
        return num.toFixed(2) + '%';
    }

    function demandCell(label, value) {
        return '<div class="rbt-demand__cell"><span>' + esc(label) + '</span><b>' + esc(value || '—') + '</b></div>';
    }

    function skuQtyText(line) {
        var qty = Number(line && line.qty);
        if (!isFinite(qty) || qty < 1) qty = 1;
        return (line.name || '—') + '×' + qty;
    }

    function listRatioLine(item) {
        if (!item || item.repayMethod !== '比例付' || !item.settleRatios || !item.settleRatios.length) return '';
        return item.settleRatios.map(function (channel) {
            var percent = ratioPercent(channel && channel.fallback);
            var text = (channel && channel.channel ? channel.channel : '渠道') + ' 完成 ' + (percent || '—');
            var subs = (channel && channel.subs || []).map(function (sub) {
                var subPercent = ratioPercent(sub && sub.ratio);
                return sub && sub.name && subPercent ? sub.name + ' ' + subPercent : '';
            }).filter(Boolean);
            return subs.length ? text + '（' + subs.join('，') + '）' : text;
        }).join('；');
    }

    function renderDemand(item, withCancel) {
        var cancel = withCancel && canCancelDemand(item) && item.storeCode === account.code
            ? '<button type="button" class="rbt-demand__cancel" data-cancel="' + esc(item.code) + '">取消需求</button>'
            : '';
        var sign = item.status === '待签署'
            ? '<button type="button" class="rbt-demand__cancel" data-sign="' + esc(item.code) + '">去签署</button>'
            : '';
        var receive = item.status === '发货中'
            ? '<button type="button" class="rbt-demand__cancel" data-open-ship="' + esc(item.code) + '">确认收货</button>'
            : '';
        var storeLine = item.storeCode !== account.code
            ? '需求门店 ' + (item.storeName || '—')
            : '';
        var shownPhase = fulfillPhase(item);
        var statusClass = shownPhase === '已完成'
            ? ' is-done'
            : (CLOSED_DEMAND_STATUSES.indexOf(item.status) >= 0 ? ' is-off' : '');
        var names = (item.skus || []).map(skuQtyText).join('、') || '—';
        var ratio = listRatioLine(item);
        var extra = ratio
            ? '<div class="rbt-demand__block"><span>结算比例</span><p>' + esc(ratio) + '</p></div>'
            : (item.repayMethod && item.repayMethod !== '比例付'
                ? '<div class="rbt-demand__block"><span>结算期数</span><p>' + esc(item.repayPeriod || '—') + '期</p></div>'
                : '');
        var view = repayView(item);
        var split = fulfillSplit(view && view._days);
        var hasDays = view && view._days && view._days.length;
        var fulfillBlock = '<div class="rbt-demand__block"><span>预计履行</span><p>' + esc(hasDays ? ('¥' + money(split.estimate) + '。结算单未确定，售后还可能改金额，只是预估。') : '未计算。还没有营业流水。') + '</p></div>' +
            '<div class="rbt-demand__block"><span>应履约</span><p>' + esc(hasDays ? ('¥' + money(split.due) + '。结算单已确定，尚未结款。') : '未产生。结算单未确定。') + '</p></div>';
        return '<article class="rbt-demand" data-demand="' + esc(item.code) + '">' +
            '<div class="rbt-demand__top"><h2 class="rbt-demand__name">' + esc(item.packageName || '—') + '</h2>' +
            '<span class="rbt-demand__status' + statusClass + '">' + esc(shownPhase || item.status || '—') + '</span></div>' +
            '<p class="rbt-demand__meta">' + esc(item.code || '—') + ' · ' + esc(item.packageCode || '—') + '</p>' +
            (storeLine ? '<p class="rbt-demand__meta">' + esc(storeLine) + '</p>' : '') +
            '<div class="rbt-demand__total"><span>商品金额</span><b>' + esc(yuanText(item.goodsAmount)) + '</b></div>' +
            '<div class="rbt-demand__grid">' +
            demandCell('结算周期', item.repayCycle || '—') +
            demandCell('结算方式', item.repayMethod || '—') +
            '</div>' +
            '<div class="rbt-demand__block"><span>商品</span><p>' + esc(names) + '</p></div>' +
            extra +
            fulfillBlock +
            '<div class="rbt-demand__foot"><span class="rbt-demand__time">创建时间 ' + esc(item.createdAt || '—') + '</span>' +
            (receive || sign || cancel) +
            '</div></article>';
    }

    function skuLineAmount(line) {
        var qty = Number(line && line.qty);
        var price = Number(line && line.salePrice);
        if (!isFinite(qty) || qty < 1) qty = 1;
        if (!isFinite(price)) return '—';
        return yuanText(money(roundMoney(price * qty)));
    }

    function renderDemandSkus(item) {
        var lines = (item && item.skus) || [];
        if (!lines.length) return '<p class="rbt-demand-sheet__empty">暂无商品</p>';
        return lines.map(function (line) {
            var qty = Number(line && line.qty);
            if (!isFinite(qty) || qty < 1) qty = 1;
            var price = line && line.salePrice != null && line.salePrice !== '' ? yuanText(money(line.salePrice)) : '—';
            var spec = [line && line.code, line && line.spec].filter(Boolean).join(' · ');
            return '<div class="rbt-demand-sku">' +
                '<div class="rbt-demand-sku__main"><strong>' + esc((line && (line.name || line.code)) || '—') + '</strong>' +
                '<p>' + esc(spec || '—') + '</p></div>' +
                '<div class="rbt-demand-sku__side"><b>' + esc(skuLineAmount(line)) + '</b><span>×' + qty + ' · ' + esc(price) + '</span></div>' +
                '</div>';
        }).join('');
    }

    function renderSettleDetail(item) {
        if (item && item.repayMethod === '比例付') {
            var rows = (item.settleRatios || []).map(function (channel) {
                var percent = ratioPercent(channel && channel.fallback) || '—';
                var subs = (channel && channel.subs || []).map(function (sub) {
                    var subPercent = ratioPercent(sub && sub.ratio);
                    return sub && sub.name && subPercent ? sub.name + ' ' + subPercent : '';
                }).filter(Boolean);
                return '<div class="rbt-demand-sku">' +
                    '<div class="rbt-demand-sku__main"><strong>' + esc((channel && channel.channel) || '渠道') + '</strong>' +
                    (subs.length ? '<p>' + esc(subs.join('，')) + '</p>' : '') +
                    '</div><div class="rbt-demand-sku__side"><b>' + esc(percent) + '</b><span>默认比例</span></div></div>';
            }).join('');
            return '<section class="rbt-demand-sheet"><h3>结算比例</h3>' +
                (rows || '<p class="rbt-demand-sheet__empty">暂无结算比例</p>') + '</section>';
        }
        if (item && item.repayMethod) {
            return '<section class="rbt-demand-sheet"><h3>结算期数</h3>' +
                '<p class="rbt-demand-sheet__text">' + esc(item.repayPeriod || '—') + '期</p></section>';
        }
        return '';
    }

    /* 发货记录跟在商品下面。发货中且尚未确认的记录可以确认收货，确认数量等于发货数量。 */
    function renderShipDetail(item) {
        var rows = (item && item.shipments) || [];
        var shipped = 0;
        rows.forEach(function (row) {
            shipped += Number(String(row && row.amount || '').replace(/[¥,]/g, '')) || 0;
        });
        var goods = Number(String(item && item.goodsAmount || '').replace(/[¥,]/g, '')) || 0;
        var over = rows.length && shipped - goods > 0.001;
        var canConfirm = item && item.status === '发货中';
        var body = rows.length
            ? rows.map(function (row) {
                var action = row.confirmed
                    ? '<p class="rbt-demand-ship__done">已确认 ' + esc(row.confirmQty || row.qty) + ' 件</p>'
                    : (canConfirm
                        ? '<button type="button" class="rbt-demand__cancel" data-confirm-recv="' + esc(row.id) + '">确认收货</button>'
                        : '<p class="rbt-demand-ship__done">待确认</p>');
                return '<div class="rbt-demand-ship">' +
                    '<div class="rbt-demand-ship__top"><strong>' + esc(row.name || '—') + '</strong>' +
                    '<span>' + (row.confirmed ? '已确认' : '待确认') + '</span></div>' +
                    '<p>发货数量 ' + esc(row.qty) + ' · 发货金额 ' + esc(yuanText(row.amount)) + '</p>' +
                    '<p>物流单号 ' + esc(row.logisticsNo || '—') + '</p>' +
                    (row.createdAt ? '<p>发货时间 ' + esc(row.createdAt) + '</p>' : '') +
                    action + '</div>';
            }).join('')
            : '<p class="rbt-demand-sheet__empty">暂无发货</p>';
        var voucher = item && item.supplementVoucher;
        var supplement = over
            ? '<div class="rbt-demand-ship rbt-demand-ship--extra"><strong>补缴凭证</strong><p>' +
                esc(voucher && voucher.name ? voucher.name : '待补缴') +
                '</p><label class="rbt-demand-ship__upload">上传凭证<input type="file" accept="image/*,.pdf" data-store-supplement hidden></label></div>'
            : '';
        return '<section class="rbt-demand-sheet' + (detailFocusShip ? ' is-focus' : '') + '" id="rbtDemandShip"><h3>发货信息</h3>' +
            body + supplement + '</section>';
    }

    function renderDemandDetail(item) {
        setHead('需求详情');
        var statusClass = item.status === '已完成'
            ? ' is-done'
            : (CLOSED_DEMAND_STATUSES.indexOf(item.status) >= 0 ? ' is-off' : '');
        return '<article class="rbt-demand">' +
            '<div class="rbt-demand__top"><h2 class="rbt-demand__name">' + esc(item.packageName || '—') + '</h2>' +
            '<span class="rbt-demand__status' + statusClass + '">' + esc(item.status || '—') + '</span></div>' +
            '<p class="rbt-demand__meta">' + esc(item.code || '—') + ' · ' + esc(item.packageCode || '—') + '</p>' +
            '<div class="rbt-demand__total"><span>商品金额</span><b>' + esc(yuanText(item.goodsAmount)) + '</b></div>' +
            '<div class="rbt-demand__grid">' +
            demandCell('结算周期', item.repayCycle || '—') +
            demandCell('结算方式', item.repayMethod || '—') +
            '</div>' +
            '<p class="rbt-demand__meta">创建时间 ' + esc(item.createdAt || '—') + '</p>' +
            (item.acceptedAt ? '<p class="rbt-demand__meta">接单时间 ' + esc(item.acceptedAt) + '</p>' : '') +
            '</article>' +
            '<section class="rbt-demand-sheet"><h3>商品</h3>' + renderDemandSkus(item) + '</section>' +
            renderShipDetail(item) +
            renderSettleDetail(item);
    }

    function toolIcon(svg, background) {
        return '<span class="rbt-h5-tool__icon" style="background:' + background + '">' + svg + '</span>';
    }

    function svgIcon(paths) {
        return '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">' + paths + '</svg>';
    }

    /* 首页菜单对齐丰银宝门店首页。除 RBT 外只展示，不跳转。 */
    function renderStoreHome() {
        var storeName = account && account.name ? account.name : '门店';
        var mark = storeName.slice(0, 1);
        var gold = 'linear-gradient(180deg,#ffd15c,#ffb020)';
        var red = 'linear-gradient(180deg,#ff7a59,#ff4d4f)';
        var orange = 'linear-gradient(180deg,#ff9a45,#ff7019)';
        var blue = 'linear-gradient(180deg,#5b9bff,#3b7cff)';
        var member = svgIcon('<rect x="4" y="4" width="6" height="6" rx="1" fill="#fff"/><rect x="14" y="4" width="6" height="6" rx="1" fill="#fff"/><rect x="4" y="14" width="6" height="6" rx="1" fill="#fff"/><rect x="14" y="14" width="3" height="3" rx=".5" fill="#fff"/><rect x="18" y="14" width="2" height="2" fill="#fff"/><rect x="14" y="18" width="2" height="2" fill="#fff"/><rect x="17" y="17" width="3" height="3" rx=".5" fill="#fff"/>');
        var live = svgIcon('<rect x="3" y="6" width="18" height="12" rx="2" stroke="#fff" stroke-width="1.8"/><path d="M10 9.5v5l4.5-2.5L10 9.5z" fill="#fff"/>');
        var order = svgIcon('<rect x="6" y="3.5" width="12" height="17" rx="2" stroke="#fff" stroke-width="1.8"/><path d="M9 8h6M9 12h6M9 16h4" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>');
        var receive = svgIcon('<path d="M4 7.5l8-3.5 8 3.5v9.2c0 .7-.4 1.3-1 1.6l-7 3.2-7-3.2c-.6-.3-1-.9-1-1.6V7.5z" stroke="#fff" stroke-width="1.6"/><path d="M8.5 12.2l2.2 2.2 4.8-5" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>');
        var purchase = svgIcon('<path d="M6 7h13l-1.4 8.2a2 2 0 0 1-2 1.6H9.2a2 2 0 0 1-2-1.6L6 7z" stroke="#fff" stroke-width="1.6"/><path d="M9 7L8 4H4" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><circle cx="10" cy="19" r="1.2" fill="#fff"/><circle cx="16" cy="19" r="1.2" fill="#fff"/>');
        var wallet = svgIcon('<rect x="3" y="6" width="18" height="13" rx="2" stroke="#fff" stroke-width="1.6"/><path d="M3 10h18" stroke="#fff" stroke-width="1.6"/><circle cx="16.5" cy="14.5" r="1.2" fill="#fff"/>');
        var biz = svgIcon('<path d="M8 9.5c0-2.2 1.6-4 4-4s4 1.8 4 4c0 1.4-.6 2.5-1.6 3.2-.6.4-1 .9-1.1 1.6h-2.6c-.1-.7-.5-1.2-1.1-1.6C8.6 12 8 10.9 8 9.5z" stroke="#fff" stroke-width="1.5"/><path d="M9 16.5h6M10.2 19h3.6" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>');
        var stock = svgIcon('<path d="M4 9.5L12 5l8 4.5v8L12 22l-8-4.5v-8z" stroke="#fff" stroke-width="1.6"/><circle cx="15.5" cy="15.5" r="2.2" stroke="#fff" stroke-width="1.4"/><path d="M17.2 17.2L19 19" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>');
        var aftersale = svgIcon('<path d="M7 8H5.5A2.5 2.5 0 0 0 3 10.5V17a2 2 0 0 0 2 2h8" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><path d="M7 8l2.2-2.2M7 8l2.2 2.2" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><rect x="9" y="8" width="12" height="10" rx="2" stroke="#fff" stroke-width="1.6"/>');
        var onboard = svgIcon('<rect x="5" y="3.5" width="12" height="16" rx="2" stroke="#fff" stroke-width="1.6"/><path d="M8 8h6M8 12h4" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/><path d="M14 15.5l1.4 1.4 3-3.2" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>');
        var rbt = svgIcon('<rect x="4" y="4" width="6.2" height="6.2" rx="1.2" fill="#fff"/><rect x="13.8" y="4" width="6.2" height="6.2" rx="1.2" fill="#fff" opacity=".7"/><rect x="4" y="13.8" width="6.2" height="6.2" rx="1.2" fill="#fff" opacity=".7"/><rect x="13.8" y="13.8" width="6.2" height="6.2" rx="1.2" fill="#fff" opacity=".7"/>');
        var scan = svgIcon('<path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16M8 12h8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>');
        var bag = svgIcon('<path d="M6.8 8.2h10.4l-.9 11a1.4 1.4 0 0 1-1.4 1.3H9.1a1.4 1.4 0 0 1-1.4-1.3l-.9-11z" stroke="currentColor" stroke-width="1.6"/><path d="M9.2 8.2V6.6A2.8 2.8 0 0 1 12 3.8a2.8 2.8 0 0 1 2.8 2.8v1.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="17.4" cy="5.6" r="2.1" fill="#ff8a3d"/>');
        var bell = svgIcon('<path d="M6 16.5h12l-1.2-1.6V10a4.8 4.8 0 1 0-9.6 0v4.9L6 16.5z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M10 16.5a2 2 0 0 0 4 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>');
        var gear = svgIcon('<path fill="currentColor" d="M19.4 13.1c.1-.4.1-.7.1-1.1s0-.7-.1-1.1l1.7-1.3a.5.5 0 0 0 .1-.6l-1.6-2.8a.5.5 0 0 0-.6-.2l-2 .8a6.2 6.2 0 0 0-1.9-1.1l-.3-2.1a.5.5 0 0 0-.5-.4h-3.2a.5.5 0 0 0-.5.4l-.3 2.1c-.7.3-1.3.7-1.9 1.1l-2-.8a.5.5 0 0 0-.6.2L2.8 9a.5.5 0 0 0 .1.6l1.7 1.3c-.1.4-.1.7-.1 1.1s0 .7.1 1.1L2.9 14.4a.5.5 0 0 0-.1.6l1.6 2.8c.1.2.4.3.6.2l2-.8c.6.4 1.2.8 1.9 1.1l.3 2.1c0 .2.2.4.5.4h3.2c.3 0 .5-.2.5-.4l.3-2.1c.7-.3 1.3-.7 1.9-1.1l2 .8c.2.1.5 0 .6-.2l1.6-2.8a.5.5 0 0 0-.1-.6l-1.7-1.3zM12 15.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4z"/>');
        function shown(icon, label) {
            return '<div class="rbt-h5-tool">' + icon + '<span>' + label + '</span></div>';
        }
        return '<div class="rbt-h5-home">' +
            '<header class="rbt-h5-home__bar">' +
            '<span class="rbt-h5-home__avatar">' + esc(mark) + '</span>' +
            '<strong class="rbt-h5-home__name">' + esc(storeName) + '</strong>' +
            '<span class="rbt-h5-home__tools">' + bell + gear + '</span>' +
            '</header>' +
            '<div class="rbt-h5-home__quick">' +
            '<div class="rbt-h5-home__quick-item"><span class="rbt-h5-home__quick-icon">' + scan + '</span><span>扫码核销</span></div>' +
            '<div class="rbt-h5-home__quick-item"><span class="rbt-h5-home__quick-icon">' + bag + '</span><span>售后</span></div>' +
            '</div>' +
            '<section class="rbt-h5-home__card">' +
            '<h2>基础工具</h2>' +
            '<div class="rbt-h5-home__grid">' +
            shown(toolIcon(member, gold), '门店会员码') +
            shown(toolIcon(live, red), '直播推广') +
            shown(toolIcon(order, gold), '客户订单') +
            shown(toolIcon(receive, orange), '收货') +
            shown(toolIcon(purchase, red), '进货') +
            shown(toolIcon(wallet, orange), '门店钱包') +
            shown(toolIcon(biz, orange), '经营中心') +
            shown(toolIcon(stock, blue), '库存查询') +
            shown(toolIcon(aftersale, blue), '售后') +
            shown(toolIcon(onboard, blue), '商户进件') +
            '<button type="button" class="rbt-h5-tool" data-entry="rbt">' + toolIcon(rbt, orange) + '<span>RBT</span></button>' +
            '</div></section></div>';
    }

    function ratioPercent(value) {
        var num = Number(String(value == null ? '' : value).replace('%', ''));
        if (!isFinite(num)) return '';
        return num.toFixed(2) + '%';
    }

    /* 基础信息只列渠道和比例，不带「默认比例」和类目。 */
    function ratioText(item) {
        var api = window.RbtSettleRatio;
        if (item && item.repayMethod === '比例付' && api && typeof api.viewOf === 'function') {
            var view = api.viewOf(item) || [];
            var text = view.map(function (channel) {
                var percent = ratioPercent(channel.fallback);
                return percent ? (channel.channel + ' ' + percent) : '';
            }).filter(Boolean).join('；');
            if (text) return text;
        }
        var period = item && item.repayPeriod ? ratioPercent(item.repayPeriod) : '';
        return period || (item && item.repayPeriod ? String(item.repayPeriod) : '—');
    }

    var REPAY_DEMO_KEY = 'rbt_h5_store_repay_demo_v1';
    var REPAY_DEMO_SCENES = [
        { id: 'pending', label: '履约中 · 无每日履行' },
        { id: 'days', label: '履约中 · 有每日履行' }
    ];
    /* 演示日数据：金额 = 所得佣金 × 该渠道结算比例。所得佣金按当日营业流水的 10% 演示。结算单未确定时记预计履行，已经履约的日期记已履行。 */
    var REPAY_DEMO_DAYS = [
        { channel: 'POS', turnover: 860 },
        { channel: '直播', turnover: 420 },
        { channel: '商城', turnover: 310 },
        { channel: 'POS', turnover: 980 },
        { channel: '直播', turnover: 560 },
        { channel: '商城', turnover: 240 }
    ];

    function readRepayDemo() {
        try {
            var id = localStorage.getItem(REPAY_DEMO_KEY);
            if (id === 'repaid-days') return 'days';
            if (id === 'repaid-empty') return 'pending';
            if (REPAY_DEMO_SCENES.some(function (scene) { return scene.id === id; })) return id;
        } catch (e) {}
        return 'days';
    }

    function channelRatio(item, channel) {
        var list = item && item.settleRatios || [];
        var fallback = 0;
        var i;
        for (i = 0; i < list.length; i++) {
            var value = Number(String(list[i].fallback || '').replace('%', ''));
            if (!isFinite(value) || value <= 0) continue;
            if (!fallback) fallback = value;
            if (list[i].channel === channel) return value;
        }
        return fallback || 10;
    }

    function repayStartDate(item) {
        var text = '';
        (item && item.signings || []).forEach(function (row) {
            var value = row && row.signedAt ? String(row.signedAt) : '';
            if (value > text) text = value;
        });
        if (!text && item) text = String(item.acceptedAt || item.updatedAt || item.createdAt || '');
        var matched = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (!matched) return null;
        return new Date(Number(matched[1]), Number(matched[2]) - 1, Number(matched[3]));
    }

    function shiftDate(start, days) {
        var next = new Date(start.getTime());
        next.setDate(next.getDate() + days);
        return next.getFullYear() + '-' + pad(next.getMonth() + 1) + '-' + pad(next.getDate());
    }

    function repayDayRows(item) {
        var start = repayStartDate(item);
        return markFulfillDays(REPAY_DEMO_DAYS.map(function (row, index) {
            var ratio = channelRatio(item, row.channel);
            var commission = Math.round(row.turnover * 10) / 100;
            var due = (Math.round(commission * ratio) / 100).toFixed(2);
            return {
                date: start ? shiftDate(start, index) : '',
                channel: row.channel,
                turnover: row.turnover.toFixed(2),
                commission: commission.toFixed(2),
                ratio: ratio.toFixed(2) + '%',
                due: due,
                actual: due,
                payMethod: (window.RbtDailyFulfill && window.RbtDailyFulfill.autoPayMethod) || '营业收入自动扣款'
            };
        }));
    }

    /* 日结结算单在营业日的次日确定。演示当前日取最近一个已发生营业日的次日，所以最近一天结算单还没确定，售后仍可能改金额，只记预计履行。更早的日期已经履约，记已履行。 */
    function markFulfillDays(rows) {
        var latest = '';
        rows.forEach(function (row) {
            if (row.date > latest) latest = row.date;
        });
        return rows.map(function (row) {
            row.stage = row.date === latest ? 'estimate' : 'due';
            return row;
        });
    }

    function fulfillSplit(days) {
        var estimate = 0;
        var due = 0;
        (days || []).forEach(function (row) {
            var amount = Number(row.due) || 0;
            if (row.stage === 'due') due += amount;
            else estimate += amount;
        });
        return { estimate: estimate, due: due };
    }

    function sumDayField(days, field) {
        return (days || []).reduce(function (total, row) {
            return total + Number(row[field] || 0);
        }, 0);
    }

    var payMethod = 'alipay';
    var pendingPay = null;
    var payPwd = '';
    var payPwdError = false;

    function yuanCents(value) {
        var amount = Number(String(value == null ? '' : value).replace(/,/g, ''));
        if (!isFinite(amount)) return 0;
        return Math.round(amount * 100);
    }

    function centsText(cents) {
        var sign = cents < 0 ? '-' : '';
        var abs = Math.abs(Math.round(cents));
        var whole = Math.floor(abs / 100);
        var frac = abs % 100;
        return sign + whole + '.' + (frac < 10 ? '0' : '') + frac;
    }

    function centsComma(cents) {
        var text = centsText(cents);
        var parts = text.split('.');
        var whole = parts[0];
        var prefix = whole.charAt(0) === '-' ? '-' : '';
        var digits = prefix ? whole.slice(1) : whole;
        digits = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return prefix + digits + '.' + parts[1];
    }

    function manualCents(code) {
        var api = window.RbtDailyFulfill;
        if (!api || typeof api.manualCents !== 'function') return 0;
        return api.manualCents(account && account.code, code);
    }

    function addManualPay(code, cents, channel) {
        var api = window.RbtDailyFulfill;
        if (!api || typeof api.appendManual !== 'function') return;
        api.appendManual(account && account.code, code, {
            at: nowText(),
            cents: cents,
            channel: channel || '支付宝'
        });
    }

    function dayActualCents(days) {
        return (days || []).reduce(function (total, row) {
            return total + yuanCents(row.actual);
        }, 0);
    }

    function estimateCentsOf(days) {
        return (days || []).reduce(function (total, row) {
            if (row.stage !== 'estimate') return total;
            return total + yuanCents(row.due);
        }, 0);
    }

    function totalCents(item) {
        return yuanCents(item && item.amount);
    }

    /* 待付总额 = 货款 + 服务费。缺分项时用总金额。 */
    function payableCents(item) {
        if (!item) return 0;
        var hasGoods = item.goodsAmount != null && String(item.goodsAmount) !== '';
        var hasFee = item.serviceFee != null && String(item.serviceFee) !== '';
        if (hasGoods || hasFee) return Math.max(0, yuanCents(item.goodsAmount) + yuanCents(item.serviceFee));
        return totalCents(item);
    }

    function fulfilledCents(item) {
        var paid = dayActualCents(item && item._days) + manualCents(item && item.code);
        if (item && item.status === '已完成') return Math.max(paid, payableCents(item));
        return paid;
    }

    /* 剩余履行额 = 货款加服务费后的待付总额，再减去已履行。 */
    function remainCents(item) {
        return Math.max(0, payableCents(item) - fulfilledCents(item));
    }

    /* 最近一个预计履行日。同一天多个渠道加总。 */
    function latestEstimate(days) {
        var date = '';
        (days || []).forEach(function (row) {
            if (row.stage === 'estimate' && row.date > date) date = row.date;
        });
        if (!date) return null;
        var cents = 0;
        (days || []).forEach(function (row) {
            if (row.stage === 'estimate' && row.date === date) cents += yuanCents(row.due);
        });
        return { date: date, cents: cents };
    }

    function monthDay(date) {
        var parts = String(date || '').split('-');
        if (parts.length < 3) return String(date || '');
        return Number(parts[1]) + '月' + Number(parts[2]) + '日';
    }

    /* 营业收入自动扣款在营业日次日 08:00:00 结算。预计履行的结算单还没确定，不写结算时间。 */
    function settlementTime(date) {
        var parts = String(date || '').split('-');
        if (parts.length < 3) return '';
        var day = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        if (isNaN(day.getTime())) return '';
        day.setDate(day.getDate() + 1);
        return day.getFullYear() + '-' + pad(day.getMonth() + 1) + '-' + pad(day.getDate()) + ' 08:00:00';
    }

    function executedAtOf(day) {
        if (!day) return '';
        var raw = String(day.time || '');
        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw)) return raw;
        if (day.kind === 'manual') return raw;
        if (day.stage !== 'due') return '';
        return settlementTime(day.date);
    }

    /* 验收场景只改履约页能不能看到每日履行，不把需求改成已完成。订单完成后进入履约中。 */
    function repayView(item) {
        if (!item) return item;
        var view = {};
        Object.keys(item).forEach(function (key) { view[key] = item[key]; });
        var withDays = item.repayMethod === '比例付' &&
            (item.status === '门店付款中' || item.status === '还款中' || item.status === '已完成') &&
            readRepayDemo() === 'days';
        if (withDays) view._days = repayDayRows(item);
        return view;
    }

    function repayViews() {
        return storeDemands().map(repayView);
    }

    function repayDemands() {
        return repayViews().filter(function (item) {
            return item && (item.status === '门店付款中' || item.status === '还款中' || item.status === '已完成');
        });
    }

    function syncTabbar() {
        var bar = document.getElementById('rbtH5Tabbar');
        if (!bar) return;
        var show = screen === 'list' || screen === 'repay' || screen === 'mine';
        bar.hidden = !show;
        Array.prototype.forEach.call(bar.querySelectorAll('[data-tab]'), function (btn) {
            btn.classList.toggle('is-on', show && btn.getAttribute('data-tab') === tab);
        });
    }

    /* 需求列表：门店付款中、还款中显示履约中。剩余履行额为 0 时，履约状态改为已完成，与 PC 履约阶段一致。 */
    function phaseLabel(status) {
        if (status === '门店付款中' || status === '还款中') return '履约中';
        return status || '—';
    }

    function fulfillPhase(item) {
        if (!item) return '—';
        if (item.status !== '门店付款中' && item.status !== '还款中' && item.status !== '已完成') return phaseLabel(item.status);
        var view = item._days ? item : repayView(item);
        if (item.status === '已完成' || remainCents(view) === 0) return '已完成';
        return '履约中';
    }

    function payableDemands() {
        return repayDemands().filter(function (item) {
            return remainCents(item) > 0;
        });
    }

    /* 把门店端结清结果写给 PC。剩余履行额回到大于 0 时清掉。 */
    function syncSettledFlags() {
        var api = window.RbtDailyFulfill;
        if (!api || typeof api.markSettled !== 'function') return;
        repayDemands().forEach(function (item) {
            api.markSettled(item.code, remainCents(item) === 0);
        });
    }

    function renderRepay() {
        var rows = repayDemands();
        var openRows = payableDemands();
        var remainSum = 0;
        var estimateSum = 0;
        var fulfilledSum = 0;
        var hasOpenDays = false;
        rows.forEach(function (item) {
            remainSum += remainCents(item);
            fulfilledSum += fulfilledCents(item);
        });
        openRows.forEach(function (item) {
            if (item._days && item._days.length) {
                hasOpenDays = true;
                estimateSum += estimateCentsOf(item._days);
            }
        });
        setHead('履约');
        return '<section class="rbt-pay__hero">' +
            '<p class="rbt-pay__label">剩余履行额</p>' +
            '<p class="rbt-pay__amt">' + centsComma(remainSum) + '</p>' +
            '<div class="rbt-pay__pair">' +
            '<div><span>预计履约</span><b>' + (openRows.length ? (hasOpenDays ? ('¥' + centsText(estimateSum)) : '未计算') : '¥0.00') + '</b></div>' +
            '<div><span>已履行</span><b>¥' + centsText(fulfilledSum) + '</b></div>' +
            '</div>' +
            '<button type="button" class="rbt-pay__go" data-pay-open ' + (openRows.length ? '' : 'disabled') + '>一键履约</button>' +
            '<p class="rbt-pay__note">每天将从营业收入自动扣款</p>' +
            '</section>' +
            '<div class="rbt-pay__list">' +
            (rows.length ? rows.map(function (item) {
                var phase = fulfillPhase(item);
                var done = phase === '已完成';
                var latest = latestEstimate(item._days);
                var latestText = done
                    ? ''
                    : (latest
                        ? (monthDay(latest.date) + ' 预计履行 ¥' + centsText(latest.cents))
                        : '预计履行未计算');
                var title = item.code + (item.packageName ? ' · ' + item.packageName : '');
                return '<button type="button" class="rbt-pay__row" data-bill="' + esc(item.code) + '">' +
                    '<span class="rbt-pay__main">' +
                    '<span class="rbt-pay__head"><span class="rbt-pay__title">' + esc(title) + '</span>' +
                    '<span class="rbt-pay__phase' + (done ? ' is-done' : '') + '">' + phase + '</span></span>' +
                    '<span class="rbt-pay__sum">总金额 ¥' + centsText(totalCents(item)) + ' · 已履行 ¥' + centsText(fulfilledCents(item)) + '</span>' +
                    '<span class="rbt-pay__sum">剩余履行额 ¥' + centsText(remainCents(item)) + '</span>' +
                    (latestText ? '<span class="rbt-pay__latest">' + esc(latestText) + '</span>' : '') +
                    '</span>' +
                    '<span class="rbt-pay__chevron" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' +
                    '</button>';
            }).join('') : '<div class="rbt-pay__empty">暂无履约中的合作</div>') +
            '</div>';
    }

    function closePaySheet() {
        var mask = document.getElementById('rbtH5Pay');
        if (!mask) return;
        mask.hidden = true;
        mask.innerHTML = '';
    }

    function payDemandByCode(code) {
        var found = null;
        repayDemands().some(function (item) {
            if (item.code === code) {
                found = item;
                return true;
            }
            return false;
        });
        return found;
    }

    function currentPayItem() {
        var select = document.getElementById('rbtPayDemand');
        return select ? payDemandByCode(select.value) : null;
    }

    function syncPayHint() {
        var hint = document.getElementById('rbtPayHint');
        var item = currentPayItem();
        if (hint && item) hint.textContent = '剩余履行额 ¥' + centsText(remainCents(item));
    }

    /* 超过剩余履行额时改回剩余履行额，输入框仍可再改。返回是否发生了回改。 */
    function clampPayInput() {
        var input = document.getElementById('rbtPayAmount');
        var item = currentPayItem();
        if (!input || !item) return false;
        var raw = String(input.value || '').replace(/[^\d.]/g, '');
        var dot = raw.indexOf('.');
        if (dot >= 0) raw = raw.slice(0, dot + 1) + raw.slice(dot + 1).replace(/\./g, '').slice(0, 2);
        if (raw !== input.value) input.value = raw;
        if (!/^\d+(\.\d{1,2})?$/.test(raw)) return false;
        var remain = remainCents(item);
        if (yuanCents(raw) <= remain) return false;
        input.value = centsText(remain);
        return true;
    }

    function openPaySheet() {
        var rows = payableDemands();
        var mask = document.getElementById('rbtH5Pay');
        if (!rows.length || !mask) return;
        payMethod = 'alipay';
        var demandField = rows.length > 1
            ? '<label class="rbt-pay-demand"><span>履约需求</span><select id="rbtPayDemand">' +
                rows.map(function (item) {
                    return '<option value="' + esc(item.code) + '">' + esc(item.code) +
                        (item.packageName ? ' · ' + esc(item.packageName) : '') +
                        ' · 剩余 ¥' + centsText(remainCents(item)) + '</option>';
                }).join('') + '</select></label>'
            : '<p class="rbt-pay-demand rbt-pay-demand--text"><span>履约需求</span><b>' + esc(rows[0].code) +
                (rows[0].packageName ? ' · ' + esc(rows[0].packageName) : '') + '</b></p>' +
                '<input type="hidden" id="rbtPayDemand" value="' + esc(rows[0].code) + '">';
        mask.innerHTML = '<div class="rbt-pay-page" data-pay-sheet>' +
            '<div class="rbt-pay-page__bar"><strong>选择支付方式</strong>' +
            '<button type="button" data-pay-close aria-label="关闭">×</button></div>' +
            '<div class="rbt-pay-page__body">' +
            demandField +
            '<label class="rbt-pay-amount"><span>履约金额</span>' +
            '<span class="rbt-pay-amount__box"><input id="rbtPayAmount" inputmode="decimal" placeholder="0.00" autocomplete="off"><em>元</em></span>' +
            '<p class="rbt-pay-amount__hint" id="rbtPayHint"></p></label>' +
            '<button type="button" class="rbt-pay-method is-on" data-pay-method="alipay"><i class="rbt-pay-logo rbt-pay-logo--ali">支</i><span>支付宝</span><em></em></button>' +
            '<button type="button" class="rbt-pay-method" data-pay-method="wechat"><i class="rbt-pay-logo rbt-pay-logo--wx">微</i><span>微信</span><em></em></button>' +
            '</div>' +
            '<button type="button" class="rbt-pay-confirm" data-pay-confirm>确认支付</button>' +
            '</div>';
        mask.hidden = false;
        var select = document.getElementById('rbtPayDemand');
        if (select && select.tagName === 'SELECT') {
            select.addEventListener('change', function () {
                syncPayHint();
                clampPayInput();
            });
        }
        var input = document.getElementById('rbtPayAmount');
        if (input) {
            input.addEventListener('input', clampPayInput);
            input.focus();
        }
        syncPayHint();
    }

    function submitPay() {
        var select = document.getElementById('rbtPayDemand');
        var input = document.getElementById('rbtPayAmount');
        var item = select ? payDemandByCode(select.value) : null;
        if (!item) {
            toast('请选择履约需求');
            return;
        }
        if (clampPayInput()) return;
        var raw = input ? String(input.value || '').trim() : '';
        if (!/^\d+(\.\d{1,2})?$/.test(raw)) {
            toast('请填写履约金额，最多两位小数');
            return;
        }
        var cents = yuanCents(raw);
        if (cents <= 0) {
            toast('请填写大于 0 的履约金额');
            return;
        }
        var remain = remainCents(item);
        if (remain <= 0) return;
        if (cents > remain) {
            if (input) input.value = centsText(remain);
            return;
        }
        var payApi = window.StorePayPassword;
        if (!payApi || !payApi.hasPassword()) {
            toast('请先设置支付密码');
            return;
        }
        if (payApi.isLocked()) {
            toast('履约失败，请重新操作！');
            return;
        }
        pendingPay = {
            code: item.code,
            cents: cents,
            channel: payMethod === 'wechat' ? '微信' : '支付宝'
        };
        openPwdSheet();
    }

    function closePwdSheet() {
        var node = document.getElementById('rbtH5Pwd');
        if (!node) return;
        node.hidden = true;
        node.innerHTML = '';
        payPwd = '';
        payPwdError = false;
    }

    function pwdKey(num) {
        return '<button type="button" class="rbt-pwd__key" data-pwd-key="' + num + '">' + num + '</button>';
    }

    function renderPwdFace() {
        var boxes = '';
        var i;
        for (i = 0; i < 6; i++) boxes += '<span' + (i < payPwd.length ? ' class="is-on"' : '') + '></span>';
        var node = document.getElementById('rbtH5Pwd');
        if (!node) return;
        var boxesNode = node.querySelector('.rbt-pwd__boxes');
        var errorNode = node.querySelector('.rbt-pwd__error');
        if (!boxesNode) {
            var amount = pendingPay ? ('¥' + centsComma(pendingPay.cents)) : '';
            node.innerHTML = '<div class="rbt-pwd__mask" data-pwd-close></div>' +
                '<div class="rbt-pwd__panel" role="dialog" aria-modal="true" aria-label="请输入支付密码">' +
                '<div class="rbt-pwd__bar"><strong>请输入支付密码</strong>' +
                '<button type="button" data-pwd-close aria-label="关闭">×</button></div>' +
                '<div class="rbt-pwd__body"><p class="rbt-pwd__amount">' + esc(amount) + '</p>' +
                '<div class="rbt-pwd__boxes" aria-label="支付密码">' + boxes + '</div>' +
                '<p class="rbt-pwd__error">' + (payPwdError ? '密码输入错误，请重新输入' : '') + '</p>' +
                '<button type="button" class="rbt-pwd__forgot" data-pwd-forgot>忘记密码?</button></div>' +
                '<div class="rbt-pwd__keypad" aria-label="数字键盘">' +
                pwdKey('1') + pwdKey('2') + pwdKey('3') +
                pwdKey('4') + pwdKey('5') + pwdKey('6') +
                pwdKey('7') + pwdKey('8') + pwdKey('9') +
                '<button type="button" class="rbt-pwd__key rbt-pwd__key--empty" disabled aria-hidden="true"></button>' +
                pwdKey('0') +
                '<button type="button" class="rbt-pwd__key rbt-pwd__key--del" data-pwd-key="del" aria-label="删除">' +
                '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 6h11a1 1 0 011 1v10a1 1 0 01-1 1H9l-5-6 5-6z"/><path d="M12 10l4 4m0-4l-4 4"/></svg></button>' +
                '</div></div>';
            return;
        }
        boxesNode.innerHTML = boxes;
        if (errorNode) errorNode.textContent = payPwdError ? '密码输入错误，请重新输入' : '';
    }

    function openPwdSheet() {
        payPwd = '';
        payPwdError = false;
        var node = document.getElementById('rbtH5Pwd');
        if (!node) return;
        node.hidden = false;
        renderPwdFace();
    }

    function closePayResult() {
        var node = document.getElementById('rbtH5Result');
        if (!node) return;
        node.hidden = true;
        node.innerHTML = '';
    }

    /* 支付完成弹框。还款字眼都写成支付。关闭回到当前履约页，查看履约进入这笔履约明细。 */
    function showPayResult(pay) {
        var node = document.getElementById('rbtH5Result');
        if (!node || !pay) return;
        node.innerHTML = '<div class="rbt-result__card" role="dialog" aria-modal="true" aria-label="支付成功">' +
            '<button type="button" class="rbt-result__close" data-result-close aria-label="关闭">×</button>' +
            '<div class="rbt-result__icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg></div>' +
            '<h2 class="rbt-result__title">支付成功</h2>' +
            '<p class="rbt-result__amt">¥' + centsComma(pay.cents) + '</p>' +
            '<div class="rbt-result__meta">' +
            '<div><span>支付金额</span><b>¥' + centsText(pay.cents) + '</b></div>' +
            '<div><span>支付方式</span><b>' + esc(pay.channel) + '</b></div>' +
            '<div><span>履约需求</span><b>' + esc(pay.code) + '</b></div>' +
            '</div>' +
            '<button type="button" class="rbt-result__go" data-result-bill="' + esc(pay.code) + '">查看履约</button>' +
            '</div>';
        node.hidden = false;
    }

    function finishPendingPay() {
        var pay = pendingPay;
        if (!pay) return;
        pendingPay = null;
        addManualPay(pay.code, pay.cents, pay.channel);
        closePwdSheet();
        closePaySheet();
        tab = 'repay';
        screen = 'repay';
        render();
        showPayResult(pay);
    }

    function onPwdKey(key) {
        var payApi = window.StorePayPassword;
        if (key === 'del') {
            payPwd = payPwd.slice(0, -1);
            payPwdError = false;
            renderPwdFace();
            return;
        }
        if (!/^\d$/.test(key) || payPwd.length >= 6) return;
        payPwdError = false;
        payPwd += key;
        renderPwdFace();
        if (payPwd.length < 6) return;
        if (!payApi || !payApi.hasPassword()) {
            payPwd = '';
            payPwdError = true;
            renderPwdFace();
            toast('请先设置支付密码');
            return;
        }
        var res = payApi.verify(payPwd);
        if (!res.ok) {
            payPwd = '';
            payPwdError = true;
            renderPwdFace();
            if (res.locked) toast('履约失败，请重新操作！');
            return;
        }
        finishPendingPay();
    }

    function dayPayMethod(day) {
        return (day && day.payMethod) || ((window.RbtDailyFulfill && window.RbtDailyFulfill.autoPayMethod) || '营业收入自动扣款');
    }

    function dayFact(label, value) {
        return '<span><i>' + esc(label) + '</i><b>' + esc(value) + '</b></span>';
    }

    function manualDayRows(item) {
        var api = window.RbtDailyFulfill;
        if (!item || !api || typeof api.manualRows !== 'function') return [];
        return api.manualRows(item).map(function (row) {
            row.stage = 'due';
            return row;
        });
    }

    function displayDays(item) {
        var days = billDays(item).concat(manualDayRows(item));
        days.sort(function (a, b) {
            if (a.date !== b.date) return a.date < b.date ? -1 : 1;
            if (a.kind === 'manual' && b.kind !== 'manual') return 1;
            if (b.kind === 'manual' && a.kind !== 'manual') return -1;
            return String(a.time || '') < String(b.time || '') ? -1 : 1;
        });
        return days;
    }

    function dayChannel(day) {
        return day && day.kind === 'manual' ? '一键履约' : (day && day.channel) || '—';
    }

    function renderDayList(item, days) {
        return days.slice().reverse().map(function (day, revIndex) {
            var index = days.length - 1 - revIndex;
            var stage = day.stage === 'due' ? '已履行' : '预计履行';
            var when = executedAtOf(day) || '未执行';
            var facts = day.kind === 'manual'
                ? dayFact('支付方式', day.payMethod || '—')
                : dayFact('营业流水', '¥' + money(day.turnover)) +
                    dayFact('所得佣金', '¥' + money(day.commission)) +
                    dayFact('结算比例', day.ratio) +
                    dayFact('支付方式', dayPayMethod(day));
            facts += dayFact('结算时间', when);
            return '<button type="button" class="rbt-bill__day" data-day-index="' + index + '">' +
                '<span class="rbt-bill__day-head">' +
                '<span class="rbt-bill__day-date">' + esc(monthDay(day.date)) + '</span>' +
                '<span class="rbt-bill__day-channel">' + esc(dayChannel(day)) + '</span>' +
                '<span class="rbt-bill__day-stage' + (day.stage === 'due' ? ' is-due' : '') + '">' + stage + '</span>' +
                '<span class="rbt-bill__day-more" aria-hidden="true">›</span></span>' +
                '<span class="rbt-bill__day-grid">' + facts + '</span></button>';
        }).join('');
    }

    /* 本行履行额按需求单构成分摊。商品金额是货款；贸易商服务费 = 贸易商应收 − 商品金额；冷丰、服务商服务费用各自应收。四项之和等于总金额，再按占比拆到这一天，合计等于本行金额。 */
    function dayPayWeights(item) {
        var goods = yuanCents(item && item.goodsAmount);
        var pack = window.RbtDemandData && typeof window.RbtDemandData.receivables === 'function'
            ? window.RbtDemandData.receivables(item)
            : null;
        var trader = yuanCents(pack && pack.trader);
        var lengfeng = yuanCents(pack && pack.lengfeng);
        var provider = yuanCents(pack && pack.provider);
        var weights = [
            { label: '商品金额', cents: goods },
            { label: '贸易商服务费', cents: Math.max(0, trader - goods) },
            { label: '冷丰服务费', cents: Math.max(0, lengfeng) },
            { label: '服务商服务费', cents: Math.max(0, provider) }
        ].filter(function (row) { return row.cents > 0; });
        if (weights.length) return weights;
        var fee = yuanCents(item && item.serviceFee);
        if (goods > 0) weights.push({ label: '商品金额', cents: goods });
        if (fee > 0) weights.push({ label: '服务费', cents: fee });
        return weights.length ? weights : [{ label: '商品金额', cents: 1 }];
    }

    function splitDayPay(cents, weights) {
        var total = weights.reduce(function (sum, row) { return sum + row.cents; }, 0);
        var used = 0;
        return weights.map(function (row, index) {
            if (index === weights.length - 1) return { label: row.label, cents: cents - used };
            var share = total > 0 ? Math.floor(cents * row.cents / total) : 0;
            used += share;
            return { label: row.label, cents: share };
        });
    }

    function closeDaySplit() {
        var node = document.getElementById('rbtH5DaySplit');
        if (!node) return;
        node.hidden = true;
        node.innerHTML = '';
    }

    function openDaySplit(index) {
        var item = repayViews().filter(function (row) { return row.code === billCode; })[0];
        var day = item ? displayDays(item)[index] : null;
        var node = document.getElementById('rbtH5DaySplit');
        if (!item || !day || !node) return;
        var parts = splitDayPay(yuanCents(day.due), dayPayWeights(item));
        node.innerHTML = '<div class="rbt-split__card" role="dialog" aria-modal="true" aria-label="支付明细">' +
            '<h2 class="rbt-split__title">' + esc(monthDay(day.date) + ' · ' + dayChannel(day)) + '</h2>' +
            '<div class="rbt-split__row"><span>结算时间</span><b>' + esc(executedAtOf(day) || '未执行') + '</b></div>' +
            '<div class="rbt-split__row"><span>支付方式</span><b>' + esc(day.kind === 'manual' ? (day.payMethod || '—') : dayPayMethod(day)) + '</b></div>' +
            '<div class="rbt-split__row"><span>金额</span><b>¥' + esc(money(day.due)) + '</b></div>' +
            parts.map(function (row) {
                return '<div class="rbt-split__row"><span>' + esc(row.label) + '</span><b>¥' + centsText(row.cents) + '</b></div>';
            }).join('') +
            '<button type="button" class="rbt-split__ok" data-day-split-close>确定</button>' +
            '</div>';
        node.hidden = false;
    }

    /* 已发生节点才列出时间。付款时间是贸易商付完货款的时间，本业务不叫放款。 */
    function earliestLogTime(item, pattern) {
        var found = '';
        (item && item.logs || []).forEach(function (row) {
            if (!row || !row.time || !pattern.test(row.content || '')) return;
            if (!found || row.time < found) found = row.time;
        });
        return found;
    }

    function nodeTimeLines(item) {
        var lines = [];
        function add(label, time) {
            if (!time) return;
            lines.push([label, time]);
        }
        if (!item) return lines;
        add('创建时间', item.createdAt);
        add('确认签约', earliestLogTime(item, /确认签约/));
        add('付款时间', item.paidAt || earliestLogTime(item, /在线支付|线下支付/));
        if (item.status === '已完成') add('履约完成', item.completedAt);
        return lines;
    }

    /* 已完成不再留预计履行。最近一天结算单未确定时本来记预计履行，整笔完成后改记已履行。 */
    function billDays(item) {
        var days = (item && item._days) || [];
        if (fulfillPhase(item) !== '已完成') return days;
        return days.map(function (day) {
            if (!day || day.stage !== 'estimate') return day;
            var next = {};
            Object.keys(day).forEach(function (key) { next[key] = day[key]; });
            next.stage = 'due';
            return next;
        });
    }

    function renderBill(item) {
        var phase = fulfillPhase(item);
        var autoDays = billDays(item);
        var days = displayDays(item);
        var split = fulfillSplit(autoDays);
        setHead('履约明细');
        var settled = [
            ['已履行', '¥' + centsText(fulfilledCents(item))],
            ['剩余履行额', '¥' + centsText(remainCents(item))]
        ];
        var lines = autoDays.length
            ? [
                ['贸易商', item.traderName || '—'],
                ['履约计划', '已按日产生'],
                ['结算比例', ratioText(item)],
                ['计算来源', '按营业流水计算'],
                ['预计履行', phase === '已完成' ? '无' : ('¥' + money(split.estimate))],
                ['应履约', '¥' + money(split.due)]
            ].concat(settled).concat(nodeTimeLines(item))
            : [
                ['贸易商', item.traderName || '—'],
                ['履约计划', '未激活'],
                ['结算比例', ratioText(item)],
                ['计算来源', '还没有营业流水'],
                ['预计履行', '未计算'],
                ['应履约', '未产生']
            ].concat(settled).concat(nodeTimeLines(item));
        return '<section class="rbt-bill__head">' +
            '<div class="rbt-bill__top"><span class="rbt-bill__code">' + esc(item.code) + '</span><span class="rbt-bill__tag">' + phase + '</span></div>' +
            '<p class="rbt-bill__label">总金额</p>' +
            '<p class="rbt-bill__amt">' + esc(item.amount || '—') + '</p>' +
            '<div class="rbt-bill__stats">' +
            '<div><span>结算周期</span><b>' + esc(item.repayCycle || '—') + '</b></div>' +
            '<div><span>结算方式</span><b>' + esc(item.repayMethod || '—') + '</b></div>' +
            '</div>' +
            '</section>' +
            '<div class="rbt-bill-tabs" role="tablist">' +
            '<button type="button" data-bill-tab="base"' + (billTab === 'daily' ? '' : ' class="is-on"') + '>基础信息</button>' +
            '<button type="button" data-bill-tab="daily"' + (billTab === 'daily' ? ' class="is-on"' : '') + '>每日履行</button>' +
            '</div>' +
            (billTab === 'daily'
                ? ('<section class="rbt-bill__sheet' + (days.length ? '' : ' rbt-bill__sheet--blank') + '">' +
                    (days.length
                        ? renderDayList(item, days)
                        : '<p class="rbt-bill__empty">暂无每日履行。履约计划未激活，比例付不预造每日金额。</p>') +
                    '</section>')
                : ('<section class="rbt-bill__sheet">' +
                    lines.map(function (line) {
                        return '<div class="rbt-bill__line"><span>' + esc(line[0]) + '</span><b>' + esc(line[1]) + '</b></div>';
                    }).join('') +
                    renderContractList(item) +
                    '</section>'));
    }

    function signedContracts(item) {
        var api = window.RbtDemandData;
        if (!item || !api || typeof api.signContracts !== 'function') return [];
        return api.signContracts(item).filter(function (contract) {
            if (!contract || contract.signStatus !== '已签署') return false;
            return (contract.parties || []).some(function (party) { return party.role === 'store'; });
        });
    }

    function renderContractList(item) {
        var contracts = signedContracts(item);
        var value = contracts.length
            ? contracts.map(function (contract) {
                return '<button type="button" class="rbt-bill__contract" data-contract-open="' + esc(contract.key) + '">' +
                    esc(contract.name) + '</button>';
            }).join('')
            : '—';
        return '<div class="rbt-bill__line"><span>签署合同</span><b>' + value + '</b></div>';
    }

    function closeContract() {
        var node = document.getElementById('rbtH5Contract');
        if (!node) return;
        node.hidden = true;
        node.innerHTML = '';
    }

    function contractSideLine(label, value) {
        return '<div class="rbt-contract__side-line"><span>' + esc(label) + '</span><b>' + esc(value || '—') + '</b></div>';
    }

    function contractSeal(name, index) {
        var uid = 'rbtSealArc' + index;
        return '<span class="rbt-contract__seal" aria-label="已盖章"><svg viewBox="0 0 120 120" width="96" height="96">' +
            '<circle cx="60" cy="60" r="56" fill="rgba(255,255,255,0.55)" stroke="#c41e1e" stroke-width="3"/>' +
            '<circle cx="60" cy="60" r="51" fill="none" stroke="#c41e1e" stroke-width="1"/>' +
            '<defs><path id="' + uid + '" d="M16,64 A44,44 0 0,1 104,64"/></defs>' +
            '<text fill="#c41e1e" font-size="11" font-weight="700"><textPath href="#' + uid + '" startOffset="50%" text-anchor="middle">' +
            esc(name || '签署方') + '</textPath></text>' +
            '<text x="60" y="66" text-anchor="middle" fill="#c41e1e" font-size="16">★</text>' +
            '<text x="60" y="86" text-anchor="middle" fill="#c41e1e" font-size="12" font-weight="700">合同专用章</text></svg></span>';
    }

    function contractCnDate(raw) {
        var matched = String(raw || '').match(/(\d{4})-(\d{2})-(\d{2})/);
        return matched ? (matched[1] + '年' + matched[2] + '月' + matched[3] + '日') : '';
    }

    /* 正文用合同管理里的销售合同。乙方填门店，签署页盖章并写入签署日期。 */
    function contractPaperHtml(contract) {
        var bag = window.LF_CONTRACT_BODIES || {};
        var body = bag.TPL001 || '';
        var storeParty = (contract.parties || []).filter(function (party) { return party.role === 'store'; })[0];
        var storeName = storeParty && storeParty.name || '';
        var signedAt = '';
        (contract.parties || []).some(function (party) {
            if (party && party.signedAt) {
                signedAt = party.signedAt;
                return true;
            }
            return false;
        });
        var dateText = contractCnDate(signedAt);
        if (!body) return '暂无合同正文';
        var lines = body.split('\n');
        var headEnd = lines.findIndex(function (line) { return line.indexOf('鉴于') === 0; });
        if (headEnd < 0) headEnd = Math.min(lines.length, 24);
        var addressFilled = false;
        for (var i = 0; i < headEnd; i++) {
            var head = lines[i];
            if (storeName && /^乙方：\s*$/.test(head.trim())) {
                lines[i] = head.replace(/：\s*$/, '：' + storeName);
                continue;
            }
            if (storeName && !addressFilled && /地址：\s*$/.test(head.trim())) {
                lines[i] = head.replace(/：\s*$/, '：' + storeName);
                addressFilled = true;
            }
        }
        var inPage = false;
        var sealIndex = 0;
        return lines.map(function (line) {
            var trimmed = line.trim();
            if (trimmed.indexOf('以下无正文') >= 0) inPage = true;
            if (inPage && trimmed.indexOf('附件') === 0) inPage = false;
            if (!inPage || trimmed.indexOf('以下无正文') >= 0) return esc(line);
            if (/^甲方（盖章）/.test(trimmed)) {
                sealIndex += 1;
                return '<span class="rbt-contract__sign">' + esc(line) + contractSeal('上海冷丰道善信息科技有限公司', sealIndex) + '</span>';
            }
            if (/^乙方（(?:签字|盖章）)/.test(trimmed)) {
                var shown = line;
                if (storeName && /：\s*[_＿\s　]*$/.test(trimmed)) shown = line.replace(/：\s*[_＿\s　]*$/, '：' + storeName);
                sealIndex += 1;
                return '<span class="rbt-contract__sign">' + esc(shown) + contractSeal(storeName, sealIndex) + '</span>';
            }
            if (/^日期/.test(trimmed) && dateText) return esc(line.replace(/：.*/, '：' + dateText));
            return esc(line);
        }).join('\n');
    }

    function openContract(key) {
        var item = repayViews().filter(function (row) { return row.code === billCode; })[0];
        var contract = signedContracts(item).filter(function (row) { return row.key === key; })[0];
        var node = document.getElementById('rbtH5Contract');
        if (!item || !contract || !node) return;
        var signers = (contract.parties || []).map(function (party) {
            return '<section class="rbt-contract__signer"><div class="rbt-contract__signer-top"><span>签署</span><span>顺序签署</span></div>' +
                '<div class="rbt-contract__signer-who"><b>' + esc(party.name || party.roleLabel || '—') + '</b><em>已签署</em></div>' +
                contractSideLine('完成时间', party.signedAt) + '</section>';
        }).join('');
        node.innerHTML = '<div class="rbt-contract__bar"><button type="button" data-contract-close aria-label="返回">‹</button><strong>' +
            esc(contract.name) + '</strong></div>' +
            '<div class="rbt-contract__body">' +
            '<p class="rbt-contract__meta">签署任务 · ' + esc(contract.code) + ' · ' + esc(item.storeName || '') + ' · 已签署</p>' +
            '<article class="rbt-contract__paper">' + contractPaperHtml(contract) + '</article>' +
            '<section class="rbt-contract__side"><h3>详情</h3>' +
            contractSideLine('主题', contract.name) +
            '<div class="rbt-contract__side-line"><span>状态</span><b><i class="rbt-contract__dot"></i>已签署</b></div>' +
            contractSideLine('合同编号', contract.code) +
            contractSideLine('发件人', '上海冷丰道善信息科技有限公司') +
            contractSideLine('关联需求', item.code) +
            signers +
            '</section></div>';
        node.hidden = false;
    }

    function renderReceive() {
        var api = window.RbtDemandData;
        var item = api && typeof api.get === 'function' ? api.get(receiveCode) : null;
        setHead('确认收货');
        if (!item) return '<div class="rbt-h5-empty">需求单不存在</div>';
        var rows = item.shipments || [];
        var shipped = 0;
        rows.forEach(function (row) { shipped += Number(String(row.amount || '').replace(/[¥,]/g, '')) || 0; });
        var goods = Number(String(item.goodsAmount || '').replace(/[¥,]/g, '')) || 0;
        var over = rows.length && shipped - goods > 0.001;
        var voucher = item.supplementVoucher;
        var supplement = over
            ? '<section class="rbt-h5-card"><h2>补缴凭证</h2><p>' +
                (voucher && voucher.name ? esc(voucher.name) : '待补缴') +
                '</p><label class="rbt-h5-action" style="display:inline-block;">上传凭证<input type="file" accept="image/*,.pdf" data-store-supplement hidden></label></section>'
            : '';
        var list = rows.length
            ? rows.map(function (row) {
                var action = row.confirmed
                    ? '<p>已确认 ' + esc(row.confirmQty || row.qty) + ' 件</p>'
                    : '<button type="button" class="rbt-h5-action" data-confirm-recv="' + esc(row.id) + '">确认收货</button>';
                return '<section class="rbt-h5-card"><h2>' + esc(row.name) + '</h2>' +
                    '<p>发货数量 ' + esc(row.qty) + ' · 发货金额 ¥' + esc(row.amount) + '</p>' +
                    '<p>物流单号 ' + esc(row.logisticsNo || '—') + '</p>' +
                    action + '</section>';
            }).join('')
            : '<div class="rbt-h5-empty">还没有待确认的发货</div>';
        return '<section class="rbt-h5-card"><h2>' + esc(item.packageName || item.code) + '</h2>' +
            '<p>' + esc(item.code) + ' · ' + esc(item.status) + '</p></section>' + list + supplement;
    }

    function renderMine() {
        setHead('我的');
        return '<section class="rbt-h5-card"><h2>' + esc(account && account.name ? account.name : '门店') + '</h2>' +
            '<p>门店编码：' + esc(account && account.code) + '</p>' +
            '<p>手机号：' + esc(account && account.phone) + '</p>' +
            '<button type="button" class="rbt-h5-action" data-switch-store>切换门店</button></section>';
    }

    function syncHomeChrome() {
        var phone = document.getElementById('rbtH5Phone');
        var scroll = document.getElementById('rbtH5Scroll');
        var on = screen === 'home';
        if (phone) {
            phone.classList.toggle('is-home', on);
            phone.classList.toggle('is-list', screen === 'list' || screen === 'detail');
            phone.classList.toggle('is-sku', screen === 'skus');
            phone.classList.toggle('is-confirm', screen === 'installment');
        }
        if (scroll) scroll.classList.toggle('is-home', on);
    }

    /* 返回放在门店名左侧。首页、还款、我的没有上一级。 */
    function backTarget() {
        if (screen === 'bill') return 'repay';
        if (screen === 'list') return 'home';
        if (screen === 'packages' || screen === 'sign' || screen === 'receive' || screen === 'detail') return 'list';
        if (screen === 'skus') return 'packages';
        if (screen === 'installment') return 'skus';
        return '';
    }

    function syncHeadBack() {
        var btn = document.getElementById('rbtH5HeadBack');
        if (!btn) return;
        btn.classList.toggle('is-on', !!(account && backTarget()));
    }

    function goBack(target) {
        if (target === 'repay') {
            tab = 'repay';
            screen = 'repay';
        } else if (target === 'home') {
            tab = 'home';
            screen = 'home';
        } else if (target) {
            screen = target;
            if (screen === 'packages') {
                clearPicked();
                clearInstallmentChoice();
            }
            if (screen === 'skus') clearInstallmentChoice();
        }
        render();
    }

    function closeRecvConfirm() {
        document.querySelectorAll('[data-recv-confirm]').forEach(function (node) {
            node.remove();
        });
    }

    /* 详情里先确认商品已到货或服务已完成，再真正记收货。 */
    function openRecvConfirm(shipId) {
        var phone = document.getElementById('rbtH5Phone');
        if (!phone || !shipId) return;
        closeRecvConfirm();
        var demand = null;
        storeDemands().some(function (item) {
            if (item && item.code === detailCode) {
                demand = item;
                return true;
            }
            return false;
        });
        var row = null;
        ((demand && demand.shipments) || []).some(function (item) {
            if (item && item.id === shipId) {
                row = item;
                return true;
            }
            return false;
        });
        var name = row && (row.name || row.skuCode) ? (row.name || row.skuCode) : '';
        var mask = document.createElement('div');
        mask.className = 'rbt-recv-mask';
        mask.setAttribute('data-recv-confirm', '1');
        mask.innerHTML = '<div class="rbt-recv-dialog" role="dialog" aria-modal="true">' +
            '<p>请确认当前商品已到货或当前服务已完成</p>' +
            (name ? '<p class="rbt-recv-dialog__name">' + esc(name) + '</p>' : '') +
            '<div class="rbt-recv-dialog__actions">' +
            '<button type="button" data-recv-cancel>取消</button>' +
            '<button type="button" data-recv-ok>确认收货</button>' +
            '</div></div>';
        mask.addEventListener('click', function (event) {
            if (event.target === mask || event.target.closest('[data-recv-cancel]')) {
                closeRecvConfirm();
                return;
            }
            if (event.target.closest('[data-recv-ok]')) {
                closeRecvConfirm();
                submitRecv(detailCode, shipId);
            }
        });
        phone.appendChild(mask);
    }

    function submitRecv(code, shipId) {
        var recvApi = window.RbtDemandData;
        var recvResult = recvApi && recvApi.confirmReceipt(
            code,
            shipId,
            account && (account.person || account.name)
        );
        if (recvResult && recvResult.ok && screen === 'detail') detailFocusShip = true;
        toast(recvResult && recvResult.ok ? '已确认收货' : ((recvResult && recvResult.reason) || '不能确认'));
        render();
    }

    function bindSupplement(scroll, code) {
        var supplementFile = scroll && scroll.querySelector('[data-store-supplement]');
        if (!supplementFile) return;
        supplementFile.addEventListener('change', function () {
            var file = supplementFile.files && supplementFile.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function () {
                var api = window.RbtDemandData;
                var result = api && api.saveSupplement(code, {
                    name: file.name,
                    type: file.type,
                    data: reader.result
                }, account && (account.person || account.name));
                if (result && result.ok) detailFocusShip = true;
                toast(result && result.ok ? '补缴凭证已上传' : ((result && result.reason) || '上传失败'));
                render();
            };
            reader.readAsDataURL(file);
        });
    }

    function render() {
        var scroll = document.getElementById('rbtH5Scroll');
        if (!scroll) return;
        closePaySheet();
        closePwdSheet();
        closePayResult();
        closeDaySplit();
        closeContract();
        if (account) syncSettledFlags();
        scroll.classList.remove('is-bill-blank');
        scroll.classList.toggle('is-repay', screen === 'repay');
        syncHomeChrome();
        syncTabbar();
        syncHeadBack();
        closeRecvConfirm();
        scroll.style.paddingBottom = '';
        var createBar = document.getElementById('rbtH5Create');
        if (createBar) createBar.hidden = true;
        if (screen !== 'skus') fillSkuBar(null);
        fillPublishBar(screen === 'installment');
        if (screen === 'home') {
            setHead('首页');
            scroll.innerHTML = renderStoreHome();
            return;
        }
        if (screen === 'packages') {
            setHead('选择商品包');
            var choices = packages();
            scroll.innerHTML = (choices.length ? choices.map(function (item) {
                    return '<button type="button" class="rbt-h5-card" data-package="' + esc(item.code) + '" style="display:block;width:100%;text-align:left;cursor:pointer;">' +
                        '<h2>' + esc(item.name) + '</h2><p>' + esc(item.code) + ' · ' + item.skus.length + ' 个商品</p></button>';
                }).join('') : '<div class="rbt-h5-empty">暂无本门店的商品包</div>');
            return;
        }
        if (screen === 'skus') {
            var pkg = findPackage(packageCode);
            setHead('选择商品');
            fillSkuBar(null, false, 0, 0);
            if (!pkg) {
                scroll.innerHTML = '<div class="rbt-h5-empty">商品包不存在</div>';
                return;
            }
            var lines = selectedLines(pkg);
            var allOn = pkg.skus.length > 0 && lines.length === pkg.skus.length;
            var pieceCount = lines.reduce(function (total, line) { return total + line.qty; }, 0);
            scroll.innerHTML = '<section class="rbt-sku-pack"><h2>' + esc(pkg.name) + '</h2>' +
                '<p>' + esc(pkg.code) + ' · ' + pkg.skus.length + '个商品</p></section>' +
                (pkg.skus.length
                    ? pkg.skus.map(function (line) {
                        var on = isPicked(line.code);
                        var qty = on ? qtyOf(line.code) : 1;
                        var image = line.image
                            ? '<img class="rbt-sku-card__img" src="' + esc(line.image) + '" alt="' + esc(line.name) + '">'
                            : '<span class="rbt-sku-card__img rbt-sku-card__img--empty">暂无图片</span>';
                        return '<div class="rbt-sku-card rbt-h5-sku">' +
                            '<label class="rbt-sku-card__pick"><input type="checkbox" data-sku="' + esc(line.code) + '" ' + (on ? 'checked' : '') + ' aria-label="选择' + esc(line.name) + '"></label>' +
                            image +
                            '<div class="rbt-sku-card__main"><strong>' + esc(line.name) + '</strong>' +
                            '<p>商品条码 ' + esc(line.barcode) + '</p>' +
                            '<p>' + esc(skuPackText(line)) + '</p>' +
                            '<div class="rbt-sku-card__row"><b class="rbt-sku-card__price">¥' + esc(line.salePrice) + '</b>' +
                            '<div class="rbt-h5-qty" data-qty-box="' + esc(line.code) + '">' +
                            '<button type="button" data-qty-minus="' + esc(line.code) + '" ' + (on ? '' : 'disabled ') + 'aria-label="减少数量">−</button>' +
                            '<input type="number" inputmode="numeric" min="1" max="' + QTY_MAX + '" value="' + qty + '" data-qty-input="' + esc(line.code) + '" aria-label="数量">' +
                            '<button type="button" data-qty-plus="' + esc(line.code) + '" ' + (qty >= QTY_MAX ? 'disabled ' : '') + 'aria-label="增加数量">+</button>' +
                            '</div></div></div></div>';
                    }).join('')
                    : '<div class="rbt-h5-empty">该商品包暂无商品</div>');
            fillSkuBar(pkg, allOn, lines.length, pieceCount);
            return;
        }
        if (screen === 'installment') {
            var instPkg = findPackage(packageCode);
            setHead('确认发布信息');
            if (!instPkg) {
                fillPublishBar(false);
                scroll.innerHTML = '<div class="rbt-h5-empty">商品包不存在</div>';
                return;
            }
            var instLines = selectedLines(instPkg);
            var instAmount = sumLines(instLines);
            var plans = matchedInstallments(instPkg, instAmount);
            if (!plans.length) {
                fillPublishBar(false);
                scroll.innerHTML = '<div class="rbt-h5-empty">暂无匹配的产品配置</div>';
                return;
            }
            var currentPlan = ensureInstallmentChoice(plans);
            var cycles = availableCycles(plans);
            var methods = availableMethods(plans, repayCycle);
            var periods = currentPlan ? currentPlan.periods : [];
            var isRatio = repayMethod === '比例付';
            var goodsAmount = money(instAmount);
            var periodRow = !isRatio && periods.length
                ? confirmRow(periodsFieldLabel(repayMethod), confirmChoice(periods, repayPeriod, 'period'))
                : '';
            scroll.innerHTML = '<section class="rbt-sku-pack"><h2>' + esc(instPkg.name) + '</h2>' +
                '<p>' + esc(instPkg.code) + ' · ' + instPkg.skus.length + '个商品</p></section>' +
                '<section class="rbt-confirm">' +
                confirmRow('商品金额', esc(yuanText(goodsAmount)), true) +
                confirmRow('结算周期', confirmChoice(cycles, repayCycle, 'cycle')) +
                confirmRow('结算状态', confirmChoice(methods, repayMethod, 'method')) +
                periodRow +
                '</section>';
            fillPublishBar(true);
            return;
        }
        if (screen === 'receive') {
            scroll.innerHTML = renderReceive();
            bindSupplement(scroll, receiveCode);
            return;
        }
        if (screen === 'sign') {
            setHead('合同签署');
            var signing = window.RbtDemandData && window.RbtDemandData.get(signCode);
            scroll.innerHTML = '' +
                (window.RbtContractSign
                    ? window.RbtContractSign.render(signing, { role: 'store', code: account && account.code, name: account && account.name })
                    : '<div class="rbt-h5-empty">合同签署页不可用</div>');
            return;
        }
        if (screen === 'bill') {
            var bill = repayViews().filter(function (item) { return item.code === billCode; })[0];
            scroll.classList.toggle('is-bill-blank', !!(bill && billTab === 'daily' && !displayDays(bill).length));
            scroll.innerHTML = bill
                ? renderBill(bill)
                : '<div class="rbt-h5-empty">履约明细不存在</div>';
            return;
        }
        if (tab === 'mine') {
            scroll.innerHTML = renderMine();
            return;
        }
        if (tab === 'repay') {
            scroll.innerHTML = renderRepay();
            return;
        }
        if (screen === 'detail') {
            var currentDemand = null;
            storeDemands().some(function (item) {
                if (item.code === detailCode) {
                    currentDemand = item;
                    return true;
                }
                return false;
            });
            scroll.innerHTML = currentDemand
                ? renderDemandDetail(currentDemand)
                : '<div class="rbt-h5-empty">需求单不存在</div>';
            scroll.scrollTop = 0;
            if (currentDemand && detailFocusShip) {
                scroll.style.paddingBottom = '70%';
                var shipSection = document.getElementById('rbtDemandShip');
                if (shipSection) {
                    var shipTop = shipSection.getBoundingClientRect().top;
                    var scrollerTop = scroll.getBoundingClientRect().top;
                    scroll.scrollTop += shipTop - scrollerTop;
                }
            }
            bindSupplement(scroll, detailCode);
            return;
        }
        setHead('需求列表');
        var rows = storeDemands();
        scroll.innerHTML = rows.length
            ? rows.map(function (item) { return renderDemand(item, true); }).join('')
            : '<div class="rbt-h5-empty">暂无需求</div>';
    }

    function open(next) {
        account = next;
        if (readRepayDemo() === 'pending') {
            tab = 'home';
            screen = 'list';
            repayFilter = 'pending';
        } else {
            tab = 'repay';
            screen = 'repay';
            repayFilter = 'pending';
        }
        packageCode = '';
        clearPicked();
        clearInstallmentChoice();
        render();
    }

    function close() {
        account = null;
        tab = 'home';
        screen = 'list';
        var tabbar = document.getElementById('rbtH5Tabbar');
        if (tabbar) tabbar.hidden = true;
        var phone = document.getElementById('rbtH5Phone');
        var scroll = document.getElementById('rbtH5Scroll');
        var headBack = document.getElementById('rbtH5HeadBack');
        if (headBack) headBack.classList.remove('is-on');
        if (phone) phone.classList.remove('is-home');
        closePaySheet();
        closePwdSheet();
        closePayResult();
        closeDaySplit();
        closeContract();
        if (scroll) {
            scroll.classList.remove('is-home');
            scroll.classList.remove('is-repay');
            scroll.innerHTML = '';
        }
        var createBar = document.getElementById('rbtH5Create');
        if (createBar) createBar.hidden = true;
    }

    var headBackBtn = document.getElementById('rbtH5HeadBack');
    if (headBackBtn) {
        headBackBtn.addEventListener('click', function () {
            var contract = document.getElementById('rbtH5Contract');
            if (contract && !contract.hidden) {
                closeContract();
                return;
            }
            var target = backTarget();
            if (target) goBack(target);
        });
    }

    document.getElementById('rbtH5App').addEventListener('click', function (event) {
        var resultBill = event.target.closest('[data-result-bill]');
        var resultClose = event.target.closest('[data-result-close]');
        if (resultBill) {
            billCode = resultBill.getAttribute('data-result-bill') || '';
            billTab = 'base';
            tab = 'repay';
            screen = 'bill';
            render();
            return;
        }
        if (resultClose) {
            closePayResult();
            tab = 'repay';
            screen = 'repay';
            render();
            return;
        }
        if (event.target.closest('#rbtH5Result')) return;
        var dayBtn = event.target.closest('[data-day-index]');
        var dayClose = event.target.closest('[data-day-split-close]');
        if (dayClose || event.target.id === 'rbtH5DaySplit') {
            closeDaySplit();
            return;
        }
        if (dayBtn) {
            openDaySplit(Number(dayBtn.getAttribute('data-day-index')));
            return;
        }
        if (event.target.closest('#rbtH5DaySplit')) return;
        var contractClose = event.target.closest('[data-contract-close]');
        var contractOpen = event.target.closest('[data-contract-open]');
        if (contractClose) {
            closeContract();
            return;
        }
        if (contractOpen) {
            openContract(contractOpen.getAttribute('data-contract-open') || '');
            return;
        }
        if (event.target.closest('#rbtH5Contract')) return;
        var pwdKeyBtn = event.target.closest('[data-pwd-key]');
        var pwdClose = event.target.closest('[data-pwd-close]');
        var pwdForgot = event.target.closest('[data-pwd-forgot]');
        if (pwdForgot) {
            window.location.href = '../store-app/h5/password-forgot.html?kind=pay';
            return;
        }
        if (pwdClose) {
            pendingPay = null;
            closePwdSheet();
            return;
        }
        if (pwdKeyBtn) {
            onPwdKey(pwdKeyBtn.getAttribute('data-pwd-key'));
            return;
        }
        if (event.target.closest('#rbtH5Pwd')) return;
        var payOpen = event.target.closest('[data-pay-open]');
        var payClose = event.target.closest('[data-pay-close]');
        var payPick = event.target.closest('[data-pay-method]');
        var payConfirm = event.target.closest('[data-pay-confirm]');
        if (payOpen) {
            if (payOpen.disabled) return;
            openPaySheet();
            return;
        }
        if (payClose || event.target.id === 'rbtH5Pay') {
            closePaySheet();
            return;
        }
        if (payPick) {
            payMethod = payPick.getAttribute('data-pay-method') === 'wechat' ? 'wechat' : 'alipay';
            var methods = document.querySelectorAll('#rbtH5Pay [data-pay-method]');
            Array.prototype.forEach.call(methods, function (btn) {
                btn.classList.toggle('is-on', btn === payPick);
            });
            return;
        }
        if (payConfirm) {
            submitPay();
            return;
        }
        if (event.target.closest('#rbtH5Pay')) return;
        var tabBtn = event.target.closest('[data-tab]');
        var repayView = event.target.closest('[data-repay-view]');
        var billTabBtn = event.target.closest('[data-bill-tab]');
        var billBtn = event.target.closest('[data-bill]');
        var billFirst = event.target.closest('[data-bill-first]');
        var backRepay = event.target.closest('[data-back-repay]');
        var switchStore = event.target.closest('[data-switch-store]');
        if (tabBtn) {
            tab = tabBtn.getAttribute('data-tab') || 'home';
            screen = tab === 'repay' ? 'repay' : (tab === 'mine' ? 'mine' : 'list');
            render();
            return;
        }
        if (repayView) {
            repayFilter = repayView.getAttribute('data-repay-view') === 'done' ? 'done' : 'pending';
            tab = 'repay';
            screen = 'repay';
            render();
            return;
        }
        if (billTabBtn) {
            billTab = billTabBtn.getAttribute('data-bill-tab') === 'daily' ? 'daily' : 'base';
            render();
            return;
        }
        if (billFirst || billBtn) {
            var code = billBtn ? billBtn.getAttribute('data-bill') : '';
            if (!code) {
                var first = repayDemands()[0];
                code = first ? first.code : '';
            }
            if (!code) return;
            billCode = code;
            billTab = 'base';
            tab = 'repay';
            screen = 'bill';
            render();
            return;
        }
        if (backRepay) {
            tab = 'repay';
            screen = 'repay';
            render();
            return;
        }
        if (switchStore && window.RbtH5StoreLogin) {
            window.RbtH5StoreLogin.logout();
            return;
        }
        var entry = event.target.closest('[data-entry]');
        var create = event.target.closest('[data-create]');
        var back = event.target.closest('[data-back]');
        var pkgButton = event.target.closest('[data-package]');
        var cancel = event.target.closest('[data-cancel]');
        var sign = event.target.closest('[data-sign]');
        var confirmSign = event.target.closest('[data-confirm-sign]');
        var nextStep = event.target.closest('[data-next]');
        var publish = event.target.closest('[data-publish]');
        var cycleBtn = event.target.closest('[data-cycle]');
        var methodBtn = event.target.closest('[data-method]');
        var periodBtn = event.target.closest('[data-period]');
        var ratioHelp = event.target.closest('[data-ratio-help]');
        var helpWraps = document.querySelectorAll('.rbt-h5-help-wrap');
        if (ratioHelp) {
            var wrap = ratioHelp.closest('.rbt-h5-help-wrap');
            var tip = wrap && wrap.querySelector('.rbt-h5-help-tip');
            var willOpen = tip && tip.hasAttribute('hidden');
            Array.prototype.forEach.call(helpWraps, function (item) {
                item.classList.remove('is-open');
                var btn = item.querySelector('[data-ratio-help]');
                var pop = item.querySelector('.rbt-h5-help-tip');
                if (btn) btn.setAttribute('aria-expanded', 'false');
                if (pop) pop.setAttribute('hidden', '');
            });
            if (willOpen && wrap && tip) {
                wrap.classList.add('is-open');
                tip.removeAttribute('hidden');
                ratioHelp.setAttribute('aria-expanded', 'true');
            }
            return;
        }
        Array.prototype.forEach.call(helpWraps, function (item) {
            item.classList.remove('is-open');
            var btn = item.querySelector('[data-ratio-help]');
            var pop = item.querySelector('.rbt-h5-help-tip');
            if (btn) btn.setAttribute('aria-expanded', 'false');
            if (pop) pop.setAttribute('hidden', '');
        });
        if (entry && entry.getAttribute('data-entry') === 'rbt') {
            screen = 'list';
            render();
            return;
        }
        if (create) return;
        if (back) {
            screen = back.getAttribute('data-back');
            if (screen === 'packages') {
                clearPicked();
                clearInstallmentChoice();
            }
            if (screen === 'skus') clearInstallmentChoice();
            render();
            return;
        }
        if (pkgButton) {
            packageCode = pkgButton.getAttribute('data-package');
            clearPicked();
            clearInstallmentChoice();
            screen = 'skus';
            render();
            return;
        }
        if (cycleBtn) {
            repayCycle = cycleBtn.getAttribute('data-cycle') || '';
            repayMethod = '';
            repayPeriod = '';
            render();
            return;
        }
        if (methodBtn) {
            repayMethod = methodBtn.getAttribute('data-method') || '';
            repayPeriod = '';
            render();
            return;
        }
        if (periodBtn) {
            repayPeriod = periodBtn.getAttribute('data-period') || '';
            render();
            return;
        }
        if (nextStep) {
            if (blockUnpaidDeposit()) return;
            if (blockDemandCount()) return;
            if (blockNoAvailableQuota()) return;
            var nextPkg = findPackage(packageCode);
            var nextLines = nextPkg ? selectedLines(nextPkg) : [];
            if (!nextPkg) {
                toast('请选择商品包');
                return;
            }
            if (!nextLines.length) {
                toast('请勾选商品');
                return;
            }
            var nextError = publishInstallmentError(nextPkg, nextLines);
            if (nextError) {
                toast(nextError);
                return;
            }
            clearInstallmentChoice();
            screen = 'installment';
            render();
            return;
        }
        var qtyMinus = event.target.closest('[data-qty-minus]');
        var qtyPlus = event.target.closest('[data-qty-plus]');
        if (qtyMinus || qtyPlus) {
            var qtyCode = (qtyMinus || qtyPlus).getAttribute(qtyMinus ? 'data-qty-minus' : 'data-qty-plus');
            var currentQty = qtyOf(qtyCode);
            var nextQty = qtyPlus && currentQty < 1 ? 1 : (currentQty > 0 ? currentQty : 1) + (qtyMinus ? -1 : 1);
            setQty(qtyCode, nextQty);
            render();
            return;
        }
        var skuCard = event.target.closest('.rbt-h5-sku');
        if (skuCard && !event.target.closest('[data-qty-box]') && !event.target.closest('input[type="checkbox"]')) {
            var skuBox = skuCard.querySelector('[data-sku]');
            if (skuBox) {
                skuBox.checked = !skuBox.checked;
                skuBox.dispatchEvent(new Event('change', { bubbles: true }));
            }
            return;
        }
        if (confirmSign) {
            var signedCode = confirmSign.getAttribute('data-confirm-sign');
            var signApi = window.RbtDemandData;
            var signResult = signApi && typeof signApi.signDemand === 'function'
                ? signApi.signDemand(signedCode, { role: 'store', code: account && account.code, name: account && account.name }, confirmSign.getAttribute('data-contract-key'))
                : { ok: false };
            if (signResult && signResult.ok && signResult.done) toast('各方已完成签署，系统已自动划款，需求进入发货中');
            else if (signResult && signResult.ok) toast('签署成功');
            else if (signResult && signResult.reason === 'signed') toast('你已签署');
            else toast('当前不能签署');
            render();
            return;
        }
        var openShip = event.target.closest('[data-open-ship]');
        if (openShip) {
            detailCode = openShip.getAttribute('data-open-ship') || '';
            detailFocusShip = true;
            screen = 'detail';
            render();
            return;
        }
        var confirmRecv = event.target.closest('[data-confirm-recv]');
        if (confirmRecv) {
            var shipId = confirmRecv.getAttribute('data-confirm-recv') || '';
            if (screen === 'detail') {
                openRecvConfirm(shipId);
                return;
            }
            submitRecv(receiveCode, shipId);
            return;
        }
        if (sign) {
            signCode = sign.getAttribute('data-sign') || '';
            screen = 'sign';
            render();
            return;
        }
        if (cancel) {
            var code = cancel.getAttribute('data-cancel');
            var list = demands();
            var target = null;
            list.some(function (item) {
                if (item.code === code && item.storeCode === account.code) {
                    target = item;
                    return true;
                }
                return false;
            });
            if (!canCancelDemand(target)) {
                toast('当前状态不允许取消');
                return;
            }
            var cancelBy = (account.person || account.name || '门店').split('、')[0];
            if (window.RbtDemandData && typeof window.RbtDemandData.setStatus === 'function') {
                window.RbtDemandData.setStatus(code, '已作废', cancelBy);
            } else {
                target.status = '已作废';
                target.updater = cancelBy;
                target.updatedAt = nowText();
                releaseDemandQuota(target);
                saveDemands(list);
            }
            toast('需求已作废');
            render();
            return;
        }
        var demandCard = event.target.closest('[data-demand]');
        if (demandCard && !event.target.closest('button')) {
            detailCode = demandCard.getAttribute('data-demand') || '';
            detailFocusShip = false;
            screen = 'detail';
            render();
            return;
        }
        if (publish) {
            if (blockUnpaidDeposit()) return;
            if (blockDemandCount()) return;
            if (blockNoAvailableQuota()) return;
            var pkg = findPackage(packageCode);
            var lines = pkg ? selectedLines(pkg) : [];
            if (!pkg) {
                toast('请选择商品包');
                return;
            }
            if (!lines.length) {
                toast('请勾选商品');
                return;
            }
            var amountValue = sumLines(lines);
            var publishPlans = matchedInstallments(pkg, amountValue);
            var publishPlan = ensureInstallmentChoice(publishPlans);
            if (!publishPlan || !repayCycle) {
                toast('请选择结算周期');
                return;
            }
            if (!repayMethod) {
                toast('请选择结算方式');
                return;
            }
            var isRatioPay = repayMethod === '比例付';
            if (!isRatioPay && !repayPeriod) {
                toast('请选择结算期数');
                return;
            }
            var publishPayable = payableAmount(amountValue, publishPlan, isRatioPay ? '' : repayPeriod);
            var publishDaily = isRatioPay ? null : estimateDailyPay(amountValue, publishPlan, repayPeriod);
            if (publishPayable == null) {
                toast('总金额计算失败');
                return;
            }
            var publishRatios = isRatioPay ? channelRatiosOf(publishPlan) : null;
            if (isRatioPay && !publishRatios) {
                toast('请先在产品配置中维护各渠道结算比例');
                return;
            }
            var quota = accountQuota();
            var available = quota ? quota.available : 0;
            if (cents(amountValue) > cents(available)) {
                toast('商品金额须小于等于可用额度');
                return;
            }
            var all = demands();
            var publishAt = nowText();
            var publisher = (account.person || account.name || '门店').split('、')[0];
            var created = {
                code: nextCode(all),
                storeCode: account.code,
                storeName: account.name,
                packageCode: pkg.code,
                packageName: pkg.name,
                skus: lines.map(function (line) {
                    return { code: line.code, name: line.name, salePrice: line.salePrice, qty: line.qty };
                }),
                goodsAmount: money(amountValue),
                serviceFee: money(Number(money(publishPayable)) - Number(money(amountValue))),
                amount: money(publishPayable),
                installmentCode: publishPlan.code,
                installmentName: publishPlan.name,
                repayCycle: publishPlan.repayCycle,
                repayMethod: publishPlan.repayMethod,
                repayPeriod: isRatioPay ? '' : String(repayPeriod),
                settleRatios: publishRatios ? JSON.parse(JSON.stringify(publishRatios)) : [],
                dailyAmount: publishDaily || '',
                status: '待接单',
                quotaHeld: false,
                creator: publisher,
                createdAt: publishAt,
                updater: publisher,
                updatedAt: publishAt,
                logs: [{ time: publishAt, operator: publisher, content: '发布需求单' }]
            };
            occupyDemandQuota(created);
            all.unshift(created);
            saveDemands(all);
            screen = 'list';
            packageCode = '';
            clearPicked();
            clearInstallmentChoice();
            toast('需求已发布');
            render();
            return;
        }
    });

    document.getElementById('rbtH5App').addEventListener('change', function (event) {
        var qtyInput = event.target.closest('[data-qty-input]');
        if (qtyInput) {
            setQty(qtyInput.getAttribute('data-qty-input'), qtyInput.value);
            render();
            return;
        }
        var all = event.target.closest('[data-all]');
        var one = event.target.closest('[data-sku]');
        var pkg = findPackage(packageCode);
        if (!pkg) return;
        if (all) {
            if (all.checked) {
                pkg.skus.forEach(function (line) {
                    if (!isPicked(line.code)) setQty(line.code, 1);
                });
            } else {
                clearPicked();
            }
            render();
            return;
        }
        if (one) {
            var code = one.getAttribute('data-sku');
            if (one.checked) setQty(code, 1);
            else setQty(code, 0);
            render();
        }
    });

    function mountRepayDemo() {
        if (document.getElementById('rbtRepayDemo')) return;
        var current = readRepayDemo();
        var panel = document.createElement('div');
        panel.id = 'rbtRepayDemo';
        panel.className = 'rbt-repay-demo';
        panel.innerHTML =
            '<div class="rbt-repay-demo__title">履约验收开关</div>' +
            '<label class="rbt-repay-demo__row">场景' +
            '<select id="rbtRepayDemoScene">' +
            REPAY_DEMO_SCENES.map(function (scene) {
                return '<option value="' + scene.id + '"' + (scene.id === current ? ' selected' : '') + '>' + scene.label + '</option>';
            }).join('') +
            '</select></label>' +
            '<p class="rbt-repay-demo__hint">履约中的每日履行按所得佣金乘结算比例生成。切到无每日履行时不列出。只影响履约页，不改需求单状态。</p>' +
            '<button type="button" class="rbt-repay-demo__apply" id="rbtRepayDemoApply">应用并刷新</button>';
        document.body.appendChild(panel);
        document.getElementById('rbtRepayDemoApply').addEventListener('click', function () {
            var select = document.getElementById('rbtRepayDemoScene');
            var next = select ? select.value : current;
            try { localStorage.setItem(REPAY_DEMO_KEY, next); } catch (e) {}
            window.location.reload();
        });
    }

    mountRepayDemo();

    window.RbtH5StoreApp = { open: open, close: close };
})();
