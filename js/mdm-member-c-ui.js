/**
 * C 端会员 — 详情抽屉、积分、优惠券（由 vendor mdm-member-c + member-detail-drawer 迁入）
 */
(function () {
    var MOCK_COUPONS = [
        {
            id: 'cp1',
            name: '全场通用减额券',
            type: '通用商品优惠券',
            usage: '满减',
            content: '无门槛减0.1元',
            collectCount: '不限',
            status: '进行中',
            stock: '999',
            unavailable: '—'
        },
        {
            id: 'cp2',
            name: '新品专享券',
            type: '通用商品优惠券',
            usage: '折扣',
            content: '满100减15',
            collectCount: '每人3次',
            status: '进行中',
            stock: '120',
            unavailable: '—'
        },
        {
            id: 'cp3',
            name: '节日回馈券',
            type: '通用商品优惠券',
            usage: '满减',
            content: '满200减40',
            collectCount: '每人1次',
            status: '未开始',
            stock: '50',
            unavailable: '未到使用时间'
        }
    ];

    function escapeHtml(s) {
        return String(s ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text != null && text !== '') n.textContent = text;
        return n;
    }

    function empty(host) {
        while (host && host.firstChild) host.removeChild(host.firstChild);
    }

    function removeMemberCUi() {
        document.querySelectorAll('[data-member-c-ui="1"]').forEach(function (n) {
            n.remove();
        });
    }

    function removeMemberDetailDrawer() {
        document.querySelectorAll('[data-member-detail-drawer]').forEach(function (n) {
            n.remove();
        });
    }

    function mkBtn(label, primary) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'erp-btn' + (primary ? ' erp-btn--primary' : '');
        b.textContent = label;
        return b;
    }

    function refDangerMod(v) {
        if (v == null || v === '' || v === '—') return undefined;
        return 'member-detail-text--danger';
    }

    function enrichMemberRecord(m) {
        function z(v, def) {
            return v == null || v === '' ? def : v;
        }
        return {
            id: String(z(m.id, '—')),
            nickname: String(z(m.nickname, '—')),
            avatarText: String(
                m.avatarText != null && m.avatarText !== ''
                    ? m.avatarText
                    : (m.nickname && m.nickname[0]) || '—'
            ),
            phone: String(z(m.phone, '—')),
            gender: String(z(m.gender, '—')),
            isMember: String(z(m.isMember, '—')),
            tags: String(z(m.tags, '—')),
            source: String(z(m.source, '—')),
            bindMethod: String(z(m.bindMethod, '—')),
            channelCount: String(z(m.channelCount, '—')),
            points: String(z(m.points, '—')),
            satisMinutes: String(z(m.satisMinutes, '—')),
            satisFeedback: String(z(m.satisFeedback, '—')),
            growthScore: String(z(m.growthScore, '—')),
            amount: String(z(m.amount, '—')),
            orderCount: String(z(m.orderCount, '—')),
            lastConsume: String(z(m.lastConsume, '—')),
            status: String(z(m.status, '—')),
            superiorReferrer: m.superiorReferrer != null ? String(m.superiorReferrer) : '—',
            grandReferrer: m.grandReferrer != null ? String(m.grandReferrer) : '—',
            memberIp: m.memberIp != null ? String(m.memberIp) : '49.65.152.240 江苏南京鼓楼',
            watchTotalMin: m.watchTotalMin != null ? String(m.watchTotalMin) : String(z(m.satisMinutes, '341')),
            liveWatchCount: m.liveWatchCount != null ? String(m.liveWatchCount) : String(z(m.satisFeedback, '342')),
            firstLogin: m.firstLogin != null ? String(m.firstLogin) : '2021-09-09 13:00',
            latestLogin: m.latestLogin != null ? String(m.latestLogin) : '2021-09-19 13:00',
            latestBindStore: m.latestBindStore != null ? String(m.latestBindStore) : '—',
            phoneBrand: m.phoneBrand != null ? String(m.phoneBrand) : '—',
            phoneModel: m.phoneModel != null ? String(m.phoneModel) : '—',
            bindStoreCount: m.bindStoreCount != null ? String(m.bindStoreCount) : String(z(m.channelCount, '2342'))
        };
    }

    function rowToMember(tr) {
        if (!tr) return null;
        var c = tr.querySelectorAll('td');
        if (c.length < 18) return null;
        var av = c[2].querySelector('span');
        return {
            id: c[0].textContent.trim(),
            nickname: c[1].textContent.trim(),
            avatarText: av ? av.textContent.trim() : '',
            phone: c[3].textContent.trim(),
            gender: c[4].textContent.trim(),
            isMember: c[5].textContent.trim(),
            tags: c[6].textContent.trim(),
            source: c[7].textContent.trim(),
            bindMethod: c[8].textContent.trim(),
            channelCount: c[9].textContent.trim(),
            points: c[10].textContent.trim(),
            satisMinutes: c[11].textContent.trim(),
            satisFeedback: c[12].textContent.trim(),
            growthScore: c[13].textContent.trim(),
            amount: c[14].textContent.trim(),
            orderCount: c[15].textContent.trim(),
            lastConsume: c[16].textContent.trim(),
            status: (c[17].querySelector('.status') || c[17]).textContent.trim()
        };
    }

    function wrapTable(headers, rows, wrapExtraClass) {
        var wrap = el('div', 'erp-table-scroll');
        if (wrapExtraClass) wrap.classList.add.apply(wrap.classList, wrapExtraClass.split(' ').filter(Boolean));
        var table = el('table', 'erp-table');
        var thead = el('thead');
        var trh = el('tr');
        headers.forEach(function (h) {
            trh.appendChild(el('th', '', h));
        });
        thead.appendChild(trh);
        var tbody = el('tbody');
        rows.forEach(function (cells) {
            var tr = el('tr');
            cells.forEach(function (text) {
                var td = el('td', '');
                td.textContent = text;
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(thead);
        table.appendChild(tbody);
        wrap.appendChild(table);
        return wrap;
    }

    function fakePaginationBar() {
        var bar = el('div', 'erp-pagination');
        bar.appendChild(el('span', 'erp-pagination__total', '演示分页'));
        return bar;
    }

    function panelMemberDetail(rec) {
        var root = el('div', 'member-drawer-panel');
        root.appendChild(el('div', 'supplier-detail-section-title', '基础信息'));
        var basicHead = el('div', 'member-detail-basic-head');
        var grid = el('div', 'supplier-detail-grid');
        var cells = [
            ['会员ID', rec.id],
            ['会员昵称', rec.nickname],
            ['会员性别', rec.gender],
            ['手机号码', rec.phone],
            ['是否会员', rec.isMember],
            ['会员标签', rec.tags],
            ['会员来源', rec.source],
            ['绑定方式', rec.bindMethod],
            ['绑定门店数量', rec.bindStoreCount],
            ['上级推荐人', rec.superiorReferrer, refDangerMod(rec.superiorReferrer)],
            ['会员IP', rec.memberIp],
            ['观看总时长(分)', rec.watchTotalMin + 'min'],
            ['观看直播次数', rec.liveWatchCount],
            ['上上级推荐人', rec.grandReferrer, refDangerMod(rec.grandReferrer)],
            ['会员积分', rec.points],
            ['成交金额', '¥' + rec.amount],
            ['成交订单数', rec.orderCount],
            ['最近消费时间', rec.lastConsume],
            ['第一次登录时间', rec.firstLogin],
            ['最近登录时间', rec.latestLogin],
            ['最近绑定门店名称', rec.latestBindStore],
            ['手机品牌', rec.phoneBrand],
            ['手机型号', rec.phoneModel]
        ];
        cells.forEach(function (row) {
            var label = row[0];
            var value = row[1];
            var mod = row[2];
            var cell = el('div', 'supplier-detail-cell');
            cell.appendChild(el('div', 'supplier-detail-cell__label', label));
            var body = el('div', 'supplier-detail-cell__body', value || '—');
            if (mod) body.classList.add(mod);
            cell.appendChild(body);
            grid.appendChild(cell);
        });
        basicHead.appendChild(grid);
        basicHead.appendChild(el('div', 'member-detail-avatar-lg', rec.avatarText));
        root.appendChild(basicHead);

        root.appendChild(el('div', 'supplier-detail-section-title', '结算信息'));
        var settleNote = el('p');
        settleNote.style.cssText = 'font-size:13px;color:#666;margin:8px 0;line-height:1.6';
        settleNote.textContent = '结算进件与收款账户请到支付进件工作台维护（演示）。';
        root.appendChild(settleNote);

        root.appendChild(el('div', 'supplier-detail-section-title', '收货地址'));
        var addrHeaders = ['收件人信息', '收件地址', '收件人联系方式', '地址标签'];
        var addrRows = [
            ['张三', '上海市浦东新区张江路 88 号', '138****2211', '家'],
            ['李四', '杭州市西湖区文三路 256 号', '139****8811', '公司']
        ];
        root.appendChild(wrapTable(addrHeaders, addrRows, ''));
        root.appendChild(fakePaginationBar());
        return root;
    }

    function panelMemberAssets() {
        var root = el('div', 'member-drawer-panel');
        root.appendChild(el('div', 'supplier-detail-section-title', '会员积分明细'));
        var ptHeaders = ['时间', '类型', '数据', '余额', '订单编号'];
        var ptRows = [
            ['2024-07-14 16:00', '积分抵扣', '-17.00', '5000.00', 'NO.2311312313'],
            ['2024-07-13 10:00', '观看直播收入', '+17.00', '5017.00', ''],
            ['2024-07-12 09:30', '后台添加', '+100.00', '5000.00', '']
        ];
        root.appendChild(wrapTable(ptHeaders, ptRows, 'member-drawer-table--center'));
        root.appendChild(fakePaginationBar());
        root.appendChild(el('div', 'supplier-detail-section-title member-detail-section--spaced', '会员优惠券'));
        var cpHeaders = [
            '优惠券类型',
            '优惠券名称',
            '优惠券金额',
            '领取时间',
            '有效期',
            '使用日期',
            '优惠券状态',
            '关联订单'
        ];
        var cpRows = [
            ['平台优惠券', '优惠券名称', '5.00', '2021-12-12 13:00', '2021-12-12 ~ 2021-12-22', '-', '待使用', '-'],
            ['平台优惠券', '优惠券名称', '10.00', '2021-12-10 13:00', '2021-12-10 ~ 2021-12-20', '2021-12-15', '已使用', '23423423422342'],
            ['平台优惠券', '优惠券名称', '3.00', '2020-06-01 13:00', '2020-06-01 ~ 2020-06-05', '-', '已过期', '-']
        ];
        root.appendChild(wrapTable(cpHeaders, cpRows, 'member-drawer-table--center'));
        root.appendChild(fakePaginationBar());
        return root;
    }

    function panelBindStores() {
        var root = el('div', 'member-drawer-panel');
        root.appendChild(el('div', 'supplier-detail-section-title', '绑定门店'));
        var headers = [
            '门店名称',
            '省市区',
            '详细地址',
            '绑定方式',
            '绑定时间',
            '观看时长',
            '消费金额',
            '下单次数',
            '退款金额',
            '退款次数'
        ];
        var rows = [['—', '—', '—', '—', '—', '—', '—', '—', '—', '—']];
        root.appendChild(wrapTable(headers, rows, ''));
        root.appendChild(fakePaginationBar());
        return root;
    }

    function panelWatchRecords() {
        var root = el('div', 'member-drawer-panel');
        root.appendChild(el('div', 'supplier-detail-section-title', '观看记录'));
        var headers = [
            '观看时间',
            '门店名称',
            '直播间名称',
            '直播场次ID',
            '观看时长',
            '下单次数',
            '点赞次数',
            '分享次数',
            '互动次数',
            '累计消费金额',
            '下单商品类目'
        ];
        var rows = [
            [
                '2020-01-01 13:00',
                '演示门店A',
                '品牌日播间',
                'SES-10001',
                '32min',
                '1',
                '12',
                '2',
                '5',
                '¥199.00',
                '饮品 / 乳品'
            ]
        ];
        root.appendChild(wrapTable(headers, rows, 'member-drawer-table--wide'));
        root.appendChild(fakePaginationBar());
        return root;
    }

    function panelOrderRecords() {
        var root = el('div', 'member-drawer-panel');
        root.appendChild(el('div', 'supplier-detail-section-title', '订单记录'));
        var headers = ['订单号', '关联直播间ID', '订单时间', '实付金额', '生成订单时间', '交易状态'];
        var rows = [['ORD-202001011300001', 'LR-88302', '2020-01-01 13:00', '¥128.00', '2020-01-01 12:55', '已支付']];
        root.appendChild(wrapTable(headers, rows, ''));
        root.appendChild(fakePaginationBar());
        return root;
    }

    function openMemberDetailDrawer(member, initialTab) {
        removeMemberDetailDrawer();
        var rec = enrichMemberRecord(member);
        initialTab = initialTab || 'detail';

        var backdrop = el('div', 'store-drawer-backdrop');
        backdrop.setAttribute('data-member-detail-drawer', '1');

        var drawer = el('aside', 'store-drawer store-drawer--member-wide');
        drawer.setAttribute('data-member-detail-drawer', '1');

        function shut() {
            backdrop.remove();
            drawer.remove();
        }

        var header = el('div', 'store-drawer__header');
        header.appendChild(el('h2', 'store-drawer__title', '会员详情'));
        var btnClose = el('button', 'store-drawer__close');
        btnClose.type = 'button';
        btnClose.innerHTML = '&times;';
        btnClose.addEventListener('click', shut);
        header.appendChild(btnClose);

        var hero = el('div', 'store-drawer__hero');
        var nameRow = el('div', 'store-drawer__name-row');
        nameRow.appendChild(el('span', 'store-drawer__name', rec.nickname));
        hero.appendChild(nameRow);
        hero.appendChild(
            el('div', 'store-drawer__meta', '会员ID：' + rec.id + (rec.phone ? ' · ' + rec.phone : ''))
        );

        var tabsWrap = el('div', 'store-drawer__tabs');
        var tabIds = ['detail', 'assets', 'stores', 'watch', 'orders'];
        var tabLabels = ['会员详情', '会员资产', '绑定门店', '观看记录', '订单记录'];
        var bodyHost = el('div', 'store-drawer__body');

        var panels = {
            detail: panelMemberDetail(rec),
            assets: panelMemberAssets(),
            stores: panelBindStores(),
            watch: panelWatchRecords(),
            orders: panelOrderRecords()
        };

        var tabs = tabIds.map(function (id, i) {
            var btn = el('button', 'store-drawer__tab', tabLabels[i]);
            btn.type = 'button';
            btn.addEventListener('click', function () {
                showTab(id);
            });
            tabsWrap.appendChild(btn);
            return btn;
        });

        function showTab(id) {
            tabIds.forEach(function (tid, j) {
                tabs[j].classList.toggle('is-active', tid === id);
            });
            empty(bodyHost);
            bodyHost.appendChild(panels[id]);
        }

        drawer.appendChild(header);
        drawer.appendChild(hero);
        drawer.appendChild(tabsWrap);
        drawer.appendChild(bodyHost);

        var idx = tabIds.indexOf(initialTab);
        showTab(tabIds[idx >= 0 ? idx : 0]);

        backdrop.addEventListener('click', shut);
        drawer.addEventListener('click', function (e) {
            e.stopPropagation();
        });

        document.body.appendChild(backdrop);
        document.body.appendChild(drawer);
    }

    function createPaginationBar(opts) {
        var page = opts.page,
            pageSize = opts.pageSize,
            total = opts.total,
            onPage = opts.onPage;
        var maxPage = Math.max(1, Math.ceil(total / pageSize));
        var bar = el('div', 'erp-pagination');
        bar.appendChild(el('span', 'erp-pagination__total', '共 ' + total + ' 条'));
        var mid = el('div', 'erp-pagination__mid');
        mid.appendChild(el('span', 'erp-pagination__hint', pageSize + ' 条/页'));
        var pages = el('div', 'erp-pagination__pages');
        var windowStart = Math.max(1, Math.min(page - 1, maxPage - 2));
        for (var p = windowStart; p <= Math.min(maxPage, windowStart + 2); p++) {
            (function (pp) {
                var b = el('button', 'erp-page-btn' + (pp === page ? ' is-active' : ''), String(pp));
                b.type = 'button';
                b.addEventListener('click', function () {
                    onPage(pp);
                });
                pages.appendChild(b);
            })(p);
        }
        mid.appendChild(pages);
        bar.appendChild(mid);
        var right = el('div', 'erp-pagination__right');
        right.appendChild(el('span', 'erp-pagination__goto-label', '前往'));
        var inp = el('input', 'erp-pagination__goto-input');
        inp.type = 'number';
        inp.min = '1';
        inp.max = String(maxPage);
        inp.value = String(Math.min(page, maxPage));
        inp.addEventListener('change', function () {
            var v = Math.min(maxPage, Math.max(1, Number(inp.value) || 1));
            onPage(v);
        });
        right.appendChild(inp);
        right.appendChild(el('span', 'erp-pagination__goto-label', '页'));
        bar.appendChild(right);
        return bar;
    }

    function openPointsModal(member) {
        removeMemberCUi();
        var backdrop = el('div', 'erp-modal-backdrop');
        backdrop.setAttribute('data-member-c-ui', '1');
        var modal = el('div', 'erp-modal erp-modal--member-c-points');
        var header = el('div', 'erp-modal__header');
        header.appendChild(el('h2', 'erp-modal__title', '发放/扣除积分'));
        var bx = el('button', 'erp-modal__header-btn');
        bx.type = 'button';
        bx.innerHTML = '&times;';
        bx.addEventListener('click', function () {
            backdrop.remove();
        });
        var ha = el('div', 'erp-modal__header-actions');
        ha.appendChild(bx);
        header.appendChild(ha);

        var body = el('div', 'erp-modal__body');

        var rowType = el('div', 'erp-modal-field');
        var lab1 = el('label', 'erp-modal-field__label');
        lab1.textContent = '类型';
        rowType.appendChild(lab1);
        var typeCtrl = el('div', 'erp-modal-field__control');
        var radioRow = el('div', 'member-c-radio-row');
        var rIssue = document.createElement('input');
        rIssue.type = 'radio';
        rIssue.name = 'mc-points-type';
        rIssue.value = 'issue';
        rIssue.checked = true;
        var rDeduct = document.createElement('input');
        rDeduct.type = 'radio';
        rDeduct.name = 'mc-points-type';
        rDeduct.value = 'deduct';
        var labIssue = el('label', 'member-c-radio-label');
        labIssue.appendChild(rIssue);
        labIssue.appendChild(document.createTextNode(' 发放'));
        var labDeduct = el('label', 'member-c-radio-label');
        labDeduct.appendChild(rDeduct);
        labDeduct.appendChild(document.createTextNode(' 扣除'));
        radioRow.appendChild(labIssue);
        radioRow.appendChild(labDeduct);
        typeCtrl.appendChild(radioRow);
        rowType.appendChild(typeCtrl);
        body.appendChild(rowType);

        var rowQty = el('div', 'erp-modal-field');
        rowQty.appendChild(el('label', 'erp-modal-field__label', '数量'));
        var qtyCtrl = el('div', 'erp-modal-field__control');
        var qtyInp = el('input', 'erp-input');
        qtyInp.type = 'number';
        qtyInp.min = '1';
        qtyInp.step = '1';
        qtyInp.placeholder = '请输入发放/扣除积分数量';
        qtyCtrl.appendChild(qtyInp);
        rowQty.appendChild(qtyCtrl);
        body.appendChild(rowQty);

        var rowReason = el('div', 'erp-modal-field');
        rowReason.appendChild(el('label', 'erp-modal-field__label', '原因'));
        var reasonCtrl = el('div', 'erp-modal-field__control');
        var ta = el('textarea', 'erp-textarea');
        ta.maxLength = 150;
        ta.rows = 4;
        ta.placeholder = '请输入发放/扣除原因';
        var counter = el('div', 'member-c-textarea-counter');
        var cntSpan = el('span', '', '0');
        counter.appendChild(cntSpan);
        counter.appendChild(document.createTextNode('/150'));
        function syncCnt() {
            cntSpan.textContent = String((ta.value || '').length);
        }
        ta.addEventListener('input', syncCnt);
        reasonCtrl.appendChild(ta);
        reasonCtrl.appendChild(counter);
        rowReason.appendChild(reasonCtrl);
        body.appendChild(rowReason);

        var footer = el('div', 'erp-modal__footer');
        var bCancel = mkBtn('取消', false);
        var bOk = mkBtn('确定', true);
        bCancel.addEventListener('click', function () {
            backdrop.remove();
        });
        bOk.addEventListener('click', function () {
            var type =
                (backdrop.querySelector('input[name="mc-points-type"]:checked') || {}).value || 'issue';
            var qty = qtyInp.value.trim();
            var reason = (ta.value || '').trim();
            if (!qty || Number(qty) <= 0) {
                window.alert('请输入有效的积分数量');
                return;
            }
            if (!reason) {
                window.alert('请输入原因');
                return;
            }
            var label = type === 'deduct' ? '扣除' : '发放';
            window.alert('已提交' + label + '积分：会员 ' + member.id + '，数量 ' + qty);
            backdrop.remove();
            showToast('积分操作已记录（演示）', 'success');
        });

        footer.appendChild(bCancel);
        footer.appendChild(bOk);

        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);
        backdrop.appendChild(modal);
        backdrop.addEventListener('click', function (ev) {
            if (ev.target === backdrop) backdrop.remove();
        });
        document.body.appendChild(backdrop);
        syncCnt();
    }

    function openCouponDispatchModal(member) {
        removeMemberCUi();
        var backdrop = el('div', 'erp-modal-backdrop');
        backdrop.setAttribute('data-member-c-ui', '1');
        var modal = el('div', 'erp-modal erp-modal--member-c-coupon');
        var header = el('div', 'erp-modal__header');
        header.appendChild(el('h2', 'erp-modal__title', '派送优惠券'));
        var bx = el('button', 'erp-modal__header-btn');
        bx.type = 'button';
        bx.innerHTML = '&times;';
        bx.addEventListener('click', function () {
            backdrop.remove();
        });
        var ha = el('div', 'erp-modal__header-actions');
        ha.appendChild(bx);
        header.appendChild(ha);

        var body = el('div', 'erp-modal__body');
        var tabs = el('div', 'member-coupon-tabs');
        var tab1 = el('button', 'member-coupon-tab is-active');
        tab1.type = 'button';
        tab1.textContent = '商品优惠券';
        tabs.appendChild(tab1);
        body.appendChild(tabs);

        var toolbar = el('div', 'erp-toolbar member-coupon-toolbar');
        var searchInp = el('input', 'erp-input member-coupon-search');
        searchInp.type = 'text';
        searchInp.placeholder = '请输入优惠券名称';
        searchInp.style.maxWidth = '280px';
        var searchBtn = mkBtn('搜索', false);
        toolbar.appendChild(searchInp);
        toolbar.appendChild(searchBtn);
        body.appendChild(toolbar);

        var scroll = el('div', 'erp-table-scroll member-c-table-scroll');
        var table = el('table', 'erp-table');
        var thead = el('thead');
        var trh = el('tr');
        [
            '名称',
            '类型',
            '使用方式',
            '优惠内容',
            '领取次数',
            '状态',
            '库存数',
            '不可用说明',
            '操作'
        ].forEach(function (h) {
            trh.appendChild(el('th', '', h));
        });
        thead.appendChild(trh);
        var tbody = el('tbody');
        table.appendChild(thead);
        table.appendChild(tbody);
        scroll.appendChild(table);
        body.appendChild(scroll);

        var pagHost = el('div', 'member-coupon-pagination');
        body.appendChild(pagHost);

        var couponPage = 1;
        var couponPageSize = 10;
        var couponKeyword = '';

        function filteredCoupons() {
            var k = couponKeyword.trim().toLowerCase();
            return MOCK_COUPONS.filter(function (c) {
                return !k || String(c.name).toLowerCase().indexOf(k) !== -1;
            });
        }

        function paintCouponTable() {
            var all = filteredCoupons();
            var total = all.length;
            var maxPage = Math.max(1, Math.ceil(total / couponPageSize));
            if (couponPage > maxPage) couponPage = maxPage;
            var start = (couponPage - 1) * couponPageSize;
            var slice = all.slice(start, start + couponPageSize);

            empty(tbody);
            slice.forEach(function (c) {
                var tr = el('tr');
                var cells = [
                    c.name,
                    c.type,
                    c.usage,
                    c.content,
                    c.collectCount,
                    c.status,
                    c.stock,
                    c.unavailable
                ];
                cells.forEach(function (text) {
                    tr.appendChild(el('td', '', text));
                });
                var tdOp = el('td');
                var issueLink = el('a', 'erp-link', '发放');
                issueLink.href = '#';
                issueLink.addEventListener('click', function (e) {
                    e.preventDefault();
                    window.alert('已向会员 ' + member.id + ' 发放优惠券：' + c.name);
                });
                tdOp.appendChild(issueLink);
                tr.appendChild(tdOp);
                tbody.appendChild(tr);
            });

            empty(pagHost);
            pagHost.appendChild(
                createPaginationBar({
                    page: couponPage,
                    pageSize: couponPageSize,
                    total: total,
                    onPage: function (p) {
                        couponPage = p;
                        paintCouponTable();
                    }
                })
            );
        }

        searchBtn.addEventListener('click', function () {
            couponKeyword = searchInp.value || '';
            couponPage = 1;
            paintCouponTable();
        });
        searchInp.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                couponKeyword = searchInp.value || '';
                couponPage = 1;
                paintCouponTable();
            }
        });

        paintCouponTable();

        var footer = el('div', 'erp-modal__footer');
        var bCancel = mkBtn('取消', false);
        var bOk = mkBtn('确定', true);
        bCancel.addEventListener('click', function () {
            backdrop.remove();
        });
        bOk.addEventListener('click', function () {
            window.alert('已确认派送（演示）：会员 ' + member.id);
            backdrop.remove();
            showToast('优惠券派送已确认（演示）', 'success');
        });
        footer.appendChild(bCancel);
        footer.appendChild(bOk);

        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);
        backdrop.appendChild(modal);
        backdrop.addEventListener('click', function (ev) {
            if (ev.target === backdrop) backdrop.remove();
        });
        document.body.appendChild(backdrop);
    }

    window.MdmMemberCUi = {
        rowToMember: rowToMember,
        openDetailFromRow: function (tr) {
            var m = rowToMember(tr);
            if (!m) {
                showToast('无法读取该行会员数据', 'error');
                return;
            }
            openMemberDetailDrawer(m, 'detail');
        },
        openCouponFromRow: function (tr) {
            var m = rowToMember(tr);
            if (!m) return;
            openCouponDispatchModal(m);
        },
        openPointsFromRow: function (tr) {
            var m = rowToMember(tr);
            if (!m) return;
            openPointsModal(m);
        }
    };
})();
