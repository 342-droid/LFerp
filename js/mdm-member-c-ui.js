/**
 * C 端会员 — 详情抽屉、积分、优惠券（由 vendor mdm-member-c + member-detail-drawer 迁入）
 */
(function () {
    /* 与会员等级-选择优惠券弹窗同一套演示数据 */
    var COUPON_OPTIONS = [
        { value: '满50减5券', label: '满50减5券', amount: '减5元', threshold: '50元', channel: '全渠道', validPeriod: '领取后7天有效', collectLimit: '不限', stock: '999', expired: false },
        { value: '满100减15券', label: '满100减15券', amount: '减15元', threshold: '100元', channel: 'APP/小程序', validPeriod: '2026-01-01~12-31', collectLimit: '每人3次', stock: '500', expired: false },
        { value: '满200减30券', label: '满200减30券', amount: '减30元', threshold: '200元', channel: '全渠道', validPeriod: '2026-03-01~09-30', collectLimit: '每人2次', stock: '200', expired: false },
        { value: '满300减50券', label: '满300减50券', amount: '减50元', threshold: '300元', channel: '门店自提', validPeriod: '领取后15天有效', collectLimit: '每人1次', stock: '100', expired: false },
        { value: '生日专属券', label: '生日专属券', amount: '减10元', threshold: '无门槛', channel: '全渠道', validPeriod: '生日当月有效', collectLimit: '每人1次', stock: '999', expired: false },
        { value: '免运费券', label: '免运费券', amount: '免运费', threshold: '无门槛', channel: '快递配送', validPeriod: '领取后3天有效', collectLimit: '每人2次', stock: '300', expired: false },
        { value: '新人专享券', label: '新人专享券', amount: '减8元', threshold: '无门槛', channel: 'APP/小程序', validPeriod: '领取后30天有效', collectLimit: '每人1次', stock: '800', expired: false },
        { value: '周末专享券', label: '周末专享券', amount: '9折', threshold: '5元', channel: '全渠道', validPeriod: '每周五~周日', collectLimit: '不限', stock: '999', expired: false },
        { value: '生鲜满减券', label: '生鲜满减券', amount: '减12元', threshold: '5元', channel: '全渠道', validPeriod: '2026-04-01~10-31', collectLimit: '每人3次', stock: '450', expired: false },
        { value: '过期满减券', label: '过期满减券', amount: '减20元', threshold: '5元', channel: '全渠道', validPeriod: '2025-01-01~12-31', collectLimit: '每人1次', stock: '0', expired: true }
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
        document.querySelectorAll('[data-member-c-coupon-qty="1"]').forEach(function (n) {
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
            registerTime: String(z(m.registerTime, z(m.firstLogin, '—'))),
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
        if (c.length < 4) return null;
        var av = c[2] ? c[2].querySelector('span') : null;
        /* 注销会员表：ID / 昵称 / 手机 / 注册时间 / 渠道 / 平台 / 状态 / 备注 / 操作 */
        if (c.length < 19) {
            var stCell = c[6] || c[7] || c[c.length - 2];
            var nick = c[1].textContent.trim();
            return {
                id: c[0].textContent.trim(),
                nickname: nick,
                avatarText: av ? av.textContent.trim() : String(nick || '会').charAt(0),
                phone: (c[2] && c[2].textContent.trim()) || '—',
                gender: '—',
                isMember: '—',
                level: '普通会员',
                tags: '—',
                source: (c[4] && c[4].textContent.trim()) || '—',
                bindMethod: '—',
                channelCount: '—',
                points: '—',
                satisMinutes: '—',
                satisFeedback: '—',
                growthScore: '—',
                amount: '—',
                orderCount: '—',
                lastConsume: '—',
                status: ((stCell && (stCell.querySelector('.status') || stCell)).textContent || '注销').trim()
            };
        }
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
            registerTime: c.length >= 21 ? c[18].textContent.trim() : '—',
            status: ((c.length >= 21 ? c[19] : c[18]).querySelector('.status') || (c.length >= 21 ? c[19] : c[18])).textContent.trim()
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
            ['注册时间', rec.registerTime || rec.firstLogin || '—'],
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

    function couponSceneLabel(method) {
        if (window.MdmMallMarketingRecordStore && typeof window.MdmMallMarketingRecordStore.normalizeCollectMethod === 'function') {
            return window.MdmMallMarketingRecordStore.normalizeCollectMethod(method);
        }
        if (method === '后台手工发券') return '后台人工发券';
        if (method === '直播发券' || method === '福袋发券' || method === '签到发券' || method === '后台人工发券') {
            return method;
        }
        return '后台人工发券';
    }

    function couponActivityIdText(row) {
        if (window.MdmMallMarketingRecordStore && typeof window.MdmMallMarketingRecordStore.formatActivityId === 'function') {
            return window.MdmMallMarketingRecordStore.formatActivityId(row) || '—';
        }
        var scene = couponSceneLabel(row && (row.scene || row.collectMethod));
        if (scene === '后台人工发券') return '—';
        var id = String((row && row.activityId) || '').trim();
        return id && id !== '—' ? id : '—';
    }

    function couponStatusClass(st) {
        if (st === '未使用' || st === '待使用') return 'mdm-status mdm-status--ok';
        if (st === '已使用') return 'mdm-status mdm-status--muted';
        if (st === '已过期') return 'mdm-status mdm-status--warn';
        return 'mdm-status';
    }

    function parseCollectLimit(text) {
        var s = String(text || '').trim();
        if (!s || s === '不限') return Infinity;
        var m = s.match(/(\d+)/);
        return m ? Number(m[1]) : Infinity;
    }

    function parseStockQty(coupon) {
        var n = Number(coupon && coupon.stock);
        return isNaN(n) || n < 0 ? Infinity : n;
    }

    function countUserCouponClaimed(userId, couponName) {
        var Store = window.MdmMallMarketingRecordStore;
        if (!Store || typeof Store.loadList !== 'function') return 0;
        var uid = String(userId || '');
        var name = String(couponName || '');
        if (!uid || !name) return 0;
        return Store.loadList().filter(function (row) {
            return String(row.userId) === uid && String(row.couponName) === name;
        }).length;
    }

    function getUserClaimableQty(member, coupon) {
        var limit = parseCollectLimit(coupon && coupon.collectLimit);
        if (!isFinite(limit)) return Infinity;
        var name = (coupon && (coupon.label || coupon.value)) || '';
        return Math.max(0, limit - countUserCouponClaimed(member && member.id, name));
    }

    function formatClaimableQty(n) {
        return isFinite(n) ? String(n) : '不限';
    }

    function toastIssueFail(reason) {
        var msg = '发放失败：' + reason;
        if (typeof showToast === 'function') showToast(msg, 'error');
        else window.alert(msg);
    }

    function validateIssueQty(qty, claimable, stock) {
        if (!qty || isNaN(qty) || qty < 1 || qty !== Math.floor(qty)) {
            return '发放数量须为正整数';
        }
        if (isFinite(claimable) && qty > claimable) {
            return '发放数量不能超过可领数量（当前可领 ' + claimable + '）';
        }
        if (isFinite(stock) && qty > stock) {
            return '发放数量不能超过券库存（当前剩余 ' + stock + '）';
        }
        return '';
    }

    function normalizeCouponOrderNos(row) {
        if (window.MdmMallMarketingRecordStore && typeof window.MdmMallMarketingRecordStore.normalizeOrderNos === 'function') {
            return window.MdmMallMarketingRecordStore.normalizeOrderNos(row);
        }
        var out = [];
        function push(v) {
            var s = String(v || '').trim();
            if (!s || s === '—') return;
            if (out.indexOf(s) === -1) out.push(s);
        }
        if (row && Array.isArray(row.orderNos)) row.orderNos.forEach(push);
        else if (row && row.orderNo) push(row.orderNo);
        return out;
    }

    function mockLiveCouponRows(rec) {
        var uid = String((rec && rec.id) || 'U10001');
        return [
            {
                id: 'LC' + uid + '-001',
                name: '满50减5券',
                threshold: '50元',
                faceValue: '5元',
                channel: '全渠道',
                validPeriod: '领取后7天有效',
                collectAt: '2026-08-03 20:15:08',
                scene: '直播发券',
                collectMethod: '直播发券',
                activityId: 'sess-001',
                status: '未使用',
                orderNos: []
            },
            {
                id: 'LB' + uid + '-001',
                name: '生鲜满减券',
                threshold: '5元',
                faceValue: '12元',
                channel: '全渠道',
                validPeriod: '2026-04-01~10-31',
                collectAt: '2026-07-22 19:40:11',
                scene: '福袋发券',
                collectMethod: '福袋发券',
                activityId: 'tpl-b1',
                status: '已使用',
                orderNos: ['ORD-3212689201598341']
            },
            {
                id: 'SI' + uid + '-001',
                name: '周末专享券',
                threshold: '5元',
                faceValue: '9折',
                channel: '全渠道',
                validPeriod: '每周五~周日',
                collectAt: '2026-06-14 21:08:44',
                scene: '签到发券',
                collectMethod: '签到发券',
                activityId: 'tpl-s1',
                status: '已过期',
                orderNos: []
            }
        ];
    }

    function mockManualCouponRows(rec) {
        var uid = String((rec && rec.id) || 'U10001');
        return [
            {
                id: 'MR' + uid + '-001',
                name: '新人专享券',
                threshold: '无门槛',
                faceValue: '8元',
                channel: 'APP/小程序',
                validPeriod: '领取后30天有效',
                collectAt: '2026-08-10 16:40:18',
                scene: '后台人工发券',
                collectMethod: '后台人工发券',
                activityId: '',
                status: '未使用',
                orderNos: []
            },
            {
                id: 'MR' + uid + '-002',
                name: '免运费券',
                threshold: '无门槛',
                faceValue: '免运费',
                channel: '快递配送',
                validPeriod: '领取后3天有效',
                collectAt: '2026-08-01 10:22:11',
                scene: '后台人工发券',
                collectMethod: '后台人工发券',
                activityId: '',
                status: '未使用',
                orderNos: ['ORD-3212689201598341']
            },
            {
                id: 'MR' + uid + '-003',
                name: '满100减15券',
                threshold: '100元',
                faceValue: '15元',
                channel: 'APP/小程序',
                validPeriod: '2026-01-01~12-31',
                collectAt: '2026-08-01 11:08:20',
                scene: '后台人工发券',
                collectMethod: '后台人工发券',
                activityId: '',
                status: '已使用',
                orderNos: ['ORD-3212689201588561', 'ORD-3212689201599001']
            }
        ];
    }

    function rowsFromMallRecordStore(rec) {
        var Store = window.MdmMallMarketingRecordStore;
        if (!Store || typeof Store.loadList !== 'function') return [];
        var uid = String((rec && rec.id) || '');
        return Store.loadList()
            .filter(function (row) {
                return uid && String(row.userId) === uid;
            })
            .map(function (row) {
                return {
                    id: row.id,
                    name: row.couponName,
                    threshold: row.threshold,
                    faceValue: row.faceValue,
                    channel: row.channel || '全渠道',
                    validPeriod: row.validPeriod || '—',
                    collectAt: row.collectAt,
                    scene: couponSceneLabel(row.collectMethod),
                    collectMethod: couponSceneLabel(row.collectMethod),
                    activityId: row.activityId,
                    status: row.status === '待使用' ? '未使用' : (row.status || '未使用'),
                    orderNos: normalizeCouponOrderNos(row)
                };
            });
    }

    function loadMemberCouponRows(rec) {
        var fromStore = rowsFromMallRecordStore(rec);
        if (fromStore.length) {
            return fromStore.sort(function (a, b) {
                return String(b.collectAt || '').localeCompare(String(a.collectAt || ''));
            });
        }
        return mockLiveCouponRows(rec).concat(mockManualCouponRows(rec)).sort(function (a, b) {
            return String(b.collectAt || '').localeCompare(String(a.collectAt || ''));
        });
    }

    function panelMemberAssets(rec) {
        var root = el('div', 'member-drawer-panel');
        root.appendChild(el('div', 'supplier-detail-section-title', '优惠券'));

        var allRows = loadMemberCouponRows(rec);
        var state = { name: '', threshold: '', scene: '', activityId: '', status: '', timeStart: '', timeEnd: '' };

        var toolbar = el('div', 'erp-toolbar member-drawer-filter-toolbar');
        var nameInp = mkInput('请输入优惠券名称');
        toolbar.appendChild(mkField('优惠券名称', nameInp));

        var thresholdInp = mkInput('请输入门槛，如无门槛、5元');
        toolbar.appendChild(mkField('门槛', thresholdInp));

        var sceneSel = mkSelect([
            { value: '', label: '全部' },
            { value: '直播发券', label: '直播发券' },
            { value: '福袋发券', label: '福袋发券' },
            { value: '签到发券', label: '签到发券' },
            { value: '后台人工发券', label: '后台人工发券' }
        ]);
        toolbar.appendChild(mkField('领券场景', sceneSel));

        var activitySel = mkSelect([{ value: '', label: '全部' }]);
        var activityField = mkField('直播场次ID', activitySel);
        activityField.hidden = true;
        toolbar.appendChild(activityField);

        var statusSel = mkSelect([
            { value: '', label: '全部' },
            { value: '未使用', label: '未使用' },
            { value: '已使用', label: '已使用' },
            { value: '已过期', label: '已过期' }
        ]);
        toolbar.appendChild(mkField('状态', statusSel));

        var timeStartCtl = mkDatetimeClearable('开始时间');
        var timeEndCtl = mkDatetimeClearable('结束时间');
        var timeWrap = el('div', 'member-growth-time-range');
        timeWrap.appendChild(timeStartCtl.wrap);
        timeWrap.appendChild(el('span', 'member-growth-time-range__sep', '至'));
        timeWrap.appendChild(timeEndCtl.wrap);
        toolbar.appendChild(mkField('领取时间', timeWrap));

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

        function toComparable(v) {
            return String(v || '').replace('T', ' ').slice(0, 19);
        }

        function getFiltered() {
            var name = String(state.name || '').trim().toLowerCase();
            var threshold = String(state.threshold || '').trim().toLowerCase();
            return allRows.filter(function (row) {
                if (name && String(row.name || '').toLowerCase().indexOf(name) === -1) return false;
                if (threshold && String(row.threshold || '').toLowerCase().indexOf(threshold) === -1) return false;
                if (state.scene && row.scene !== state.scene) return false;
                if (state.activityId && String(row.activityId || '') !== state.activityId) return false;
                if (state.status === '未使用') {
                    if (row.status !== '未使用' && row.status !== '待使用') return false;
                } else if (state.status && row.status !== state.status) return false;
                if (state.timeStart && toComparable(row.collectAt) < toComparable(state.timeStart)) return false;
                if (state.timeEnd && toComparable(row.collectAt) > toComparable(state.timeEnd)) return false;
                return true;
            });
        }

        function renderCouponTable(rows) {
            var wrap = el('div', 'erp-table-scroll member-drawer-table--wide');
            var table = el('table', 'erp-table');
            var thead = el('thead');
            var trh = el('tr');
            ['领券ID', '券名称', '门槛', '券面额', '适用渠道', '有效期', '领取时间', '领券场景', '活动ID', '状态', '核销关联订单'].forEach(function (h) {
                trh.appendChild(el('th', '', h));
            });
            thead.appendChild(trh);
            var tbody = el('tbody');
            if (!rows.length) {
                var emptyTr = el('tr');
                var emptyTd = el('td', '', '暂无匹配优惠券');
                emptyTd.colSpan = 11;
                emptyTd.style.textAlign = 'center';
                emptyTd.style.color = '#999';
                emptyTd.style.padding = '24px 10px';
                emptyTr.appendChild(emptyTd);
                tbody.appendChild(emptyTr);
            } else {
                rows.forEach(function (row) {
                    var tr = el('tr');
                    [row.id, row.name, row.threshold, row.faceValue, row.channel, row.validPeriod, row.collectAt, row.scene, couponActivityIdText(row)].forEach(function (text) {
                        tr.appendChild(el('td', '', text || '—'));
                    });
                    var tdStatus = el('td');
                    var st = el('span', couponStatusClass(row.status), row.status || '—');
                    tdStatus.appendChild(st);
                    tr.appendChild(tdStatus);
                    var tdOrders = el('td', 'member-coupon-orders');
                    var nos = normalizeCouponOrderNos(row);
                    if (!nos.length) {
                        tdOrders.textContent = '—';
                    } else {
                        nos.forEach(function (no, i) {
                            if (i) tdOrders.appendChild(document.createElement('br'));
                            tdOrders.appendChild(document.createTextNode(no));
                        });
                    }
                    tr.appendChild(tdOrders);
                    tbody.appendChild(tr);
                });
            }
            table.appendChild(thead);
            table.appendChild(tbody);
            wrap.appendChild(table);
            return wrap;
        }

        function renderList() {
            var filtered = getFiltered();
            empty(tableHost);
            empty(pageHost);
            tableHost.appendChild(renderCouponTable(filtered));
            var bar = el('div', 'erp-pagination');
            bar.appendChild(el('span', 'erp-pagination__total', '共 ' + filtered.length + ' 条'));
            pageHost.appendChild(bar);
        }

        function syncActivityFilter() {
            var Store = window.MdmMallMarketingRecordStore;
            var meta = Store && typeof Store.fillActivityFilterSelect === 'function'
                ? Store.fillActivityFilterSelect(activitySel, sceneSel.value)
                : null;
            var labelEl = activityField.querySelector('.erp-field__label');
            if (meta) {
                if (labelEl) labelEl.textContent = meta.label;
                activityField.hidden = false;
            } else {
                activityField.hidden = true;
                activitySel.value = '';
            }
        }

        function readState() {
            state.name = nameInp.value || '';
            state.threshold = thresholdInp.value || '';
            state.scene = sceneSel.value || '';
            state.activityId = activityField.hidden ? '' : (activitySel.value || '');
            state.status = statusSel.value || '';
            state.timeStart = timeStartCtl.input.value || '';
            state.timeEnd = timeEndCtl.input.value || '';
        }

        btnQuery.addEventListener('click', function () {
            readState();
            if (state.timeStart && state.timeEnd && toComparable(state.timeStart) > toComparable(state.timeEnd)) {
                window.alert('领取时间起始不能晚于结束时间');
                return;
            }
            renderList();
        });

        btnReset.addEventListener('click', function () {
            nameInp.value = '';
            thresholdInp.value = '';
            sceneSel.value = '';
            activitySel.value = '';
            statusSel.value = '';
            timeStartCtl.input.value = '';
            timeEndCtl.input.value = '';
            timeStartCtl.sync();
            timeEndCtl.sync();
            syncActivityFilter();
            state = { name: '', threshold: '', scene: '', activityId: '', status: '', timeStart: '', timeEnd: '' };
            renderList();
        });

        nameInp.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                btnQuery.click();
            }
        });
        thresholdInp.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                btnQuery.click();
            }
        });

        sceneSel.addEventListener('change', syncActivityFilter);
        syncActivityFilter();
        renderList();
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
                id: 'GV202607200001',
                occurAt: '2026-07-20 14:20:03',
                acquireType: '购物消费',
                acquireSub: '支付完成',
                change: '+86',
                afterValue: String(rec.growthScore || '1485'),
                status: '有效',
                expireAt: '2027-07-20 14:20:03',
                refNo: 'ORD-3212689201598341',
                remark: '订单实付 ¥86.00',
                operator: '—'
            },
            {
                id: 'GV202607180001',
                occurAt: '2026-07-18 08:01:12',
                acquireType: '用户活跃',
                acquireSub: '每日签到',
                change: '+5',
                afterValue: '1399',
                status: '有效',
                expireAt: '2027-07-18 08:01:12',
                refNo: '—',
                remark: '每日签到',
                operator: '—'
            },
            {
                id: 'GV202606120001',
                occurAt: '2026-06-12 19:33:41',
                acquireType: '购物消费',
                acquireSub: '交易完成',
                change: '+129',
                afterValue: '1394',
                status: '有效',
                expireAt: '2027-06-12 19:33:41',
                refNo: 'ORD-3212689201588561',
                remark: '订单实付 ¥129.50',
                operator: '—'
            },
            {
                id: 'GV202605240001',
                occurAt: '2026-05-24 21:15:08',
                acquireType: '购物消费',
                acquireSub: '售后完成',
                change: '-30',
                afterValue: '1265',
                status: '有效',
                expireAt: '—',
                refNo: 'AS202605240018',
                remark: '售后退款扣减成长值',
                operator: '—'
            },
            {
                id: 'GV202512010001',
                occurAt: '2025-12-01 10:00:00',
                acquireType: '手工调整',
                acquireSub: '手工增加',
                change: '+200',
                afterValue: '980',
                status: '过期',
                expireAt: '2026-06-01 10:00:00',
                refNo: '—',
                remark: '活动补偿',
                operator: '运营 / ops01'
            },
            {
                id: 'GV202508080001',
                occurAt: '2025-08-08 16:45:09',
                acquireType: '用户活跃',
                acquireSub: '评价订单',
                change: '+10',
                afterValue: '780',
                status: '过期',
                expireAt: '2026-02-08 16:45:09',
                refNo: 'ORD-3212689201584693',
                remark: '评价订单',
                operator: '—'
            }
        ];
    }

    /** 与成长值明细页一致：有效记录不展示过期时间 */
    function formatGrowthExpireDisplay(row) {
        if (!row || row.status === '有效') return '—';
        return row.expireAt || '—';
    }

    function genGrowthSerialId() {
        var d = new Date();
        function pad(n) { return n < 10 ? '0' + n : String(n); }
        return 'GV' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) +
            pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds());
    }

    /**
     * 时间筛选：有值后悬停（或聚焦）显示清空按钮
     * @returns {{ wrap: HTMLElement, input: HTMLInputElement, sync: Function }}
     */
    function mkDatetimeClearable(title) {
        var wrap = el('span', 'lf-datetime-wrap');
        wrap.setAttribute('data-datetime-wrap', '1');
        var input = mkInput('', 'datetime-local');
        input.step = '1';
        if (title) input.title = title;
        var clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'lf-datetime-clear';
        clearBtn.setAttribute('aria-label', '清空');
        clearBtn.textContent = '×';
        function sync() {
            wrap.classList.toggle('has-value', !!input.value);
        }
        clearBtn.addEventListener('click', function (ev) {
            ev.preventDefault();
            input.value = '';
            sync();
            input.dispatchEvent(new Event('change', { bubbles: true }));
        });
        input.addEventListener('input', sync);
        input.addEventListener('change', sync);
        wrap.appendChild(input);
        wrap.appendChild(clearBtn);
        sync();
        return { wrap: wrap, input: input, sync: sync };
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

        /* 购物消费子项与 MdmMemberGrowthAcquire 保持一致：支付完成 / 交易完成 / 售后完成 */
        var Acquire = window.MdmMemberGrowthAcquire;
        var SUB_OPTIONS = {
            购物消费: (Acquire && Acquire.CONSUME_SUBS_ZH) || [
                { value: '支付完成', label: '支付完成' },
                { value: '交易完成', label: '交易完成' },
                { value: '售后完成', label: '售后完成' }
            ],
            用户活跃: (Acquire && Acquire.ACTIVITY_SUBS_ZH) || [
                { value: '每日签到', label: '每日签到' },
                { value: '浏览商品', label: '浏览商品' },
                { value: '分享邀请', label: '分享邀请' },
                { value: '评价订单', label: '评价订单' }
            ],
            手工调整: (Acquire && Acquire.MANUAL_SUBS_ZH) || [
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
        var timeStartCtl = mkDatetimeClearable('开始时间');
        var timeEndCtl = mkDatetimeClearable('结束时间');
        var timeStart = timeStartCtl.input;
        var timeEnd = timeEndCtl.input;
        var timeWrap = el('div', 'member-growth-time-range');
        timeWrap.appendChild(timeStartCtl.wrap);
        timeWrap.appendChild(el('span', 'member-growth-time-range__sep', '至'));
        timeWrap.appendChild(timeEndCtl.wrap);
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
                        id: genGrowthSerialId(),
                        occurAt: result.occurAt || nowStr(),
                        acquireType: '手工调整',
                        acquireSub: result.change < 0 ? '手工减少' : '手工增加',
                        change: (result.change > 0 ? '+' : '') + result.change,
                        afterValue: String(result.afterValue),
                        status: '有效',
                        expireAt: '—',
                        refNo: '—',
                        remark: result.remark || '手工调整',
                        operator: result.operator || '—'
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
            /* 顺序对齐成长值明细页（本页已在会员详情内，省略会员ID/昵称/手机号） */
            var headers = [
                '流水号',
                '获取方式',
                '明细类型',
                '变动成长值',
                '关联单号',
                '备注',
                '获取时间',
                '过期时间',
                '状态',
                '操作人'
            ];
            var rows = filtered.map(function (row) {
                var operatorText = row.acquireType === '手工调整'
                    ? (row.operator || '—')
                    : '—';
                return [
                    row.id || '—',
                    row.acquireType,
                    row.acquireSub,
                    row.change,
                    row.refNo,
                    row.remark,
                    row.occurAt,
                    formatGrowthExpireDisplay(row),
                    row.status,
                    operatorText
                ];
            });
            if (!rows.length) {
                rows = [['—', '—', '—', '—', '—', '暂无匹配明细', '—', '—', '—', '—']];
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
            timeStartCtl.sync();
            timeEndCtl.sync();
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

    var POINTS_TYPE_LABEL = {
        consume: '消费赠送',
        upgrade: '会员升级',
        checkin: '签到',
        luckybag: '福袋',
        watch_task: '观看任务',
        exchange: '积分兑换',
        exchange_cancel: '积分兑换取消',
        cash: '积分抵现',
        exchange_refund: '积分兑换售后',
        cash_refund: '积分抵现售后',
        manual: '手工调整'
    };

    function mockMemberPointsRows(rec) {
        var mid = String(rec.id || '');
        /* 演示数据：消费赠送支付成功为冻结，交易成功后可用；兑换售后保留原有效期 */
        if (mid === 'U10002') {
            return [
                {
                    occurAt: '2026-07-25 21:06:33',
                    changeType: 'consume',
                    change: 68,
                    remaining: 68,
                    afterValue: 118,
                    refNo: 'ORD-3212689201600888',
                    remark: '支付成功赠送，订单未交易成功',
                    status: '冻结'
                },
                {
                    occurAt: '2026-04-24 21:15:08',
                    changeType: 'exchange_refund',
                    change: 50,
                    remaining: null,
                    afterValue: 50,
                    refNo: 'AS202604240018',
                    remark: '积分兑换售后，保留原有效期（退还归属 1月2日批次）',
                    status: '—'
                },
                {
                    occurAt: '2026-04-24 20:11:05',
                    changeType: 'exchange',
                    change: -100,
                    remaining: null,
                    afterValue: 0,
                    refNo: 'EX-20260424008',
                    remark: '兑换商品：冷丰鲜牛奶',
                    status: '—'
                },
                {
                    occurAt: '2026-01-02 10:00:00',
                    changeType: 'consume',
                    change: 80,
                    remaining: 50,
                    afterValue: 100,
                    refNo: 'ORD-3212689201588600',
                    remark: '支付成功赠送，交易成功后可用',
                    status: '可用'
                },
                {
                    occurAt: '2026-01-01 10:00:00',
                    changeType: 'consume',
                    change: 20,
                    remaining: 0,
                    afterValue: 20,
                    refNo: 'ORD-3212689201588561',
                    remark: '支付成功赠送，交易成功后可用',
                    status: '可用'
                }
            ];
        }
        return [
            {
                occurAt: '2026-07-26 10:18:42',
                changeType: 'consume',
                change: 45,
                remaining: 45,
                afterValue: 206,
                refNo: 'ORD-3212689201600128',
                remark: '支付成功赠送，订单未交易成功',
                status: '冻结'
            },
            {
                occurAt: '2026-04-25 16:20:03',
                changeType: 'consume',
                change: 86,
                remaining: 86,
                afterValue: 161,
                refNo: 'ORD-3212689201598341',
                remark: '支付成功赠送，交易成功后可用',
                status: '可用'
            },
            {
                occurAt: '2026-04-25 15:08:41',
                changeType: 'cash',
                change: -60,
                remaining: null,
                afterValue: 75,
                refNo: 'ORD-3212689201599001',
                remark: '抵扣 ¥0.60',
                status: '—'
            },
            {
                occurAt: '2026-04-20 18:40:11',
                changeType: 'consume',
                change: 50,
                remaining: 50,
                afterValue: 135,
                refNo: 'ORD-3212689201598100',
                remark: '支付成功赠送，交易成功后可用',
                status: '可用'
            },
            {
                occurAt: '2026-04-18 08:01:12',
                changeType: 'checkin',
                change: 5,
                remaining: 5,
                afterValue: 85,
                refNo: '—',
                remark: '每日签到',
                status: '可用'
            },
            {
                occurAt: '2026-04-10 09:15:22',
                changeType: 'consume',
                change: 80,
                remaining: 25,
                afterValue: 80,
                refNo: 'ORD-3212689201598001',
                remark: '支付成功赠送，交易成功后可用',
                status: '可用'
            },
            {
                occurAt: '2026-02-15 11:08:20',
                changeType: 'cash_refund',
                change: 30,
                remaining: null,
                afterValue: 70,
                refNo: 'AS202602150008',
                remark: '积分抵现售后，保留原有效期',
                status: '—'
            },
            {
                occurAt: '2026-02-01 14:22:10',
                changeType: 'cash',
                change: -60,
                remaining: null,
                afterValue: 40,
                refNo: 'ORD-3212689201500888',
                remark: '抵扣 ¥0.60',
                status: '—'
            },
            {
                occurAt: '2025-03-10 12:00:00',
                changeType: 'consume',
                change: 100,
                remaining: 70,
                afterValue: 100,
                refNo: 'ORD-3212689201500001',
                remark: '支付成功赠送，交易成功后可用',
                status: '过期'
            }
        ];
    }

    function calcMemberPointsSummary(rows) {
        var available = 0;
        var frozen = 0;
        var earned = 0;
        var used = 0;
        var expired = 0;
        (rows || []).forEach(function (row) {
            var change = Number(row.change) || 0;
            var remain = row.remaining == null ? null : (Number(row.remaining) || 0);
            if (change > 0) earned += change;
            if (row.changeType === 'cash' || row.changeType === 'exchange') {
                used += Math.abs(change);
            }
            if (row.status === '过期' && remain != null) {
                /* 过期批次：按已过期仍留存 + 已消耗前的获取额不便拆分时，演示用状态过期且剩余>0 计入 */
                expired += remain;
            }
            if (row.changeType === 'expire') {
                expired += Math.abs(change);
            }
            if (remain != null && remain > 0) {
                if (row.status === '冻结') frozen += remain;
                else if (row.status === '可用') available += remain;
            }
        });
        return {
            current: available + frozen,
            available: available,
            frozen: frozen,
            earned: earned,
            used: used,
            expired: expired
        };
    }

    function formatPointsChangeCell(val) {
        var n = Number(val) || 0;
        var span = document.createElement('span');
        if (n > 0) {
            span.className = 'member-points-change--plus';
            span.textContent = '+' + n;
        } else if (n < 0) {
            span.className = 'member-points-change--minus';
            span.textContent = String(n);
        } else {
            span.textContent = '0';
        }
        return span;
    }

    function formatPointsStatusCell(status) {
        var span = document.createElement('span');
        var s = status || '—';
        span.textContent = s;
        if (s === '可用') span.className = 'member-points-status member-points-status--available';
        else if (s === '冻结') span.className = 'member-points-status member-points-status--frozen';
        else if (s === '过期') span.className = 'member-points-status member-points-status--expired';
        return span;
    }

    function panelMemberPoints(rec) {
        var root = el('div', 'member-drawer-panel');

        var sectionHead = el('div', 'member-growth-section-head');
        sectionHead.appendChild(el('div', 'supplier-detail-section-title', '会员积分'));
        var btnAdjustPoints = mkBtn('调整积分', true);
        sectionHead.appendChild(btnAdjustPoints);
        root.appendChild(sectionHead);

        var allRows = mockMemberPointsRows(rec);
        var summaryData = calcMemberPointsSummary(allRows);

        var summary = el('div', 'member-growth-summary member-growth-summary--points');
        var summaryDefs = [
            { key: 'current', label: '当前积分' },
            { key: 'available', label: '可用积分' },
            { key: 'frozen', label: '冻结积分' },
            { key: 'earned', label: '累计获取积分' },
            {
                key: 'used',
                label: '累计使用积分',
                tip: '只统计积分抵现和积分兑换之和'
            },
            { key: 'expired', label: '累计过期积分' }
        ];
        var summaryValueEls = {};
        summaryDefs.forEach(function (def) {
            var card = el('div', 'member-growth-summary__item');
            var lab = el('div', 'member-growth-summary__label');
            lab.appendChild(document.createTextNode(def.label));
            if (def.tip) {
                var tip = el('i', 'member-points-help', '?');
                tip.title = def.tip;
                tip.setAttribute('aria-label', def.tip);
                lab.appendChild(tip);
            }
            card.appendChild(lab);
            var valEl = el('div', 'member-growth-summary__value', String(summaryData[def.key]));
            summaryValueEls[def.key] = valEl;
            card.appendChild(valEl);
            summary.appendChild(card);
        });
        root.appendChild(summary);

        var state = { timeStart: '', timeEnd: '', changeType: '', status: '' };

        var toolbar = el('div', 'erp-toolbar member-drawer-filter-toolbar');
        var timeStartCtl = mkDatetimeClearable('开始时间');
        var timeEndCtl = mkDatetimeClearable('结束时间');
        var timeStart = timeStartCtl.input;
        var timeEnd = timeEndCtl.input;
        var timeWrap = el('div', 'member-growth-time-range');
        timeWrap.appendChild(timeStartCtl.wrap);
        timeWrap.appendChild(el('span', 'member-growth-time-range__sep', '至'));
        timeWrap.appendChild(timeEndCtl.wrap);
        toolbar.appendChild(mkField('变动时间', timeWrap));

        var typeSel = mkSelect([
            { value: '', label: '全部' },
            { value: 'consume', label: '消费赠送' },
            { value: 'upgrade', label: '会员升级' },
            { value: 'checkin', label: '签到' },
            { value: 'luckybag', label: '福袋' },
            { value: 'watch_task', label: '观看任务' },
            { value: 'exchange', label: '积分兑换' },
            { value: 'exchange_cancel', label: '积分兑换取消' },
            { value: 'cash', label: '积分抵现' },
            { value: 'exchange_refund', label: '积分兑换售后' },
            { value: 'cash_refund', label: '积分抵现售后' }
        ]);
        toolbar.appendChild(mkField('变动类型', typeSel));

        var statusSel = mkSelect([
            { value: '', label: '全部' },
            { value: '可用', label: '可用' },
            { value: '冻结', label: '冻结' },
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

        function toComparable(v) {
            return String(v || '').replace('T', ' ').slice(0, 19);
        }

        function getFiltered() {
            return allRows.filter(function (row) {
                if (state.timeStart && toComparable(row.occurAt) < toComparable(state.timeStart)) return false;
                if (state.timeEnd && toComparable(row.occurAt) > toComparable(state.timeEnd)) return false;
                if (state.changeType && row.changeType !== state.changeType) return false;
                if (state.status && row.status !== state.status) return false;
                return true;
            });
        }

        function renderList() {
            var filtered = getFiltered();
            empty(tableHost);
            empty(pageHost);

            var headers = [
                '变动时间',
                '变动类型',
                '变动积分',
                '本批剩余',
                '变动后余额',
                '关联单号',
                '积分过期时间',
                '状态',
                '备注'
            ];
            var wrap = el('div', 'erp-table-scroll');
            var table = el('table', 'erp-table member-drawer-table--wide');
            var thead = document.createElement('thead');
            var hr = document.createElement('tr');
            headers.forEach(function (h) {
                hr.appendChild(el('th', '', h));
            });
            thead.appendChild(hr);
            var tbody = document.createElement('tbody');

            if (!filtered.length) {
                var emptyTr = document.createElement('tr');
                var emptyTd = el('td', '', '暂无匹配明细');
                emptyTd.colSpan = headers.length;
                emptyTd.style.textAlign = 'center';
                emptyTd.style.color = '#999';
                emptyTr.appendChild(emptyTd);
                tbody.appendChild(emptyTr);
            } else {
                filtered.forEach(function (row) {
                    var tr = document.createElement('tr');
                    tr.appendChild(el('td', '', row.occurAt));
                    tr.appendChild(el('td', '', POINTS_TYPE_LABEL[row.changeType] || row.changeType));
                    var tdChange = document.createElement('td');
                    tdChange.appendChild(formatPointsChangeCell(row.change));
                    tr.appendChild(tdChange);
                    tr.appendChild(el('td', '', row.remaining == null ? '—' : String(row.remaining)));
                    tr.appendChild(el('td', '', String(row.afterValue)));
                    tr.appendChild(el('td', '', row.refNo || '—'));
                    tr.appendChild(el('td', '', row.expireAt || (row.remaining == null ? '—' : addDaysStr(row.occurAt, 365))));
                    var tdStatus = document.createElement('td');
                    tdStatus.appendChild(formatPointsStatusCell(row.status));
                    tr.appendChild(tdStatus);
                    tr.appendChild(el('td', '', row.remark || '—'));
                    tbody.appendChild(tr);
                });
            }

            table.appendChild(thead);
            table.appendChild(tbody);
            wrap.appendChild(table);
            tableHost.appendChild(wrap);

            var bar = el('div', 'erp-pagination');
            bar.appendChild(el('span', 'erp-pagination__total', '共 ' + filtered.length + ' 条'));
            pageHost.appendChild(bar);
        }

        btnQuery.addEventListener('click', function () {
            state.timeStart = timeStart.value || '';
            state.timeEnd = timeEnd.value || '';
            state.changeType = typeSel.value || '';
            state.status = statusSel.value || '';
            if (state.timeStart && state.timeEnd && toComparable(state.timeStart) > toComparable(state.timeEnd)) {
                window.alert('变动时间起始不能晚于结束时间');
                return;
            }
            renderList();
        });

        btnReset.addEventListener('click', function () {
            timeStart.value = '';
            timeEnd.value = '';
            timeStartCtl.sync();
            timeEndCtl.sync();
            typeSel.value = '';
            statusSel.value = '';
            state = { timeStart: '', timeEnd: '', changeType: '', status: '' };
            renderList();
        });

        function nowStr() {
            var d = new Date();
            function pad(n) { return n < 10 ? '0' + n : String(n); }
            return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
                ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
        }

        function addDaysStr(dateStr, days) {
            var s = String(dateStr || '').replace('T', ' ').slice(0, 19);
            var m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (!m) return '—';
            var d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
            d.setDate(d.getDate() + days);
            function pad(n) { return n < 10 ? '0' + n : String(n); }
            return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' 00:00:00';
        }

        function refreshSummaryCards() {
            var data = calcMemberPointsSummary(allRows);
            Object.keys(summaryValueEls).forEach(function (k) {
                if (summaryValueEls[k]) summaryValueEls[k].textContent = String(data[k]);
            });
            rec.points = String(data.current);
        }

        btnAdjustPoints.addEventListener('click', function () {
            var data = calcMemberPointsSummary(allRows);
            openPointsModal(rec, {
                overDrawer: true,
                available: data.available,
                onSuccess: function (result) {
                    var occurAt = nowStr();
                    allRows.unshift({
                        occurAt: occurAt,
                        changeType: 'manual',
                        change: result.change,
                        remaining: result.change > 0 ? result.change : null,
                        afterValue: result.afterValue,
                        refNo: '—',
                        expireAt: result.change > 0 ? addDaysStr(occurAt, 365) : '—',
                        remark: result.remark || '手工调整',
                        status: result.change > 0 ? '可用' : '—'
                    });
                    refreshSummaryCards();
                    renderList();
                }
            });
        });

        renderList();
        return root;
    }

    var STORE_BIND_LOG_KEY = 'mdm_member_store_bind_log_v1';
    var MEMBER_BIND_EXTRA_STORES = [
        { id: 'ONS-CENTER-01', name: '中心店01', address: '杭州市西湖区绿城西溪世纪中心1号楼', regionId: '330000', regionText: '浙江省杭州市西湖区', customerCount: 0 },
        { id: 'ONS-XIXI-SOUTH', name: '西溪湿地南门店', address: '杭州市西湖区天目山路旁西溪湿地南门', regionId: '330000', regionText: '浙江省杭州市西湖区', customerCount: 0 },
        { id: 'ONS-JIANGCUN', name: '蒋村公交站店', address: '杭州市西湖区余杭塘路蒋村路口', regionId: '330000', regionText: '浙江省杭州市西湖区', customerCount: 0 },
        { id: 'ONS303445581201', name: '冷丰生鲜超市', address: '天津市河东区长三角珠宝产业园A3栋', regionId: '120000', regionText: '天津市河东区', customerCount: 0 }
    ];
    var STORE_REGION_TEXT = {
        '110000': '北京市',
        '120000': '天津市',
        '130000': '河北省',
        '310000': '上海市',
        '320000': '江苏省',
        '330000': '浙江省',
        '420000': '湖北省',
        '440000': '广东省',
        '510000': '四川省'
    };

    function formatNow() {
        var d = new Date();
        function p(n) {
            return n < 10 ? '0' + n : String(n);
        }
        return (
            d.getFullYear() +
            '-' +
            p(d.getMonth() + 1) +
            '-' +
            p(d.getDate()) +
            ' ' +
            p(d.getHours()) +
            ':' +
            p(d.getMinutes()) +
            ':' +
            p(d.getSeconds())
        );
    }

    function loadStoreBindMap() {
        try {
            var raw = localStorage.getItem(STORE_BIND_LOG_KEY);
            var data = raw ? JSON.parse(raw) : {};
            return data && typeof data === 'object' ? data : {};
        } catch (e) {
            return {};
        }
    }

    function saveStoreBindMap(map) {
        try {
            localStorage.setItem(STORE_BIND_LOG_KEY, JSON.stringify(map));
        } catch (e) { /* ignore */ }
    }

    function defaultStoreBindLogs(memberId) {
        var id = String(memberId || '');
        if (id === 'U10001') {
            return [
                { type: '切换门店', storeName: '西溪湿地南门店', region: '浙江省杭州市西湖区', addr: '杭州市西湖区天目山路旁西溪湿地南门', way: '扫码', time: '2026-08-20 15:10:22', watch: '46min', amount: '¥268.00', orders: '3', refundAmt: '¥0.00', refundCnt: '0' },
                { type: '绑定门店', storeName: '中心店01', region: '浙江省杭州市西湖区', addr: '杭州市西湖区绿城西溪世纪中心1号楼', way: '确认门店', time: '2026-08-01 09:20:11', watch: '120min', amount: '¥3688.00', orders: '12', refundAmt: '¥32.00', refundCnt: '1' },
                { type: '切换门店', storeName: '蒋村公交站店', region: '浙江省杭州市西湖区', addr: '杭州市西湖区余杭塘路蒋村路口', way: '扫码', time: '2026-07-12 11:08:40', watch: '18min', amount: '¥86.00', orders: '1', refundAmt: '¥0.00', refundCnt: '0' }
            ];
        }
        if (id === 'U10002') {
            return [
                { type: '切换门店', storeName: '西湖文三路店', region: '浙江省杭州市西湖区', addr: '文三路478号华星时代广场', way: '扫码', time: '2026-04-02 19:20:00', watch: '22min', amount: '¥199.00', orders: '1', refundAmt: '¥0.00', refundCnt: '0' },
                { type: '绑定门店', storeName: '中心店01', region: '浙江省杭州市西湖区', addr: '杭州市西湖区绿城西溪世纪中心1号楼', way: '确认门店', time: '2025-11-03 18:42:11', watch: '45min', amount: '¥1299.50', orders: '5', refundAmt: '¥0.00', refundCnt: '0' }
            ];
        }
        return [
            { type: '绑定门店', storeName: '中心店01', region: '浙江省杭州市西湖区', addr: '杭州市西湖区绿城西溪世纪中心1号楼', way: '确认门店', time: '2026-01-12 09:20:11', watch: '—', amount: '—', orders: '—', refundAmt: '—', refundCnt: '—' }
        ];
    }

    function listStoreBindLogs(memberId) {
        var all = loadStoreBindMap();
        var rows = all[memberId];
        if (!rows || !rows.length) rows = defaultStoreBindLogs(memberId);
        return rows.slice().sort(function (a, b) {
            return String((b && b.time) || '').localeCompare(String((a && a.time) || ''));
        });
    }

    function appendStoreBindLog(memberId, rec) {
        var all = loadStoreBindMap();
        var rows = all[memberId];
        if (!rows || !rows.length) rows = defaultStoreBindLogs(memberId);
        rows.unshift(rec);
        all[memberId] = rows;
        saveStoreBindMap(all);
        return listStoreBindLogs(memberId);
    }

    function storeRegionText(store) {
        if (!store) return '—';
        if (store.regionText) return store.regionText;
        return STORE_REGION_TEXT[store.regionId] || '—';
    }

    function openChangeStorePicker(member) {
        if (!member || !window.MdmProxyStorePicker) {
            showToast('门店选择器未加载', 'error');
            return;
        }
        window.MdmProxyStorePicker.open({
            single: true,
            compactHeight: true,
            extraStores: MEMBER_BIND_EXTRA_STORES,
            onConfirm: function (_selected, stores) {
                var store = stores && stores[0];
                if (!store) return;
                appendStoreBindLog(member.id, {
                    type: '切换门店',
                    storeName: store.name,
                    region: storeRegionText(store),
                    addr: store.address || '—',
                    way: '后台变更',
                    time: formatNow(),
                    watch: '—',
                    amount: '—',
                    orders: '—',
                    refundAmt: '—',
                    refundCnt: '—'
                });
                showToast('已将绑定门店变更为「' + store.name + '」', 'success');
            }
        });
    }

    function panelBindStores(rec) {
        var root = el('div', 'member-drawer-panel');
        root.appendChild(el('div', 'supplier-detail-section-title', '绑定门店'));
        var headers = [
            '类型',
            '门店名称',
            '省市区',
            '详细地址',
            '绑定方式',
            '发生时间',
            '观看时长',
            '消费金额',
            '下单次数',
            '退款金额',
            '退款次数'
        ];
        var logs = listStoreBindLogs(rec && rec.id);
        var rows = logs.length
            ? logs.map(function (item) {
                return [
                    item.type || '—',
                    item.storeName || '—',
                    item.region || '—',
                    item.addr || '—',
                    item.way || '—',
                    item.time || '—',
                    item.watch || '—',
                    item.amount || '—',
                    item.orders || '—',
                    item.refundAmt || '—',
                    item.refundCnt || '—'
                ];
            })
            : [['暂无绑定/切换记录', '—', '—', '—', '—', '—', '—', '—', '—', '—', '—']];
        root.appendChild(wrapTable(headers, rows, 'member-drawer-table--wide'));
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
        var tabIds = ['detail', 'growth', 'points', 'assets', 'stores', 'watch', 'orders'];
        var tabLabels = ['会员详情', '成长值', '会员积分', '优惠券', '绑定门店', '观看记录', '订单记录'];
        var bodyHost = el('div', 'store-drawer__body');

        var panels = {
            detail: panelMemberDetail(rec),
            growth: panelMemberGrowth(rec),
            points: panelMemberPoints(rec),
            assets: panelMemberAssets(rec),
            stores: panelBindStores(rec),
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

    function getCurrentOperator() {
        var name = '演示运营';
        var account = 'admin';
        try {
            if (typeof getCurrentUser === 'function') {
                var u = getCurrentUser();
                if (u) {
                    if (u.name || u.username) name = u.name || u.username;
                    if (u.username) account = u.username;
                }
            }
        } catch (e) { /* ignore */ }
        return { name: name, account: account };
    }

    function getCurrentOperatorName() {
        return getCurrentOperator().name;
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

    function openPointsModal(member, opts) {
        opts = opts || {};
        if (!member) return;
        removeMemberCUi();

        var pointsNum = Number(String(member.points || '0').replace(/[^\d.-]/g, '')) || 0;
        var available = opts.available != null ? Number(opts.available) : pointsNum;
        var operator = getCurrentOperatorName();
        var REMARK_MAX = 200;

        var backdrop = el('div', 'erp-modal-backdrop' + (opts.overDrawer ? ' erp-modal-backdrop--over-drawer' : ''));
        backdrop.setAttribute('data-member-c-ui', '1');
        var modal = el('div', 'erp-modal erp-modal--pts-adjust');
        var header = el('div', 'erp-modal__header');
        header.appendChild(el('h2', 'erp-modal__title', '调整积分'));
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
        var memCtrl = el('div', 'erp-modal-field__control');
        var memLine = el('div', 'pts-adjust-member');
        memLine.textContent =
            (member.nickname || '—') +
            '（' +
            (member.id || '—') +
            '） · 可用积分 ' +
            available;
        memCtrl.appendChild(memLine);
        memCtrl.appendChild(
            el('div', 'pts-adjust-tip', '减少时按 FIFO 优先扣最早获取的「可用」批次（冻结积分不可扣）')
        );
        rowMember.appendChild(memCtrl);
        body.appendChild(rowMember);

        var rowType = el('div', 'erp-modal-field');
        var labType = el('label', 'erp-modal-field__label');
        labType.innerHTML = '<span class="erp-req">*</span>调整类型';
        rowType.appendChild(labType);
        var typeCtrl = el('div', 'erp-modal-field__control');
        var radioRow = el('div', 'pts-adjust-radio-row');
        var rAdd = document.createElement('input');
        rAdd.type = 'radio';
        rAdd.name = 'ptsAdjustDir';
        rAdd.value = 'add';
        rAdd.checked = true;
        var rSub = document.createElement('input');
        rSub.type = 'radio';
        rSub.name = 'ptsAdjustDir';
        rSub.value = 'sub';
        var labAdd = el('label', 'pts-adjust-radio-label');
        labAdd.appendChild(rAdd);
        labAdd.appendChild(document.createTextNode(' 增加'));
        var labSub = el('label', 'pts-adjust-radio-label');
        labSub.appendChild(rSub);
        labSub.appendChild(document.createTextNode(' 减少'));
        radioRow.appendChild(labAdd);
        radioRow.appendChild(labSub);
        typeCtrl.appendChild(radioRow);
        rowType.appendChild(typeCtrl);
        body.appendChild(rowType);

        var rowQty = el('div', 'erp-modal-field');
        var labQty = el('label', 'erp-modal-field__label');
        labQty.setAttribute('for', 'ptsAdjustValue');
        labQty.innerHTML = '<span class="erp-req">*</span>调整积分';
        rowQty.appendChild(labQty);
        var qtyCtrl = el('div', 'erp-modal-field__control');
        var qtyInp = el('input', 'erp-input');
        qtyInp.id = 'ptsAdjustValue';
        qtyInp.type = 'number';
        qtyInp.min = '1';
        qtyInp.step = '1';
        qtyInp.placeholder = '请输入正整数';
        qtyCtrl.appendChild(qtyInp);
        rowQty.appendChild(qtyCtrl);
        body.appendChild(rowQty);

        var rowRemark = el('div', 'erp-modal-field');
        var labRemark = el('label', 'erp-modal-field__label');
        labRemark.setAttribute('for', 'ptsAdjustRemark');
        labRemark.textContent = '备注';
        rowRemark.appendChild(labRemark);
        var remarkCtrl = el('div', 'erp-modal-field__control');
        var ta = el('textarea', 'erp-input');
        ta.id = 'ptsAdjustRemark';
        ta.rows = 3;
        ta.maxLength = REMARK_MAX;
        ta.placeholder = '选填，最多 ' + REMARK_MAX + ' 字';
        remarkCtrl.appendChild(ta);
        remarkCtrl.appendChild(el('div', 'pts-adjust-tip', '操作人：' + operator));
        rowRemark.appendChild(remarkCtrl);
        body.appendChild(rowRemark);

        var footer = el('div', 'erp-modal__footer');
        var bCancel = mkBtn('取消', false);
        var bOk = mkBtn('确定', true);
        bCancel.addEventListener('click', function () {
            backdrop.remove();
        });
        bOk.addEventListener('click', function () {
            var dirEl = backdrop.querySelector('input[name="ptsAdjustDir"]:checked');
            var dir = dirEl ? dirEl.value : 'add';
            var raw = qtyInp.value;
            var val = Number(raw);
            if (!raw || isNaN(val) || val < 1 || !/^\d+$/.test(String(raw).trim())) {
                window.alert('请输入正整数积分');
                return;
            }
            if (dir === 'sub' && val > available) {
                window.alert('扣减不得大于可用积分（当前可用 ' + available + '）');
                return;
            }
            var remark = String(ta.value || '').trim();
            var delta = dir === 'add' ? val : -val;
            var after = available + delta;
            var curPts = Number(String(member.points || '0').replace(/[^\d.-]/g, '')) || 0;
            member.points = String(Math.max(0, curPts + delta));
            if (typeof opts.onSuccess === 'function') {
                opts.onSuccess({
                    change: delta,
                    afterValue: after,
                    available: Math.max(0, after),
                    remark: remark || (dir === 'add' ? '手工增加积分' : '手工减少积分（FIFO）'),
                    operator: operator
                });
            }
            backdrop.remove();
            showToast('积分调整成功', 'success');
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

    function closeCouponIssueQtyModal() {
        document.querySelectorAll('[data-member-c-coupon-qty="1"]').forEach(function (n) {
            n.remove();
        });
    }

    function addCouponQtyDisplayRow(body, label, value) {
        var row = el('div', 'erp-modal-field');
        row.appendChild(el('label', 'erp-modal-field__label', label));
        var ctrl = el('div', 'erp-modal-field__control');
        ctrl.appendChild(el('div', 'pts-adjust-member', value));
        row.appendChild(ctrl);
        body.appendChild(row);
    }

    function openCouponIssueQtyModal(member, coupon, onConfirm) {
        closeCouponIssueQtyModal();
        var claimable = getUserClaimableQty(member, coupon);
        var stockNum = parseStockQty(coupon);
        var nested = el('div', 'erp-modal-backdrop erp-modal-backdrop--nested');
        nested.setAttribute('data-member-c-coupon-qty', '1');
        var modal = el('div', 'erp-modal erp-modal--member-c-coupon-qty');
        var header = el('div', 'erp-modal__header');
        header.appendChild(el('h2', 'erp-modal__title', '确认发放数量'));
        var bx = el('button', 'erp-modal__header-btn');
        bx.type = 'button';
        bx.innerHTML = '&times;';
        bx.addEventListener('click', closeCouponIssueQtyModal);
        var ha = el('div', 'erp-modal__header-actions');
        ha.appendChild(bx);
        header.appendChild(ha);

        var body = el('div', 'erp-modal__body');
        addCouponQtyDisplayRow(body, '优惠券', coupon.label);
        addCouponQtyDisplayRow(body, '可领数量', formatClaimableQty(claimable));
        addCouponQtyDisplayRow(body, '剩余库存', isFinite(stockNum) ? String(stockNum) : String(coupon.stock || '—'));

        var rowQty = el('div', 'erp-modal-field');
        var labQty = el('label', 'erp-modal-field__label');
        labQty.innerHTML = '<span class="erp-req">*</span>发放数量';
        rowQty.appendChild(labQty);
        var qtyCtrl = el('div', 'erp-modal-field__control');
        var qtyInp = el('input', 'erp-input');
        qtyInp.type = 'number';
        qtyInp.min = '1';
        qtyInp.step = '1';
        qtyInp.placeholder = '请输入正整数';
        qtyInp.value = '1';
        var maxQty = Math.min(
            isFinite(claimable) ? claimable : Infinity,
            isFinite(stockNum) ? stockNum : Infinity
        );
        if (isFinite(maxQty) && maxQty >= 1) qtyInp.max = String(maxQty);
        qtyInp.addEventListener('input', function () {
            var n = Number(qtyInp.value);
            if (isFinite(maxQty) && n > maxQty) qtyInp.value = String(maxQty);
        });
        qtyCtrl.appendChild(qtyInp);
        qtyCtrl.appendChild(el('div', 'pts-adjust-tip', '不能超过该用户可领数量，也不能大于券库存'));
        rowQty.appendChild(qtyCtrl);
        body.appendChild(rowQty);

        var footer = el('div', 'erp-modal__footer');
        var bCancel = mkBtn('取消', false);
        var bOk = mkBtn('确定', true);
        bCancel.addEventListener('click', closeCouponIssueQtyModal);
        bOk.addEventListener('click', function () {
            var raw = (qtyInp.value || '').trim();
            var val = Number(raw);
            var latestClaimable = getUserClaimableQty(member, coupon);
            var latestStock = parseStockQty(coupon);
            if (!raw || !/^\d+$/.test(raw)) {
                toastIssueFail('发放数量须为正整数');
                return;
            }
            var reason = validateIssueQty(val, latestClaimable, latestStock);
            if (reason) {
                toastIssueFail(reason);
                return;
            }
            closeCouponIssueQtyModal();
            if (typeof onConfirm === 'function') onConfirm(val);
        });
        footer.appendChild(bCancel);
        footer.appendChild(bOk);

        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);
        nested.appendChild(modal);
        nested.addEventListener('click', function (ev) {
            if (ev.target === nested) closeCouponIssueQtyModal();
        });
        document.body.appendChild(nested);
        setTimeout(function () {
            qtyInp.focus();
            qtyInp.select();
        }, 0);
    }

    function openCouponDispatchModal(member) {
        removeMemberCUi();
        closeCouponIssueQtyModal();
        var backdrop = el('div', 'erp-modal-backdrop');
        backdrop.setAttribute('data-member-c-ui', '1');
        var modal = el('div', 'erp-modal erp-modal--member-c-coupon');
        var header = el('div', 'erp-modal__header');
        header.appendChild(el('h2', 'erp-modal__title', '发放优惠券'));
        var bx = el('button', 'erp-modal__header-btn');
        bx.type = 'button';
        bx.innerHTML = '&times;';
        function closeList() {
            closeCouponIssueQtyModal();
            backdrop.remove();
        }
        bx.addEventListener('click', closeList);
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

        var scroll = el('div', 'member-c-coupon-table-wrap');
        var table = el('table', 'erp-table member-c-coupon-table');
        var thead = el('thead');
        var trh = el('tr');
        ['优惠券名称', '券面值', '门槛', '适用渠道', '有效期', '领取限制', '可领数量', '剩余库存', '操作'].forEach(function (h) {
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
            return COUPON_OPTIONS.filter(function (c) {
                if (c.expired) return false;
                return !k || String(c.label).toLowerCase().indexOf(k) !== -1;
            });
        }

        function paintCouponTable() {
            var all = filteredCoupons();
            var total = all.length;
            var maxPage = Math.max(1, Math.ceil(total / couponPageSize) || 1);
            if (couponPage > maxPage) couponPage = maxPage;
            var start = (couponPage - 1) * couponPageSize;
            var slice = all.slice(start, start + couponPageSize);

            empty(tbody);
            if (!slice.length) {
                var emptyTr = el('tr');
                var emptyTd = el('td', 'is-empty', '无匹配优惠券');
                emptyTd.colSpan = 9;
                emptyTr.appendChild(emptyTd);
                tbody.appendChild(emptyTr);
            } else {
                slice.forEach(function (c) {
                    var claimable = getUserClaimableQty(member, c);
                    var tr = el('tr');
                    [c.label, c.amount, c.threshold, c.channel, c.validPeriod, c.collectLimit, formatClaimableQty(claimable), c.stock].forEach(function (text) {
                        tr.appendChild(el('td', '', text));
                    });
                    var tdOp = el('td');
                    var issueBtn = el('a', 'erp-link', '发放');
                    issueBtn.href = '#';
                    issueBtn.addEventListener('click', function (e) {
                        e.preventDefault();
                        var latestClaimable = getUserClaimableQty(member, c);
                        var latestStock = parseStockQty(c);
                        if (isFinite(latestClaimable) && latestClaimable <= 0) {
                            toastIssueFail('该用户可领数量为 0');
                            return;
                        }
                        if (isFinite(latestStock) && latestStock <= 0) {
                            toastIssueFail('券库存不足');
                            return;
                        }
                        openCouponIssueQtyModal(member, c, function (qty) {
                            var op = getCurrentOperator();
                            if (window.MdmMallMarketingRecordStore && typeof window.MdmMallMarketingRecordStore.addManualIssue === 'function') {
                                window.MdmMallMarketingRecordStore.addManualIssue({
                                    userId: member.id,
                                    nickname: member.nickname,
                                    phone: member.phone,
                                    coupon: c,
                                    qty: qty,
                                    operatorName: op.name,
                                    operatorAccount: op.account
                                });
                            }
                            if (isFinite(latestStock)) {
                                c.stock = String(Math.max(0, latestStock - qty));
                            }
                            closeList();
                            showToast('发放成功', 'success');
                        });
                    });
                    tdOp.appendChild(issueBtn);
                    tr.appendChild(tdOp);
                    tbody.appendChild(tr);
                });
            }

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
        bCancel.addEventListener('click', closeList);
        footer.appendChild(bCancel);

        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);
        backdrop.appendChild(modal);
        backdrop.addEventListener('click', function (ev) {
            if (ev.target === backdrop) closeList();
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
        openChangeStoreFromRow: function (tr) {
            var m = rowToMember(tr);
            if (!m) {
                showToast('无法读取该行会员数据', 'error');
                return;
            }
            openChangeStorePicker(m);
        },
        openGrowthAdjust: openGrowthAdjustModal
    };
})();
