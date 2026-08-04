/**
 * 会员成长值 — 获取方式子筛选项（多处共用，改一处即可同步）
 * 引用方：成长值明细页、会员详情成长值 Tab、C 端成长值明细展示
 *
 * 购物消费子项：支付完成 / 交易完成 / 售后完成
 */
(function (global) {
    var CONSUME_SUBS = [
        { value: 'payment_complete', label: '支付完成' },
        { value: 'trade_complete', label: '交易完成' },
        { value: 'aftersale_complete', label: '售后完成' }
    ];

    /** B 端会员详情抽屉使用中文 value（与列表展示一致） */
    var CONSUME_SUBS_ZH = CONSUME_SUBS.map(function (it) {
        return { value: it.label, label: it.label };
    });

    var ACTIVITY_SUBS = [
        { value: 'signin', label: '每日签到' },
        { value: 'browse', label: '浏览商品' },
        { value: 'share', label: '分享邀请' },
        { value: 'review', label: '评价订单' }
    ];

    var ACTIVITY_SUBS_ZH = ACTIVITY_SUBS.map(function (it) {
        return { value: it.label, label: it.label };
    });

    var MANUAL_SUBS = [
        { value: 'manual_add', label: '手工增加' },
        { value: 'manual_sub', label: '手工减少' }
    ];

    var MANUAL_SUBS_ZH = MANUAL_SUBS.map(function (it) {
        return { value: it.label, label: it.label };
    });

    var SUB_LABEL = {};
    CONSUME_SUBS.concat(ACTIVITY_SUBS, MANUAL_SUBS).forEach(function (it) {
        SUB_LABEL[it.value] = it.label;
        SUB_LABEL[it.label] = it.label;
    });

    /** 兼容旧数据：订单完成 → 交易完成 */
    var LEGACY_SUB_MAP = {
        order_complete: 'trade_complete',
        订单完成: '交易完成'
    };

    function normalizeConsumeSub(sub) {
        if (sub == null || sub === '') return sub;
        var s = String(sub);
        if (LEGACY_SUB_MAP[s]) return LEGACY_SUB_MAP[s];
        return s;
    }

    function labelOf(sub) {
        var n = normalizeConsumeSub(sub);
        return SUB_LABEL[n] || SUB_LABEL[sub] || String(sub || '—');
    }

    global.MdmMemberGrowthAcquire = {
        CONSUME_SUBS: CONSUME_SUBS,
        CONSUME_SUBS_ZH: CONSUME_SUBS_ZH,
        ACTIVITY_SUBS: ACTIVITY_SUBS,
        ACTIVITY_SUBS_ZH: ACTIVITY_SUBS_ZH,
        MANUAL_SUBS: MANUAL_SUBS,
        MANUAL_SUBS_ZH: MANUAL_SUBS_ZH,
        SUB_LABEL: SUB_LABEL,
        LEGACY_SUB_MAP: LEGACY_SUB_MAP,
        normalizeConsumeSub: normalizeConsumeSub,
        labelOf: labelOf
    };
})(typeof window !== 'undefined' ? window : this);
