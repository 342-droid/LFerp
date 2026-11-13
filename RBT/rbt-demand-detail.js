/* RBT 需求单详情：在当前页弹出，展示需求基础信息、门店额度、商品明细与关联合同。 */
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

    function receivableOf(item, key) {
        var api = window.RbtDemandData;
        var pack = api && typeof api.receivables === 'function' ? api.receivables(item) : null;
        return pack && pack[key];
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
        if (status === '已作废' || status === '已取消' || status === '已驳回') return 'neutral';
        if (status === '待审核' || status === '待复核' || status === '待确认签约' || status === '待签署') return 'warning';
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
        var ratioApi = window.RbtSettleRatio;
        if (item.repayMethod === '比例付') {
            var lines = ratioApi && typeof ratioApi.textLines === 'function' ? ratioApi.textLines(item) : '';
            return lines || '—';
        }
        if (blank(item.repayPeriod)) return '—';
        return String(item.repayPeriod).indexOf('期') >= 0
            ? String(item.repayPeriod)
            : String(item.repayPeriod) + '期';
    }

    function settleRatioSection(item) {
        var ratioApi = window.RbtSettleRatio;
        var html = ratioApi && typeof ratioApi.tableHtml === 'function' ? ratioApi.tableHtml(item) : '';
        if (!html) return '';
        var edit = window.RbtSettleRatio && typeof window.RbtSettleRatio.canEdit === 'function' && window.RbtSettleRatio.canEdit(item)
            ? '<button type="button" class="rbt-demand-contract-link" data-rbt-ratio-edit>修改结算比例</button>'
            : '';
        return '<div class="supplier-detail-section-title">结算比例' + edit + '</div>' + html;
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

    function amountTable(item) {
        var cells = [
            money(item && item.goodsAmount),
            money(item && item.serviceFee),
            money(item && item.amount),
            money(receivableOf(item, 'trader')),
            money(receivableOf(item, 'lengfeng')),
            money(receivableOf(item, 'provider'))
        ];
        var head = '<tr><th class="is-money">商品金额</th><th class="is-money">服务费</th><th class="is-money">总金额</th>' +
            '<th class="is-money">贸易商应收</th><th class="is-money">冷丰应收</th><th class="is-money">服务商应收</th></tr>';
        var body = '<tr>' + cells.map(function (value) {
            return '<td class="is-money">' + esc(value) + '</td>';
        }).join('') + '</tr>';
        return '<div class="rbt-demand-table-wrap"><table class="rbt-demand-table"><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>';
    }

    function canShowContract(item) {
        if (item && item.contractsVoided) return true;
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

    function agreementPartyLine(party, contract) {
        var name = party && party.name ? party.name : (party && party.role === 'trader' ? '待接单' : '—');
        var extra = party && party.code && party.role !== 'trader' && party.role !== 'supply' ? '（' + party.code + '）' : '';
        var state = party && party.signedAt ? '已签署 ' + party.signedAt : (party && party.role === 'trader' && !party.name ? '待接单' : '待签署');
        if (contract && contract.signStatus === '已作废') state = '已作废';
        return (party && party.roleLabel ? party.roleLabel : '签署方') + '：' + name + extra + '，' + state;
    }

    function contractBody(item, contract) {
        var skuLines = (item.skus || []).map(function (row, index) {
            var qty = Number(row && row.qty);
            if (!isFinite(qty) || qty < 1) qty = 1;
            return (index + 1) + '. ' + show(row && row.name) + '（' + show(row && row.code) + '）×' + qty +
                '，售价 ' + money(row && row.salePrice);
        }).join('\n') || '无';
        var parties = (contract && contract.parties || []).map(function (party) {
            return agreementPartyLine(party, contract);
        });
        var signed = resolveSignStatus(item, contract) === '已签署';
        return [
            contract.name || '协议',
            '',
            '合同编号：' + show(contract.code),
            '关联需求单：' + show(item.code),
            '签署状态：' + resolveSignStatus(item, contract),
            '',
            '签署方：'
        ].concat(parties.length ? parties : ['无']).concat([
            '',
            '商品包：' + show(item.packageName) + '（' + show(item.packageCode) + '）',
            '商品金额：' + money(item.goodsAmount),
            '服务费：' + money(item.serviceFee),
            '总金额：' + money(item.amount),
            '结算周期：' + show(item.repayCycle),
            '结算方式：' + show(item.repayMethod),
            periodLabel(item) + '：' + (String(periodValue(item)).indexOf('\n') >= 0 ? '\n' + periodValue(item) : periodValue(item)),
            '',
            '商品明细：',
            skuLines,
            '',
            resolveSignStatus(item, contract) === '已作废'
                ? '本合同已作废。'
                : (signed ? '本合同已完成签署。' : '本合同待双方签署后生效。'),
            '',
            '创建人：' + show(item.creator),
            '创建时间：' + show(item.createdAt)
        ]).filter(function (line, index, arr) {
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

    function agreementContracts(item) {
        var api = window.RbtDemandData;
        if (!canShowContract(item) || !api || typeof api.signContracts !== 'function') return [];
        return api.signContracts(item);
    }

    function contractSection(item) {
        var contracts = agreementContracts(item);
        var head = '<tr><th>协议</th><th>编号</th><th>签署方</th><th>签署状态</th></tr>';
        var body = contracts.map(function (contract) {
            var parties = (contract.parties || []).map(function (party) {
                var name = party.name || (party.role === 'trader' ? '待接单' : '—');
                return esc(party.roleLabel) + ' ' + esc(name);
            }).join('、');
            return '<tr><td><button type="button" class="rbt-demand-contract-link" data-rbt-demand-contract-open="' + esc(contract.key) + '">' +
                esc(contract.name) + '</button></td><td>' + esc(contract.code) + '</td><td>' + parties +
                '</td><td>' + esc(contract.signStatus || '待签署') + '</td></tr>';
        }).join('');
        var inner = contracts.length
            ? '<div class="rbt-demand-table-wrap"><table class="rbt-demand-table"><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>'
            : '<div class="rbt-demand-empty">暂无关联合同</div>';
        return '<div class="supplier-detail-section-title">关联合同</div>' + inner;
    }

    function voucherSection(item) {
        var voucher = item && item.guaranteeDeposit;
        var title = '<div class="supplier-detail-section-title">担保金缴纳凭证</div>';
        if (!voucher || !voucher.voucherData) {
            return title + '<div class="rbt-demand-empty">暂无担保金缴纳凭证</div>';
        }
        var isImage = String(voucher.voucherType || '').indexOf('image/') === 0 || /^data:image\//.test(String(voucher.voucherData || ''));
        var preview = isImage
            ? '<img src="' + esc(voucher.voucherData) + '" alt="担保金缴纳凭证" style="display:block;max-width:280px;margin-top:8px;border:1px solid #eee;border-radius:6px;">'
            : '<div style="margin-top:8px;"><a href="' + esc(voucher.voucherData) + '" target="_blank" rel="noopener">查看凭证</a></div>';
        return title +
            '<div class="supplier-detail-grid">' +
            textCell('缴纳状态', voucher.paid ? '已缴纳' : '未缴纳') +
            textCell('凭证文件', voucher.voucherName) +
            textCell('上传人', voucher.uploadedBy) +
            textCell('上传时间', voucher.uploadedAt) +
            '</div>' + preview;
    }

    function relatedDocsSection(item) {
        var api = window.RbtTradeDocs;
        var docs = api && typeof api.docsOfDemand === 'function' ? api.docsOfDemand(item && item.code) : [];
        if ((!docs || !docs.length) && item && item.status !== '支付中' && item.status !== '已完成') return '';
        var title = '<div class="supplier-detail-section-title">关联购销单</div>';
        if (!docs || !docs.length) {
            return title + '<div class="rbt-demand-empty">暂无关联购销单</div>';
        }
        var head = '<tr><th>单据</th><th>单号</th><th>买方</th><th>卖方</th><th class="is-money">金额</th><th>状态</th></tr>';
        var body = docs.map(function (row) {
            var name = row.docType || '购销单';
            return '<tr><td>' + esc(name) + '</td><td><button type="button" class="rbt-demand-contract-link" data-rbt-trade-open="' +
                esc(row.code) + '">' + esc(row.code) + '</button></td><td>' +
                esc(row.buyerName || row.receivePlace) + '</td><td>' +
                esc(row.sellerName || row.supplier) + '</td><td class="is-money">' +
                money(row.amount) + '</td><td>' + esc(row.status) + '</td></tr>';
        }).join('');
        return title + '<div class="rbt-demand-table-wrap"><table class="rbt-demand-table"><thead>' + head +
            '</thead><tbody>' + body + '</tbody></table></div>';
    }

    function logPanel(item) {
        var latest = window.RbtDemandData && typeof window.RbtDemandData.get === 'function'
            ? window.RbtDemandData.get(item.code) || item
            : item;
        var logs = latest.logs || [];
        var rows = logs.length
            ? logs.map(function (row) {
                return (
                    '<tr><td>' + esc(row.content) + '</td><td class="rbt-store-log__who">' +
                    esc(row.operator) + '</td><td class="rbt-store-log__time">' +
                    esc(row.time) + '</td></tr>'
                );
            }).join('')
            : '<tr><td colspan="3" class="rbt-store-log__empty">暂无操作记录</td></tr>';
        return (
            '<div class="supplier-detail-tab"><table class="rbt-store-log"><thead><tr>' +
            '<th>变更内容</th><th class="rbt-store-log__who">变更人</th><th class="rbt-store-log__time">变更时间</th>' +
            '</tr></thead><tbody>' + rows + '</tbody></table></div>'
        );
    }

    function basePanel(item) {
        return (
            '<div class="supplier-detail-tab">' +
            storeQuotaSection(item) +
            '<div class="supplier-detail-section-title">基础信息</div><div class="supplier-detail-grid">' +
            textCell('需求单号', item.code) +
            statusCell('状态', item.status) +
            textCell('接单贸易商', item.traderName || '—') +
            textCell('服务商', item.providerName || '—') +
            textCell('接单时间', item.acceptedAt) +
            textCell('门店', show(item.storeName) + '（' + show(item.storeCode) + '）') +
            textCell('商品包', show(item.packageName) + '（' + show(item.packageCode) + '）') +
            textCell('产品', show(item.installmentName) + '（' + show(item.installmentCode) + '）') +
            textCell('结算周期', item.repayCycle) +
            textCell('结算方式', item.repayMethod) +
            (item.repayMethod === '比例付' && item.settleRatios && item.settleRatios.length ? '' : textCell(periodLabel(item), periodValue(item))) +
            textCell('创建人', item.creator) +
            textCell('创建时间', item.createdAt) +
            textCell('更新人', item.updater) +
            textCell('更新时间', item.updatedAt) +
            '</div>' +
            '<div class="supplier-detail-section-title">金额信息</div>' +
            amountTable(item) +
            settleRatioSection(item) +
            '<div class="supplier-detail-section-title">商品明细</div>' +
            skuTable(item.skus) +
            contractSection(item) +
            voucherSection(item) +
            relatedDocsSection(item) +
            '</div>'
        );
    }

    function bindBaseEvents(drawer, item) {
        var editRatio = drawer.querySelector('[data-rbt-ratio-edit]');
        if (editRatio) {
            editRatio.addEventListener('click', function () {
                var ratioApi = window.RbtSettleRatio;
                if (!ratioApi || typeof ratioApi.openEditor !== 'function') return;
                ratioApi.openEditor(item, {
                    onSaved: function (saved) {
                        open(saved);
                    }
                });
            });
        }
        var agreements = agreementContracts(item);
        drawer.querySelectorAll('[data-rbt-demand-contract-open]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var key = btn.getAttribute('data-rbt-demand-contract-open');
                var found = null;
                agreements.some(function (row) {
                    if (row.key === key) {
                        found = row;
                        return true;
                    }
                    return false;
                });
                if (found) openPreview(item, found);
            });
        });
        drawer.querySelectorAll('[data-rbt-trade-open]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var code = btn.getAttribute('data-rbt-trade-open');
                var tradeApi = window.RbtTradeDetail;
                if (!tradeApi || typeof tradeApi.openByCode !== 'function') return;
                closeDrawer();
                tradeApi.openByCode(code);
            });
        });
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
            '<div class="store-drawer__tabs store-drawer__tabs--sticky" id="rbtDemandTabs">' +
            '<button type="button" class="store-drawer__tab is-active" data-tab="base">基础信息</button>' +
            '<button type="button" class="store-drawer__tab" data-tab="logs">操作记录</button></div>' +
            '<div class="store-drawer__body" id="rbtDemandBody"></div>';
        document.body.appendChild(backdrop);
        document.body.appendChild(drawer);
        backdrop.addEventListener('click', closeDrawer);
        drawer.querySelector('[data-rbt-demand-close]').addEventListener('click', closeDrawer);
        document.addEventListener('keydown', onDrawerKey);
        var tabs = document.getElementById('rbtDemandTabs');
        var body = document.getElementById('rbtDemandBody');
        function show(id) {
            tabs.querySelectorAll('.store-drawer__tab').forEach(function (button) {
                button.classList.toggle('is-active', button.getAttribute('data-tab') === id);
            });
            body.innerHTML = id === 'logs' ? logPanel(item) : basePanel(item);
            if (id !== 'logs') bindBaseEvents(drawer, item);
        }
        tabs.addEventListener('click', function (event) {
            var button = event.target.closest('[data-tab]');
            if (!button) return;
            show(button.getAttribute('data-tab'));
        });
        show('base');
    }

    window.RbtDemandDetail = { open: open, close: closeDrawer };
})();
