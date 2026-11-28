/* RBT 产品详情：基础信息、适用商品包、操作记录。 */
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
        if (event.key !== 'Escape') return;
        /* 上面叠着商品包详情时，先让商品包关，产品详情留着。 */
        if (document.querySelector('[data-rbt-package-drawer]')) return;
        closeDrawer();
    }

    function logPanel(item) {
        var latest = window.RbtInstallmentData && typeof window.RbtInstallmentData.get === 'function'
            ? window.RbtInstallmentData.get(item.code) || item
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

    function packageNamesOf(item) {
        if (item && Array.isArray(item.packageNames)) return item.packageNames.filter(Boolean);
        if (item && Array.isArray(item.packages)) return item.packages.filter(Boolean);
        return [];
    }

    function resolvePackage(name) {
        var api = window.RbtPackageData;
        if (!api || !name) return null;
        if (typeof api.findByName === 'function') {
            var byName = api.findByName(name);
            if (byName) return byName;
        }
        if (typeof api.get === 'function') {
            var byCode = api.get(name);
            if (byCode) return byCode;
        }
        if (typeof api.list === 'function') {
            var found = null;
            (api.list() || []).some(function (row) {
                if (row && (row.name === name || row.code === name)) {
                    found = row;
                    return true;
                }
                return false;
            });
            return found;
        }
        return null;
    }

    function packageLink(code, text) {
        return '<button type="button" class="rbt-installment-pkg-link" data-rbt-pkg-open="' +
            esc(code) + '">' + esc(text) + '</button>';
    }

    /* 适用商品包挪到基础信息下方，表格展示，点编码打开商品包详情。 */
    function packageSection(item) {
        var names = packageNamesOf(item);
        var head = '<tr><th>商品包编码</th><th>商品包名称</th><th>状态</th><th class="is-money">总金额</th></tr>';
        var body;
        if (!names.length) {
            body = '<tr><td class="is-empty" colspan="4">暂无适用商品包</td></tr>';
        } else {
            var api = window.RbtPackageData;
            body = names.map(function (name) {
                var pkg = resolvePackage(name);
                if (!pkg) {
                    return '<tr><td>—</td><td>' + esc(name) + '</td><td>—</td><td class="is-money">—</td></tr>';
                }
                var view = api && typeof api.detailOf === 'function' ? api.detailOf(pkg) : pkg;
                var status = pkg.enabled === false ? '禁用' : '启用';
                return '<tr><td>' + packageLink(pkg.code, pkg.code) + '</td><td>' +
                    esc(pkg.name || name) + '</td><td>' + esc(status) +
                    '</td><td class="is-money">' + esc((view && view.totalText) || '—') + '</td></tr>';
            }).join('');
        }
        return '<div class="supplier-detail-section-title">适用商品包</div>' +
            '<div class="rbt-demand-table-wrap"><table class="rbt-demand-table"><thead>' + head +
            '</thead><tbody>' + body + '</tbody></table></div>';
    }

    function basePanel(item) {
        return (
            '<div class="supplier-detail-tab">' +
            '<div class="supplier-detail-section-title">基础信息</div><div class="supplier-detail-grid">' +
            cell('产品编码', item.code) +
            cell('产品名称', item.name) +
            statusCell(item.status) +
            cell('结算周期', item.repayCycle) +
            cell('结算方式', item.repayMethod) +
            cell('结算系数', item.rateRange) +
            cell('货款区间', item.amountRange) +
            cell('创建人', item.creator) +
            cell('创建时间', item.createdAt) +
            cell('更新人', item.updater) +
            cell('更新时间', item.updatedAt) +
            '</div>' + ratioSection(item) + packageSection(item) + '</div>'
        );
    }

    function ratioSection(item) {
        var api = window.RbtSettleRatio;
        var html = api && item.repayMethod === '比例付' && item.settleRatios && item.settleRatios.length && typeof api.renderHtml === 'function'
            ? api.renderHtml({ repayMethod: '比例付', settleRatios: item.settleRatios, skus: [], hideCategories: true })
            : '';
        if (!html) return '';
        return '<div class="supplier-detail-section-title">渠道结算比例</div>' + html;
    }

    function bindPackageLinks(root) {
        if (!root) return;
        root.querySelectorAll('[data-rbt-pkg-open]').forEach(function (node) {
            node.addEventListener('click', function () {
                var code = node.getAttribute('data-rbt-pkg-open') || '';
                var api = window.RbtPackageData;
                if (!code || !api || typeof api.openDetail !== 'function') return;
                api.openDetail(code);
            });
        });
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
            '<div class="store-drawer__tabs store-drawer__tabs--sticky" id="rbtInstallmentTabs">' +
            '<button type="button" class="store-drawer__tab is-active" data-tab="base">基础信息</button>' +
            '<button type="button" class="store-drawer__tab" data-tab="logs">操作记录</button></div>' +
            '<div class="store-drawer__body" id="rbtInstallmentBody"></div>';
        document.body.appendChild(backdrop);
        document.body.appendChild(drawer);
        backdrop.addEventListener('click', function () {
            if (document.querySelector('[data-rbt-package-drawer]')) return;
            closeDrawer();
        });
        drawer.querySelector('[data-rbt-installment-close]').addEventListener('click', closeDrawer);
        document.addEventListener('keydown', onDrawerKey);
        var tabs = document.getElementById('rbtInstallmentTabs');
        var body = document.getElementById('rbtInstallmentBody');
        function show(id) {
            tabs.querySelectorAll('.store-drawer__tab').forEach(function (button) {
                button.classList.toggle('is-active', button.getAttribute('data-tab') === id);
            });
            body.innerHTML = id === 'logs' ? logPanel(item) : basePanel(item);
            if (id !== 'logs') bindPackageLinks(body);
        }
        tabs.addEventListener('click', function (event) {
            var button = event.target.closest('[data-tab]');
            if (!button) return;
            show(button.getAttribute('data-tab'));
        });
        show('base');
    }

    window.RbtInstallmentDetail = { open: open, close: closeDrawer };
})();
