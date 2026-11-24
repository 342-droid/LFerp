/* 产品配置和需求单都按渠道维护默认比例。POS 可再加堂食、外卖、团购，各自单独比例。不再按商品类目配置。 */
(function () {
    var CHANNELS = ['POS', '直播', '商城'];
    var POS_SUBS = ['堂食', '外卖', '团购'];
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

    /* 按渠道展示默认比例。只有 POS 可以带堂食、外卖、团购。 */
    function viewOf(item) {
        if (!item || item.repayMethod !== '比例付' || !item.settleRatios || !item.settleRatios.length) return null;
        return item.settleRatios.map(function (channel) {
            return {
                channel: channel.channel,
                fallback: channel.fallback,
                subs: copySubs(channel.channel, channel.subs)
            };
        });
    }

    function textLines(item) {
        var view = viewOf(item);
        if (!view) return '';
        return view.map(function (channel) {
            var subs = channel.subs.map(function (sub) {
                return sub.name + ' ' + sub.ratio + '%';
            }).join('，');
            return channel.channel + '：默认比例 ' + channel.fallback + '%' + (subs ? '，' + subs : '');
        }).join('\n');
    }

    function tableHtml(item) {
        var view = viewOf(item);
        if (!view || !view.length) return '';
        var head = '<tr><th>渠道</th><th class="is-money">默认比例</th><th>二级渠道</th><th class="is-money">二级渠道比例</th></tr>';
        var body = view.map(function (channel) {
            var subs = channel.subs || [];
            if (!subs.length) {
                return '<tr><td>' + esc(channel.channel) + '</td><td class="is-money">' + esc(channel.fallback) + '%</td><td>—</td><td class="is-money">—</td></tr>';
            }
            return subs.map(function (sub, index) {
                var lead = index === 0
                    ? '<td rowspan="' + subs.length + '">' + esc(channel.channel) + '</td><td class="is-money" rowspan="' + subs.length + '">' + esc(channel.fallback) + '%</td>'
                    : '';
                return '<tr>' + lead + '<td>' + esc(sub.name) + '</td><td class="is-money">' + esc(sub.ratio) + '%</td></tr>';
            }).join('');
        }).join('');
        return '<div class="rbt-demand-table-wrap"><table class="rbt-demand-table"><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>';
    }

    function renderHtml(item) {
        if (!item || item.repayMethod !== '比例付' || !item.settleRatios || !item.settleRatios.length) return '';
        ensureStyle();
        var plain = item.settleRatios.map(function (channel) {
            var subs = copySubs(channel.channel, channel.subs).map(function (sub) {
                return esc(sub.name) + ' ' + esc(sub.ratio) + '%';
            }).join('；');
            var ratio = esc(channel.fallback) + '%' + (subs ? '；' + subs : '');
            return '<tr><td>' + esc(channel.channel) + '</td><td>' + ratio + '</td></tr>';
        }).join('');
        return '<table class="rbt-ratio"><thead><tr><th>渠道</th><th>结算比例</th></tr></thead><tbody>' + plain + '</tbody></table>';
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

    /* 只保留三个渠道的默认比例。POS 可带二级渠道，不再写入商品类目比例。 */
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
            next.push({ channel: channel, fallback: fallback, rows: [], subs: copySubs(channel, found && found.subs) });
            return true;
        });
        return ok ? next : null;
    }

    /* 发布需求时从产品配置抄到需求单。没有这份比例时不展示。 */
    function textOf(item) {
        if (!item || item.repayMethod !== '比例付') return '';
        if (!item.settleRatios || !item.settleRatios.length) return '';
        return summary(item.settleRatios);
    }

    function summary(list) {
        if (!list || !list.length) return '';
        return list.map(function (channel) {
            var parts = ['默认比例 ' + channel.fallback + '%'];
            copySubs(channel.channel, channel.subs).forEach(function (sub) {
                parts.push(sub.name + ' ' + sub.ratio + '%');
            });
            return channel.channel + ' ' + parts.join('，');
        }).join('；');
    }

    var EDITABLE_STATUSES = ['待接单', '待确认签约', '待签署', '发货中', '门店付款中'];

    function canEdit(item) {
        return !!(item && EDITABLE_STATUSES.indexOf(item.status) >= 0);
    }

    function emptyDraft() {
        var draft = {};
        CHANNELS.forEach(function (channel) {
            draft[channel] = { fallback: '', rows: [], subs: [] };
        });
        return draft;
    }

    function draftFrom(item) {
        var draft = emptyDraft();
        ((item && item.settleRatios) || []).forEach(function (channel) {
            if (!channel || !draft[channel.channel]) return;
            draft[channel.channel] = {
                fallback: channel.fallback || '',
                rows: [],
                subs: channel.channel === 'POS' ? copySubs('POS', channel.subs) : []
            };
        });
        return draft;
    }

    function syncEditor(host, draft) {
        if (!host || !draft) return;
        CHANNELS.forEach(function (channel) {
            if (!draft[channel]) draft[channel] = { fallback: '', rows: [], subs: [] };
            var fallback = host.querySelector('[data-pass-fallback="' + channel + '"]');
            if (fallback) draft[channel].fallback = fallback.value;
        });
        if (!draft.POS) draft.POS = { fallback: '', rows: [], subs: [] };
        host.querySelectorAll('[data-pass-sub]').forEach(function (input) {
            var index = Number(input.getAttribute('data-index'));
            if (draft.POS.subs[index]) draft.POS.subs[index].ratio = input.value;
        });
    }

    function renderEditor(host, draft) {
        if (!host || !draft) return;
        var used = {};
        ((draft.POS && draft.POS.subs) || []).forEach(function (row) {
            if (row && row.name) used[row.name] = true;
        });
        var options = '<option value="">请选择</option>' + POS_SUBS.filter(function (name) {
            return !used[name];
        }).map(function (name) {
            return '<option value="' + esc(name) + '">' + esc(name) + '</option>';
        }).join('');
        host.innerHTML = CHANNELS.map(function (channel) {
            var item = draft[channel] || { fallback: '', subs: [] };
            var pos = '';
            if (channel === 'POS') {
                var rows = (item.subs || []).map(function (row, index) {
                    return '<div class="rbt-pass-field"><span class="rbt-pass-label">' + esc(row.name) + '</span><input data-pass-sub="1" data-index="' + index + '" value="' + esc(row.ratio) + '" inputmode="decimal" placeholder="请输入"><span>%</span><button type="button" class="rbt-pass-del" data-pass-del="' + index + '">删除</button></div>';
                }).join('');
                pos = '<div class="rbt-pass-field"><span class="rbt-pass-label">二级渠道</span><select data-pass-pick>' + options + '</select><input data-pass-new inputmode="decimal" placeholder="请输入"><span>%</span><button type="button" class="btn btn-secondary" data-pass-add>添加</button></div>' +
                    rows +
                    '<div class="rbt-review-note">堂食、外卖、团购需要单独比例时再添加。没单独配置的金额用 POS 默认比例。同一二级渠道只加一条。</div>';
            }
            return '<div class="rbt-pass-channel"><h3>' + esc(channel) + '</h3>' +
                '<div class="rbt-pass-field"><span class="rbt-pass-label">默认比例</span><input data-pass-fallback="' + esc(channel) + '" value="' + esc(item.fallback) + '" inputmode="decimal" placeholder="请输入"><span>%</span></div>' +
                pos + '</div>';
        }).join('');
    }

    function addPosSub(host, draft, toastFn) {
        syncEditor(host, draft);
        if (!draft.POS) draft.POS = { fallback: '', rows: [], subs: [] };
        var pick = host.querySelector('[data-pass-pick]');
        var ratioInput = host.querySelector('[data-pass-new]');
        var name = pick ? pick.value : '';
        var ratio = parseRatio(ratioInput && ratioInput.value);
        if (!name) {
            if (toastFn) toastFn('请选择二级渠道', 'error');
            return;
        }
        if ((draft.POS.subs || []).some(function (row) { return row.name === name; })) {
            if (toastFn) toastFn('该二级渠道已添加', 'error');
            return;
        }
        if (!ratio) {
            if (toastFn) toastFn('二级渠道比例须大于 0 且不超过 100', 'error');
            return;
        }
        draft.POS.subs.push({ name: name, ratio: ratio });
        renderEditor(host, draft);
    }

    function removePosSub(host, draft, index) {
        syncEditor(host, draft);
        if (draft.POS && draft.POS.subs) draft.POS.subs.splice(index, 1);
        renderEditor(host, draft);
    }

    /* 产品配置表单直接改草稿，不经过审核弹窗里的输入框。 */
    function collectDraft(draft) {
        if (!draft) return null;
        var invalid = false;
        var list = CHANNELS.map(function (channel) {
            var item = draft[channel] || { fallback: '', rows: [], subs: [] };
            var fallback = parseRatio(item.fallback);
            if (!fallback) invalid = true;
            return { channel: channel, fallback: fallback, rows: [], subs: takenSubs(channel, item.subs, function () { invalid = true; }) };
        });
        if (invalid) return null;
        return normalize(list);
    }

    function collectEditor(host, draft) {
        if (!draft) return null;
        syncEditor(host, draft);
        var invalid = false;
        var list = CHANNELS.map(function (channel) {
            var item = draft[channel] || { fallback: '', rows: [], subs: [] };
            var fallback = parseRatio(item.fallback);
            if (String(item.fallback || '').trim() && !fallback) invalid = true;
            if (!fallback) invalid = true;
            return { channel: channel, fallback: fallback, rows: [], subs: takenSubs(channel, item.subs, function () { invalid = true; }) };
        });
        if (invalid) return null;
        return normalize(list);
    }

    /* POS 二级渠道只收堂食、外卖、团购。同一名称只留一条，比例不合法的丢掉。 */
    function copySubs(channel, list) {
        if (channel !== 'POS' || !Array.isArray(list)) return [];
        var seen = {};
        var subs = [];
        list.forEach(function (row) {
            var name = String(row && row.name || '').trim();
            var ratio = parseRatio(row && row.ratio);
            if (POS_SUBS.indexOf(name) < 0 || !ratio || seen[name]) return;
            seen[name] = true;
            subs.push({ name: name, ratio: ratio });
        });
        return subs;
    }

    function takenSubs(channel, list, onInvalid) {
        if (channel !== 'POS') return [];
        var seen = {};
        var subs = [];
        (list || []).forEach(function (row) {
            var name = String(row && row.name || '').trim();
            var ratio = parseRatio(row && row.ratio);
            if (POS_SUBS.indexOf(name) < 0 || !ratio || seen[name]) {
                if (onInvalid) onInvalid();
                return;
            }
            seen[name] = true;
            subs.push({ name: name, ratio: ratio });
        });
        return subs;
    }

    function bindEditor(host, getDraft, toastFn) {
        if (!host || host.getAttribute('data-rbt-ratio-editor') === '1') return;
        host.setAttribute('data-rbt-ratio-editor', '1');
        host.addEventListener('click', function (event) {
            var draft = getDraft && getDraft();
            if (!draft) return;
            var add = event.target.closest('[data-pass-add]');
            var del = event.target.closest('[data-pass-del]');
            if (add) addPosSub(host, draft, toastFn);
            if (del) removePosSub(host, draft, Number(del.getAttribute('data-pass-del')));
        });
    }

    function statusText(item) {
        var daily = window.RbtDailyFulfill;
        if (daily && typeof daily.phaseLabel === 'function' && item && (item.status === '还款中' || item.status === '已完成')) {
            return daily.phaseLabel(item.status);
        }
        return (item && item.status) || '';
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
            '<div class="rbt-demand-contract__meta">' + esc(demand.storeName || '') + ' · ' + esc(statusText(demand)) + '</div></div>' +
            '<button type="button" class="rbt-demand-contract__close" data-rbt-ratio-edit-close aria-label="关闭">&times;</button></div>' +
            '<div class="rbt-ratio-dialog__body rbt-review-body">' +
            '<div data-rbt-ratio-edit-form></div>' +
            '<label class="rbt-ratio-reason"><span class="rbt-ratio-reason__label"><i>*</i>修改原因</span>' +
            '<textarea data-rbt-ratio-reason maxlength="100" placeholder="请填写修改原因"></textarea></label></div>' +
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
                toast('每个渠道都要填写默认比例；已填的二级渠道比例须大于 0 且不超过 100', 'error');
                return;
            }
            var reasonInput = mask.querySelector('[data-rbt-ratio-reason]');
            var reason = reasonInput ? String(reasonInput.value || '').trim() : '';
            if (!reason) {
                toast('请填写修改原因', 'error');
                if (reasonInput) reasonInput.focus();
                return;
            }
            if (reason.length > 100) {
                toast('修改原因不超过 100 个字', 'error');
                return;
            }
            if (summary(demand.settleRatios) === summary(settleRatios)) {
                toast('结算比例没有变化', 'error');
                return;
            }
            var saved = dataApi && typeof dataApi.updateSettleRatios === 'function'
                ? dataApi.updateSettleRatios(demand.code, settleRatios, '王丽', reason)
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

    function ensureDialogChrome() {
        if (document.getElementById('rbt-ratio-dialog-style')) return;
        var style = document.createElement('style');
        style.id = 'rbt-ratio-dialog-style';
        style.textContent = [
            '.rbt-demand-contract-link{border:0;padding:0;background:transparent;color:#1677ff;cursor:pointer;font:inherit;text-align:left;}',
            '.rbt-demand-contract-link:hover{text-decoration:underline;}',
            '.rbt-demand-contract-mask{position:fixed;inset:0;z-index:2400;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:24px;}',
            '.rbt-demand-contract{width:min(760px,96vw);max-height:min(86vh,920px);background:#fff;border-radius:10px;box-shadow:0 16px 48px rgba(0,0,0,.18);display:flex;flex-direction:column;overflow:hidden;}',
            '.rbt-demand-contract__head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:18px 20px 14px;border-bottom:1px solid #ebeef5;}',
            '.rbt-demand-contract__eyebrow{color:#909399;font-size:12px;margin-bottom:4px;}',
            '.rbt-demand-contract__title{font-size:18px;font-weight:600;color:#303133;line-height:1.4;}',
            '.rbt-demand-contract__meta{margin-top:4px;color:#606266;font-size:13px;}',
            '.rbt-demand-contract__close{border:0;background:transparent;color:#909399;font-size:24px;line-height:1;cursor:pointer;padding:0 2px;}',
            '.rbt-demand-contract__close:hover{color:#303133;}',
            '.rbt-ratio-dialog{width:min(840px,96vw);}',
            '.rbt-ratio-dialog__body{padding:16px 20px 20px;overflow:auto;}',
            '.supplier-detail-section-title .rbt-demand-contract-link{margin-left:12px;font-weight:400;font-size:13px;}'
        ].join('');
        document.head.appendChild(style);
    }

    function ensureEditorStyle() {
        ensureDialogChrome();
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
            '.rbt-ratio-reason{display:block;margin-top:16px;padding-top:14px;border-top:1px solid #f0f0f0;}',
            '.rbt-ratio-reason__label{display:block;margin-bottom:8px;color:#303133;font-size:13px;}',
            '.rbt-ratio-reason__label i{margin-right:4px;color:#f56c6c;font-style:normal;}',
            '.rbt-ratio-reason textarea{width:100%;min-height:72px;box-sizing:border-box;border:1px solid #dcdfe6;border-radius:4px;padding:8px 10px;font:inherit;font-size:13px;line-height:1.5;resize:vertical;}',
            '.rbt-review-foot{display:flex;justify-content:flex-end;gap:8px;padding:12px 20px 16px;border-top:1px solid #ebeef5;}'
        ].join('');
        document.head.appendChild(style);
    }

    window.RbtSettleRatio = {
        CHANNELS: CHANNELS.slice(),
        POS_SUBS: POS_SUBS.slice(),
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
        collectDraft: collectDraft,
        collectEditor: collectEditor,
        bindEditor: bindEditor,
        openEditor: openEditor,
        closeEditor: closeEditor,
        ensureDialogChrome: ensureDialogChrome,
        renderHtml: function (item) {
            ensureStyle();
            return renderHtml(item);
        },
        categoryOptions: categoryOptions
    };
})();
