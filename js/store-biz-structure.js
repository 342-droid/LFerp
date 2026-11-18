/**
 * 门店业务结构：事业线（单选）→ 品牌名称（单选）→ 业务线（多选）
 * 口径来自业务结构表。表内「测试」是集团内部店：用户不能定位、不能下单，门店真实存在。
 * 枚举不叫测试，事业线、品牌、业务线都显示为「集团内部」。
 * 餐饮三个品牌共用一套业务线；康美「POS」为「POS/到店」；纯私域只有拉新、留存和两场私域直播。
 */
(function (global) {
    var CATERING = [
        '拉新',
        '留存',
        '私域直播-生鲜场',
        '私域直播-百货场',
        '外卖运营',
        '抖音运营',
        'POS/堂食',
        '商城',
        '代采进货'
    ];
    var KANGMEI = [
        '拉新',
        '留存',
        '私域直播-生鲜场',
        '私域直播-百货场',
        '外卖运营',
        '抖音运营',
        'POS/到店',
        '商城',
        '代采进货'
    ];
    var PRIVATE_DOMAIN = ['拉新', '留存', '私域直播-生鲜场', '私域直播-百货场'];
    /* 表内原名「测试」。集团内部店，用户不能定位和下单，门店真实存在。 */
    var INTERNAL = ['集团内部'];

    var TREE = [
        {
            line: '餐饮',
            brands: [
                { name: '冷丰锅贴', biz: CATERING },
                { name: '莉姐家乌鸡米线', biz: CATERING },
                { name: '冷丰食堂大钵刘', biz: CATERING }
            ]
        },
        {
            line: '康美',
            brands: [{ name: '汉言', biz: KANGMEI }]
        },
        {
            line: '纯私域',
            brands: [
                { name: '冷丰特选', biz: PRIVATE_DOMAIN },
                { name: '其他', biz: PRIVATE_DOMAIN }
            ]
        },
        {
            line: '集团内部',
            brands: [{ name: '集团内部', biz: INTERNAL }]
        }
    ];

    function findLine(line) {
        var i;
        for (i = 0; i < TREE.length; i++) {
            if (TREE[i].line === line) return TREE[i];
        }
        return null;
    }

    function findBrand(line, brand) {
        var node = findLine(line);
        var i;
        if (!node) return null;
        for (i = 0; i < node.brands.length; i++) {
            if (node.brands[i].name === brand) return node.brands[i];
        }
        return null;
    }

    function lines() {
        return TREE.map(function (x) {
            return x.line;
        });
    }

    function brands(line) {
        var node = findLine(line);
        return node
            ? node.brands.map(function (b) {
                  return b.name;
              })
            : [];
    }

    function bizLines(line, brand) {
        var node = findBrand(line, brand);
        return node ? node.biz.slice() : [];
    }

    function normalizeBiz(value) {
        if (Array.isArray(value)) {
            return value
                .map(function (x) {
                    return String(x || '').trim();
                })
                .filter(Boolean);
        }
        return String(value || '')
            .split(/[、,，]/)
            .map(function (s) {
                return s.trim();
            })
            .filter(Boolean);
    }

    function formatBiz(value) {
        var list = normalizeBiz(value);
        return list.length ? list.join('、') : '';
    }

    global.StoreBizStructure = {
        lines: lines,
        brands: brands,
        bizLines: bizLines,
        normalizeBiz: normalizeBiz,
        formatBiz: formatBiz
    };
})(window);
