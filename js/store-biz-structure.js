/**
 * 门店业务结构：事业线（单选）→ 品牌名称（单选）及业务线（多选），两者相互独立。
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

    var DEFAULT_TREE = [
        {
            line: '餐饮',
            brands: ['冷丰锅贴', '莉姐家乌鸡米线', '冷丰食堂大钵刘'],
            biz: CATERING
        },
        {
            line: '康美',
            brands: ['汉言'],
            biz: KANGMEI
        },
        {
            line: '纯私域',
            brands: ['冷丰特选', '其他'],
            biz: PRIVATE_DOMAIN
        },
        {
            line: '集团内部',
            brands: ['集团内部'],
            biz: INTERNAL
        }
    ];

    var STORAGE_KEY = 'lf_store_biz_structure_v1';

    function normalizeTree(tree) {
        return tree.map(function (node) {
            var brands = Array.isArray(node.brands) ? node.brands : [];
            var legacyBiz = [];
            brands.forEach(function (brand) {
                if (brand && Array.isArray(brand.biz)) brand.biz.forEach(function (name) {
                    if (legacyBiz.indexOf(name) < 0) legacyBiz.push(name);
                });
            });
            return {
                line: node.line,
                brands: brands.map(function (brand) { return typeof brand === 'string' ? brand : brand.name; }),
                biz: Array.isArray(node.biz) ? node.biz.slice() : legacyBiz
            };
        });
    }

    function readTree() {
        try {
            var saved = JSON.parse(global.localStorage.getItem(STORAGE_KEY));
            if (Array.isArray(saved)) return saved;
        } catch (e) {}
        return normalizeTree(DEFAULT_TREE);
    }

    function validTree(tree) {
        if (!Array.isArray(tree)) return false;
        var linesSeen = new Set();
        return tree.every(function (node) {
            if (!node || typeof node.line !== 'string' || !node.line.trim() || !Array.isArray(node.brands) || !Array.isArray(node.biz) || linesSeen.has(node.line.trim())) return false;
            linesSeen.add(node.line.trim());
            var brandsSeen = new Set();
            var brandsValid = node.brands.every(function (name) {
                if (typeof name !== 'string' || !name.trim() || brandsSeen.has(name.trim())) return false;
                brandsSeen.add(name.trim());
                return true;
            });
            var bizSeen = new Set();
            return brandsValid && node.biz.every(function (name) {
                if (typeof name !== 'string' || !name.trim() || bizSeen.has(name.trim())) return false;
                bizSeen.add(name.trim());
                return true;
            });
        });
    }

    function tree() {
        var saved = readTree();
        if (!Array.isArray(saved)) return normalizeTree(DEFAULT_TREE);
        try {
            var normalized = normalizeTree(saved);
            return validTree(normalized) ? normalized : normalizeTree(DEFAULT_TREE);
        } catch (e) {
            return normalizeTree(DEFAULT_TREE);
        }
    }

    function saveTree(next) {
        if (!validTree(next)) return false;
        try {
            global.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeTree(next)));
            global.dispatchEvent(new Event('store-biz-structure-change'));
            return true;
        } catch (e) {
            return false;
        }
    }

    function findLine(line) {
        var i;
        var current = tree();
        for (i = 0; i < current.length; i++) {
            if (current[i].line === line) return current[i];
        }
        return null;
    }

    function lines() {
        return tree().map(function (x) {
            return x.line;
        });
    }

    function brands(line) {
        var node = findLine(line);
        return node ? node.brands.slice() : [];
    }

    function bizLines(line) {
        var node = findLine(line);
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
        tree: tree,
        saveTree: saveTree,
        lines: lines,
        brands: brands,
        bizLines: bizLines,
        normalizeBiz: normalizeBiz,
        formatBiz: formatBiz
    };
})(window);
