/**
 * 进件地址：省市区 + 详细地址 拆分 / 拼接（OCR 回填后可手改）
 */
(function () {
    function compact(s) {
        return String(s == null ? '' : s).replace(/[\s\/]/g, '');
    }

    function normalizeRegion(s) {
        return String(s == null ? '' : s)
            .replace(/[／]/g, '/')
            .replace(/\s*\/\s*/g, ' / ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function regionTree() {
        return (window.MdmStoreRegionCascader && window.MdmStoreRegionCascader.REGION_TREE) || {};
    }

    function joinAddress(region, detail) {
        var r = compact(region);
        var d = String(detail == null ? '' : detail).trim();
        if (!r) return d;
        if (!d) return r;
        var dc = compact(d);
        if (dc.indexOf(r) === 0) return d;
        return r + d;
    }

    function splitByTree(full) {
        var raw = String(full == null ? '' : full).trim();
        var c = compact(raw);
        if (!c) return null;
        var tree = regionTree();
        var best = null;
        Object.keys(tree).forEach(function (p) {
            Object.keys(tree[p] || {}).forEach(function (city) {
                (tree[p][city] || []).forEach(function (d) {
                    var candidates = [compact(p + city + d), compact(p + d), compact(city + d)];
                    candidates.forEach(function (prefix) {
                        if (!prefix || c.indexOf(prefix) !== 0) return;
                        if (!best || prefix.length > best.len) {
                            best = {
                                region: p + ' / ' + city + ' / ' + d,
                                len: prefix.length
                            };
                        }
                    });
                });
            });
        });
        if (!best) return null;
        return {
            region: best.region,
            detail: raw.replace(/[\s\/]/g, '').slice(best.len)
        };
    }

    function splitByRegex(full) {
        var raw = String(full == null ? '' : full).replace(/\s+/g, '');
        var m = raw.match(
            /^((?:[\u4e00-\u9fa5]{2,}(?:省|自治区|特别行政区))?[\u4e00-\u9fa5]{2,}(?:市|州|地区)(?:市辖区)?[\u4e00-\u9fa5]{2,}(?:区|县|市|旗))(.*)$/
        );
        if (!m) return null;
        var head = m[1];
        var prov = '';
        var rest = head;
        var pm = rest.match(/^([\u4e00-\u9fa5]{2,}(?:省|自治区|特别行政区))/);
        if (pm) {
            prov = pm[1];
            rest = rest.slice(prov.length);
        }
        var cm = rest.match(/^([\u4e00-\u9fa5]{2,}(?:市|州|地区)|市辖区)/);
        var city = cm ? cm[1] : '';
        var district = city ? rest.slice(city.length) : rest;
        var region = [prov, city, district].filter(Boolean).join(' / ');
        return { region: region, detail: m[2] || '' };
    }

    function splitAddress(full, regionHint, detailHint) {
        var region = normalizeRegion(regionHint);
        var detail = String(detailHint == null ? '' : detailHint).trim();
        if (region || detail) {
            return {
                region: region,
                detail: detail,
                full: joinAddress(region, detail) || String(full || '').trim()
            };
        }
        var raw = String(full == null ? '' : full).trim();
        if (!raw) return { region: '', detail: '', full: '' };
        if (raw.indexOf('/') !== -1) {
            var parts = raw.split('/').map(function (s) {
                return s.trim();
            }).filter(Boolean);
            if (parts.length >= 3) {
                return {
                    region: parts.slice(0, 3).join(' / '),
                    detail: parts.slice(3).join(''),
                    full: raw
                };
            }
        }
        var parsed = splitByTree(raw) || splitByRegex(raw);
        if (parsed) {
            return {
                region: normalizeRegion(parsed.region),
                detail: String(parsed.detail || '').trim(),
                full: joinAddress(parsed.region, parsed.detail) || raw
            };
        }
        return { region: '', detail: raw, full: raw };
    }

    window.MdmOnboardAddress = {
        compact: compact,
        normalizeRegion: normalizeRegion,
        joinAddress: joinAddress,
        splitAddress: splitAddress
    };
})();
