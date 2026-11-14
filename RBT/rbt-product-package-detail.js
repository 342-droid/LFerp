/* RBT 商品包详情：基础信息、包含 SKU、操作记录。 */
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

    function tagHtml(code) {
        var ui = window.BusinessTagPrototypeUI;
        if (!ui || typeof ui.chipsHtml !== 'function') return '—';
        return ui.chipsHtml('PRODUCT_PACKAGE', code);
    }

    function skuImage(item) {
        if (typeof renderWmsSkuImage === 'function') return renderWmsSkuImage(item.code, item.name);
        if (!item.image) return '—';
        return '<img class="wms-sku-image" src="' + esc(item.image) + '" alt="' + esc(item.name) + '">';
    }

    function skuTable(items) {
        var head = '<tr><th>商品图片</th><th>商品编码</th><th>商品名称</th><th>商品条码</th><th>商品单位</th><th>商品规格</th><th class="is-money">采购价</th><th class="is-money">售价</th></tr>';
        var body = !items || !items.length
            ? '<tr><td class="is-empty" colspan="8">暂无商品</td></tr>'
            : items.map(function (item) {
                return '<tr><td>' + skuImage(item) + '</td><td>' + esc(item.code) + '</td><td>' + esc(item.name) +
                    '</td><td>' + esc(item.barcode) + '</td><td>' + esc(item.unit) + '</td><td>' + esc(item.spec) +
                    '</td><td class="is-money">' + esc(item.purchasePrice) + '</td><td class="is-money">' + esc(item.salePrice) + '</td></tr>';
            }).join('');
        return '<div class="rbt-package-sku-table-wrap"><table class="rbt-package-sku-table"><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>';
    }

    function paintTags(pkg) {
        var hosts = [document.getElementById('rbtPackageHeroTags'), document.getElementById('rbtPackageBaseTags')];
        hosts.forEach(function (host) {
            if (host) host.innerHTML = tagHtml(pkg.code);
        });
    }

    function closeDrawer() {
        document.querySelectorAll('[data-rbt-package-drawer]').forEach(function (node) {
            node.remove();
        });
        document.removeEventListener('keydown', onDrawerKey);
        window.removeEventListener('business-tags:changed', onTagsChanged);
        opened = null;
    }

    function onDrawerKey(event) {
        if (event.key === 'Escape') closeDrawer();
    }

    var opened = null;

    function onTagsChanged() {
        if (opened) paintTags(opened);
    }

    function logPanel(pkg) {
        var latest = window.RbtPackageData && typeof window.RbtPackageData.get === 'function'
            ? window.RbtPackageData.get(pkg.code) || pkg
            : pkg;
        var logs = latest.logs || [];
        var rows = logs.length
            ? logs.map(function (item) {
                return (
                    '<tr><td>' + esc(item.content) + '</td><td class="rbt-store-log__who">' +
                    esc(item.operator) + '</td><td class="rbt-store-log__time">' +
                    esc(item.time) + '</td></tr>'
                );
            }).join('')
            : '<tr><td colspan="3" class="rbt-store-log__empty">暂无操作记录</td></tr>';
        return (
            '<div class="supplier-detail-tab"><table class="rbt-store-log"><thead><tr>' +
            '<th>变更内容</th><th class="rbt-store-log__who">变更人</th><th class="rbt-store-log__time">变更时间</th>' +
            '</tr></thead><tbody>' + rows + '</tbody></table></div>'
        );
    }

    function basePanel(pkg) {
        return (
            '<div class="supplier-detail-tab">' +
            '<div class="supplier-detail-section-title">基础信息</div><div class="supplier-detail-grid">' +
            cell('商品包编码', pkg.code) +
            cell('商品包名称', pkg.name) +
            cell('门店', pkg.storeText) +
            cell('状态', pkg.enabled === false ? '禁用' : '启用') +
            '<div class="supplier-detail-cell"><div class="supplier-detail-cell__label">商品包标签</div><div class="supplier-detail-cell__body" id="rbtPackageBaseTags"></div></div>' +
            cell('创建人', pkg.creator) +
            cell('创建时间', pkg.createdAt) +
            cell('更新人', pkg.updater) +
            cell('更新时间', pkg.updatedAt) +
            '</div>' +
            '<div class="supplier-detail-section-title">包含SKU</div>' +
            skuTable(pkg.skuItems) +
            '</div>'
        );
    }

    function open(pkg) {
        if (!pkg) return;
        closeDrawer();
        opened = pkg;
        var backdrop = document.createElement('div');
        backdrop.className = 'store-drawer-backdrop';
        backdrop.setAttribute('data-rbt-package-drawer', '1');
        var drawer = document.createElement('aside');
        drawer.className = 'store-drawer store-drawer--interactive store-drawer--store-wide';
        drawer.setAttribute('data-rbt-package-drawer', '1');
        drawer.setAttribute('role', 'dialog');
        drawer.setAttribute('aria-modal', 'true');
        drawer.setAttribute('aria-label', '商品包详情');
        drawer.innerHTML =
            '<div class="store-drawer__header"><h2 class="store-drawer__title">商品包详情</h2>' +
            '<button type="button" class="store-drawer__close" data-rbt-package-close aria-label="关闭">&times;</button></div>' +
            '<div class="store-drawer__hero store-drawer__hero--elevated">' +
            '<div class="store-drawer__name-row"><span class="store-drawer__name">' + esc(pkg.name) + '</span></div>' +
            '<div class="store-drawer__meta">商品包编码：' + esc(pkg.code) + '</div>' +
            '<div class="store-drawer__meta" id="rbtPackageHeroTags"></div></div>' +
            '<div class="store-drawer__tabs store-drawer__tabs--sticky" id="rbtPackageTabs">' +
            '<button type="button" class="store-drawer__tab is-active" data-tab="base">基础信息</button>' +
            '<button type="button" class="store-drawer__tab" data-tab="logs">操作记录</button></div>' +
            '<div class="store-drawer__body" id="rbtPackageBody"></div>';
        document.body.appendChild(backdrop);
        document.body.appendChild(drawer);
        backdrop.addEventListener('click', closeDrawer);
        drawer.querySelector('[data-rbt-package-close]').addEventListener('click', closeDrawer);
        document.addEventListener('keydown', onDrawerKey);
        window.addEventListener('business-tags:changed', onTagsChanged);
        var tabs = document.getElementById('rbtPackageTabs');
        var body = document.getElementById('rbtPackageBody');
        function show(id) {
            tabs.querySelectorAll('.store-drawer__tab').forEach(function (button) {
                button.classList.toggle('is-active', button.getAttribute('data-tab') === id);
            });
            body.innerHTML = id === 'logs' ? logPanel(pkg) : basePanel(pkg);
            if (id !== 'logs') paintTags(pkg);
        }
        tabs.addEventListener('click', function (event) {
            var button = event.target.closest('[data-tab]');
            if (!button) return;
            show(button.getAttribute('data-tab'));
        });
        show('base');
    }

    window.RbtPackageDetail = { open: open };
})();
