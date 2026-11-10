/* RBT 需求单详情：在当前页弹出，展示需求基础信息、门店额度、担保门店、商品明细与关联合同。 */
(function () {
    function esc(value) {
        return String(value == null || value === '' ? '—' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function blank(value) {
        return value == null || String(value).trim() === '';
    }

    function show(value) {
        return blank(value) ? '—' : String(value);
    }

    function money(value) {
        if (blank(value) && value !== 0) return '—';
        var num = Number(String(value).replace(/^¥/, ''));
        if (!isFinite(num)) return '—';
        return '¥' + num.toLocaleString('zh-CN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function statusKind(status) {
        if (status === '已完成' || status === '已签署') return 'success';
        if (status === '已取消' || status === '已驳回') return 'neutral';
        if (status === '待审核' || status === '待复核' || status === '待签署') return 'warning';
        if (status === '支付中') return 'danger';
        return 'neutral';
    }

    function storeByCode(code) {
        var api = window.RbtStoreData;
        if (!api || typeof api.get !== 'function' || blank(code)) return null;
        return api.get(code) || null;
    }

    function quotaOf(store) {
        var api = window.RbtStoreData;
        if (!api || typeof api.quotaOf !== 'function' || !store) {
            return { total: null, occupied: null, available: null };
        }
        return api.quotaOf(store);
    }

    function cell(label, valueHtml) {
        return (
            '<div class="supplier-detail-cell"><div class="supplier-detail-cell__label">' +
            esc(label) +
            '</div><div class="supplier-detail-cell__body">' +
            valueHtml +
            '</div></div>'
        );
    }

    function textCell(label, value) {
        return cell(label, esc(value));
    }

    function statusCell(label, value) {
        return cell(
            label,
            '<span class="mdm-detail-tag mdm-detail-tag--' +
                statusKind(value) +
                '">' +
                esc(value || '—') +
                '</span>'
        );
    }

    function periodLabel(item) {
        return item && item.repayMethod === '比例付' ? '结算比例' : '结算期数';
    }

    function periodValue(item) {
        if (!item) return '—';
        if (item.repayMethod === '比例付') return show(item.repayPeriod);
        if (blank(item.repayPeriod)) return '—';
        return String(item.repayPeriod).indexOf('期') >= 0
            ? String(item.repayPeriod)
            : String(item.repayPeriod) + '期';
    }

    function dailyValue(item) {
        if (!item || item.repayMethod === '比例付') return '—';
        return money(item.dailyAmount);
    }

    function storeQuotaSection(item) {
        var store = storeByCode(item && item.storeCode);
        var quota = quotaOf(store);
        return (
            '<div class="supplier-detail-section-title">门店额度</div><div class="supplier-detail-grid">' +
            textCell('门店总额度', money(quota.total)) +
            textCell('已占用', money(quota.occupied)) +
            textCell('可用额度', money(quota.available)) +
            '</div>'
        );
    }

    function guarantorTable(items) {
        var head = '<tr><th>门店编码</th><th>门店名称</th><th class="is-money">总额度</th><th class="is-money">已占用</th><th class="is-money">可用额度</th></tr>';
        var body = !items || !items.length
            ? '<tr><td class="is-empty" colspan="5">暂无担保门店</td></tr>'
            : items.map(function (item) {
                var store = storeByCode(item && item.code);
                var quota = quotaOf(store);
                return '<tr><td>' + esc(item && item.code) + '</td><td>' + esc(item && item.name) +
                    '</td><td class="is-money">' + esc(money(quota.total)) +
                    '</td><td class="is-money">' + esc(money(quota.occupied)) +
                    '</td><td class="is-money">' + esc(money(quota.available)) + '</td></tr>';
            }).join('');
        return '<div class="rbt-demand-table-wrap"><table class="rbt-demand-table"><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>';
    }

    function skuTable(items) {
        var head = '<tr><th>商品编码</th><th>商品名称</th><th class="is-money">售价</th><th class="is-money">数量</th></tr>';
        var body = !items || !items.length
            ? '<tr><td class="is-empty" colspan="4">暂无商品</td></tr>'
            : items.map(function (item) {
                var qty = Number(item && item.qty);
                if (!isFinite(qty) || qty < 1) qty = 1;
                return '<tr><td>' + esc(item && item.code) + '</td><td>' + esc(item && item.name) +
                    '</td><td class="is-money">' + esc(money(item && item.salePrice)) +
                    '</td><td class="is-money">' + esc(qty) + '</td></tr>';
            }).join('');
        return '<div class="rbt-demand-table-wrap"><table class="rbt-demand-table"><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>';
    }

    function canShowContract(item) {
        var api = window.RbtDemandData;
        if (api && typeof api.hasContractStatus === 'function') {
            return api.hasContractStatus(item && item.status);
        }
        return ['待签署', '待复核', '支付中', '已完成'].indexOf(item && item.status) >= 0;
    }

    function resolveSignStatus(item, contract) {
        if (contract && contract.signStatus) return contract.signStatus;
        var api = window.RbtDemandData;
        if (api && typeof api.contractSignStatus === 'function') {
            return api.contractSignStatus(item && item.status) || '—';
        }
        return item && item.status === '待签署' ? '待签署' : '已签署';
    }

    function contractBody(item, contract) {
        var guarantorNames = (item.guarantors || []).map(function (row) {
            return row && row.name ? row.name : '';
        }).filter(Boolean).join('、') || '无';
        var skuLines = (item.skus || []).map(function (row, index) {
            var qty = Number(row && row.qty);
            if (!isFinite(qty) || qty < 1) qty = 1;
            return (index + 1) + '. ' + show(row && row.name) + '（' + show(row && row.code) + '）×' + qty +
                '，售价 ' + money(row && row.salePrice);
        }).join('\n') || '无';
        var signed = resolveSignStatus(item, contract) === '已签署';
        return [
            contract.name || '货款分期合作合同',
            '',
            '合同编号：' + show(contract.code),
            '关联需求单：' + show(item.code),
            '签署状态：' + resolveSignStatus(item, contract),
            '',
            '甲方（门店）：' + show(item.storeName) + '（' + show(item.storeCode) + '）',
            '担保门店：' + guarantorNames,
            '商品包：' + show(item.packageName) + '（' + show(item.packageCode) + '）',
            '产品：' + show(item.installmentName) + '（' + show(item.installmentCode) + '）',
            '货款总金额：' + money(item.amount),
            '结算周期：' + show(item.repayCycle),
            '结算方式：' + show(item.repayMethod),
            periodLabel(item) + '：' + periodValue(item),
            item.repayMethod === '比例付' ? '' : ('预估每日结算货款：' + dailyValue(item)),
            '',
            '商品明细：',
            skuLines,
            '',
            '双方确认按上述条件执行货款分期结算。',
            signed ? '本合同已完成签署。' : '本合同待各方签署后生效。',
            '',
            '创建人：' + show(item.creator),
            '创建时间：' + show(item.createdAt)
        ].filter(function (line, index, arr) {
            return !(line === '' && arr[index - 1] === '');
        }).join('\n');
    }

    function closePreview() {
        document.querySelectorAll('[data-rbt-demand-contract-preview]').forEach(function (node) {
            node.remove();
        });
        document.removeEventListener('keydown', onPreviewKey);
    }

    function onPreviewKey(event) {
        if (event.key === 'Escape') {
            event.stopPropagation();
            closePreview();
        }
    }

    function openPreview(item, contract) {
        if (!item || !contract) return;
        closePreview();
        var mask = document.createElement('div');
        mask.className = 'rbt-demand-contract-mask';
        mask.setAttribute('data-rbt-demand-contract-preview', '1');
        mask.innerHTML =
            '<div class="rbt-demand-contract" role="dialog" aria-modal="true" aria-label="合同预览">' +
            '<div class="rbt-demand-contract__head">' +
            '<div><div class="rbt-demand-contract__eyebrow">合同预览</div>' +
            '<div class="rbt-demand-contract__title">' + esc(contract.name) + '</div>' +
            '<div class="rbt-demand-contract__meta">' + esc(contract.code) + ' · ' + esc(resolveSignStatus(item, contract)) + '</div></div>' +
            '<button type="button" class="rbt-demand-contract__close" data-rbt-demand-contract-close aria-label="关闭">&times;</button></div>' +
            '<pre class="rbt-demand-contract__paper">' + esc(contractBody(item, contract)) + '</pre></div>';
        document.body.appendChild(mask);
        mask.addEventListener('click', function (event) {
            if (event.target === mask) closePreview();
        });
        mask.querySelector('[data-rbt-demand-contract-close]').addEventListener('click', closePreview);
        document.addEventListener('keydown', onPreviewKey);
    }

    function contractSection(item) {
        var contract = item && item.contract;
        var showValue = canShowContract(item) && contract && contract.code;
        var inner = showValue
            ? '<div class="supplier-detail-grid">' +
                cell(
                    '合同编号',
                    '<button type="button" class="rbt-demand-contract-link" data-rbt-demand-contract-open>' +
                        esc(contract.code) +
                        '</button>'
                ) +
                cell(
                    '合同名称',
                    '<button type="button" class="rbt-demand-contract-link" data-rbt-demand-contract-open>' +
                        esc(contract.name) +
                        '</button>'
                ) +
                statusCell('签署状态', resolveSignStatus(item, contract)) +
                '</div>'
            : '<div class="rbt-demand-empty">暂无关联合同</div>';
        return '<div class="supplier-detail-section-title">关联合同</div>' + inner;
    }

    function closeDrawer() {
        closePreview();
        document.querySelectorAll('[data-rbt-demand-drawer]').forEach(function (node) {
            node.remove();
        });
        document.removeEventListener('keydown', onDrawerKey);
    }

    function onDrawerKey(event) {
        if (event.key === 'Escape') {
            if (document.querySelector('[data-rbt-demand-contract-preview]')) {
                closePreview();
                return;
            }
            closeDrawer();
        }
    }

    function open(item) {
        if (!item) return;
        closeDrawer();
        var backdrop = document.createElement('div');
        backdrop.className = 'store-drawer-backdrop';
        backdrop.setAttribute('data-rbt-demand-drawer', '1');
        var drawer = document.createElement('aside');
        drawer.className = 'store-drawer store-drawer--interactive store-drawer--store-wide';
        drawer.setAttribute('data-rbt-demand-drawer', '1');
        drawer.setAttribute('role', 'dialog');
        drawer.setAttribute('aria-modal', 'true');
        drawer.setAttribute('aria-label', '需求单详情');
        drawer.innerHTML =
            '<div class="store-drawer__header"><h2 class="store-drawer__title">需求单详情</h2>' +
            '<button type="button" class="store-drawer__close" data-rbt-demand-close aria-label="关闭">&times;</button></div>' +
            '<div class="store-drawer__hero store-drawer__hero--elevated">' +
            '<div class="store-drawer__name-row"><span class="store-drawer__name">' + esc(item.code) + '</span>' +
            '<span class="mdm-detail-tag mdm-detail-tag--' + statusKind(item.status) + '">' + esc(item.status || '—') + '</span></div>' +
            '<div class="store-drawer__meta">门店：' + esc(item.storeName) + '（' + esc(item.storeCode) + '）</div>' +
            '<div class="store-drawer__meta">商品包：' + esc(item.packageName) + '（' + esc(item.packageCode) + '）</div></div>' +
            '<div class="store-drawer__body"><div class="supplier-detail-tab">' +
            storeQuotaSection(item) +
            '<div class="supplier-detail-section-title">基础信息</div><div class="supplier-detail-grid">' +
            textCell('需求单号', item.code) +
            statusCell('状态', item.status) +
            textCell('门店', show(item.storeName) + '（' + show(item.storeCode) + '）') +
            textCell('商品包', show(item.packageName) + '（' + show(item.packageCode) + '）') +
            textCell('货款总金额', money(item.amount)) +
            textCell('产品', show(item.installmentName) + '（' + show(item.installmentCode) + '）') +
            textCell('结算周期', item.repayCycle) +
            textCell('结算方式', item.repayMethod) +
            textCell(periodLabel(item), periodValue(item)) +
            textCell('预估每日结算货款', dailyValue(item)) +
            textCell('创建人', item.creator) +
            textCell('创建时间', item.createdAt) +
            textCell('更新人', item.updater) +
            textCell('更新时间', item.updatedAt) +
            '</div>' +
            '<div class="supplier-detail-section-title">担保门店</div>' +
            guarantorTable(item.guarantors) +
            '<div class="supplier-detail-section-title">商品明细</div>' +
            skuTable(item.skus) +
            contractSection(item) +
            '</div></div>';
        document.body.appendChild(backdrop);
        document.body.appendChild(drawer);
        backdrop.addEventListener('click', closeDrawer);
        drawer.querySelector('[data-rbt-demand-close]').addEventListener('click', closeDrawer);
        drawer.querySelectorAll('[data-rbt-demand-contract-open]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                openPreview(item, item.contract);
            });
        });
        document.addEventListener('keydown', onDrawerKey);
    }

    window.RbtDemandDetail = { open: open, close: closeDrawer };
})();
