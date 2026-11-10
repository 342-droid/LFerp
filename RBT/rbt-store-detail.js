/* RBT 门店详情：对齐门店档案的基础信息、进件信息，不含收货信息、运营评估、商户进件 */
(function () {
    function esc(value) {
        return String(value == null || value === '' ? '—' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function statusKind(text) {
        var value = String(text || '');
        if (/正常|进件成功|已开通|已签署|营业中|启用/.test(value)) return 'success';
        if (/冻结|停用|禁用|失败|已拒绝/.test(value)) return 'danger';
        if (/未进件|进件中|未提交|休息中|未签署/.test(value)) return 'warning';
        return 'neutral';
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

    function tagCell(label, value) {
        return (
            '<div class="supplier-detail-cell"><div class="supplier-detail-cell__label">' +
            esc(label) +
            '</div><div class="supplier-detail-cell__body"><span class="mdm-detail-tag mdm-detail-tag--' +
            statusKind(value) +
            '">' +
            esc(value) +
            '</span></div></div>'
        );
    }

    function photoCell(label, ready) {
        return (
            '<div class="supplier-detail-cell"><div class="supplier-detail-cell__label">' +
            esc(label) +
            '</div><div class="supplier-detail-cell__body"><div class="' +
            (ready ? 'rbt-photo-ready' : 'rbt-photo-empty') +
            '">' +
            (ready ? '已上传' : '未上传') +
            '</div></div></div>'
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

    function tagList(code) {
        var ui = window.BusinessTagPrototypeUI;
        if (!ui || typeof ui.chipsHtml !== 'function') return '—';
        return ui.chipsHtml('RBT_STORE', code);
    }

    function money(value) {
        if (value === undefined || value === null || value === '') return '—';
        var num = Number(value);
        if (!isFinite(num)) return '—';
        return num.toLocaleString('zh-CN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + ' 元';
    }

    function quotaSection(store) {
        var quotaApi = window.RbtStoreData && window.RbtStoreData.quotaOf;
        var quota = quotaApi ? quotaApi(store) : null;
        return section(
            '额度信息',
            cell('门店总额度', money(quota && quota.total)) +
                cell('已占用', money(quota && quota.occupied)) +
                cell('已成交', money(quota && quota.locked)) +
                cell('可用额度', money(quota && quota.available))
        );
    }

    function basicPanel(store) {
        var region = String(store.region || '').replace(/\//g, ' / ');
        return (
            '<div class="supplier-detail-tab">' +
            quotaSection(store) +
            section(
                '基础信息',
                cell('门店编码', store.code) +
                    cell('主体名称', store.subjectName) +
                    cell('联系人', store.contact) +
                    cell('联系人手机号', store.phone) +
                    cell('门店名称', store.name) +
                    cell('门店简称', store.shortName) +
                    cell('门店合作类型', store.partnerType) +
                    cell('门店类型', store.storeType) +
                    cell('事业线', store.bizLine) +
                    cell('品牌名称', store.brandName) +
                    cell('业务线', store.bizLines) +
                    cell('RBT等级', store.rbtLevel) +
                    tagCell('状态', store.enabled === false ? '禁用' : '启用') +
                    '<div class="supplier-detail-cell"><div class="supplier-detail-cell__label">门店标签</div><div class="supplier-detail-cell__body" id="rbtBaseTags"></div></div>' +
                    cell('绑定BD', store.bd) +
                    cell('配送仓库', store.warehouse) +
                    cell('省市区', region) +
                    cell('详细地址', store.address) +
                    cell('经纬度', store.latlng) +
                    cell('运营状态', store.opStatus) +
                    cell('营业时间', store.businessHours) +
                    tagCell('进件状态', store.onboardStatus) +
                    cell('余额支付', store.balancePay) +
                    cell('结算类型', store.settleType) +
                    cell('结算周期', store.settleCycle) +
                    cell('分账服务', store.splitService) +
                    tagCell('门店状态', store.storeStatus) +
                    cell('可提现手机号', store.withdrawPhone) +
                    photoCell('门头/场地照', store.photos) +
                    photoCell('内景/工作区域照', store.photos) +
                    photoCell('收银台/前台照', store.photos) +
                    '<div class="supplier-detail-cell supplier-detail-cell--span4"><div class="supplier-detail-cell__label">门店仓库</div><div class="supplier-detail-cell__body">' +
                    esc(store.warehouse) +
                    '</div></div>'
            ) +
            '</div>'
        );
    }

    function onboardPanel(store) {
        var info = store.onboard || {};
        var ready = !!info.photos;
        return (
            '<div class="supplier-detail-tab">' +
            section(
                '进件信息',
                cell('商户简称', store.shortName) +
                    cell('汇付商户号', info.merchantNo) +
                    cell('余额支付', store.balancePay) +
                    tagCell('进件状态', store.onboardStatus) +
                    cell('小票名称', info.receiptName) +
                    cell('实际经营地址', info.bizAddress) +
                    cell('法人手机号', store.legalPhone) +
                    cell('管理员姓名', info.adminName) +
                    cell('管理员手机号', info.adminPhone) +
                    cell('管理员邮箱', info.adminEmail) +
                    photoCell('营业执照(F07)', ready) +
                    cell('商户名称', info.licenseName) +
                    cell('证照编号', info.licenseCode) +
                    cell('证照有效期开始日期', info.licenseStart) +
                    cell('证照有效期截止日期', info.licenseEnd) +
                    cell('成立日期', info.foundDate) +
                    cell('省市区', info.licenseRegion) +
                    cell('详细地址', info.licenseAddress) +
                    photoCell('法人身份证人像面(F02)', ready) +
                    photoCell('法人身份证国徽面(F03)', ready) +
                    cell('法人证件类型', info.legalCertType) +
                    cell('法人姓名', store.legalName) +
                    cell('法人证件号码', info.legalId) +
                    cell('法人证件开始日期', info.legalStart) +
                    cell('法人证件截止日期', info.legalEnd) +
                    cell('省市区', info.legalRegion) +
                    cell('详细地址', info.legalAddress) +
                    photoCell('开户许可证', ready) +
                    cell('开户名', info.accountName) +
                    cell('银行卡号', info.cardNo) +
                    cell('开户银行', info.bankName) +
                    cell('开户支行', info.bankBranch) +
                    cell('经营场所名称', info.placeName) +
                    photoCell('门头/场地照(F22)', ready) +
                    photoCell('内景/工作区域照(F24)', ready) +
                    photoCell('收银台/前台照(F105)', ready) +
                    cell('协议类型', info.agreementType) +
                    tagCell('协议签署', info.agreementSigned ? '已签署' : '未签署') +
                    cell('协议名称', info.agreementName ? '《' + info.agreementName + '》' : '—')
            ) +
            '</div>'
        );
    }

    function paintTags(store) {
        var host = document.getElementById('rbtDetailTags');
        if (host) host.innerHTML = tagList(store.code);
    }

    function closeDrawer() {
        document.querySelectorAll('[data-rbt-store-drawer]').forEach(function (node) {
            node.remove();
        });
        document.removeEventListener('keydown', onDrawerKey);
        window.removeEventListener('business-tags:changed', onTagsChanged);
    }

    function onDrawerKey(event) {
        if (event.key === 'Escape') closeDrawer();
    }

    var openedStore = null;

    function onTagsChanged() {
        if (!openedStore) return;
        paintTags(openedStore);
        var tagHost = document.getElementById('rbtBaseTags');
        if (tagHost) tagHost.innerHTML = tagList(openedStore.code);
    }

    function open(store) {
        if (!store) return;
        closeDrawer();
        openedStore = store;
        var backdrop = document.createElement('div');
        backdrop.className = 'store-drawer-backdrop';
        backdrop.setAttribute('data-rbt-store-drawer', '1');
        var drawer = document.createElement('aside');
        drawer.className = 'store-drawer store-drawer--interactive store-drawer--store-wide';
        drawer.setAttribute('data-rbt-store-drawer', '1');
        drawer.setAttribute('role', 'dialog');
        drawer.setAttribute('aria-modal', 'true');
        drawer.setAttribute('aria-label', '门店详情');
        drawer.innerHTML =
            '<div class="store-drawer__header"><h2 class="store-drawer__title">门店详情</h2>' +
            '<button type="button" class="store-drawer__close" data-rbt-drawer-close aria-label="关闭">&times;</button></div>' +
            '<div class="store-drawer__hero store-drawer__hero--elevated" id="rbtStoreHero"></div>' +
            '<div class="store-drawer__tabs store-drawer__tabs--sticky" id="rbtStoreTabs"></div>' +
            '<div class="store-drawer__body" id="rbtStoreBody"></div>';
        document.body.appendChild(backdrop);
        document.body.appendChild(drawer);
        backdrop.addEventListener('click', closeDrawer);
        drawer.querySelector('[data-rbt-drawer-close]').addEventListener('click', closeDrawer);
        document.addEventListener('keydown', onDrawerKey);
        window.addEventListener('business-tags:changed', onTagsChanged);

        var hero = document.getElementById('rbtStoreHero');
        var tabs = document.getElementById('rbtStoreTabs');
        var body = document.getElementById('rbtStoreBody');
        var kind = statusKind(store.storeStatus);
        hero.innerHTML =
            '<div class="store-drawer__name-row"><span class="store-drawer__name">' +
            esc(store.name) +
            '</span><span class="store-drawer__tag store-drawer__tag--' +
            (kind === 'success' ? 'orange' : 'gray') +
            '">' +
            esc(store.storeStatus === '正常' ? '门店正常' : store.storeStatus) +
            '</span><span class="store-drawer__tag store-drawer__tag--gray">' +
            esc(store.opStatus) +
            '</span><span class="store-drawer__tag store-drawer__tag--gray">RBT ' +
            esc(store.rbtLevel) +
            '</span></div>' +
            '<div class="store-drawer__meta">门店编码：' +
            esc(store.code) +
            ' · 所属组织：' +
            esc(store.subjectName) +
            '</div>' +
            '<div class="store-drawer__meta" id="rbtDetailTags"></div>';
        paintTags(store);
        var panels = {
            base: basicPanel(store),
            onboard: onboardPanel(store)
        };
        tabs.innerHTML =
            '<button type="button" class="store-drawer__tab is-active" data-tab="base">基础信息</button>' +
            '<button type="button" class="store-drawer__tab" data-tab="onboard">进件信息</button>';
        function show(id) {
            tabs.querySelectorAll('.store-drawer__tab').forEach(function (button) {
                button.classList.toggle('is-active', button.getAttribute('data-tab') === id);
            });
            body.innerHTML = panels[id];
            var tagHost = document.getElementById('rbtBaseTags');
            if (tagHost) tagHost.innerHTML = tagList(store.code);
        }
        tabs.addEventListener('click', function (event) {
            var button = event.target.closest('[data-tab]');
            if (!button) return;
            show(button.getAttribute('data-tab'));
        });
        show('base');
    }

    window.RbtStoreDetail = { open: open };
})();
