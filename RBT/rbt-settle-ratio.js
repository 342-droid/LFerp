/* 初审通过时按需求单维护结算比例：渠道 + 商品类目，每个渠道一条默认比例。 */
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

    /* 每个渠道先用自己维护的类目。本单商品类目这个渠道没单独填时，按该渠道默认比例补上。 */
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
            return channel.channel + '：默认比例 ' + channel.fallback + '%' + (cats ? '，' + cats : '');
        }).join('\n');
    }

    function tableHtml(item) {
        var view = viewOf(item);
        if (!view || !view.length) return '';
        var head = '<tr><th>渠道</th><th class="is-money">默认比例</th><th>商品类目</th><th class="is-money">类目结算比例</th></tr>';
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
        return '<table class="rbt-ratio"><thead><tr><th>渠道</th><th>默认比例</th><th>商品类目</th></tr></thead><tbody>' + body + '</tbody></table>';
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

    /* 只保留三个渠道。默认比例必填；类目比例可空，空的不写入。 */
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
            var parts = ['默认比例 ' + channel.fallback + '%'];
            (channel.rows || []).forEach(function (row) {
                parts.push(row.category + ' ' + row.ratio + '%');
            });
            return channel.channel + ' ' + parts.join('，');
        }).join('；');
    }

    var EDITABLE_STATUSES = ['待接单', '待确认签约', '待签署', '待复核', '支付中'];

    function canEdit(item) {
        return !!(item && EDITABLE_STATUSES.indexOf(item.status) >= 0);
    }

    function emptyDraft() {
        var draft = {};
        CHANNELS.forEach(function (channel) {
            draft[channel] = { fallback: '', rows: [] };
        });
        return draft;
    }

    function draftFrom(item) {
        var draft = emptyDraft();
        ((item && item.settleRatios) || []).forEach(function (channel) {
            if (!channel || !draft[channel.channel]) return;
            draft[channel.channel] = {
                fallback: channel.fallback || '',
                rows: (channel.rows || []).map(function (row) {
                    return { category: row.category, ratio: row.ratio };
                })
            };
        });
        return draft;
    }

    function syncEditor(host, draft) {
        if (!host || !draft) return;
        CHANNELS.forEach(function (channel) {
            if (!draft[channel]) draft[channel] = { fallback: '', rows: [] };
            var fallback = host.querySelector('[data-pass-fallback="' + channel + '"]');
            if (fallback) draft[channel].fallback = fallback.value;
            host.querySelectorAll('[data-pass-row="' + channel + '"]').forEach(function (input) {
                var index = Number(input.getAttribute('data-index'));
                if (draft[channel].rows[index]) draft[channel].rows[index].ratio = input.value;
            });
        });
    }

    function renderEditor(host, draft) {
        if (!host || !draft) return;
        var options = '<option value="">请选择类目</option>' + categoryOptions().map(function (name) {
            return '<option value="' + esc(name) + '">' + esc(name) + '</option>';
        }).join('');
        host.innerHTML = CHANNELS.map(function (channel) {
            var item = draft[channel] || { fallback: '', rows: [] };
            var rows = (item.rows || []).map(function (row, index) {
                return '<div class="rbt-pass-field"><span class="rbt-pass-label">' + esc(row.category) + '</span><input data-pass-row="' + esc(channel) + '" data-index="' + index + '" value="' + esc(row.ratio) + '" inputmode="decimal" placeholder="请输入"><span>%</span><button type="button" class="rbt-pass-del" data-pass-del="' + esc(channel) + '" data-index="' + index + '">删除</button></div>';
            }).join('');
            return '<div class="rbt-pass-channel"><h3>' + esc(channel) + '</h3>' +
                '<div class="rbt-pass-field"><span class="rbt-pass-label">默认比例</span><input data-pass-fallback="' + esc(channel) + '" value="' + esc(item.fallback) + '" inputmode="decimal" placeholder="请输入"><span>%</span></div>' +
                '<div class="rbt-pass-field"><span class="rbt-pass-label">商品类目</span><select data-pass-pick="' + esc(channel) + '">' + options + '</select><input data-pass-new="' + esc(channel) + '" inputmode="decimal" placeholder="请输入"><span>%</span><button type="button" class="btn btn-secondary" data-pass-add="' + esc(channel) + '">添加</button></div>' +
                rows +
                '<div class="rbt-review-note">需要按类目区分时再添加。未添加的类目使用默认比例。</div></div>';
        }).join('');
    }

    function addEditorRow(host, draft, channel, toastFn) {
        syncEditor(host, draft);
        var pick = host.querySelector('[data-pass-pick="' + channel + '"]');
        var ratioInput = host.querySelector('[data-pass-new="' + channel + '"]');
        var category = pick ? pick.value : '';
        var ratio = parseRatio(ratioInput && ratioInput.value);
        if (!category) {
            if (toastFn) toastFn('请选择商品类目', 'error');
            return;
        }
        if ((draft[channel].rows || []).some(function (row) { return row.category === category; })) {
            if (toastFn) toastFn('该渠道已添加「' + category + '」', 'error');
            return;
        }
        if (!ratio) {
            if (toastFn) toastFn('类目结算比例须大于 0 且不超过 100', 'error');
            return;
        }
        draft[channel].rows.push({ category: category, ratio: ratio });
        renderEditor(host, draft);
    }

    function removeEditorRow(host, draft, channel, index) {
        syncEditor(host, draft);
        if (draft[channel]) draft[channel].rows.splice(index, 1);
        renderEditor(host, draft);
    }

    function collectEditor(host, draft) {
        if (!draft) return null;
        syncEditor(host, draft);
        var invalid = false;
        var list = CHANNELS.map(function (channel) {
            var item = draft[channel] || { fallback: '', rows: [] };
            var fallback = parseRatio(item.fallback);
            if (String(item.fallback || '').trim() && !fallback) invalid = true;
            if (!fallback) invalid = true;
            var rows = [];
            (item.rows || []).forEach(function (row) {
                var ratio = parseRatio(row.ratio);
                if (!row.category || !ratio) {
                    invalid = true;
                    return;
                }
                rows.push({ category: row.category, ratio: ratio });
            });
            return { channel: channel, fallback: fallback, rows: rows };
        });
        if (invalid) return null;
        return normalize(list);
    }

    function bindEditor(host, getDraft, toastFn) {
        if (!host || host.getAttribute('data-rbt-ratio-editor') === '1') return;
        host.setAttribute('data-rbt-ratio-editor', '1');
        host.addEventListener('click', function (event) {
            var draft = getDraft && getDraft();
            if (!draft) return;
            var add = event.target.closest('[data-pass-add]');
            var del = event.target.closest('[data-pass-del]');
            if (add) addEditorRow(host, draft, add.getAttribute('data-pass-add'), toastFn);
            if (del) removeEditorRow(host, draft, del.getAttribute('data-pass-del'), Number(del.getAttribute('data-index')));
        });
    }

    function toast(message, type) {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type || 'success');
            return;
        }
        window.alert(message);
    }

    function closeEditor() {
        document.querySelectorAll('[data-rbt-ratio-edit-modal]').forEach(function (node) {
            node.remove();
        });
        document.removeEventListener('keydown', onEditorKey);
    }

    function onEditorKey(event) {
        if (event.key !== 'Escape') return;
        event.stopPropagation();
        closeEditor();
    }

    function openEditor(item, options) {
        var dataApi = window.RbtDemandData;
        var demand = dataApi && item && item.code && typeof dataApi.get === 'function' ? dataApi.get(item.code) : item;
        if (!canEdit(demand)) {
            toast('当前状态不可修改结算比例', 'error');
            return;
        }
        ensureEditorStyle();
        closeEditor();
        var draft = draftFrom(demand);
        var mask = document.createElement('div');
        mask.className = 'rbt-demand-contract-mask';
        mask.setAttribute('data-rbt-ratio-edit-modal', '1');
        mask.innerHTML =
            '<div class="rbt-demand-contract rbt-ratio-dialog" role="dialog" aria-modal="true" aria-label="修改结算比例">' +
            '<div class="rbt-demand-contract__head">' +
            '<div><div class="rbt-demand-contract__eyebrow">修改结算比例</div>' +
            '<div class="rbt-demand-contract__title">' + esc(demand.code) + '</div>' +
            '<div class="rbt-demand-contract__meta">' + esc(demand.storeName || '') + ' · ' + esc(demand.status || '') + '</div></div>' +
            '<button type="button" class="rbt-demand-contract__close" data-rbt-ratio-edit-close aria-label="关闭">&times;</button></div>' +
            '<div class="rbt-ratio-dialog__body rbt-review-body" data-rbt-ratio-edit-form></div>' +
            '<div class="rbt-review-foot"><button type="button" class="btn btn-secondary" data-rbt-ratio-edit-close>取消</button>' +
            '<button type="button" class="btn btn-primary" data-rbt-ratio-edit-save>保存</button></div></div>';
        document.body.appendChild(mask);
        var host = mask.querySelector('[data-rbt-ratio-edit-form]');
        renderEditor(host, draft);
        bindEditor(host, function () { return draft; }, toast);
        mask.addEventListener('click', function (event) {
            if (event.target === mask || event.target.closest('[data-rbt-ratio-edit-close]')) closeEditor();
            var save = event.target.closest('[data-rbt-ratio-edit-save]');
            if (!save) return;
            var settleRatios = collectEditor(host, draft);
            if (!settleRatios) {
                toast('每个渠道都要填写默认比例；已填的类目比例须大于 0 且不超过 100', 'error');
                return;
            }
            var saved = dataApi && typeof dataApi.updateSettleRatios === 'function'
                ? dataApi.updateSettleRatios(demand.code, settleRatios, '王丽')
                : null;
            if (!saved) {
                toast('保存失败', 'error');
                return;
            }
            closeEditor();
            toast('结算比例已更新');
            if (options && typeof options.onSaved === 'function') options.onSaved(saved);
        });
        document.addEventListener('keydown', onEditorKey);
    }

    function categoryOptions() {
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

    function ensureEditorStyle() {
        if (document.getElementById('rbt-ratio-editor-style')) return;
        var style = document.createElement('style');
        style.id = 'rbt-ratio-editor-style';
        style.textContent = [
            '.rbt-pass-channel{margin-top:14px;padding-top:12px;border-top:1px solid #f0f0f0;}',
            '.rbt-pass-channel:first-child{margin-top:0;padding-top:0;border-top:0;}',
            '.rbt-pass-channel h3{margin:0 0 8px;font-size:14px;color:#303133;}',
            '.rbt-pass-field{display:flex;align-items:center;gap:8px;margin-top:8px;}',
            '.rbt-pass-field input,.rbt-pass-field select{height:36px;border:1px solid #dcdfe6;border-radius:4px;padding:0 10px;font:inherit;font-size:13px;background:#fff;}',
            '.rbt-pass-field input{width:120px;}',
            '.rbt-pass-field select{width:160px;}',
            '.rbt-pass-label{width:88px;text-align:right;color:#333;font-size:13px;}',
            '.rbt-pass-del{border:0;background:transparent;color:#cf1322;cursor:pointer;font-size:13px;padding:0;}',
            '.rbt-review-note{margin-top:6px;color:#909399;font-size:12px;}',
            '.rbt-review-foot{display:flex;justify-content:flex-end;gap:8px;padding:12px 20px 16px;border-top:1px solid #ebeef5;}',
            '.supplier-detail-section-title .rbt-demand-contract-link{margin-left:12px;font-weight:400;font-size:13px;}'
        ].join('');
        document.head.appendChild(style);
    }

    window.RbtSettleRatio = {
        CHANNELS: CHANNELS.slice(),
        CATEGORIES: CATEGORIES.slice(),
        EDITABLE_STATUSES: EDITABLE_STATUSES.slice(),
        parseRatio: parseRatio,
        categoryOfSku: categoryOfSku,
        categoriesOfDemand: categoriesOfDemand,
        normalize: normalize,
        summary: summary,
        textOf: textOf,
        viewOf: viewOf,
        textLines: textLines,
        tableHtml: tableHtml,
        canEdit: canEdit,
        emptyDraft: emptyDraft,
        draftFrom: draftFrom,
        renderEditor: renderEditor,
        collectEditor: collectEditor,
        bindEditor: bindEditor,
        openEditor: openEditor,
        closeEditor: closeEditor,
        renderHtml: function (item) {
            ensureStyle();
            return renderHtml(item);
        },
        categoryOptions: categoryOptions
    };
})();
