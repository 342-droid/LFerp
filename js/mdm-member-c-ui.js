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
            level: String(z(m.level, '普通会员')),
            tags: String(z(m.tags, '—')),
            source: String(z(m.source, '—')),
            birthday: String(z(m.birthday, '')),
            district: String(z(m.district, '')),
            bindMethod: String(z(m.bindMethod, '—')),
            channelCount: String(z(m.channelCount, '—')),
            points: String(z(m.points, '—')),
            satisMinutes: String(z(m.satisMinutes, '—')),
            satisFeedback: String(z(m.satisFeedback, '—')),
            growthScore: String(z(m.growthScore, '1485')),
            growthTotal: String(z(m.growthTotal, '3260')),
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
            inviteMemberId: String(z(m.inviteMemberId, 'U10088')),
            inviteNickname: String(z(m.inviteNickname, '邀请达人小王')),
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
        if (c.length < 19) return null;
        var av = c[2].querySelector('span');
        var base = {
            id: c[0].textContent.trim(),
            nickname: c[1].textContent.trim(),
            avatarText: av ? av.textContent.trim() : '',
            phone: c[3].textContent.trim(),
            gender: c[4].textContent.trim(),
            isMember: c[5].textContent.trim(),
            level: c[6].textContent.trim(),
            tags: c[7].textContent.trim(),
            source: c[8].textContent.trim(),
            bindMethod: c[9].textContent.trim(),
            channelCount: c[10].textContent.trim(),
            points: c[11].textContent.trim(),
            satisMinutes: c[12].textContent.trim(),
            satisFeedback: c[13].textContent.trim(),
            growthScore: c[14].textContent.trim(),
            amount: c[15].textContent.trim(),
            orderCount: c[16].textContent.trim(),
            lastConsume: c[17].textContent.trim(),
            status: (c[18].querySelector('.status') || c[18]).textContent.trim()
        };
        if (tr.getAttribute('data-birthday')) base.birthday = tr.getAttribute('data-birthday');
        if (tr.getAttribute('data-district')) base.district = tr.getAttribute('data-district');
        if (tr.getAttribute('data-phone-full')) base.phone = tr.getAttribute('data-phone-full');

        /* 再从同步列表补全生日 / 城区等扩展字段 */
        try {
            var raw = localStorage.getItem('mdm_member_c_list_v1');
            if (raw) {
                var list = JSON.parse(raw);
                if (Array.isArray(list)) {
                    for (var i = 0; i < list.length; i++) {
                        if (list[i] && list[i].id === base.id) {
                            if (list[i].birthday) base.birthday = list[i].birthday;
                            if (list[i].district) base.district = list[i].district;
                            if (list[i].phone) base.phone = list[i].phone;
                            if (list[i].growthTotal) base.growthTotal = list[i].growthTotal;
                            break;
                        }
                    }
                }
            }
        } catch (e) { /* ignore */ }
        return base;
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
            ['会员等级', rec.level || '—'],
            ['会员标签', rec.tags],
            ['会员来源', rec.source],
            ['生日', rec.birthday || '—'],
            ['所在城区', rec.district],
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
            ['注册邀请人', rec.inviteMemberId + ' / ' + rec.inviteNickname],
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

    function mkField(label, control) {
        var field = el('div', 'erp-field');
        field.appendChild(el('div', 'erp-field__label', label));
        field.appendChild(control);
        return field;
    }

    function mkInput(placeholder, type) {
        var inp = document.createElement('input');
        inp.className = 'erp-input';
        inp.type = type || 'text';
        if (placeholder) inp.placeholder = placeholder;
        return inp;
    }

    function mkSelect(options) {
        var sel = document.createElement('select');
        sel.className = 'erp-select';
        (options || []).forEach(function (opt) {
            var o = document.createElement('option');
            o.value = opt.value;
            o.textContent = opt.label;
            sel.appendChild(o);
        });
        return sel;
    }

    function mockGrowthRows(rec) {
        return [
            {
                occurAt: '2026-07-20 14:20:03',
                acquireType: '购物消费',
                acquireSub: '订单完成',
                change: '+86',
                afterValue: String(rec.growthScore || '1485'),
                status: '有效',
                refNo: 'ORD-3212689201598341',
                remark: '订单实付 ¥86.00'
            },
            {
                occurAt: '2026-07-18 08:01:12',
                acquireType: '用户活跃',
                acquireSub: '每日签到',
                change: '+5',
                afterValue: '1399',
                status: '有效',
                refNo: '—',
                remark: '每日签到'
            },
            {
                occurAt: '2026-06-12 19:33:41',
                acquireType: '购物消费',
                acquireSub: '订单完成',
                change: '+129',
                afterValue: '1394',
                status: '有效',
                refNo: 'ORD-3212689201588561',
                remark: '订单实付 ¥129.50'
            },
            {
                occurAt: '2026-05-24 21:15:08',
                acquireType: '购物消费',
                acquireSub: '售后完成',
                change: '-30',
                afterValue: '1265',
                status: '有效',
                refNo: 'AS202605240018',
                remark: '售后退款扣减成长值'
            },
            {
                occurAt: '2025-12-01 10:00:00',
                acquireType: '手工调整',
                acquireSub: '手工增加',
                change: '+200',
                afterValue: '980',
                status: '过期',
                refNo: '—',
                remark: '活动补偿'
            },
            {
                occurAt: '2025-08-08 16:45:09',
                acquireType: '用户活跃',
                acquireSub: '评价订单',
                change: '+10',
                afterValue: '780',
                status: '过期',
                refNo: 'ORD-3212689201584693',
                remark: '评价订单'
            }
        ];
    }

    function panelMemberGrowth(rec) {
        var root = el('div', 'member-drawer-panel');

        var sectionHead = el('div', 'member-growth-section-head');
        sectionHead.appendChild(el('div', 'supplier-detail-section-title', '成长值'));
        var btnAdjustGrowth = mkBtn('调整成长值', true);
        sectionHead.appendChild(btnAdjustGrowth);
        root.appendChild(sectionHead);

        var summary = el('div', 'member-growth-summary');
        [
            ['当前等级', rec.level || '—'],
            ['成长值', rec.growthScore || '—'],
            ['累计成长值', rec.growthTotal || '—']
        ].forEach(function (item) {
            var card = el('div', 'member-growth-summary__item');
            card.appendChild(el('div', 'member-growth-summary__label', item[0]));
            card.appendChild(el('div', 'member-growth-summary__value', item[1]));
            summary.appendChild(card);
        });
        root.appendChild(summary);

        var SUB_OPTIONS = {
            购物消费: [
                { value: '订单完成', label: '订单完成' },
                { value: '售后完成', label: '售后完成' }
            ],
            用户活跃: [
                { value: '每日签到', label: '每日签到' },
                { value: '浏览商品', label: '浏览商品' },
                { value: '分享邀请', label: '分享邀请' },
                { value: '评价订单', label: '评价订单' }
            ],
            手工调整: [
                { value: '手工增加', label: '手工增加' },
                { value: '手工减少', label: '手工减少' }
            ]
        };
        var SUB_LABELS = {
            购物消费: '明细类型',
            用户活跃: '活跃行为',
            手工调整: '调整类型'
        };

        var allRows = mockGrowthRows(rec);
        var state = { timeStart: '', timeEnd: '', acquireType: '', acquireSub: '', status: '' };

        var toolbar = el('div', 'erp-toolbar member-drawer-filter-toolbar');
        var timeStart = mkInput('', 'datetime-local');
        timeStart.step = '1';
        var timeEnd = mkInput('', 'datetime-local');
        timeEnd.step = '1';
        var timeWrap = el('div', 'member-growth-time-range');
        timeWrap.appendChild(timeStart);
        timeWrap.appendChild(el('span', 'member-growth-time-range__sep', '至'));
        timeWrap.appendChild(timeEnd);
        toolbar.appendChild(mkField('获取时间', timeWrap));

        var typeSel = mkSelect([
            { value: '', label: '全部' },
            { value: '购物消费', label: '购物消费' },
            { value: '用户活跃', label: '用户活跃' },
            { value: '手工调整', label: '手工调整' }
        ]);
        toolbar.appendChild(mkField('获取方式', typeSel));

        var subSel = mkSelect([{ value: '', label: '全部' }]);
        var subField = mkField('明细类型', subSel);
        subField.style.display = 'none';
        toolbar.appendChild(subField);

        var statusSel = mkSelect([
            { value: '', label: '全部' },
            { value: '有效', label: '有效' },
            { value: '过期', label: '过期' }
        ]);
        toolbar.appendChild(mkField('状态', statusSel));

        var actions = el('div', 'erp-toolbar__actions');
        var btnReset = mkBtn('重置', false);
        btnReset.classList.add('erp-btn--outline-primary');
        var btnQuery = mkBtn('查询', true);
        actions.appendChild(btnReset);
        actions.appendChild(btnQuery);
        toolbar.appendChild(actions);
        root.appendChild(toolbar);

        var tableHost = el('div', 'member-growth-table-host');
        root.appendChild(tableHost);
        var pageHost = el('div', 'member-growth-page-host');
        root.appendChild(pageHost);

        function refreshSummary() {
            var cards = summary.querySelectorAll('.member-growth-summary__value');
            if (cards[0]) cards[0].textContent = rec.level || '—';
            if (cards[1]) cards[1].textContent = rec.growthScore || '—';
            if (cards[2]) cards[2].textContent = rec.growthTotal || '—';
        }

        function toComparable(v) {
            return String(v || '').replace('T', ' ').slice(0, 19);
        }

        function nowStr() {
            var d = new Date();
            function pad(n) { return n < 10 ? '0' + n : String(n); }
            return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
                ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
        }

        btnAdjustGrowth.addEventListener('click', function () {
            openGrowthAdjustModal(rec, {
                onSuccess: function (result) {
                    rec.growthScore = String(result.afterValue);
                    if (result.change > 0) {
                        rec.growthTotal = String((Number(rec.growthTotal) || 0) + result.change);
                    }
                    allRows.unshift({
                        occurAt: result.occurAt || nowStr(),
                        acquireType: '手工调整',
                        acquireSub: result.change < 0 ? '手工减少' : '手工增加',
                        change: (result.change > 0 ? '+' : '') + result.change,
                        afterValue: String(result.afterValue),
                        status: '有效',
                        refNo: '—',
                        remark: result.remark || '手工调整'
                    });
                    refreshSummary();
                    renderList();
                }
            });
        });

        function syncSubSelect() {
            var type = typeSel.value || '';
            var options = SUB_OPTIONS[type] || [];
            var labelEl = subField.querySelector('.erp-field__label');
            empty(subSel);
            var allOpt = document.createElement('option');
            allOpt.value = '';
            allOpt.textContent = '全部';
            subSel.appendChild(allOpt);

            if (!type || !options.length) {
                subField.style.display = 'none';
                subSel.value = '';
                if (labelEl) labelEl.textContent = '明细类型';
                return;
            }

            options.forEach(function (opt) {
                var o = document.createElement('option');
                o.value = opt.value;
                o.textContent = opt.label;
                subSel.appendChild(o);
            });
            if (labelEl) labelEl.textContent = SUB_LABELS[type] || '明细类型';
            subField.style.display = '';
            subSel.value = '';
        }

        function getFiltered() {
            return allRows.filter(function (row) {
                if (state.timeStart && toComparable(row.occurAt) < toComparable(state.timeStart)) return false;
                if (state.timeEnd && toComparable(row.occurAt) > toComparable(state.timeEnd)) return false;
                if (state.acquireType && row.acquireType !== state.acquireType) return false;
                if (state.acquireSub && row.acquireSub !== state.acquireSub) return false;
                if (state.status && row.status !== state.status) return false;
                return true;
            });
        }

        function renderList() {
            var filtered = getFiltered();
            empty(tableHost);
            empty(pageHost);
            var headers = ['获取时间', '获取方式', '明细类型', '变动值', '变动后成长值', '状态', '关联单号', '备注'];
            var rows = filtered.map(function (row) {
                return [
                    row.occurAt,
                    row.acquireType,
                    row.acquireSub,
                    row.change,
                    row.afterValue,
                    row.status,
                    row.refNo,
                    row.remark
                ];
            });
            if (!rows.length) {
                rows = [['—', '—', '—', '—', '—', '—', '—', '暂无匹配明细']];
            }
            tableHost.appendChild(wrapTable(headers, rows, 'member-drawer-table--wide'));
            var bar = el('div', 'erp-pagination');
            bar.appendChild(el('span', 'erp-pagination__total', '共 ' + filtered.length + ' 条'));
            pageHost.appendChild(bar);
        }

        function readState() {
            state.timeStart = timeStart.value || '';
            state.timeEnd = timeEnd.value || '';
            state.acquireType = typeSel.value || '';
            state.acquireSub = subField.style.display === 'none' ? '' : (subSel.value || '');
            state.status = statusSel.value || '';
        }

        typeSel.addEventListener('change', function () {
            syncSubSelect();
        });

        btnQuery.addEventListener('click', function () {
            readState();
            if (state.timeStart && state.timeEnd && toComparable(state.timeStart) > toComparable(state.timeEnd)) {
                window.alert('获取时间起始不能晚于结束时间');
                return;
            }
            renderList();
        });

        btnReset.addEventListener('click', function () {
            timeStart.value = '';
            timeEnd.value = '';
            typeSel.value = '';
            statusSel.value = '';
            syncSubSelect();
            state = { timeStart: '', timeEnd: '', acquireType: '', acquireSub: '', status: '' };
            renderList();
        });

        syncSubSelect();
        renderList();
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
        var tabIds = ['detail', 'growth', 'assets', 'stores', 'watch', 'orders'];
        var tabLabels = ['会员详情', '成长值', '会员资产', '绑定门店', '观看记录', '订单记录'];
        var bodyHost = el('div', 'store-drawer__body');

        var panels = {
            detail: panelMemberDetail(rec),
            growth: panelMemberGrowth(rec),
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

    function getCurrentOperatorName() {
        try {
            if (typeof getCurrentUser === 'function') {
                var u = getCurrentUser();
                if (u && (u.name || u.username)) return u.name || u.username;
            }
        } catch (e) { /* ignore */ }
        return '演示运营';
    }

    function syncMemberGrowthToListStorage(member) {
        try {
            var key = 'mdm_member_c_list_v1';
            var raw = localStorage.getItem(key);
            var list = raw ? JSON.parse(raw) : [];
            if (!Array.isArray(list)) list = [];
            var found = false;
            for (var i = 0; i < list.length; i++) {
                if (list[i] && String(list[i].id) === String(member.id)) {
                    list[i].growthScore = member.growthScore;
                    list[i].growthTotal = member.growthTotal;
                    found = true;
                    break;
                }
            }
            if (!found) {
                list.unshift({
                    id: member.id,
                    nickname: member.nickname,
                    phone: member.phone,
                    level: member.level,
                    growthScore: member.growthScore,
                    growthTotal: member.growthTotal
                });
            }
            localStorage.setItem(key, JSON.stringify(list));
        } catch (e) { /* ignore */ }
    }

    function syncMemberGrowthToTableRow(member) {
        var tbody = document.getElementById('tableBody');
        if (!tbody || !member || !member.id) return;
        var rows = tbody.querySelectorAll('tr');
        for (var i = 0; i < rows.length; i++) {
            var tr = rows[i];
            var idCell = tr.querySelector('td');
            if (!idCell || idCell.textContent.trim() !== String(member.id)) continue;
            var cells = tr.querySelectorAll('td');
            /* 会员成长分在第 15 列（0-based index 14） */
            if (cells[14]) cells[14].textContent = String(member.growthScore || '0');
            break;
        }
    }

    function openGrowthAdjustModal(member, opts) {
        opts = opts || {};
        if (!member) return;
        removeMemberCUi();

        var remain = Number(String(member.growthScore || '0').replace(/[^\d.-]/g, '')) || 0;
        var operator = getCurrentOperatorName();

        var backdrop = el('div', 'erp-modal-backdrop erp-modal-backdrop--over-drawer');
        backdrop.setAttribute('data-member-c-ui', '1');
        var modal = el('div', 'erp-modal erp-modal--member-c-points');
        var header = el('div', 'erp-modal__header');
        header.appendChild(el('h2', 'erp-modal__title', '调整成长值'));
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

        var rowMember = el('div', 'erp-modal-field');
        rowMember.appendChild(el('label', 'erp-modal-field__label', '会员'));
        var memberCtrl = el('div', 'erp-modal-field__control');
        memberCtrl.appendChild(
            el(
                'div',
                'member-growth-adjust-member',
                member.id + ' / ' + (member.nickname || '—') +
                    (member.phone && member.phone !== '—' ? ' / ' + member.phone : '')
            )
        );
        memberCtrl.appendChild(
            el('div', 'member-growth-adjust-tip', '当前剩余成长值 ')
        );
        memberCtrl.lastChild.appendChild(el('strong', '', String(remain)));
        memberCtrl.lastChild.appendChild(document.createTextNode(' 分'));
        rowMember.appendChild(memberCtrl);
        body.appendChild(rowMember);

        var rowOp = el('div', 'erp-modal-field');
        rowOp.appendChild(el('label', 'erp-modal-field__label', '操作人'));
        var opCtrl = el('div', 'erp-modal-field__control');
        opCtrl.appendChild(el('div', 'member-growth-adjust-member', operator));
        rowOp.appendChild(opCtrl);
        body.appendChild(rowOp);

        var rowType = el('div', 'erp-modal-field');
        var labType = el('label', 'erp-modal-field__label');
        labType.innerHTML = '<span class="erp-req">*</span>调整类型';
        rowType.appendChild(labType);
        var typeCtrl = el('div', 'erp-modal-field__control');
        var radioRow = el('div', 'member-c-radio-row');
        var rAdd = document.createElement('input');
        rAdd.type = 'radio';
        rAdd.name = 'mc-growth-type';
        rAdd.value = 'add';
        rAdd.checked = true;
        var rSub = document.createElement('input');
        rSub.type = 'radio';
        rSub.name = 'mc-growth-type';
        rSub.value = 'sub';
        var labAdd = el('label', 'member-c-radio-label');
        labAdd.appendChild(rAdd);
        labAdd.appendChild(document.createTextNode(' 手工增加'));
        var labSub = el('label', 'member-c-radio-label');
        labSub.appendChild(rSub);
        labSub.appendChild(document.createTextNode(' 手工减少'));
        radioRow.appendChild(labAdd);
        radioRow.appendChild(labSub);
        typeCtrl.appendChild(radioRow);
        rowType.appendChild(typeCtrl);
        body.appendChild(rowType);

        var rowQty = el('div', 'erp-modal-field');
        var labQty = el('label', 'erp-modal-field__label');
        labQty.innerHTML = '<span class="erp-req">*</span>调整数值';
        rowQty.appendChild(labQty);
        var qtyCtrl = el('div', 'erp-modal-field__control');
        var qtyInp = el('input', 'erp-input');
        qtyInp.type = 'number';
        qtyInp.min = '1';
        qtyInp.step = '1';
        qtyInp.placeholder = '请输入正整数';
        qtyCtrl.appendChild(qtyInp);
        rowQty.appendChild(qtyCtrl);
        body.appendChild(rowQty);

        var rowReason = el('div', 'erp-modal-field');
        var labReason = el('label', 'erp-modal-field__label');
        labReason.innerHTML = '<span class="erp-req">*</span>备注';
        rowReason.appendChild(labReason);
        var reasonCtrl = el('div', 'erp-modal-field__control');
        var ta = el('textarea', 'erp-textarea');
        ta.maxLength = 200;
        ta.rows = 4;
        ta.placeholder = '请填写调整原因，最多 200 字';
        var counter = el('div', 'member-c-textarea-counter');
        var cntSpan = el('span', '', '0');
        counter.appendChild(cntSpan);
        counter.appendChild(document.createTextNode('/200'));
        ta.addEventListener('input', function () {
            cntSpan.textContent = String((ta.value || '').length);
        });
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
                (backdrop.querySelector('input[name="mc-growth-type"]:checked') || {}).value || 'add';
            var qtyRaw = (qtyInp.value || '').trim();
            var remark = (ta.value || '').trim();
            if (!qtyRaw || !/^\d+$/.test(qtyRaw) || Number(qtyRaw) < 1) {
                window.alert('调整数值须为正整数');
                return;
            }
            if (!remark) {
                window.alert('请填写备注信息');
                return;
            }
            var amount = Number(qtyRaw);
            if (type === 'sub' && amount > remain) {
                window.alert('扣减数量不得大于会员剩余成长值（当前剩余 ' + remain + ' 分）');
                return;
            }
            var change = type === 'sub' ? -amount : amount;
            var afterValue = remain + change;
            member.growthScore = String(afterValue);
            var total = Number(String(member.growthTotal || remain).replace(/[^\d.-]/g, '')) || remain;
            if (change > 0) member.growthTotal = String(total + change);

            syncMemberGrowthToTableRow(member);
            syncMemberGrowthToListStorage(member);

            var result = {
                change: change,
                afterValue: afterValue,
                remark: remark,
                operator: operator,
                occurAt: (function () {
                    var d = new Date();
                    function pad(n) { return n < 10 ? '0' + n : String(n); }
                    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
                        ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
                })()
            };

            backdrop.remove();
            if (typeof showToast === 'function') {
                showToast(type === 'sub' ? '已手工减少成长值' : '已手工增加成长值', 'success');
            } else {
                window.alert(type === 'sub' ? '已手工减少成长值' : '已手工增加成长值');
            }
            if (typeof opts.onSuccess === 'function') opts.onSuccess(result);
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
        setTimeout(function () {
            qtyInp.focus();
        }, 0);
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
        },
        openGrowthFromRow: function (tr) {
            var m = rowToMember(tr);
            if (!m) {
                showToast('无法读取该行会员数据', 'error');
                return;
            }
            openGrowthAdjustModal(m);
        },
        openGrowthAdjust: openGrowthAdjustModal
    };
})();
