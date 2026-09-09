/**
 * 门店编码（LF-IT-SPEC-2026-003）
 * 8 位：第 1-3 位城市码（IATA Metropolitan Code / 自定义）+ 第 4-8 位城市内顺序码。
 * 编码由系统按所选城市自动生成，一经分配不重复使用，注销后不回收。
 */
(function (global) {
    var CITY_CODES = {
        上海: 'SHA',
        北京: 'BJS',
        武汉: 'WUH',
        广州: 'CAN',
        深圳: 'SZX',
        成都: 'CTU',
        杭州: 'HGH',
        南京: 'NKG',
        长沙: 'CSX',
        天津: 'TSN',
        重庆: 'CKG',
        南昌: 'KHN',
        沈阳: 'SHE',
        苏州: 'SZH',
        石家庄: 'SJW',
        唐山: 'TVS',
        太原: 'TYN',
        呼和浩特: 'HET',
        大连: 'DLC',
        宁波: 'NGB',
        嘉兴: 'JIX',
        昭通: 'ZAT',
        昆明: 'KMG'
    };

    var MUNICIPALITIES = ['北京', '上海', '天津', '重庆'];
    var SEQ_KEY = 'mdm_store_code_seq_v1';
    var CODE_RE = /^([A-Z]{3})(\d{5})$/;

    /** 档案页演示数据：旧门店ID → 新门店编码，便于营业时间/进件等本地缓存迁移 */
    var LEGACY_ALIASES = {
        'ONS-CENTER-01': 'HGH00002',
        ONS307892038169264128: 'BJS00001',
        ONS303445581201: 'TSN00001',
        ONS303445581202: 'SHA00001',
        ONS303445581203: 'HGH00001'
    };

    function pad5(n) {
        var s = String(Math.max(0, parseInt(n, 10) || 0));
        return ('00000' + s).slice(-5);
    }

    function stripAdminSuffix(name) {
        return String(name || '')
            .replace(/市辖区$/g, '')
            .replace(/特别行政区$/g, '')
            .replace(/自治区$/g, '')
            .replace(/省$/g, '')
            .replace(/市$/g, '')
            .trim();
    }

    function compactRegion(path) {
        return String(path || '')
            .replace(/\s*\/\s*/g, '/')
            .trim();
    }

    function extractCityName(regionText) {
        var raw = String(regionText || '').trim();
        if (!raw) return '';
        if (CODE_RE.test(raw.toUpperCase())) return '';
        var parts = compactRegion(raw)
            .split('/')
            .map(function (s) {
                return s.trim();
            })
            .filter(Boolean);
        if (!parts.length) return '';
        var first = stripAdminSuffix(parts[0]);
        if (MUNICIPALITIES.indexOf(first) !== -1) return first;
        if (parts[1] && parts[1] !== '市辖区') return stripAdminSuffix(parts[1]);
        var names = Object.keys(CITY_CODES).sort(function (a, b) {
            return b.length - a.length;
        });
        for (var i = 0; i < names.length; i++) {
            if (raw.indexOf(names[i]) !== -1) return names[i];
        }
        return first;
    }

    function cityCodeOf(regionOrCity) {
        var raw = String(regionOrCity || '').trim();
        if (/^[A-Za-z]{3}$/.test(raw)) return raw.toUpperCase();
        var parsed = parseCode(raw);
        if (parsed) return parsed.cityCode;
        var name = extractCityName(raw);
        return (name && CITY_CODES[name]) || '';
    }

    function parseCode(code) {
        var m = String(code || '')
            .trim()
            .toUpperCase()
            .match(CODE_RE);
        if (!m) return null;
        return { cityCode: m[1], seq: parseInt(m[2], 10) };
    }

    function formatCode(cityCode, seq) {
        var cc = String(cityCode || '')
            .trim()
            .toUpperCase();
        if (!/^[A-Z]{3}$/.test(cc)) return '';
        return cc + pad5(seq);
    }

    function readSeqMap() {
        try {
            var raw = localStorage.getItem(SEQ_KEY);
            var data = raw ? JSON.parse(raw) : {};
            return data && typeof data === 'object' ? data : {};
        } catch (e) {
            return {};
        }
    }

    function writeSeqMap(map) {
        try {
            localStorage.setItem(SEQ_KEY, JSON.stringify(map || {}));
        } catch (e) {}
    }

    function collectExistingCodes(excludeCode) {
        var skip = String(excludeCode || '').trim().toUpperCase();
        var codes = [];
        var tbody = document.getElementById('tableBody');
        if (tbody) {
            tbody.querySelectorAll('tr').forEach(function (tr) {
                var td = tr.querySelector('td');
                var one = td ? String(td.textContent || '').trim() : '';
                if (one && one.toUpperCase() !== skip) codes.push(one);
            });
        }
        return codes;
    }

    function maxSeqForCity(cityCode, excludeCode) {
        var cc = String(cityCode || '')
            .trim()
            .toUpperCase();
        var max = 0;
        collectExistingCodes(excludeCode).forEach(function (code) {
            var p = parseCode(code);
            if (p && p.cityCode === cc && p.seq > max) max = p.seq;
        });
        var stored = parseInt(readSeqMap()[cc], 10) || 0;
        if (stored > max) max = stored;
        return max;
    }

    function peekNextCode(regionText, excludeCode) {
        var cityCode = cityCodeOf(regionText);
        if (!cityCode) return '';
        return formatCode(cityCode, maxSeqForCity(cityCode, excludeCode) + 1);
    }

    function allocateNextCode(regionText, excludeCode) {
        var cityCode = cityCodeOf(regionText);
        if (!cityCode) return '';
        var next = maxSeqForCity(cityCode, excludeCode) + 1;
        var map = readSeqMap();
        map[cityCode] = next;
        writeSeqMap(map);
        return formatCode(cityCode, next);
    }

    function migrateMapKeys(map) {
        if (!map || typeof map !== 'object') return false;
        var changed = false;
        Object.keys(LEGACY_ALIASES).forEach(function (oldId) {
            var newId = LEGACY_ALIASES[oldId];
            if (map[oldId] != null && map[newId] == null) {
                map[newId] = map[oldId];
                changed = true;
            }
        });
        return changed;
    }

    global.MdmStoreCode = {
        CITY_CODES: CITY_CODES,
        LEGACY_ALIASES: LEGACY_ALIASES,
        compactRegion: compactRegion,
        extractCityName: extractCityName,
        cityCodeOf: cityCodeOf,
        parseCode: parseCode,
        formatCode: formatCode,
        peekNextCode: peekNextCode,
        allocateNextCode: allocateNextCode,
        migrateMapKeys: migrateMapKeys
    };
})(window);
