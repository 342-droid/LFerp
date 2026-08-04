/**
 * 会员等级 — 共享数据（列表 / 配置页）
 */
(function (global) {
    var STORAGE_KEY = 'mdm_member_level_list_v1';
    var LEVEL_MAX = 15;
    var NAME_MAX = 20;

    var MODE_LABEL = {
        total: '累计赠送',
        monthly: '每月赠送',
        daily: '每日赠送'
    };

    var SCOPE_LABEL = {
        all: '全部商品',
        include_product: '适用商品',
        include_category: '适用类目',
        exclude_product: '排除商品',
        exclude_category: '排除类目'
    };

    /** 进入直播间特效样式 */
    var LIVE_ENTRY_EFFECT_LABEL = {
        banner: '欢迎横幅',
        vehicle: '进场座驾',
        fullscreen: '全屏特效'
    };

    function levelIconSvg(bg, fg, label) {
        var svg =
            '<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72">' +
            '<rect width="72" height="72" rx="14" fill="' + bg + '"/>' +
            '<text x="36" y="42" text-anchor="middle" font-size="22" font-weight="700" fill="' + fg + '" ' +
            'font-family="PingFang SC,Microsoft YaHei,sans-serif">' + label + '</text></svg>';
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }

    function defaultDiscountScope() {
        return { type: 'all', products: [], categories: [] };
    }

    function normalizeDiscountScope(scope) {
        scope = scope || {};
        var type = scope.type || 'all';
        if (['all', 'include_product', 'include_category', 'exclude_product', 'exclude_category'].indexOf(type) === -1) {
            type = 'all';
        }
        return {
            type: type,
            products: Array.isArray(scope.products) ? scope.products : [],
            categories: Array.isArray(scope.categories) ? scope.categories : []
        };
    }

    function normalizeLevel(item) {
        if (!item || typeof item !== 'object') return item;
        if (item.giftPointsEnabled == null) item.giftPointsEnabled = Number(item.giftPoints) > 0;
        if (item.giftCouponEnabled == null) item.giftCouponEnabled = !!(item.giftCoupons && item.giftCoupons.length);
        if (item.memberDiscountEnabled == null) {
            item.memberDiscountEnabled = item.memberDiscount != null && Number(item.memberDiscount) < 100;
        }
        if (item.pointsRatioEnabled == null) {
            item.pointsRatioEnabled = item.pointsRatio != null && Number(item.pointsRatio) > 100;
        }
        if (item.birthdayEnabled == null) item.birthdayEnabled = false;
        if (item.liveEntryEffectEnabled == null) item.liveEntryEffectEnabled = false;
        if (!item.liveEntryEffectType || !LIVE_ENTRY_EFFECT_LABEL[item.liveEntryEffectType]) {
            item.liveEntryEffectType = 'banner';
        }

        item.giftPointsDesc = item.giftPointsDesc || '';
        item.giftCouponDesc = item.giftCouponDesc || '';
        item.memberDiscountDesc = item.memberDiscountDesc || '';
        item.pointsRatioDesc = item.pointsRatioDesc || '';
        item.birthdayDesc = item.birthdayDesc || '';
        item.liveEntryEffectDesc = item.liveEntryEffectDesc || '';
        item.discountScope = normalizeDiscountScope(item.discountScope);
        if (!item.giftCouponMode) item.giftCouponMode = 'total';
        /* 生日送券仅生日月每年一次，统一为 total，不再使用每月/每日 */
        item.birthdayCouponMode = 'total';
        if (!Array.isArray(item.giftCoupons)) item.giftCoupons = [];
        if (!Array.isArray(item.birthdayCoupons)) item.birthdayCoupons = [];
        return item;
    }

    function defaultLevelList() {
        return [
            normalizeLevel({
                id: 'ML10004',
                name: '普通会员',
                icon: levelIconSvg('#E8ECF0', '#6B7280', '普'),
                growthValue: 0,
                giftPointsEnabled: false,
                giftPoints: 0,
                giftPointsDesc: '',
                giftCouponEnabled: false,
                giftCouponMode: 'total',
                giftCoupons: [],
                giftCouponDesc: '',
                memberDiscountEnabled: false,
                memberDiscount: 100,
                memberDiscountDesc: '',
                discountScope: defaultDiscountScope(),
                pointsRatioEnabled: false,
                pointsRatio: 100,
                pointsRatioDesc: '',
                birthdayEnabled: false,
                birthdayCouponMode: 'total',
                birthdayCoupons: [],
                birthdayDesc: '',
                liveEntryEffectEnabled: false,
                liveEntryEffectType: 'banner',
                liveEntryEffectDesc: '',
                memberCount: 5620,
                updatedAt: '2026-04-15 09:12:08',
                status: '启用'
            }),
            normalizeLevel({
                id: 'ML10003',
                name: '银牌会员',
                icon: levelIconSvg('#D7DEE8', '#5B6B7C', '银'),
                growthValue: 2000,
                giftPointsEnabled: true,
                giftPoints: 100,
                giftPointsDesc: '升级至本等级时一次性发放',
                giftCouponEnabled: true,
                giftCouponMode: 'total',
                giftCoupons: [
                    { coupon: '满50减5券', qty: 2 },
                    { coupon: '免运费券', qty: 1 }
                ],
                giftCouponDesc: '升级成功后发放到券包',
                memberDiscountEnabled: true,
                memberDiscount: 95,
                memberDiscountDesc: '结算时自动叠加会员折扣',
                discountScope: { type: 'all', products: [], categories: [] },
                pointsRatioEnabled: true,
                pointsRatio: 120,
                pointsRatioDesc: '下单按 1.2 倍积分结算',
                birthdayEnabled: true,
                birthdayCouponMode: 'total',
                birthdayCoupons: [
                    { coupon: '生日专属券', qty: 1 },
                    { coupon: '免运费券', qty: 1 }
                ],
                birthdayDesc: '生日当月可领取',
                liveEntryEffectEnabled: true,
                liveEntryEffectType: 'banner',
                liveEntryEffectDesc: '进场展示银色欢迎横幅',
                memberCount: 1280,
                updatedAt: '2026-04-18 15:30:44',
                status: '启用'
            }),
            normalizeLevel({
                id: 'ML10002',
                name: '金牌会员',
                icon: levelIconSvg('#F5D78E', '#8A5A00', '金'),
                growthValue: 5000,
                giftPointsEnabled: true,
                giftPoints: 200,
                giftPointsDesc: '',
                giftCouponEnabled: true,
                giftCouponMode: 'monthly',
                giftCoupons: [
                    { coupon: '满100减15券', qty: 1 },
                    { coupon: '满50减5券', qty: 2 }
                ],
                giftCouponDesc: '',
                memberDiscountEnabled: true,
                memberDiscount: 90,
                memberDiscountDesc: '',
                discountScope: {
                    type: 'exclude_category',
                    products: [],
                    categories: [{ id: 'C04', name: '烟酒专区' }]
                },
                pointsRatioEnabled: true,
                pointsRatio: 150,
                pointsRatioDesc: '',
                birthdayEnabled: true,
                birthdayCouponMode: 'total',
                birthdayCoupons: [{ coupon: '生日专属券', qty: 2 }],
                birthdayDesc: '',
                liveEntryEffectEnabled: true,
                liveEntryEffectType: 'vehicle',
                liveEntryEffectDesc: '进场展示金牌座驾特效',
                memberCount: 312,
                updatedAt: '2026-04-20 10:22:11',
                status: '启用'
            }),
            normalizeLevel({
                id: 'ML10001',
                name: '钻石会员',
                icon: levelIconSvg('#B8D4F8', '#1E4F8C', '钻'),
                growthValue: 10000,
                giftPointsEnabled: true,
                giftPoints: 500,
                giftPointsDesc: '',
                giftCouponEnabled: true,
                giftCouponMode: 'daily',
                giftCoupons: [
                    { coupon: '满200减30券', qty: 1 },
                    { coupon: '满100减15券', qty: 1 },
                    { coupon: '免运费券', qty: 1 }
                ],
                giftCouponDesc: '',
                memberDiscountEnabled: true,
                memberDiscount: 85,
                memberDiscountDesc: '',
                discountScope: {
                    type: 'include_product',
                    products: [
                        { id: 'P1001', name: '冷丰精选西红柿' },
                        { id: 'P1003', name: '有机生菜' }
                    ],
                    categories: []
                },
                pointsRatioEnabled: true,
                pointsRatio: 200,
                pointsRatioDesc: '',
                birthdayEnabled: true,
                birthdayCouponMode: 'total',
                birthdayCoupons: [
                    { coupon: '生日专属券', qty: 1 },
                    { coupon: '满200减30券', qty: 1 }
                ],
                birthdayDesc: '',
                liveEntryEffectEnabled: true,
                liveEntryEffectType: 'fullscreen',
                liveEntryEffectDesc: '进场展示钻石全屏特效',
                memberCount: 86,
                updatedAt: '2026-04-20 10:22:11',
                status: '启用'
            })
        ];
    }

    function loadLevelList() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return defaultLevelList();
            var parsed = JSON.parse(raw);
            if (!Array.isArray(parsed) || !parsed.length) return defaultLevelList();
            return parsed.map(normalizeLevel);
        } catch (e) {
            return defaultLevelList();
        }
    }

    function saveLevelList(list) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(list || []));
        } catch (e) { /* ignore */ }
    }

    function isSystemPreset(item) {
        return !!item && Number(item.growthValue) === 0;
    }

    function escapeHtml(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatCouponList(mode, items) {
        if (!items || !items.length) return '';
        var modeText = MODE_LABEL[mode] || MODE_LABEL.total;
        var detail = items.map(function (it) {
            return it.coupon + '×' + it.qty;
        }).join('、');
        return modeText + '：' + detail;
    }

    function formatBirthdayCouponList(items) {
        if (!items || !items.length) return '';
        return items.map(function (it) {
            return it.coupon + '×' + it.qty;
        }).join('、');
    }

    function formatBenefitSummary(item) {
        item = normalizeLevel(item);
        var parts = [];
        if (item.giftPointsEnabled && item.giftPoints > 0) {
            parts.push('赠送积分：' + item.giftPoints);
        }
        if (item.giftCouponEnabled) {
            var giftText = formatCouponList(item.giftCouponMode, item.giftCoupons);
            if (giftText) parts.push('赠送优惠券：' + giftText);
        }
        if (item.memberDiscountEnabled && item.memberDiscount != null && item.memberDiscount < 100) {
            var disc = (item.memberDiscount / 10).toFixed(1).replace(/\.0$/, '') + ' 折';
            var scope = item.discountScope || defaultDiscountScope();
            if (scope.type && scope.type !== 'all') {
                disc += '（' + (SCOPE_LABEL[scope.type] || scope.type) + '）';
            }
            parts.push('会员折扣：' + disc);
        }
        if (item.pointsRatioEnabled) {
            parts.push('消费积分等级赠送比例：' + (item.pointsRatio / 100).toFixed(2).replace(/\.?0+$/, '') + ' 倍');
        }
        if (item.birthdayEnabled) {
            var birthText = formatBirthdayCouponList(item.birthdayCoupons);
            parts.push(birthText ? '生日送券：生日月赠送：' + birthText : '生日送券：已开启');
        }
        if (item.liveEntryEffectEnabled) {
            var effectName = LIVE_ENTRY_EFFECT_LABEL[item.liveEntryEffectType] || '欢迎横幅';
            parts.push('进入直播间特效：' + effectName);
        }
        if (!parts.length) {
            return '<span class="member-level-benefit-empty">暂无权益</span>';
        }
        return (
            '<ul class="member-level-benefit-list">' +
            parts.map(function (p) {
                return '<li>' + escapeHtml(p) + '</li>';
            }).join('') +
            '</ul>'
        );
    }

    var DEMO_CATEGORIES = [
        { id: 'C01', name: '生鲜蔬菜' },
        { id: 'C02', name: '肉禽蛋品' },
        { id: 'C03', name: '乳品饮料' },
        { id: 'C04', name: '烟酒专区' },
        { id: 'C05', name: '冷冻食品' },
        { id: 'C06', name: '水果' }
    ];

    var DEMO_PRODUCTS = [
        {
            id: 'P1001',
            name: '冷丰精选西红柿',
            categoryId: 'C01',
            image: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=80&h=80&fit=crop',
            skus: [
                { code: 'SKU-P1001-S', price: 6.5 },
                { code: 'SKU-P1001-L', price: 12.8 }
            ]
        },
        {
            id: 'P1002',
            name: '新鲜黄瓜',
            categoryId: 'C01',
            image: 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=80&h=80&fit=crop',
            skus: [{ code: 'SKU-P1002-01', price: 4.9 }]
        },
        {
            id: 'P1003',
            name: '有机生菜',
            categoryId: 'C01',
            image: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=80&h=80&fit=crop',
            skus: [
                { code: 'SKU-P1003-A', price: 5.2 },
                { code: 'SKU-P1003-B', price: 8.6 }
            ]
        },
        {
            id: 'P1004',
            name: '土鸡蛋 30 枚',
            categoryId: 'C02',
            image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=80&h=80&fit=crop',
            skus: [{ code: 'SKU-P1004-30', price: 29.9 }]
        },
        {
            id: 'P1005',
            name: '冷丰鲜牛奶',
            categoryId: 'C03',
            image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=80&h=80&fit=crop',
            skus: [
                { code: 'SKU-P1005-500', price: 6.8 },
                { code: 'SKU-P1005-1L', price: 11.5 }
            ]
        },
        {
            id: 'P1006',
            name: '冷冻虾仁',
            categoryId: 'C05',
            image: 'https://images.unsplash.com/photo-1565680018434-b513d5ea5c19?w=80&h=80&fit=crop',
            skus: [{ code: 'SKU-P1006-250', price: 39.9 }]
        },
        {
            id: 'P1007',
            name: '精品五花肉',
            categoryId: 'C02',
            image: 'https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=80&h=80&fit=crop',
            skus: [
                { code: 'SKU-P1007-500', price: 28.0 },
                { code: 'SKU-P1007-1KG', price: 52.0 }
            ]
        },
        {
            id: 'P1008',
            name: '香蕉（进口）',
            categoryId: 'C06',
            image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=80&h=80&fit=crop',
            skus: [{ code: 'SKU-P1008-01', price: 9.9 }]
        }
    ];

    global.MdmMemberLevelData = {
        STORAGE_KEY: STORAGE_KEY,
        LEVEL_MAX: LEVEL_MAX,
        NAME_MAX: NAME_MAX,
        MODE_LABEL: MODE_LABEL,
        SCOPE_LABEL: SCOPE_LABEL,
        LIVE_ENTRY_EFFECT_LABEL: LIVE_ENTRY_EFFECT_LABEL,
        DEMO_PRODUCTS: DEMO_PRODUCTS,
        DEMO_CATEGORIES: DEMO_CATEGORIES,
        levelIconSvg: levelIconSvg,
        defaultDiscountScope: defaultDiscountScope,
        normalizeDiscountScope: normalizeDiscountScope,
        normalizeLevel: normalizeLevel,
        defaultLevelList: defaultLevelList,
        loadLevelList: loadLevelList,
        saveLevelList: saveLevelList,
        isSystemPreset: isSystemPreset,
        escapeHtml: escapeHtml,
        formatCouponList: formatCouponList,
        formatBenefitSummary: formatBenefitSummary
    };
})(window);
