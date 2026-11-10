/* RBF 待入驻贸易商详情抽屉：主体、联系人、证照信息与证照图片。 */
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

    function photoCell(label, src) {
        var body;
        if (src) {
            body =
                '<button type="button" class="mdm-onboard-photo" data-rbf-trader-photo="' +
                esc(src) +
                '" data-rbf-trader-photo-title="' +
                esc(label) +
                '" title="点击放大查看"><img src="' +
                esc(src) +
                '" alt="' +
                esc(label) +
                '"></button>';
        } else {
            body = '未上传';
        }
        return (
            '<div class="supplier-detail-cell"><div class="supplier-detail-cell__label">' +
            esc(label) +
            '</div><div class="supplier-detail-cell__body">' +
            body +
            '</div></div>'
        );
    }

    function section(title, inner) {
        return (
            '<div class="supplier-detail-section-title">' +
            esc(title) +
            '</div><div class="supplier-detail-grid">' +
            inner +
            '</div>'
        );
    }

    function closeLightbox() {
        document.querySelectorAll('[data-rbf-trader-lightbox]').forEach(function (node) {
            node.remove();
        });
    }

    function openLightbox(src, title) {
        if (!src) return;
        closeLightbox();
        var backdrop = document.createElement('div');
        backdrop.className = 'erp-modal-backdrop erp-modal-backdrop--over-drawer mdm-photo-lightbox';
        backdrop.setAttribute('data-rbf-trader-lightbox', '1');
        backdrop.innerHTML =
            '<div class="mdm-photo-lightbox__box">' +
            '<div class="mdm-photo-lightbox__head"><div class="mdm-photo-lightbox__title">' +
            esc(title || '查看照片') +
            '</div><button type="button" class="erp-modal__header-btn" data-rbf-trader-lightbox-close aria-label="关闭">&times;</button></div>' +
            '<img class="mdm-photo-lightbox__img" src="' +
            esc(src) +
            '" alt="' +
            esc(title || '照片') +
            '">' +
            '</div>';
        document.body.appendChild(backdrop);
        backdrop.addEventListener('click', function (event) {
            if (event.target === backdrop) closeLightbox();
        });
        backdrop.querySelector('[data-rbf-trader-lightbox-close]').addEventListener('click', closeLightbox);
    }

    function closeDrawer() {
        closeLightbox();
        document.querySelectorAll('[data-rbf-trader-drawer]').forEach(function (node) {
            node.remove();
        });
        document.removeEventListener('keydown', onDrawerKey);
    }

    function onDrawerKey(event) {
        if (event.key === 'Escape') {
            if (document.querySelector('[data-rbf-trader-lightbox]')) closeLightbox();
            else closeDrawer();
        }
    }

    function open(row) {
        if (!row) return;
        closeDrawer();
        var license = row.license || {};
        var permit = row.permit || {};
        var backdrop = document.createElement('div');
        backdrop.className = 'store-drawer-backdrop';
        backdrop.setAttribute('data-rbf-trader-drawer', '1');
        var drawer = document.createElement('aside');
        drawer.className = 'store-drawer store-drawer--interactive store-drawer--store-wide';
        drawer.setAttribute('data-rbf-trader-drawer', '1');
        drawer.setAttribute('role', 'dialog');
        drawer.setAttribute('aria-modal', 'true');
        drawer.setAttribute('aria-label', '贸易商详情');
        drawer.innerHTML =
            '<div class="store-drawer__header"><h2 class="store-drawer__title">贸易商详情</h2>' +
            '<button type="button" class="store-drawer__close" data-rbf-drawer-close aria-label="关闭">&times;</button></div>' +
            '<div class="store-drawer__hero store-drawer__hero--elevated">' +
            '<div class="store-drawer__name-row"><span class="store-drawer__name">' +
            esc(row.subjectName) +
            '</span><span class="store-drawer__tag store-drawer__tag--gray">' +
            esc(row.status || '待审核') +
            '</span></div>' +
            '<div class="store-drawer__meta">编码：' +
            esc(row.code) +
            ' · 牌照类型：' +
            esc(row.licenseType) +
            ' · 业务范围：' +
            esc(row.bizScope) +
            '</div></div>' +
            '<div class="store-drawer__body" id="rbfTraderBody"></div>';
        document.body.appendChild(backdrop);
        document.body.appendChild(drawer);
        backdrop.addEventListener('click', closeDrawer);
        drawer.querySelector('[data-rbf-drawer-close]').addEventListener('click', closeDrawer);
        document.addEventListener('keydown', onDrawerKey);
        var quotaApi = window.RbfTraderData && window.RbfTraderData.quotaOf;
        var quota = quotaApi ? quotaApi(row) : null;
        var money = function (value) {
            if (value === undefined || value === null || value === '') return '—';
            var num = Number(value);
            if (!isFinite(num)) return '—';
            return num.toLocaleString('zh-CN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }) + ' 元';
        };
        var quotaSection =
            row.status === '已审核' || row.status === '已通过' || (quota && quota.total > 0)
                ? section(
                    '额度信息',
                    cell('接单总额度', money(quota && quota.total)) +
                        cell('已占用（接单中）', money(quota && quota.occupied)) +
                        cell('已成交锁定', money(quota && quota.locked)) +
                        cell('可用额度', money(quota && quota.available))
                )
                : '';
        document.getElementById('rbfTraderBody').innerHTML =
            section(
                '基础信息',
                cell('主体名称', row.subjectName) +
                    cell('牌照类型', row.licenseType) +
                    cell('业务范围', row.bizScope) +
                    cell('联系人姓名', row.contactName) +
                    cell('联系人手机号', row.contactPhone) +
                    cell('创建人', row.creator) +
                    cell('创建时间', row.createdAt) +
                    cell('更新人', row.updater) +
                    cell('更新时间', row.updatedAt)
            ) +
            quotaSection +
            section(
                '营业执照',
                photoCell('营业执照图片', license.image) +
                    cell('名称', license.name) +
                    cell('统一社会信用代码', license.creditCode) +
                    cell('类型', license.type) +
                    cell('法定代表人', license.legal) +
                    cell('注册资本', license.capital) +
                    cell('成立日期', license.founded) +
                    cell('住所', license.address) +
                    cell('经营范围', license.scope)
            ) +
            section(
                '经营许可证',
                photoCell('经营许可证图片', permit.image) +
                    cell('许可证编号', permit.no) +
                    cell('经营者名称', permit.name) +
                    cell('法定代表人', permit.legal) +
                    cell('经营场所', permit.place) +
                    cell('主体业态', permit.mode) +
                    cell('经营项目', permit.items) +
                    cell('有效期至', permit.expire)
            );
        drawer.addEventListener('click', function (event) {
            var button = event.target.closest('[data-rbf-trader-photo]');
            if (!button) return;
            openLightbox(button.getAttribute('data-rbf-trader-photo'), button.getAttribute('data-rbf-trader-photo-title'));
        });
    }

    window.RbfTraderDetail = { open: open };
})();
