/* 初审通过时按需求单维护结算比例：渠道 + 商品类目，每个渠道一条兜底利率。 */
(function () {
    var CHANNELS = ['POS', '直播', '商城'];
    var CATEGORIES = ['新鲜蔬菜', '时令水果', '粮油调味', '肉禽蛋品'];
    var SKU_CATEGORY = {
        SKU10001: '时令水果',
        SKU10002: '新鲜蔬菜',
        SKU10003: '肉禽蛋品',
        SKU10004: '新鲜蔬菜',
        SKU10005: '时令水果',
        SKU10006: '时令水果',
        SKU10007: '肉禽蛋品',
        SKU10008: '新鲜蔬菜',
        SKU10009: '粮油调味',
        SKU10010: '新鲜蔬菜',
        SKU10011: '肉禽蛋品',
        SKU10012: '新鲜蔬菜'
    };

    function parseRatio(value) {
        var text = String(value == null ? '' : value).replace(/%/g, '').trim();
        if (!text) return '';
        if (!/^\d+(\.\d+)?$/.test(text)) return '';
        var num = Number(text);
        if (!isFinite(num) || num <= 0 || num > 100) return '';
        return num.toFixed(2);
    }

    function categoryOfSku(skuOrCode) {
        if (skuOrCode && typeof skuOrCode === 'object') {
            var named = String(skuOrCode.category || '').trim();
            if (named) return named;
            return SKU_CATEGORY[skuOrCode.code] || '';
        }
        return SKU_CATEGORY[skuOrCode] || '';
    }

    function categoriesOfDemand(demand) {
        var seen = {};
        var list = [];
        ((demand && demand.skus) || []).forEach(function (sku) {
            var name = categoryOfSku(sku);
            if (!name || seen[name]) return;
            seen[name] = true;
            list.push(name);
        });
        return list;
    }

    function esc(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /* 每个渠道先用自己维护的类目。本单商品类目这个渠道没单独填时，按该渠道兜底利率补上。 */
    function viewOf(item) {
        if (!item || item.repayMethod !== '比例付' || !item.settleRatios || !item.settleRatios.length) return null;
        var demandCategories = categoriesOfDemand(item);
        return item.settleRatios.map(function (channel) {
            var categories = [];
            var seen = {};
            (channel.rows || []).forEach(function (row) {
                var name = String(row && row.category || '').trim();
                var ratio = parseRatio(row && row.ratio);
                if (!name || !ratio || seen[name]) return;
                seen[name] = true;
                categories.push({ name: name, ratio: ratio });
            });
            demandCategories.forEach(function (name) {
                if (seen[name] || !channel.fallback) return;
                seen[name] = true;
                categories.push({ name: name, ratio: channel.fallback });
            });
            return {
                channel: channel.channel,
                fallback: channel.fallback,
                categories: categories
            };
        });
    }

    function textLines(item) {
        var view = viewOf(item);
        if (!view) return '';
        return view.map(function (channel) {
            var cats = channel.categories.map(function (cat) {
                return cat.name + ' ' + cat.ratio + '%';
            }).join('、');
            return channel.channel + '：兜底 ' + channel.fallback + '%' + (cats ? '，' + cats : '');
        }).join('\n');
    }

    function tableHtml(item) {
        var view = viewOf(item);
        if (!view || !view.length) return '';
        var head = '<tr><th>渠道</th><th class="is-money">兜底利率</th><th>商品类目</th><th class="is-money">类目结算比例</th></tr>';
        var body = view.map(function (channel) {
            var cats = channel.categories || [];
            if (!cats.length) {
                return '<tr><td>' + esc(channel.channel) + '</td><td class="is-money">' + esc(channel.fallback) + '%</td><td>—</td><td class="is-money">—</td></tr>';
            }
            return cats.map(function (cat, index) {
                var lead = index === 0
                    ? '<td rowspan="' + cats.length + '">' + esc(channel.channel) + '</td><td class="is-money" rowspan="' + cats.length + '">' + esc(channel.fallback) + '%</td>'
                    : '';
                return '<tr>' + lead + '<td>' + esc(cat.name) + '</td><td class="is-money">' + esc(cat.ratio) + '%</td></tr>';
            }).join('');
        }).join('');
        return '<div class="rbt-demand-table-wrap"><table class="rbt-demand-table"><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>';
    }

    function renderHtml(item) {
        var view = viewOf(item);
        if (!view) return '';
        var body = view.map(function (channel) {
            var cats = channel.categories.map(function (cat) {
                return '<span class="rbt-ratio__cat"><b>' + esc(cat.name) + '</b>' + esc(cat.ratio) + '%</span>';
            }).join('');
            return '<tr><td>' + esc(channel.channel) + '</td><td>' + esc(channel.fallback) + '%</td><td>' + (cats || '—') + '</td></tr>';
        }).join('');
        return '<table class="rbt-ratio"><thead><tr><th>渠道</th><th>兜底利率</th><th>商品类目</th></tr></thead><tbody>' + body + '</tbody></table>';
    }

    function ensureStyle() {
        if (document.getElementById('rbt-ratio-style')) return;
        var style = document.createElement('style');
        style.id = 'rbt-ratio-style';
        style.textContent = [
            '.rbt-ratio{width:100%;border-collapse:collapse;font-size:12px;line-height:1.45;background:transparent;}',
            '.rbt-ratio th{padding:0 10px 4px 0;font-weight:500;color:#909399;text-align:left;white-space:nowrap;}',
            '.rbt-ratio td{padding:3px 10px 3px 0;vertical-align:top;color:#303133;white-space:normal;}',
            '.rbt-ratio td:first-child{font-weight:600;color:#606266;white-space:nowrap;}',
            '.rbt-ratio td:nth-child(2){white-space:nowrap;}',
            '.rbt-ratio__cat{display:inline-flex;align-items:center;margin:0 8px 4px 0;padding:0 8px;height:22px;border-radius:4px;background:#f5f7fa;white-space:nowrap;}',
            '.rbt-ratio__cat b{margin-right:4px;font-weight:500;color:#606266;}',
            '.el-table .cell:has(.rbt-ratio){overflow:visible;text-overflow:clip;white-space:normal;line-height:normal;}'
        ].join('');
        document.head.appendChild(style);
    }

    /* 只保留三个渠道。兜底利率必填；类目比例可空，空的不写入。 */
    function normalize(list) {
        if (!Array.isArray(list)) return null;
        var next = [];
        var ok = CHANNELS.every(function (channel) {
            var found = null;
            list.some(function (item) {
                if (item && item.channel === channel) {
                    found = item;
                    return true;
                }
                return false;
            });
            var fallback = parseRatio(found && found.fallback);
            if (!fallback) return false;
            var rows = [];
            var seen = {};
            ((found && found.rows) || []).forEach(function (row) {
                var category = String(row && row.category || '').trim();
                var ratio = parseRatio(row && row.ratio);
                if (!category || !ratio || seen[category]) return;
                seen[category] = true;
                rows.push({ category: category, ratio: ratio });
            });
            next.push({ channel: channel, fallback: fallback, rows: rows });
            return true;
        });
        return ok ? next : null;
    }

    /* 只有初审维护过才有结算比例。发布时不带。 */
    function textOf(item) {
        if (!item || item.repayMethod !== '比例付') return '';
        if (!item.settleRatios || !item.settleRatios.length) return '';
        return summary(item.settleRatios);
    }

    function summary(list) {
        if (!list || !list.length) return '';
        return list.map(function (channel) {
            var parts = ['兜底 ' + channel.fallback + '%'];
            (channel.rows || []).forEach(function (row) {
                parts.push(row.category + ' ' + row.ratio + '%');
            });
            return channel.channel + ' ' + parts.join('，');
        }).join('；');
    }

    window.RbtSettleRatio = {
        CHANNELS: CHANNELS.slice(),
        CATEGORIES: CATEGORIES.slice(),
        parseRatio: parseRatio,
        categoryOfSku: categoryOfSku,
        categoriesOfDemand: categoriesOfDemand,
        normalize: normalize,
        summary: summary,
        textOf: textOf,
        viewOf: viewOf,
        textLines: textLines,
        tableHtml: tableHtml,
        renderHtml: function (item) {
            ensureStyle();
            return renderHtml(item);
        },
        categoryOptions: function () {
            var names = [];
            var seen = {};
            function push(name) {
                name = String(name || '').trim();
                if (!name || seen[name]) return;
                seen[name] = true;
                names.push(name);
            }
            var catalog = window.MdmProductCatalog;
            if (catalog && typeof catalog.getCategories === 'function') {
                catalog.getCategories().forEach(function (item) {
                    push(item && (item.name || item.id));
                });
            }
            if (!names.length) CATEGORIES.forEach(push);
            return names;
        }
    };
})();
