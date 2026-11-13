/* RBT 采购单 / 销售单详情抽屉。 */
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
        if (status === '已完成') return 'success';
        if (status === '待收货') return 'warning';
        return 'neutral';
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

    function linkCell(label, value, attr, attrValue) {
        if (blank(value)) return textCell(label, '—');
        return cell(
            label,
            '<button type="button" class="rbt-demand-contract-link" ' + attr + '="' + esc(attrValue || value) + '">' +
                esc(value) +
                '</button>'
        );
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

    function skuTable(lines) {
        var head = '<tr><th>商品编码</th><th>商品名称</th><th class="is-money">商品售价</th><th>数量</th><th class="is-money">金额</th></tr>';
        if (!lines || !lines.length) {
            return '<div class="rbt-demand-table-wrap"><table class="rbt-demand-table"><thead>' + head +
                '</thead><tbody><tr><td class="is-empty" colspan="5">暂无商品</td></tr></tbody></table></div>';
        }
        var body = lines.map(function (line) {
            return '<tr><td>' + esc(line.code) + '</td><td>' + esc(line.name) +
                '</td><td class="is-money">' + esc(line.salePrice) +
                '</td><td>' + esc(line.qty) +
                '</td><td class="is-money">' + esc(line.amount) + '</td></tr>';
        }).join('');
        return '<div class="rbt-demand-table-wrap"><table class="rbt-demand-table"><thead>' + head +
            '</thead><tbody>' + body + '</tbody></table></div>';
    }

    function titleOf(item) {
        if (item && item.kind === 'purchase') return '采购单详情';
        return '销售单详情';
    }

    function bodyOf(item) {
        if (!item) return '';
        var peerLabel = item.kind === 'sales' ? '对应采购单' : '对应销售单';
        return (
            '<div class="supplier-detail-tab">' +
            '<div class="supplier-detail-section-title">基础信息</div><div class="supplier-detail-grid">' +
            textCell('单号', item.code) +
            statusCell('状态', item.status) +
            linkCell('来源需求单', item.demandCode, 'data-rbt-open-demand', item.demandCode) +
            textCell('买方', item.buyerName) +
            textCell('卖方', item.sellerName) +
            textCell('付款方', item.payorName) +
            textCell('收货方', item.receiveName) +
            textCell('实际发货方', item.shipperName) +
            textCell('金额', money(item.amount)) +
            linkCell(peerLabel, item.peerCode, 'data-rbt-trade-open', item.peerCode) +
            textCell('创建人', item.creator) +
            textCell('创建时间', item.createdAt) +
            '</div>' +
            '<div class="supplier-detail-section-title">商品明细</div>' +
            skuTable(item.lines) +
            '</div>'
        );
    }

    function closeDrawer() {
        document.querySelectorAll('[data-rbt-trade-drawer]').forEach(function (node) {
            node.remove();
        });
        document.removeEventListener('keydown', onDrawerKey);
    }

    function onDrawerKey(event) {
        if (event.key === 'Escape') closeDrawer();
    }

    function bindEvents(drawer) {
        drawer.querySelectorAll('[data-rbt-trade-open]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                openByCode(btn.getAttribute('data-rbt-trade-open'));
            });
        });
        drawer.querySelectorAll('[data-rbt-open-demand]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var code = btn.getAttribute('data-rbt-open-demand');
                var demandApi = window.RbtDemandData;
                var detailApi = window.RbtDemandDetail;
                if (!demandApi || typeof demandApi.get !== 'function' || !detailApi || typeof detailApi.open !== 'function') return;
                var demand = demandApi.get(code);
                if (!demand) return;
                closeDrawer();
                detailApi.open(demand);
            });
        });
    }

    function open(item) {
        if (!item || item.kind === 'inbound') return;
        closeDrawer();
        var backdrop = document.createElement('div');
        backdrop.className = 'store-drawer-backdrop';
        backdrop.setAttribute('data-rbt-trade-drawer', '1');
        var drawer = document.createElement('aside');
        drawer.className = 'store-drawer store-drawer--interactive store-drawer--store-wide';
        drawer.setAttribute('data-rbt-trade-drawer', '1');
        drawer.setAttribute('role', 'dialog');
        drawer.setAttribute('aria-modal', 'true');
        drawer.setAttribute('aria-label', titleOf(item));
        drawer.innerHTML =
            '<div class="store-drawer__header"><h2 class="store-drawer__title">' + esc(titleOf(item)) + '</h2>' +
            '<button type="button" class="store-drawer__close" data-rbt-trade-close aria-label="关闭">&times;</button></div>' +
            '<div class="store-drawer__hero store-drawer__hero--elevated">' +
            '<div class="store-drawer__name-row"><span class="store-drawer__name">' + esc(item.code) + '</span>' +
            '<span class="mdm-detail-tag mdm-detail-tag--' + statusKind(item.status) + '">' + esc(item.status || '—') + '</span></div>' +
            '<div class="store-drawer__meta">来源需求单：' + esc(item.demandCode || '—') + '</div>' +
            '<div class="store-drawer__meta">收货方：' + esc(item.receiveName || '—') + '</div>' +
            '</div>' +
            '<div class="store-drawer__body">' + bodyOf(item) + '</div>';
        document.body.appendChild(backdrop);
        document.body.appendChild(drawer);
        backdrop.addEventListener('click', closeDrawer);
        drawer.querySelector('[data-rbt-trade-close]').addEventListener('click', closeDrawer);
        document.addEventListener('keydown', onDrawerKey);
        bindEvents(drawer);
    }

    function openByCode(code) {
        var api = window.RbtTradeDocs;
        if (!api || typeof api.getByCode !== 'function') return;
        open(api.getByCode(code));
    }

    window.RbtTradeDetail = { open: open, openByCode: openByCode, close: closeDrawer };
})();
