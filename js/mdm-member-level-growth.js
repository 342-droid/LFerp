/**
 * 会员等级 — 成长值明细列表、按规则计算有效期、手工调整（含操作人）
 */
(function () {
    var RULE_STORAGE_KEY = 'mdm_member_level_growth_rule_v1';
    var DEFAULT_RULE = {
        validityType: 'rolling',
        validityDays: 365
    };

    var ACTIVITY_SUBS = (window.MdmMemberGrowthAcquire && window.MdmMemberGrowthAcquire.ACTIVITY_SUBS) || [
        { value: 'signin', label: '每日签到' },
        { value: 'browse', label: '浏览商品' },
        { value: 'share', label: '分享邀请' },
        { value: 'review', label: '评价订单' }
    ];

    var CONSUME_SUBS = (window.MdmMemberGrowthAcquire && window.MdmMemberGrowthAcquire.CONSUME_SUBS) || [
        { value: 'payment_complete', label: '支付完成' },
        { value: 'trade_complete', label: '交易完成' },
        { value: 'aftersale_complete', label: '售后完成' }
    ];

    var MANUAL_SUBS = (window.MdmMemberGrowthAcquire && window.MdmMemberGrowthAcquire.MANUAL_SUBS) || [
        { value: 'manual_add', label: '手工增加' },
        { value: 'manual_sub', label: '手工减少' }
    ];

    var TYPE_LABEL = {
        consume: '购物消费',
        activity: '用户活跃',
        manual: '手工调整'
    };

    var SUB_LABEL = (window.MdmMemberGrowthAcquire && window.MdmMemberGrowthAcquire.SUB_LABEL) || {
        payment_complete: '支付完成',
        trade_complete: '交易完成',
        aftersale_complete: '售后完成',
        order_complete: '交易完成',
        signin: '每日签到',
        browse: '浏览商品',
        share: '分享邀请',
        review: '评价订单',
        manual_add: '手工增加',
        manual_sub: '手工减少'
    };

    var REMARK_MAX = 200;

    var state = {
        page: 1,
        pageSize: 10,
        filter: {
            member: '',
            timeStart: '',
            timeEnd: '',
            acquireType: '',
            acquireSub: '',
            status: ''
        },
        rule: loadGrowthRule(),
        list: [
            {
                id: 'GV202604250001',
                memberId: 'U10001',
                nickname: '小程序用户A',
                phone: '138****2211',
                acquireType: 'consume',
                acquireSub: 'payment_complete',
                change: 86,
                afterValue: 2860,
                refNo: 'ORD-3212689201598341',
                remark: '订单实付 ¥86.00',
                occurAt: '2026-04-25 14:20:03',
                operator: ''
            },
            {
                id: 'GV202604250002',
                memberId: 'U10001',
                nickname: '小程序用户A',
                phone: '138****2211',
                acquireType: 'activity',
                acquireSub: 'signin',
                change: 5,
                afterValue: 2774,
                refNo: '—',
                remark: '每日签到',
                occurAt: '2026-04-25 08:01:12',
                operator: ''
            },
            {
                id: 'GV202604240001',
                memberId: 'U10002',
                nickname: 'APP会员B',
                phone: '139****9033',
                acquireType: 'consume',
                acquireSub: 'trade_complete',
                change: 129,
                afterValue: 5420,
                refNo: 'ORD-3212689201588561',
                remark: '订单实付 ¥129.50',
                occurAt: '2026-04-24 19:33:41',
                operator: ''
            },
            {
                id: 'GV202604241001',
                memberId: 'U10002',
                nickname: 'APP会员B',
                phone: '139****9033',
                acquireType: 'consume',
                acquireSub: 'aftersale_complete',
                change: -30,
                afterValue: 5390,
                refNo: 'AS202604240018',
                remark: '售后退款扣减成长值',
                occurAt: '2026-04-24 21:15:08',
                operator: ''
            },
            {
                id: 'GV202604240002',
                memberId: 'U10002',
                nickname: 'APP会员B',
                phone: '139****9033',
                acquireType: 'activity',
                acquireSub: 'browse',
                change: 1,
                afterValue: 5291,
                refNo: '—',
                remark: '浏览商品',
                occurAt: '2026-04-24 11:08:27',
                operator: ''
            },
            {
                id: 'GV202604230001',
                memberId: 'U10004',
                nickname: '演示会员4',
                phone: '137****1004',
                acquireType: 'activity',
                acquireSub: 'review',
                change: 10,
                afterValue: 11800,
                refNo: 'ORD-3212689201584693',
                remark: '评价订单',
                occurAt: '2026-04-23 16:45:09',
                operator: ''
            },
            {
                id: 'GV202604220001',
                memberId: 'U10004',
                nickname: '演示会员4',
                phone: '137****1004',
                acquireType: 'activity',
                acquireSub: 'share',
                change: 20,
                afterValue: 11790,
                refNo: '—',
                remark: '分享邀请成功',
                occurAt: '2026-04-22 21:12:55',
                operator: ''
            },
            {
                id: 'GV202604211001',
                memberId: 'U10001',
                nickname: '小程序用户A',
                phone: '138****2211',
                acquireType: 'consume',
                acquireSub: 'aftersale_complete',
                change: -20,
                afterValue: 2840,
                refNo: 'AS202604210007',
                remark: '售后完成扣减成长值',
                occurAt: '2026-04-21 16:40:22',
                operator: ''
            },
            {
                id: 'GV202604210001',
                memberId: 'U10005',
                nickname: '演示会员5',
                phone: '137****1005',
                acquireType: 'manual',
                acquireSub: 'manual_add',
                change: 100,
                afterValue: 320,
                refNo: '—',
                remark: '客服补偿成长值',
                occurAt: '2026-04-21 10:00:00',
                operator: '张运营 / admin01'
            },
            {
                id: 'GV202604200001',
                memberId: 'U10003',
                nickname: '访客C',
                phone: '—',
                acquireType: 'manual',
                acquireSub: 'manual_sub',
                change: -20,
                afterValue: 10,
                refNo: '—',
                remark: '异常行为扣减',
                occurAt: '2026-04-20 15:30:18',
                operator: '李客服 / kf02'
            },
            {
                id: 'GV202505010001',
                memberId: 'U10001',
                nickname: '小程序用户A',
                phone: '138****2211',
                acquireType: 'activity',
                acquireSub: 'review',
                change: 10,
                afterValue: 1769,
                refNo: 'ORD-3212689201562037-A',
                remark: '评价订单',
                occurAt: '2025-05-01 09:22:44',
                operator: ''
            },
            {
                id: 'GV202504180001',
                memberId: 'U10002',
                nickname: 'APP会员B',
                phone: '139****9033',
                acquireType: 'consume',
                acquireSub: 'trade_complete',
                change: 55,
                afterValue: 3290,
                refNo: 'ORD-3212689201588561-B',
                remark: '订单实付 ¥55.00',
                occurAt: '2025-04-18 20:05:36',
                operator: ''
            },
            {
                id: 'GV202504191001',
                memberId: 'U10002',
                nickname: 'APP会员B',
                phone: '139****9033',
                acquireType: 'consume',
                acquireSub: 'aftersale_complete',
                change: -15,
                afterValue: 3275,
                refNo: 'AS202504190003',
                remark: '售后退货扣减成长值',
                occurAt: '2025-04-19 11:08:40',
                operator: ''
            },
            {
                id: 'GV202503170001',
                memberId: 'U10005',
                nickname: '演示会员5',
                phone: '137****1005',
                acquireType: 'activity',
                acquireSub: 'signin',
                change: 5,
                afterValue: 120,
                refNo: '—',
                remark: '每日签到',
                occurAt: '2025-03-17 07:58:03',
                operator: ''
            },
            {
                id: 'GV202503100001',
                memberId: 'U10005',
                nickname: '演示会员5',
                phone: '137****1005',
                acquireType: 'manual',
                acquireSub: 'manual_add',
                change: 50,
                afterValue: 115,
                refNo: '—',
                remark: '活动补发',
                occurAt: '2025-03-10 11:20:00',
                operator: '王主管 / mgr03'
            }
        ]
    };

    function loadGrowthRule() {
        try {
            var raw = localStorage.getItem(RULE_STORAGE_KEY);
            if (!raw) return { validityType: DEFAULT_RULE.validityType, validityDays: DEFAULT_RULE.validityDays };
            var parsed = JSON.parse(raw);
            return {
                validityType: parsed.validityType === 'permanent' ? 'permanent' : 'rolling',
                validityDays: Number(parsed.validityDays) > 0 ? Number(parsed.validityDays) : DEFAULT_RULE.validityDays
            };
        } catch (e) {
            return { validityType: DEFAULT_RULE.validityType, validityDays: DEFAULT_RULE.validityDays };
        }
    }

    function escapeHtml(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function toast(msg, type) {
        if (typeof showToast === 'function') {
            showToast(msg, type || 'success');
            return;
        }
        window.alert(msg);
    }

    function nowStr() {
        var d = new Date();
        function pad(n) { return n < 10 ? '0' + n : String(n); }
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
            ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }

    function genId() {
        var d = new Date();
        function pad(n) { return n < 10 ? '0' + n : String(n); }
        return 'GV' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) +
            String(Date.now()).slice(-6);
    }

    function normalizeTime(val) {
        if (!val) return '';
        return String(val).replace('T', ' ').slice(0, 19);
    }

    function toComparable(val) {
        var n = normalizeTime(val);
        return n ? n.replace(/[-:\s]/g, '') : '';
    }

    function parseDateTime(val) {
        var n = normalizeTime(val);
        if (!n) return null;
        var d = new Date(n.replace(/-/g, '/'));
        return isNaN(d.getTime()) ? null : d;
    }

    function formatDateTime(d) {
        if (!d || isNaN(d.getTime())) return '';
        function pad(n) { return n < 10 ? '0' + n : String(n); }
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
            ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }

    /**
     * 按成长值规则：获取时间 + 有效期 → 过期时间 / 状态
     * 所有获取方式均参与计算
     */
    function enrichValidity(item) {
        var rule = state.rule || loadGrowthRule();
        var occur = parseDateTime(item.occurAt);
        if (!occur) {
            return {
                expireAt: '—',
                expireAtRaw: '',
                status: '过期'
            };
        }
        if (rule.validityType === 'permanent') {
            return {
                expireAt: '永久',
                expireAtRaw: '',
                status: '有效'
            };
        }
        var days = Number(rule.validityDays) || DEFAULT_RULE.validityDays;
        var expire = new Date(occur.getTime());
        expire.setDate(expire.getDate() + days);
        var now = new Date();
        return {
            expireAt: formatDateTime(expire),
            expireAtRaw: formatDateTime(expire),
            status: now.getTime() <= expire.getTime() ? '有效' : '过期'
        };
    }

    function withValidity(item) {
        var v = enrichValidity(item);
        return Object.assign({}, item, {
            expireAt: v.expireAt,
            expireAtRaw: v.expireAtRaw,
            status: v.status
        });
    }

    function getCurrentOperator() {
        var user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
        if (user) {
            var name = user.name || user.realName || user.nickname || user.username || '';
            var account = user.account || user.username || user.loginName || user.id || '';
            if (name && account && name !== account) return name + ' / ' + account;
            if (name) return name;
            if (account) return account;
        }
        return '超级管理员 / admin';
    }

    function getLatestAfterValue(memberId) {
        var rows = state.list.filter(function (it) { return it.memberId === memberId; })
            .sort(function (a, b) {
                return toComparable(b.occurAt).localeCompare(toComparable(a.occurAt));
            });
        return rows.length ? Number(rows[0].afterValue) || 0 : 0;
    }

    function getFilteredList() {
        var f = state.filter;
        var startKey = toComparable(f.timeStart);
        var endKey = toComparable(f.timeEnd);
        var keyword = (f.member || '').trim().toLowerCase();

        return state.list.map(withValidity).filter(function (item) {
            if (keyword) {
                var hit =
                    String(item.memberId).toLowerCase().indexOf(keyword) !== -1 ||
                    String(item.nickname).toLowerCase().indexOf(keyword) !== -1 ||
                    String(item.phone).replace(/\*/g, '').indexOf(keyword.replace(/\*/g, '')) !== -1 ||
                    String(item.phone).indexOf(keyword) !== -1;
                if (!hit) return false;
            }
            if (f.acquireType && item.acquireType !== f.acquireType) return false;
            if (f.acquireSub && item.acquireSub !== f.acquireSub) return false;
            if (f.status && item.status !== f.status) return false;
            var occurKey = toComparable(item.occurAt);
            if (startKey && occurKey < startKey) return false;
            if (endKey && occurKey > endKey) return false;
            return true;
        }).slice().sort(function (a, b) {
            return toComparable(b.occurAt).localeCompare(toComparable(a.occurAt));
        });
    }

    function syncSubSelect() {
        var type = (document.getElementById('qAcquireType') || {}).value || '';
        var group = document.getElementById('qAcquireSubGroup');
        var label = document.getElementById('qAcquireSubLabel');
        var select = document.getElementById('qAcquireSub');
        if (!group || !select) return;

        var options = [];
        if (type === 'consume') {
            options = CONSUME_SUBS;
            if (label) label.textContent = '明细类型:';
        } else if (type === 'activity') {
            options = ACTIVITY_SUBS;
            if (label) label.textContent = '活跃行为:';
        } else if (type === 'manual') {
            options = MANUAL_SUBS;
            if (label) label.textContent = '调整类型:';
        } else {
            group.style.display = 'none';
            select.innerHTML = '';
            select.value = '';
            return;
        }

        group.style.display = '';
        select.innerHTML = '<option value="">全部</option>' + options.map(function (opt) {
            return '<option value="' + escapeHtml(opt.value) + '">' + escapeHtml(opt.label) + '</option>';
        }).join('');
    }

    function pageHref(file) {
        var wp = window.wmsPath;
        if (wp && typeof wp.page === 'function') return wp.page(file);
        return file;
    }

    function formatExpireDisplay(item) {
        // 有效的成长值不展示过期时间
        if (item.status === '有效') return '—';
        return item.expireAt || '—';
    }

    function formatRefNoHtml(item) {
        if (!item.refNo || item.refNo === '—') return '—';
        var href = '';
        if (item.acquireSub === 'aftersale_complete') {
            href = pageHref('mdm_aftersale_ticket_detail.html') + '?id=' + encodeURIComponent(item.refNo);
        } else if (item.acquireSub === 'payment_complete' || item.acquireSub === 'trade_complete' || item.acquireSub === 'order_complete') {
            href = pageHref('mdm_order_retail.html') + '?orderId=' + encodeURIComponent(item.refNo);
        } else {
            return escapeHtml(item.refNo);
        }
        return '<a class="subject-name-link" href="' + href + '">' + escapeHtml(item.refNo) + '</a>';
    }

    function formatMemberIdHtml(item) {
        var href = pageHref('mdm_member_c.html') +
            '?memberId=' + encodeURIComponent(item.memberId) +
            '&detail=1';
        return '<a class="subject-name-link" href="' + href + '">' + escapeHtml(item.memberId) + '</a>';
    }

    function formatChange(val) {
        var n = Number(val) || 0;
        if (n > 0) return '<span class="growth-change--plus">+' + n + '</span>';
        if (n < 0) return '<span class="growth-change--minus">' + n + '</span>';
        return '0';
    }

    function closeAdjustModal() {
        var backdrop = document.querySelector('[data-growth-adjust-modal]');
        if (backdrop) backdrop.remove();
    }

    function maskPhone(phone) {
        var raw = String(phone == null ? '' : phone).trim();
        if (!raw || raw === '—') return '—';
        var digits = raw.replace(/\D/g, '');
        if (digits.length === 11) return digits.slice(0, 3) + '****' + digits.slice(7);
        if (digits.length >= 7) return digits.slice(0, 3) + '****' + digits.slice(-4);
        return raw;
    }

    function collectMembers() {
        var map = {};
        state.list.forEach(function (item) {
            if (!item.memberId || map[item.memberId]) return;
            map[item.memberId] = {
                memberId: item.memberId,
                nickname: item.nickname,
                phone: item.phone
            };
        });
        // 补充演示会员，便于搜索调整
        [
            { memberId: 'U10001', nickname: '小程序用户A', phone: '138****2211' },
            { memberId: 'U10002', nickname: 'APP会员B', phone: '139****9033' },
            { memberId: 'U10003', nickname: '访客C', phone: '—' },
            { memberId: 'U10004', nickname: '演示会员4', phone: '137****1004' },
            { memberId: 'U10005', nickname: '演示会员5', phone: '137****1005' }
        ].forEach(function (m) {
            if (!map[m.memberId]) map[m.memberId] = m;
        });
        return Object.keys(map).map(function (k) { return map[k]; });
    }

    function searchMembers(keyword) {
        var kw = String(keyword || '').trim().toLowerCase();
        if (!kw) return [];
        return collectMembers().filter(function (m) {
            var phoneDigits = String(m.phone || '').replace(/\D/g, '');
            var kwDigits = kw.replace(/\D/g, '');
            return String(m.memberId).toLowerCase().indexOf(kw) >= 0 ||
                String(m.nickname).toLowerCase().indexOf(kw) >= 0 ||
                String(m.phone).toLowerCase().indexOf(kw) >= 0 ||
                (kwDigits && phoneDigits.indexOf(kwDigits) >= 0);
        }).slice(0, 20);
    }

    function openAdjustModal(presetItem) {
        closeAdjustModal();
        var operator = getCurrentOperator();
        var picked = presetItem ? {
            memberId: presetItem.memberId,
            nickname: presetItem.nickname,
            phone: presetItem.phone
        } : null;

        var backdrop = document.createElement('div');
        backdrop.className = 'erp-modal-backdrop';
        backdrop.setAttribute('data-growth-adjust-modal', '1');
        backdrop.innerHTML =
            '<div class="erp-modal erp-modal--growth-adjust">' +
            '  <div class="erp-modal__header">' +
            '    <h2 class="erp-modal__title">手工调整成长值</h2>' +
            '    <div class="erp-modal__header-actions">' +
            '      <button type="button" class="erp-modal__header-btn" data-modal-close aria-label="关闭">&times;</button>' +
            '    </div>' +
            '  </div>' +
            '  <div class="erp-modal__body" id="growthAdjustBody"></div>' +
            '  <div class="erp-modal__footer" id="growthAdjustFooter"></div>' +
            '</div>';

        function renderSearchStep() {
            var body = backdrop.querySelector('#growthAdjustBody');
            var footer = backdrop.querySelector('#growthAdjustFooter');
            body.innerHTML =
                '<div class="erp-modal-field">' +
                '  <label class="erp-modal-field__label"><span class="erp-req">*</span>搜索会员</label>' +
                '  <div class="erp-modal-field__control">' +
                '    <div class="growth-member-search-box">' +
                '      <input class="erp-input" id="growthMemberKeyword" type="text" placeholder="会员ID / 手机号 / 昵称" autocomplete="off">' +
                '      <button type="button" class="erp-btn erp-btn--primary" id="growthMemberSearchBtn">搜索</button>' +
                '    </div>' +
                '    <div class="growth-member-result" id="growthMemberResult">' +
                '      <div class="growth-member-result-empty">请先搜索并选择会员</div>' +
                '    </div>' +
                '  </div>' +
                '</div>';
            footer.innerHTML =
                '<button type="button" class="erp-btn" data-modal-cancel>取消</button>';

            function doSearch() {
                var kw = (backdrop.querySelector('#growthMemberKeyword').value || '').trim();
                var list = searchMembers(kw);
                var wrap = backdrop.querySelector('#growthMemberResult');
                if (!kw) {
                    wrap.innerHTML = '<div class="growth-member-result-empty">请输入会员ID / 手机号 / 昵称</div>';
                    return;
                }
                if (!list.length) {
                    wrap.innerHTML = '<div class="growth-member-result-empty">未找到匹配会员</div>';
                    return;
                }
                wrap.innerHTML = list.map(function (m) {
                    return (
                        '<div class="growth-member-result-item" data-member-id="' + escapeHtml(m.memberId) + '">' +
                        '  <span>' + escapeHtml(m.memberId) + ' / ' + escapeHtml(m.nickname) + ' / ' + escapeHtml(maskPhone(m.phone)) + '</span>' +
                        '  <span style="color:#2196F3;">选择</span>' +
                        '</div>'
                    );
                }).join('');
            }

            backdrop.querySelector('#growthMemberSearchBtn').addEventListener('click', doSearch);
            backdrop.querySelector('#growthMemberKeyword').addEventListener('keydown', function (ev) {
                if (ev.key === 'Enter') {
                    ev.preventDefault();
                    doSearch();
                }
            });
            backdrop.querySelector('#growthMemberResult').addEventListener('click', function (ev) {
                var row = ev.target.closest('[data-member-id]');
                if (!row) return;
                var id = row.getAttribute('data-member-id');
                var found = collectMembers().filter(function (m) { return m.memberId === id; })[0];
                if (!found) return;
                picked = found;
                renderAdjustStep();
            });
            setTimeout(function () {
                var input = backdrop.querySelector('#growthMemberKeyword');
                if (input) input.focus();
            }, 0);
        }

        function renderAdjustStep() {
            var currentValue = getLatestAfterValue(picked.memberId);
            var body = backdrop.querySelector('#growthAdjustBody');
            var footer = backdrop.querySelector('#growthAdjustFooter');
            body.innerHTML =
                '<div class="erp-modal-field">' +
                '  <label class="erp-modal-field__label">会员</label>' +
                '  <div class="erp-modal-field__control">' +
                '    <div class="growth-adjust-member">' +
                escapeHtml(picked.memberId) + ' / ' + escapeHtml(picked.nickname) +
                (picked.phone && picked.phone !== '—' ? ' / ' + escapeHtml(maskPhone(picked.phone)) : '') +
                '    </div>' +
                '    <div class="growth-adjust-tip">当前剩余成长值 <strong id="growthRemainValue">' + currentValue + '</strong> 分</div>' +
                (!presetItem ? '<div class="growth-adjust-tip"><a href="javascript:;" id="growthReselectMember">重新选择会员</a></div>' : '') +
                '  </div>' +
                '</div>' +
                '<div class="erp-modal-field">' +
                '  <label class="erp-modal-field__label">操作人</label>' +
                '  <div class="erp-modal-field__control">' +
                '    <div class="growth-adjust-member">' + escapeHtml(operator) + '</div>' +
                '  </div>' +
                '</div>' +
                '<div class="erp-modal-field">' +
                '  <label class="erp-modal-field__label"><span class="erp-req">*</span>调整类型</label>' +
                '  <div class="erp-modal-field__control">' +
                '    <div class="growth-adjust-radio-row">' +
                '      <label class="growth-adjust-radio-label"><input type="radio" name="adjType" value="manual_add" checked> 手工增加</label>' +
                '      <label class="growth-adjust-radio-label"><input type="radio" name="adjType" value="manual_sub"> 手工减少</label>' +
                '    </div>' +
                '  </div>' +
                '</div>' +
                '<div class="erp-modal-field">' +
                '  <label class="erp-modal-field__label" for="adjAmount"><span class="erp-req">*</span>调整数值</label>' +
                '  <div class="erp-modal-field__control">' +
                '    <input class="erp-input" id="adjAmount" type="number" min="1" step="1" placeholder="请输入正整数">' +
                '  </div>' +
                '</div>' +
                '<div class="erp-modal-field">' +
                '  <label class="erp-modal-field__label" for="adjRemark"><span class="erp-req">*</span>备注</label>' +
                '  <div class="erp-modal-field__control">' +
                '    <textarea class="erp-textarea" id="adjRemark" maxlength="' + REMARK_MAX + '" placeholder="请填写调整原因，最多' + REMARK_MAX + '字"></textarea>' +
                '  </div>' +
                '</div>';
            footer.innerHTML =
                '<button type="button" class="erp-btn" data-modal-cancel>取消</button>' +
                '<button type="button" class="erp-btn erp-btn--primary" data-modal-ok>确定</button>';

            var reselect = backdrop.querySelector('#growthReselectMember');
            if (reselect) {
                reselect.addEventListener('click', function (ev) {
                    ev.preventDefault();
                    picked = null;
                    renderSearchStep();
                });
            }

            backdrop.querySelector('[data-modal-ok]').addEventListener('click', function () {
                var adjTypeEl = backdrop.querySelector('input[name="adjType"]:checked');
                var adjType = adjTypeEl ? adjTypeEl.value : '';
                var amountRaw = ((backdrop.querySelector('#adjAmount') || {}).value || '').trim();
                var remark = ((backdrop.querySelector('#adjRemark') || {}).value || '').trim();
                var remain = getLatestAfterValue(picked.memberId);

                if (!adjType) {
                    toast('请选择调整类型', 'warning');
                    return;
                }
                if (!amountRaw || !/^\d+$/.test(amountRaw) || Number(amountRaw) < 1) {
                    toast('调整数值须为正整数', 'warning');
                    return;
                }
                if (!remark) {
                    toast('请填写备注信息', 'warning');
                    return;
                }

                var amount = Number(amountRaw);
                if (adjType === 'manual_sub' && amount > remain) {
                    toast('扣减数量不得大于会员剩余成长值（当前剩余 ' + remain + ' 分）', 'warning');
                    return;
                }

                var change = adjType === 'manual_sub' ? -amount : amount;
                var afterValue = remain + change;
                state.list.unshift({
                    id: genId(),
                    memberId: picked.memberId,
                    nickname: picked.nickname,
                    phone: picked.phone,
                    acquireType: 'manual',
                    acquireSub: adjType,
                    change: change,
                    afterValue: afterValue,
                    refNo: '—',
                    remark: remark,
                    occurAt: nowStr(),
                    operator: operator
                });

                closeAdjustModal();
                toast(adjType === 'manual_sub' ? '已手工减少成长值' : '已手工增加成长值', 'success');
                state.page = 1;
                render(false);
            });

            setTimeout(function () {
                var amountInput = backdrop.querySelector('#adjAmount');
                if (amountInput) amountInput.focus();
            }, 0);
        }

        backdrop.addEventListener('click', function (ev) {
            if (ev.target === backdrop) closeAdjustModal();
            if (ev.target.closest('[data-modal-close], [data-modal-cancel]')) closeAdjustModal();
        });

        document.body.appendChild(backdrop);
        if (picked) renderAdjustStep();
        else renderSearchStep();
    }

    function renderTable(pageItems) {
        var tbody = document.getElementById('tableBody');
        if (!tbody) return;
        if (!pageItems.length) {
            tbody.innerHTML = '<tr><td colspan="13" style="text-align:center;color:#999;padding:24px;">暂无数据</td></tr>';
            return;
        }
        tbody.innerHTML = pageItems.map(function (item) {
            var statusClass = item.status === '有效' ? 'active' : 'inactive';
            var operatorText = item.acquireType === 'manual'
                ? (item.operator || '—')
                : '—';
            return (
                '<tr data-id="' + escapeHtml(item.id) + '">' +
                '<td>' + escapeHtml(item.id) + '</td>' +
                '<td>' + formatMemberIdHtml(item) + '</td>' +
                '<td>' + escapeHtml(item.nickname) + '</td>' +
                '<td>' + escapeHtml(item.phone) + '</td>' +
                '<td>' + escapeHtml(TYPE_LABEL[item.acquireType] || item.acquireType) + '</td>' +
                '<td>' + escapeHtml(SUB_LABEL[item.acquireSub] || item.acquireSub) + '</td>' +
                '<td>' + formatChange(item.change) + '</td>' +
                '<td>' + formatRefNoHtml(item) + '</td>' +
                '<td>' + escapeHtml(item.remark) + '</td>' +
                '<td>' + escapeHtml(item.occurAt) + '</td>' +
                '<td>' + escapeHtml(formatExpireDisplay(item)) + '</td>' +
                '<td><span class="status ' + statusClass + '">' + escapeHtml(item.status) + '</span></td>' +
                '<td>' + escapeHtml(operatorText) + '</td>' +
                '</tr>'
            );
        }).join('');
    }

    function renderPagination(total) {
        if (typeof createPagination !== 'function') return;
        createPagination({
            containerId: 'pagination-container',
            totalItems: total,
            currentPage: state.page,
            pageSize: state.pageSize,
            onPageChange: function (page) {
                state.page = page;
                render(false);
            },
            onPageSizeChange: function (size) {
                state.pageSize = size;
                state.page = 1;
                render(false);
            }
        });
    }

    function render(resetPage) {
        if (resetPage) state.page = 1;
        state.rule = loadGrowthRule();
        var filtered = getFilteredList();
        var total = filtered.length;
        var totalPages = Math.ceil(total / state.pageSize) || 1;
        if (state.page > totalPages) state.page = totalPages;
        var start = (state.page - 1) * state.pageSize;
        renderTable(filtered.slice(start, start + state.pageSize));
        renderPagination(total);
    }

    function readFilter() {
        state.filter.member = ((document.getElementById('qMember') || {}).value || '').trim();
        state.filter.timeStart = (document.getElementById('qTimeStart') || {}).value || '';
        state.filter.timeEnd = (document.getElementById('qTimeEnd') || {}).value || '';
        state.filter.acquireType = (document.getElementById('qAcquireType') || {}).value || '';
        state.filter.acquireSub = (document.getElementById('qAcquireSub') || {}).value || '';
        state.filter.status = (document.getElementById('qStatus') || {}).value || '';
    }

    function bindEvents() {
        var backBtn = document.getElementById('btnBackLevel');
        if (backBtn) {
            backBtn.addEventListener('click', function () {
                window.location.href = 'mdm_member_level.html';
            });
        }
        var ruleBtn = document.getElementById('btnGotoRule');
        if (ruleBtn) {
            ruleBtn.addEventListener('click', function () {
                window.location.href = 'mdm_member_level_rule.html';
            });
        }

        var typeSelect = document.getElementById('qAcquireType');
        if (typeSelect) {
            typeSelect.addEventListener('change', function () {
                syncSubSelect();
            });
        }

        var queryBtn = document.getElementById('btnFilterQuery');
        if (queryBtn) {
            queryBtn.addEventListener('click', function () {
                readFilter();
                if (state.filter.timeStart && state.filter.timeEnd &&
                    toComparable(state.filter.timeStart) > toComparable(state.filter.timeEnd)) {
                    toast('获取时间起始不能晚于结束时间', 'warning');
                    return;
                }
                render(true);
            });
        }

        var adjustBtn = document.getElementById('btnAdjustGrowth');
        if (adjustBtn) {
            adjustBtn.addEventListener('click', function () {
                openAdjustModal(null);
            });
        }

        function syncDatetimeClearState() {
            document.querySelectorAll('[data-datetime-wrap]').forEach(function (wrap) {
                var input = wrap.querySelector('input');
                wrap.classList.toggle('has-value', !!(input && input.value));
            });
        }

        var searchForm = document.getElementById('growthDetailSearchForm');
        if (searchForm) {
            searchForm.addEventListener('click', function (ev) {
                var btn = ev.target.closest('[data-clear-datetime]');
                if (!btn) return;
                var id = btn.getAttribute('data-clear-datetime');
                var input = document.getElementById(id);
                if (input) {
                    input.value = '';
                    syncDatetimeClearState();
                }
            });
        }
        ['qTimeStart', 'qTimeEnd'].forEach(function (id) {
            var el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('input', syncDatetimeClearState);
            el.addEventListener('change', syncDatetimeClearState);
        });
        syncDatetimeClearState();

        var resetBtn = document.getElementById('btnFilterReset');
        if (resetBtn) {
            resetBtn.addEventListener('click', function () {
                var form = document.getElementById('growthDetailSearchForm');
                if (form) form.reset();
                state.filter = {
                    member: '',
                    timeStart: '',
                    timeEnd: '',
                    acquireType: '',
                    acquireSub: '',
                    status: ''
                };
                syncSubSelect();
                syncDatetimeClearState();
                render(true);
            });
        }

    }

    document.addEventListener('DOMContentLoaded', function () {
        syncSubSelect();
        bindEvents();
        render(true);
    });
})();
