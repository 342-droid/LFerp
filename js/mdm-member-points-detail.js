/**
 * 会员 · 积分明细
 * 按获取批次管理有效期；扣减采用先进先出（FIFO）
 * 状态：过期 / 可用 / 冻结
 * 消费送积分：支付成功即赠送（冻结），订单交易成功后变为可用
 */
(function () {
    var RULE_STORAGE_KEY = 'mdm_member_points_rule_v1';
    var DEFAULT_VALIDITY_DAYS = 365;
    var REMARK_MAX = 200;

    var TYPE_LABEL = {
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
        /* 后台手工调整（列表「调整」入口），不在筛选枚举中展示 */
        manual: '手工调整'
    };

    /** 产生获取批次的变动类型（含售后回退、兑换取消回退；manual 仅用于后台调整演示） */
    var EARN_TYPES = {
        consume: 1,
        upgrade: 1,
        checkin: 1,
        luckybag: 1,
        watch_task: 1,
        exchange_cancel: 1,
        exchange_refund: 1,
        cash_refund: 1,
        manual: 1
    };

    var state = {
        page: 1,
        pageSize: 10,
        filter: {
            member: '',
            timeStart: '',
            timeEnd: '',
            changeType: '',
            status: ''
        },
        validityDays: loadValidityDays(),
        /**
         * 原始流水（按发生时间先后写入即可，渲染前统一 FIFO 演算）
         * change > 0 且类型为 earn → 形成获取批次（兑换/抵现售后·保留原有效期则退回原批次）
         * change < 0 → 按 FIFO 从最早「可用」批次扣减（跳过冻结）
         * 消费赠送：支付成功赠送时 frozen；订单交易成功后 orderTradeSuccess=true → 可用
         */
        list: [
            /* —— U10001：消费赠送 + 抵现 + 抵现售后 + 冻结 —— */
            {
                id: 'PT202503100001',
                memberId: 'U10001',
                nickname: '小程序用户A',
                phone: '138****2211',
                changeType: 'consume',
                change: 100,
                afterValue: 100,
                refNo: 'ORD-3212689201500001',
                remark: '订单实付 ¥100.00（支付成功赠送）',
                occurAt: '2025-03-10 12:00:00',
                operator: '',
                orderTradeSuccess: true
            },
            {
                id: 'PT202602010001',
                memberId: 'U10001',
                nickname: '小程序用户A',
                phone: '138****2211',
                changeType: 'cash',
                change: -60,
                afterValue: 40,
                refNo: 'ORD-3212689201500888',
                remark: '抵扣 ¥0.60',
                occurAt: '2026-02-01 14:22:10',
                operator: ''
            },
            {
                id: 'PT202602150001',
                memberId: 'U10001',
                nickname: '小程序用户A',
                phone: '138****2211',
                changeType: 'cash_refund',
                change: 30,
                afterValue: 70,
                refNo: 'AS202602150008',
                remark: '积分抵现售后，保留原有效期（退回批次 PT202503100001）',
                occurAt: '2026-02-15 11:08:20',
                operator: '',
                keepOriginal: true,
                restoreParts: [{ lotId: 'PT202503100001', amount: 30 }]
            },
            {
                id: 'PT202604100001',
                memberId: 'U10001',
                nickname: '小程序用户A',
                phone: '138****2211',
                changeType: 'consume',
                change: 80,
                afterValue: 80,
                refNo: 'ORD-3212689201598001',
                remark: '订单实付 ¥80.00（支付成功赠送）',
                occurAt: '2026-04-10 09:15:22',
                operator: '',
                orderTradeSuccess: true
            },
            {
                id: 'PT202604180801',
                memberId: 'U10001',
                nickname: '小程序用户A',
                phone: '138****2211',
                changeType: 'checkin',
                change: 5,
                afterValue: 85,
                refNo: '—',
                remark: '每日签到',
                occurAt: '2026-04-18 08:01:12',
                operator: ''
            },
            {
                id: 'PT202604200001',
                memberId: 'U10001',
                nickname: '小程序用户A',
                phone: '138****2211',
                changeType: 'consume',
                change: 50,
                afterValue: 135,
                refNo: 'ORD-3212689201598100',
                remark: '订单实付 ¥50.00（支付成功赠送）',
                occurAt: '2026-04-20 18:40:11',
                operator: '',
                orderTradeSuccess: true
            },
            {
                id: 'PT202604250001',
                memberId: 'U10001',
                nickname: '小程序用户A',
                phone: '138****2211',
                changeType: 'cash',
                change: -60,
                afterValue: 75,
                refNo: 'ORD-3212689201599001',
                remark: '抵扣 ¥0.60',
                occurAt: '2026-04-25 15:08:41',
                operator: ''
            },
            {
                id: 'PT202604250002',
                memberId: 'U10001',
                nickname: '小程序用户A',
                phone: '138****2211',
                changeType: 'consume',
                change: 86,
                afterValue: 161,
                refNo: 'ORD-3212689201598341',
                remark: '订单实付 ¥86.00（支付成功赠送）',
                occurAt: '2026-04-25 16:20:03',
                operator: '',
                orderTradeSuccess: true
            },
            {
                id: 'PT202607260001',
                memberId: 'U10001',
                nickname: '小程序用户A',
                phone: '138****2211',
                changeType: 'consume',
                change: 45,
                afterValue: 206,
                refNo: 'ORD-3212689201600128',
                remark: '订单实付 ¥45.00（支付成功赠送，订单未交易成功·冻结）',
                occurAt: '2026-07-26 10:18:42',
                operator: '',
                frozen: true,
                orderTradeSuccess: false
            },
            /* —— U10002：兑换 FIFO + 兑换售后保留原有效期 —— */
            {
                id: 'PT202604240001',
                memberId: 'U10002',
                nickname: 'APP会员B',
                phone: '139****9033',
                changeType: 'consume',
                change: 20,
                afterValue: 20,
                refNo: 'ORD-3212689201588561',
                remark: '订单实付 ¥20.00（支付成功赠送）',
                occurAt: '2026-01-01 10:00:00',
                operator: '',
                orderTradeSuccess: true
            },
            {
                id: 'PT202604240002',
                memberId: 'U10002',
                nickname: 'APP会员B',
                phone: '139****9033',
                changeType: 'consume',
                change: 80,
                afterValue: 100,
                refNo: 'ORD-3212689201588600',
                remark: '订单实付 ¥80.00（支付成功赠送）',
                occurAt: '2026-01-02 10:00:00',
                operator: '',
                orderTradeSuccess: true
            },
            {
                id: 'PT202604240003',
                memberId: 'U10002',
                nickname: 'APP会员B',
                phone: '139****9033',
                changeType: 'exchange',
                change: -100,
                afterValue: 0,
                refNo: 'EX-20260424008',
                remark: '兑换商品：冷丰鲜牛奶（FIFO：先扣 1月1日 20，再扣 1月2日 80）',
                occurAt: '2026-04-24 20:11:05',
                operator: ''
            },
            {
                id: 'PT202604240004',
                memberId: 'U10002',
                nickname: 'APP会员B',
                phone: '139****9033',
                changeType: 'exchange_cancel',
                change: 100,
                afterValue: 100,
                refNo: 'EX-20260424008',
                remark: '待支付订单取消，退回兑换占用积分',
                occurAt: '2026-04-24 20:28:40',
                operator: '',
                keepOriginal: true,
                restoreParts: [
                    { lotId: 'PT202604240001', amount: 20 },
                    { lotId: 'PT202604240002', amount: 80 }
                ]
            },
            {
                id: 'PT202604241001',
                memberId: 'U10002',
                nickname: 'APP会员B',
                phone: '139****9033',
                changeType: 'exchange_refund',
                change: 50,
                afterValue: 50,
                refNo: 'AS202604240018',
                remark: '积分兑换售后，保留原有效期（退还 50 积分归属 1月2日批次）',
                occurAt: '2026-04-24 21:15:08',
                operator: '',
                keepOriginal: true,
                restoreParts: [{ lotId: 'PT202604240002', amount: 50 }]
            },
            {
                id: 'PT202607250001',
                memberId: 'U10002',
                nickname: 'APP会员B',
                phone: '139****9033',
                changeType: 'consume',
                change: 68,
                afterValue: 118,
                refNo: 'ORD-3212689201600888',
                remark: '订单实付 ¥68.00（支付成功赠送，订单未交易成功·冻结）',
                occurAt: '2026-07-25 21:06:33',
                operator: '',
                frozen: true,
                orderTradeSuccess: false
            },
            /* —— 其它获取类型演示 —— */
            {
                id: 'PT202604210001',
                memberId: 'U10005',
                nickname: '演示会员5',
                phone: '137****1005',
                changeType: 'upgrade',
                change: 100,
                afterValue: 100,
                refNo: '—',
                remark: '会员升级奖励',
                occurAt: '2026-04-21 10:00:00',
                operator: ''
            },
            {
                id: 'PT202604190001',
                memberId: 'U10003',
                nickname: '访客C',
                phone: '—',
                changeType: 'luckybag',
                change: 30,
                afterValue: 30,
                refNo: 'LB-20260419001',
                remark: '直播福袋奖励',
                occurAt: '2026-04-19 11:00:00',
                operator: ''
            },
            {
                id: 'PT202604200002',
                memberId: 'U10003',
                nickname: '访客C',
                phone: '—',
                changeType: 'watch_task',
                change: 20,
                afterValue: 50,
                refNo: 'LIVE-2026042001',
                remark: '观看任务完成',
                occurAt: '2026-04-20 15:30:18',
                operator: ''
            },
            {
                id: 'PT202603120001',
                memberId: 'U10004',
                nickname: '演示会员4',
                phone: '137****1004',
                changeType: 'consume',
                change: 88,
                afterValue: 88,
                refNo: 'ORD-3212689201500123',
                remark: '订单实付 ¥88.00（支付成功赠送）',
                occurAt: '2026-03-12 11:22:08',
                operator: '',
                orderTradeSuccess: true
            }
        ]
    };

    function loadValidityDays() {
        try {
            var raw = localStorage.getItem(RULE_STORAGE_KEY);
            if (!raw) return DEFAULT_VALIDITY_DAYS;
            var parsed = JSON.parse(raw);
            var days = Number(parsed && parsed.validityDays);
            return days > 0 ? Math.floor(days) : DEFAULT_VALIDITY_DAYS;
        } catch (e) {
            return DEFAULT_VALIDITY_DAYS;
        }
    }

    function escapeHtml(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function toast(msg, type) {
        if (typeof showToast === 'function') {
            showToast(msg, type || 'success');
            return;
        }
        window.alert(msg);
    }

    function pageHref(file) {
        var wp = window.wmsPath;
        if (wp && typeof wp.page === 'function') return wp.page(file);
        return file;
    }

    function pad(n) {
        return n < 10 ? '0' + n : String(n);
    }

    function formatDateTime(d) {
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
            ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }

    function parseDateTime(str) {
        if (!str) return null;
        var s = String(str).trim().replace('T', ' ');
        var m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ ](\d{2}):(\d{2})(?::(\d{2}))?/);
        if (!m) return null;
        return new Date(
            Number(m[1]), Number(m[2]) - 1, Number(m[3]),
            Number(m[4]), Number(m[5]), Number(m[6] || 0)
        );
    }

    function toComparable(str) {
        var d = parseDateTime(str);
        if (!d || isNaN(d.getTime())) return '';
        return formatDateTime(d);
    }

    function addDays(date, days) {
        var d = new Date(date.getTime());
        d.setDate(d.getDate() + days);
        return d;
    }

    function isEarnRow(item) {
        return Number(item.change) > 0 && !!EARN_TYPES[item.changeType];
    }

    /**
     * 消费赠送：支付成功即赠送为冻结；订单交易成功后才可用。
     * 会员升级 / 签到 / 福袋 / 观看任务：直接可用。
     */
    function isFrozenEarn(item) {
        if (!isEarnRow(item)) return false;
        if (item.changeType !== 'consume') return false;
        if (item.orderTradeSuccess === true) return false;
        if (item.frozen === false) return false;
        // 消费赠送默认冻结，直至订单交易成功
        return true;
    }

    /** 兑换取消/兑换售后/抵现售后：默认保留原有效期，积分退回原获取批次 */
    function isKeepOriginalRefund(item) {
        if (
            item.changeType !== 'exchange_refund' &&
            item.changeType !== 'cash_refund' &&
            item.changeType !== 'exchange_cancel'
        ) {
            return false;
        }
        return item.keepOriginal !== false;
    }

    /**
     * 按会员、按时间重放流水，计算：
     * - 获取批次：本批剩余 remaining、过期时间 expireAt、状态（过期/可用/冻结）
     * - 扣减流水：FIFO 扣减明细 fifoDetail（跳过冻结批次）
     * - 售后回退（保留原有效期）：按 restoreParts 退回原批次剩余
     */
    function enrichWithFifo(rawList) {
        var byMember = {};
        rawList.forEach(function (item) {
            if (!byMember[item.memberId]) byMember[item.memberId] = [];
            byMember[item.memberId].push(item);
        });

        var resultMap = {};
        var now = new Date();

        Object.keys(byMember).forEach(function (memberId) {
            var rows = byMember[memberId].slice().sort(function (a, b) {
                var cmp = toComparable(a.occurAt).localeCompare(toComparable(b.occurAt));
                if (cmp !== 0) return cmp;
                return String(a.id).localeCompare(String(b.id));
            });

            /** @type {{id:string, remain:number, expireAt:Date, expireKey:string, closedBy:string, frozen:boolean}[]} */
            var lots = [];

            rows.forEach(function (item) {
                var copy = Object.assign({}, item);
                var occur = parseDateTime(item.occurAt);
                var change = Number(item.change) || 0;

                if (isKeepOriginalRefund(item) && change > 0) {
                    var restoreParts = Array.isArray(item.restoreParts) ? item.restoreParts : [];
                    restoreParts.forEach(function (p) {
                        var j;
                        for (j = 0; j < lots.length; j++) {
                            if (lots[j].id !== p.lotId) continue;
                            lots[j].remain += Number(p.amount) || 0;
                            if (lots[j].remain > 0 && lots[j].closedBy === 'used') {
                                lots[j].closedBy = '';
                            }
                            break;
                        }
                    });
                    copy.isLot = false;
                    copy.remaining = null;
                    copy.lotExpireAt = '';
                    copy.fifoDetail = restoreParts.map(function (p) {
                        return p.lotId + ' +' + p.amount;
                    }).join('；');
                    copy.fifoParts = restoreParts;
                } else if (isEarnRow(item) && occur) {
                    var expire = addDays(occur, state.validityDays);
                    var frozen = isFrozenEarn(item);
                    lots.push({
                        id: item.id,
                        remain: change,
                        expireAt: expire,
                        expireKey: formatDateTime(expire),
                        closedBy: '',
                        frozen: frozen
                    });
                    copy.lotExpireAt = formatDateTime(expire);
                    copy.remaining = change;
                    copy.fifoDetail = '';
                    copy.isLot = true;
                    copy.frozen = frozen;
                } else if (change < 0) {
                    var need = -change;
                    var parts = [];
                    var i;
                    // 过期流水：只清已到期批次；其它扣减：FIFO 扣仍有效、非冻结且有剩余的批次
                    if (item.changeType === 'expire') {
                        for (i = 0; i < lots.length && need > 0; i++) {
                            var lotE = lots[i];
                            if (lotE.remain <= 0) continue;
                            if (occur && lotE.expireAt.getTime() > occur.getTime()) continue;
                            var takeE = Math.min(lotE.remain, need);
                            lotE.remain -= takeE;
                            need -= takeE;
                            if (lotE.remain === 0) lotE.closedBy = 'expire';
                            parts.push({ lotId: lotE.id, amount: takeE });
                        }
                    } else {
                        for (i = 0; i < lots.length && need > 0; i++) {
                            var lot = lots[i];
                            if (lot.remain <= 0) continue;
                            if (lot.frozen) continue; // 冻结积分不可扣减
                            // 扣减时点若批次已过期，跳过（应由过期任务处理）
                            if (occur && lot.expireAt.getTime() <= occur.getTime()) continue;
                            var take = Math.min(lot.remain, need);
                            lot.remain -= take;
                            need -= take;
                            if (lot.remain === 0) lot.closedBy = 'used';
                            parts.push({ lotId: lot.id, amount: take });
                        }
                    }
                    copy.isLot = false;
                    copy.remaining = null;
                    copy.lotExpireAt = '';
                    copy.fifoDetail = parts.map(function (p) {
                        return p.lotId + ' −' + p.amount;
                    }).join('；');
                    copy.fifoParts = parts;
                } else {
                    copy.isLot = false;
                    copy.remaining = null;
                    copy.lotExpireAt = '';
                    copy.fifoDetail = '';
                }

                resultMap[item.id] = copy;
            });

            // 回写各获取批次的最终剩余与状态：过期 / 可用 / 冻结
            lots.forEach(function (lot) {
                var row = resultMap[lot.id];
                if (!row) return;
                row.remaining = lot.remain;
                row.lotExpireAt = lot.expireKey;
                row.frozen = lot.frozen;
                if (lot.closedBy === 'expire' || (lot.remain > 0 && lot.expireAt.getTime() < now.getTime())) {
                    row.status = '过期';
                } else if (lot.frozen && lot.remain > 0) {
                    row.status = '冻结';
                } else {
                    // 可用（含已全部抵现/兑换消耗完、剩余为 0 的批次）
                    row.status = '可用';
                }
            });

            // 非批次流水：过期类记过期，售后回退/扣减流水记「—」
            rows.forEach(function (item) {
                var row = resultMap[item.id];
                if (!row || row.isLot) return;
                if (item.changeType === 'expire') {
                    row.status = '过期';
                } else {
                    row.status = '—';
                }
            });
        });

        return rawList.map(function (item) {
            return resultMap[item.id] || Object.assign({}, item, {
                remaining: null,
                lotExpireAt: '',
                fifoDetail: '',
                status: '可用',
                isLot: false
            });
        });
    }

    function getLatestAfterValue(memberId) {
        var enriched = enrichWithFifo(state.list);
        var rows = enriched.filter(function (it) { return it.memberId === memberId; })
            .sort(function (a, b) {
                return toComparable(b.occurAt).localeCompare(toComparable(a.occurAt));
            });
        return rows.length ? Number(rows[0].afterValue) || 0 : 0;
    }

    /** 会员当前可用积分（各「可用」批次剩余之和，不含冻结） */
    function getAvailableBalance(memberId) {
        var enriched = enrichWithFifo(state.list);
        return enriched.filter(function (it) {
            return it.memberId === memberId && it.isLot && it.status === '可用';
        }).reduce(function (sum, it) {
            return sum + (Number(it.remaining) || 0);
        }, 0);
    }

    function getFilteredList() {
        var f = state.filter;
        var startKey = toComparable(f.timeStart);
        var endKey = toComparable(f.timeEnd);
        var keyword = (f.member || '').trim().toLowerCase();

        return enrichWithFifo(state.list).filter(function (item) {
            if (keyword) {
                var hit =
                    String(item.memberId).toLowerCase().indexOf(keyword) !== -1 ||
                    String(item.nickname).toLowerCase().indexOf(keyword) !== -1 ||
                    String(item.phone).replace(/\*/g, '').indexOf(keyword.replace(/\*/g, '')) !== -1 ||
                    String(item.phone).indexOf(keyword) !== -1;
                if (!hit) return false;
            }
            if (f.changeType && item.changeType !== f.changeType) return false;
            if (f.status && item.status !== f.status) return false;
            var occurKey = toComparable(item.occurAt);
            if (startKey && occurKey < startKey) return false;
            if (endKey && occurKey > endKey) return false;
            return true;
        }).slice().sort(function (a, b) {
            return toComparable(b.occurAt).localeCompare(toComparable(a.occurAt));
        });
    }

    function formatChange(val) {
        var n = Number(val) || 0;
        if (n > 0) return '<span class="pts-change--plus">+' + n + '</span>';
        if (n < 0) return '<span class="pts-change--minus">' + n + '</span>';
        return '0';
    }

    function formatRemaining(item) {
        if (!item.isLot || item.remaining == null) return '—';
        var n = Number(item.remaining) || 0;
        if (n > 0) return '<span class="pts-remain--ok">' + n + '</span>';
        return '<span class="pts-remain--zero">0</span>';
    }

    function formatMemberIdHtml(item) {
        var href = pageHref('mdm_member_c.html') +
            '?memberId=' + encodeURIComponent(item.memberId) +
            '&detail=1';
        return '<a class="subject-name-link" href="' + href + '">' + escapeHtml(item.memberId) + '</a>';
    }

    function formatRefNoHtml(item) {
        if (!item.refNo || item.refNo === '—') return '—';
        var href = '';
        if (
            item.changeType === 'exchange_refund' ||
            item.changeType === 'cash_refund' ||
            String(item.refNo).indexOf('AS') === 0
        ) {
            href = pageHref('mdm_aftersale_ticket_detail.html') + '?id=' + encodeURIComponent(item.refNo);
        } else if (String(item.refNo).indexOf('ORD-') === 0) {
            href = pageHref('mdm_order_retail.html') + '?orderId=' + encodeURIComponent(item.refNo);
        } else {
            return escapeHtml(item.refNo);
        }
        return '<a class="subject-name-link" href="' + href + '">' + escapeHtml(item.refNo) + '</a>';
    }

    function formatExpireDisplay(item) {
        if (item.isLot && item.lotExpireAt) return item.lotExpireAt;
        return '—';
    }

    function formatRemarkHtml(item) {
        var base = escapeHtml(item.remark || '—');
        if (item.fifoDetail) {
            var tipLabel = isKeepOriginalRefund(item) ? '退回原批次：' : 'FIFO：';
            return base + '<span class="pts-fifo-tip">' + tipLabel + escapeHtml(item.fifoDetail) + '</span>';
        }
        return base;
    }

    function formatStatusHtml(status) {
        var cls = 'pts-status pts-status--na';
        if (status === '可用') cls = 'pts-status pts-status--available';
        else if (status === '冻结') cls = 'pts-status pts-status--frozen';
        else if (status === '过期') cls = 'pts-status pts-status--expired';
        return '<span class="' + cls + '">' + escapeHtml(status || '—') + '</span>';
    }

    function renderTable() {
        var list = getFilteredList();
        var total = list.length;
        var totalPages = Math.ceil(total / state.pageSize) || 1;
        if (state.page > totalPages) state.page = totalPages;
        if (state.page < 1) state.page = 1;
        var start = (state.page - 1) * state.pageSize;
        var pageRows = list.slice(start, start + state.pageSize);
        var tbody = document.getElementById('tableBody');
        if (!tbody) return;

        if (!pageRows.length) {
            tbody.innerHTML = '<tr><td colspan="14" style="text-align:center;color:#999;padding:28px 0;">暂无数据</td></tr>';
        } else {
            tbody.innerHTML = pageRows.map(function (item) {
                return (
                    '<tr>' +
                    '<td>' + escapeHtml(item.id) + '</td>' +
                    '<td>' + formatMemberIdHtml(item) + '</td>' +
                    '<td>' + escapeHtml(item.nickname) + '</td>' +
                    '<td>' + escapeHtml(item.phone) + '</td>' +
                    '<td>' + escapeHtml(TYPE_LABEL[item.changeType] || item.changeType) + '</td>' +
                    '<td>' + formatChange(item.change) + '</td>' +
                    '<td>' + formatRemaining(item) + '</td>' +
                    '<td>' + escapeHtml(item.afterValue) + '</td>' +
                    '<td>' + formatRefNoHtml(item) + '</td>' +
                    '<td>' + formatRemarkHtml(item) + '</td>' +
                    '<td>' + escapeHtml(item.occurAt) + '</td>' +
                    '<td>' + escapeHtml(formatExpireDisplay(item)) + '</td>' +
                    '<td>' + formatStatusHtml(item.status) + '</td>' +
                    '<td>' + escapeHtml(item.operator || '—') + '</td>' +
                    '</tr>'
                );
            }).join('');
        }

        if (typeof createPagination === 'function') {
            createPagination({
                containerId: 'pagination-container',
                totalItems: total,
                currentPage: state.page,
                pageSize: state.pageSize,
                onPageChange: function (page) {
                    state.page = page;
                    renderTable();
                },
                onPageSizeChange: function (size) {
                    state.pageSize = size;
                    state.page = 1;
                    renderTable();
                }
            });
        }
    }

    function readFilter() {
        state.filter = {
            member: (document.getElementById('qMember') || {}).value || '',
            timeStart: (document.getElementById('qTimeStart') || {}).value || '',
            timeEnd: (document.getElementById('qTimeEnd') || {}).value || '',
            changeType: (document.getElementById('qChangeType') || {}).value || '',
            status: (document.getElementById('qStatus') || {}).value || ''
        };
    }

    function syncDatetimeClearUi() {
        document.querySelectorAll('[data-datetime-wrap]').forEach(function (wrap) {
            var input = wrap.querySelector('input');
            wrap.classList.toggle('has-value', !!(input && input.value));
        });
    }

    function getCurrentOperator() {
        return '当前账号 / demo';
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

    function closeAdjustModal() {
        var backdrop = document.querySelector('[data-pts-adjust-modal]');
        if (backdrop) backdrop.remove();
    }

    function nextId() {
        var now = new Date();
        return 'PT' + now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) +
            pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());
    }

    function openAdjustModal() {
        closeAdjustModal();
        var operator = getCurrentOperator();
        var picked = null;

        var backdrop = document.createElement('div');
        backdrop.className = 'erp-modal-backdrop';
        backdrop.setAttribute('data-pts-adjust-modal', '1');
        backdrop.innerHTML =
            '<div class="erp-modal erp-modal--pts-adjust">' +
            '  <div class="erp-modal__header">' +
            '    <h2 class="erp-modal__title">手工调整积分</h2>' +
            '    <div class="erp-modal__header-actions">' +
            '      <button type="button" class="erp-modal__header-btn" data-modal-close aria-label="关闭">&times;</button>' +
            '    </div>' +
            '  </div>' +
            '  <div class="erp-modal__body" id="ptsAdjustBody"></div>' +
            '  <div class="erp-modal__footer" id="ptsAdjustFooter"></div>' +
            '</div>';

        function renderSearchStep() {
            var body = backdrop.querySelector('#ptsAdjustBody');
            var footer = backdrop.querySelector('#ptsAdjustFooter');
            body.innerHTML =
                '<div class="erp-modal-field">' +
                '  <label class="erp-modal-field__label"><span class="erp-req">*</span>搜索会员</label>' +
                '  <div class="erp-modal-field__control">' +
                '    <div class="pts-member-search-box">' +
                '      <input class="erp-input" id="ptsMemberKeyword" type="text" placeholder="会员ID / 手机号 / 昵称" autocomplete="off">' +
                '      <button type="button" class="erp-btn erp-btn--primary" id="ptsMemberSearchBtn">搜索</button>' +
                '    </div>' +
                '    <div class="pts-member-result" id="ptsMemberResult">' +
                '      <div class="pts-member-result-empty">请先搜索并选择会员</div>' +
                '    </div>' +
                '  </div>' +
                '</div>';
            footer.innerHTML = '<button type="button" class="erp-btn" data-modal-cancel>取消</button>';

            function doSearch() {
                var kw = document.getElementById('ptsMemberKeyword').value;
                var result = document.getElementById('ptsMemberResult');
                var rows = searchMembers(kw);
                if (!rows.length) {
                    result.innerHTML = '<div class="pts-member-result-empty">未找到匹配会员</div>';
                    return;
                }
                result.innerHTML = rows.map(function (m) {
                    return (
                        '<div class="pts-member-result-item" data-member-id="' + escapeHtml(m.memberId) + '">' +
                        '<span>' + escapeHtml(m.nickname) + '（' + escapeHtml(m.memberId) + '）</span>' +
                        '<span>' + escapeHtml(m.phone) + '</span>' +
                        '</div>'
                    );
                }).join('');
            }

            document.getElementById('ptsMemberSearchBtn').addEventListener('click', doSearch);
            document.getElementById('ptsMemberKeyword').addEventListener('keydown', function (ev) {
                if (ev.key === 'Enter') {
                    ev.preventDefault();
                    doSearch();
                }
            });
            document.getElementById('ptsMemberResult').addEventListener('click', function (ev) {
                var row = ev.target.closest('[data-member-id]');
                if (!row) return;
                var id = row.getAttribute('data-member-id');
                picked = collectMembers().filter(function (m) { return m.memberId === id; })[0] || null;
                if (picked) renderAdjustStep();
            });
        }

        function renderAdjustStep() {
            var balance = getAvailableBalance(picked.memberId);
            var ledgerBalance = getLatestAfterValue(picked.memberId);
            var body = backdrop.querySelector('#ptsAdjustBody');
            var footer = backdrop.querySelector('#ptsAdjustFooter');
            body.innerHTML =
                '<div class="erp-modal-field">' +
                '  <label class="erp-modal-field__label">会员</label>' +
                '  <div class="erp-modal-field__control">' +
                '    <div class="pts-adjust-member">' + escapeHtml(picked.nickname) +
                '（' + escapeHtml(picked.memberId) + '） · 可用积分 ' + balance +
                '（账面白余额 ' + ledgerBalance + '）</div>' +
                '    <div class="pts-adjust-tip">减少时按 FIFO 优先扣最早获取的「可用」批次（冻结积分不可扣）</div>' +
                '    <button type="button" class="erp-btn" id="ptsChangeMemberBtn" style="margin-top:8px;">重新选择</button>' +
                '  </div>' +
                '</div>' +
                '<div class="erp-modal-field">' +
                '  <label class="erp-modal-field__label"><span class="erp-req">*</span>调整类型</label>' +
                '  <div class="erp-modal-field__control">' +
                '    <div class="pts-adjust-radio-row">' +
                '      <label class="pts-adjust-radio-label"><input type="radio" name="ptsAdjustDir" value="add" checked> 增加</label>' +
                '      <label class="pts-adjust-radio-label"><input type="radio" name="ptsAdjustDir" value="sub"> 减少</label>' +
                '    </div>' +
                '  </div>' +
                '</div>' +
                '<div class="erp-modal-field">' +
                '  <label class="erp-modal-field__label" for="ptsAdjustValue"><span class="erp-req">*</span>调整积分</label>' +
                '  <div class="erp-modal-field__control">' +
                '    <input class="erp-input" id="ptsAdjustValue" type="number" min="1" step="1" placeholder="请输入正整数">' +
                '  </div>' +
                '</div>' +
                '<div class="erp-modal-field">' +
                '  <label class="erp-modal-field__label" for="ptsAdjustRemark">备注</label>' +
                '  <div class="erp-modal-field__control">' +
                '    <textarea class="erp-input" id="ptsAdjustRemark" rows="3" maxlength="' + REMARK_MAX + '" placeholder="选填，最多 ' + REMARK_MAX + ' 字"></textarea>' +
                '    <div class="pts-adjust-tip">操作人：' + escapeHtml(operator) + '</div>' +
                '  </div>' +
                '</div>';
            footer.innerHTML =
                '<button type="button" class="erp-btn" data-modal-cancel>取消</button>' +
                '<button type="button" class="erp-btn erp-btn--primary" id="ptsAdjustSubmit">确定</button>';

            document.getElementById('ptsChangeMemberBtn').addEventListener('click', function () {
                picked = null;
                renderSearchStep();
            });
            document.getElementById('ptsAdjustSubmit').addEventListener('click', function () {
                var dirEl = backdrop.querySelector('input[name="ptsAdjustDir"]:checked');
                var dir = dirEl ? dirEl.value : 'add';
                var raw = document.getElementById('ptsAdjustValue').value;
                var val = Number(raw);
                if (!raw || isNaN(val) || val < 1 || !/^\d+$/.test(String(raw).trim())) {
                    toast('请输入正整数积分', 'warning');
                    return;
                }
                if (dir === 'sub' && val > balance) {
                    toast('扣减不得大于可用积分（当前可用 ' + balance + '）', 'warning');
                    return;
                }
                var delta = dir === 'add' ? val : -val;
                var after = balance + delta;
                var remark = String(document.getElementById('ptsAdjustRemark').value || '').trim();
                state.list.unshift({
                    id: nextId(),
                    memberId: picked.memberId,
                    nickname: picked.nickname,
                    phone: picked.phone,
                    changeType: 'manual',
                    change: delta,
                    afterValue: after,
                    refNo: '—',
                    remark: remark || (dir === 'add' ? '手工增加积分' : '手工减少积分（FIFO）'),
                    occurAt: formatDateTime(new Date()),
                    operator: operator
                });
                closeAdjustModal();
                state.page = 1;
                renderTable();
                toast('积分调整成功');
            });
        }

        backdrop.addEventListener('click', function (ev) {
            if (ev.target === backdrop) closeAdjustModal();
        });
        backdrop.addEventListener('click', function (ev) {
            if (ev.target.closest('[data-modal-close], [data-modal-cancel]')) {
                closeAdjustModal();
            }
        });

        document.body.appendChild(backdrop);
        renderSearchStep();
    }

    document.addEventListener('DOMContentLoaded', function () {
        var gotoRule = document.getElementById('btnGotoPtsRule');
        if (gotoRule) {
            gotoRule.addEventListener('click', function () {
                window.location.href = pageHref('mdm_member_points_rule.html');
            });
        }

        document.querySelectorAll('[data-clear-datetime]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var id = btn.getAttribute('data-clear-datetime');
                var input = document.getElementById(id);
                if (input) input.value = '';
                syncDatetimeClearUi();
            });
        });
        document.querySelectorAll('#qTimeStart, #qTimeEnd').forEach(function (input) {
            input.addEventListener('change', syncDatetimeClearUi);
            input.addEventListener('input', syncDatetimeClearUi);
        });
        syncDatetimeClearUi();

        document.getElementById('btnFilterReset').addEventListener('click', function () {
            ['qMember', 'qTimeStart', 'qTimeEnd', 'qChangeType', 'qStatus'].forEach(function (id) {
                var el = document.getElementById(id);
                if (el) el.value = '';
            });
            syncDatetimeClearUi();
            readFilter();
            state.page = 1;
            renderTable();
        });

        document.getElementById('btnFilterQuery').addEventListener('click', function () {
            readFilter();
            state.page = 1;
            renderTable();
        });

        document.getElementById('btnAdjustPoints').addEventListener('click', openAdjustModal);

        if (typeof initClearButtons === 'function') initClearButtons();

        readFilter();
        renderTable();
    });
})();
