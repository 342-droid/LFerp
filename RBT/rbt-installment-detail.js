/* RBT 产品详情：在当前页弹出，展示产品资料。 */
(function () {
    function esc(value) {
        return String(value == null || value === '' ? '—' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function cell(label, value) {
        return (
            '<div class="supplier-detail-cell"><div class="supplier-detail-cell__label">' +
            esc(label) +
            '</div><div class="supplier-detail-cell__body">' +
            esc(value) +
            '</div></div>'
        );
    }

    function statusCell(value) {
        var kind = value === '禁用' ? 'danger' : 'success';
        return (
            '<div class="supplier-detail-cell"><div class="supplier-detail-cell__label">状态</div>' +
            '<div class="supplier-detail-cell__body"><span class="mdm-detail-tag mdm-detail-tag--' +
            kind +
            '">' +
            esc(value || '启用') +
            '</span></div></div>'
        );
    }

    function closeDrawer() {
        document.querySelectorAll('[data-rbt-installment-drawer]').forEach(function (node) {
            node.remove();
        });
        document.removeEventListener('keydown', onDrawerKey);
    }

    function onDrawerKey(event) {
        if (event.key === 'Escape') closeDrawer();
    }

    function open(item) {
        if (!item) return;
        closeDrawer();
        var backdrop = document.createElement('div');
        backdrop.className = 'store-drawer-backdrop';
        backdrop.setAttribute('data-rbt-installment-drawer', '1');
        var drawer = document.createElement('aside');
        drawer.className = 'store-drawer store-drawer--interactive store-drawer--store-wide';
        drawer.setAttribute('data-rbt-installment-drawer', '1');
        drawer.setAttribute('role', 'dialog');
        drawer.setAttribute('aria-modal', 'true');
        drawer.setAttribute('aria-label', '产品详情');
        drawer.innerHTML =
            '<div class="store-drawer__header"><h2 class="store-drawer__title">产品详情</h2>' +
            '<button type="button" class="store-drawer__close" data-rbt-installment-close aria-label="关闭">&times;</button></div>' +
            '<div class="store-drawer__hero store-drawer__hero--elevated">' +
            '<div class="store-drawer__name-row"><span class="store-drawer__name">' + esc(item.name) + '</span></div>' +
            '<div class="store-drawer__meta">产品编码：' + esc(item.code) + '</div></div>' +
            '<div class="store-drawer__body"><div class="supplier-detail-tab">' +
            '<div class="supplier-detail-section-title">基础信息</div><div class="supplier-detail-grid">' +
            cell('产品编码', item.code) +
            cell('产品名称', item.name) +
            statusCell(item.status) +
            cell('结算周期', item.repayCycle) +
            cell('结算方式', item.repayMethod) +
            cell('结算系数', item.rateRange) +
            cell('货款区间', item.amountRange) +
            cell('适用商品包', item.packages) +
            cell('创建人', item.creator) +
            cell('创建时间', item.createdAt) +
            cell('更新人', item.updater) +
            cell('更新时间', item.updatedAt) +
            '</div></div></div>';
        document.body.appendChild(backdrop);
        document.body.appendChild(drawer);
        backdrop.addEventListener('click', closeDrawer);
        drawer.querySelector('[data-rbt-installment-close]').addEventListener('click', closeDrawer);
        document.addEventListener('keydown', onDrawerKey);
    }

    window.RbtInstallmentDetail = { open: open, close: closeDrawer };
})();
