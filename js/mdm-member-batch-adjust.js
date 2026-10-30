/**
 * 会员列表批量增减积分、成长值。
 * 按 Excel 模板上传，不在列表里勾选。
 * 分页会克隆行，调整结果记在本文件里，翻页后再刷回表格。
 */
(function () {
    var baseline = {};
    var overrides = {};
    var bound = false;
    var LIST_KEY = 'mdm_member_c_list_v1';
    var GROWTH_RULE_KEY = 'mdm_member_level_growth_rule_v1';
    var GROWTH_LTO_LABEL = { count_one: '计1分', ignore: '不计分', round: '四舍五入' };
    var MAX_BYTES = 20 * 1024 * 1024;
    var MAX_ROWS = 100000;

    var KINDS = {
        points: {
            title: '批量调整积分',
            templateName: '批量调整积分模板.xlsx',
            headers: ['会员手机号（必填）', '调整积分（必填，正负整数）', '备注（选填，最多200字）'],
            names: ['会员手机号', '调整积分', '备注'],
            qtyLabel: '调整积分',
            tip: '整数。不写符号为增加，减少须加 -，不能为 0。备注最多 200 字。注销、注销中、审核中的会员不可调整。减少时按 FIFO 优先扣最早获取的可用批次，冻结积分不可扣；余额不足的行失败。'
        },
        growth: {
            title: '批量调整成长值',
            templateName: '批量调整成长值模板.xlsx',
            headers: ['会员手机号（必填）', '调整成长值（必填，±2位小数）', '备注（选填，最多200字）'],
            names: ['会员手机号', '调整成长值', '备注'],
            qtyLabel: '调整成长值',
            tip: '最多 2 位小数。不写符号为增加，减少须加 -，不能为 0。整数部分原样入库；不足 1 的小数按「成长值不足1时」折算（计1分记 1，不计分舍去，四舍五入满 0.5 进 1），折算后为 0 的行失败。备注最多 200 字。注销、注销中、审核中的会员不可调整。余额不足的行失败。'
        }
    };

    function toast(message, type) {
        if (typeof showToast === 'function') showToast(message, type || 'info');
        else window.alert(message);
    }

    function num(text) {
        var n = parseFloat(String(text == null ? '' : text).replace(/[^\d.-]/g, ''));
        return isFinite(n) ? n : 0;
    }

    function escapeHtml(text) {
        return String(text == null ? '' : text).replace(/[&<>"']/g, function (ch) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
        });
    }

    function businessCells(tr) {
        if (!tr) return [];
        return tr.querySelectorAll('td:not(.lf-row-no-td)');
    }

    function memberId(tr) {
        var cell = businessCells(tr)[0];
        if (!cell) return '';
        return cell.textContent.replace(/\s+/g, ' ').trim();
    }

    function rowStatus(tr) {
        var st = tr.getAttribute('data-member-status') || '';
        if (st) return st;
        var cells = businessCells(tr);
        var stCell = cells[20];
        if (!stCell) return '';
        var el = stCell.querySelector('.status');
        return (el ? el.textContent : stCell.textContent).trim();
    }

    function isClosedStatus(st) {
        return st === '注销' || st === '已注销' || st === '注销中' || st === '审核中';
    }

    function tbodyEl() {
        return document.getElementById('tableBody');
    }

    function phoneDigits(text) {
        return String(text || '').replace(/\D/g, '');
    }

    function phoneKey(text) {
        var digits = phoneDigits(text);
        if (digits.length < 7) return '';
        return digits.slice(0, 3) + digits.slice(-4);
    }

    function memberPhone(tr, cells) {
        var full = (tr.getAttribute('data-phone-full') || '').trim();
        var shown = cells[3] ? cells[3].textContent.replace(/\s+/g, '').trim() : '';
        if (shown === '—' || shown === '-' || shown === '－') shown = '';
        return full || shown;
    }

    function capture(tr) {
        var id = memberId(tr);
        if (!id) return;
        var cells = businessCells(tr);
        var status = rowStatus(tr);
        var nick = cells[1] ? cells[1].textContent.replace(/\s+/g, ' ').trim() : '';
        var phone = memberPhone(tr, cells);
        var phoneFull = phoneDigits(phone);
        if (phoneFull.length !== 11) phoneFull = '';
        if (!baseline[id]) {
            baseline[id] = {
                nickname: nick,
                growth: cells[6] ? num(cells[6].textContent) : 0,
                points: cells[11] ? num(cells[11].textContent) : 0,
                status: status,
                phone: phone,
                phoneFull: phoneFull,
                phoneKey: phoneKey(phone)
            };
            return;
        }
        if (status) baseline[id].status = status;
        if (nick) baseline[id].nickname = nick;
        if (phone) {
            baseline[id].phone = phone;
            baseline[id].phoneFull = phoneFull;
            baseline[id].phoneKey = phoneKey(phone);
        }
    }

    function currentValue(id, field) {
        if (overrides[id] && overrides[id][field] != null) return overrides[id][field];
        if (baseline[id] && baseline[id][field] != null) return baseline[id][field];
        return 0;
    }

    function findByPhone(raw) {
        var digits = phoneDigits(raw);
        if (!String(raw || '').trim()) return { error: 'empty' };
        if (digits.length !== 11) return { error: 'format' };
        var key = digits.slice(0, 3) + digits.slice(-4);
        var exact = [];
        var masked = [];
        Object.keys(baseline).forEach(function (id) {
            var rec = baseline[id];
            if (rec.phoneFull && rec.phoneFull === digits) exact.push(id);
            else if (rec.phoneKey && rec.phoneKey === key) masked.push(id);
        });
        var hits = exact.length ? exact : masked;
        if (!hits.length) return { error: 'miss' };
        if (hits.length > 1) return { error: 'multi' };
        return { id: hits[0] };
    }

    function paint(tr) {
        var id = memberId(tr);
        var ov = overrides[id];
        if (!ov) return;
        var cells = businessCells(tr);
        if (ov.growth != null && cells[6]) cells[6].textContent = String(ov.growth);
        if (ov.points != null && cells[11]) cells[11].textContent = String(ov.points);
    }

    function syncRows() {
        var tbody = tbodyEl();
        if (!tbody) return;
        tbody.querySelectorAll('tr').forEach(function (tr) {
            capture(tr);
            paint(tr);
        });
    }

    function persist(id, field, after, delta) {
        try {
            var raw = localStorage.getItem(LIST_KEY);
            if (!raw) return;
            var list = JSON.parse(raw);
            if (!Array.isArray(list)) return;
            var changed = false;
            list.forEach(function (item) {
                if (!item || String(item.id) !== String(id)) return;
                changed = true;
                if (field === 'growth') {
                    if (delta > 0) {
                        var total = num(item.growthTotal != null ? item.growthTotal : item.growthScore);
                        item.growthTotal = String(total + delta);
                    }
                    item.growthScore = String(after);
                } else {
                    item.points = String(after);
                }
            });
            if (changed) localStorage.setItem(LIST_KEY, JSON.stringify(list));
        } catch (e) { /* ignore */ }
    }

    function applyRows(kind, rows, fileName) {
        var field = kind === 'growth' ? 'growth' : 'points';
        var action = kind === 'growth' ? 'batch-growth' : 'batch-points';
        var source = '批量操作 · ' + (fileName || 'Excel');
        var logged = [];
        rows.forEach(function (row) {
            var before = currentValue(row.id, field);
            var delta = row.dir === 'sub' ? -row.amount : row.amount;
            var after = before + delta;
            if (!overrides[row.id]) overrides[row.id] = {};
            overrides[row.id][field] = after;
            persist(row.id, field, after, delta);
            var rec = baseline[row.id] || {};
            var summary = (delta > 0 ? '增加 ' : '减少 ') + row.amount + '，调整后 ' + after;
            if (kind === 'growth' && row.rawAmount != null && row.settled) {
                var ruleLabel = GROWTH_LTO_LABEL[row.settleMode] || GROWTH_LTO_LABEL.count_one;
                summary = (delta > 0 ? '增加 ' : '减少 ') + row.amount + '（导入 ' + formatGrowth(row.rawAmount) + '，按不足1时' + ruleLabel + '）';
            }
            logged.push({
                memberId: row.id,
                nickname: rec.nickname || '',
                phone: rec.phone || '',
                summary: summary,
                before: String(before),
                after: String(after),
                remark: row.remark || ''
            });
        });
        if (logged.length && window.MdmMemberCOplog) {
            window.MdmMemberCOplog.record({
                action: action,
                summary: source + '，成功 ' + logged.length + ' 位',
                members: logged
            });
        }
        syncRows();
    }

    function normalizeHeader(value) {
        return String(value == null ? '' : value)
            .replace(/[（(][^）)]*[）)]/g, '')
            .replace(/\s/g, '');
    }

    function headersMatch(kind, headerRow) {
        var expect = KINDS[kind].names;
        var got = (headerRow || []).map(normalizeHeader).filter(function (name) { return !!name; });
        if (got.length !== expect.length) return false;
        return expect.every(function (name, index) { return got[index] === name; });
    }

    /* 第一列是 11 位手机号时，这一行就是数据，不再当成表头丢掉。 */
    function looksLikePhone(value) {
        return phoneDigits(cellText(value)).length === 11;
    }

    function cellText(value) {
        if (value == null) return '';
        if (typeof value === 'number' && isFinite(value)) {
            if (Math.abs(value - Math.round(value)) < 1e-8) return String(Math.round(value));
            return String(value);
        }
        return String(value).trim();
    }

    /* 不写符号视为增加；开头的 + 可省略。减少必须写 -。 */
    function normalizeSignedText(text) {
        return String(text == null ? '' : text)
            .trim()
            .replace(/^\uFEFF/, '')
            .replace(/＋/g, '+')
            .replace(/－/g, '-')
            .replace(/,/g, '')
            .replace(/^\+/, '');
    }

    function parseSignedAmount(text) {
        var t = normalizeSignedText(text);
        if (!/^-?\d+$/.test(t)) return null;
        return Number(t);
    }

    /* 成长值不足1时：与等级规则页同一存储。未配置时默认计1分。 */
    function growthLessThanOneMode() {
        try {
            var raw = localStorage.getItem(GROWTH_RULE_KEY);
            if (raw) {
                var mode = JSON.parse(raw).consumeLessThanOne;
                if (GROWTH_LTO_LABEL[mode]) return mode;
            }
        } catch (e) { /* ignore */ }
        return 'count_one';
    }

    function formatGrowth(n) {
        var v = Math.round(Number(n) * 100) / 100;
        var sign = v < 0 ? '-' : '';
        var abs = Math.abs(v);
        if (Math.abs(abs - Math.round(abs)) < 1e-8) return sign + String(Math.round(abs));
        return sign + abs.toFixed(2).replace(/0$/, '');
    }

    /**
     * 导入值最多 2 位小数。整数部分原样保留，不足 1 的小数按当前规则折算成 0 或 1。
     * 减少先按绝对值折算，再还原为负数。
     */
    function settleGrowthDelta(signed) {
        var mode = growthLessThanOneMode();
        var negative = signed < 0;
        var n = Math.round(Math.abs(signed) * 100) / 100;
        var intPart = Math.floor(n + 1e-8);
        var frac = Math.round((n - intPart) * 100) / 100;
        var extra = 0;
        if (frac > 0) {
            if (mode === 'count_one') extra = 1;
            else if (mode === 'round') extra = frac >= 0.5 ? 1 : 0;
        }
        return {
            mode: mode,
            raw: negative ? -n : n,
            amount: intPart + extra
        };
    }

    function parseGrowthCell(value) {
        var n;
        if (typeof value === 'number' && isFinite(value)) {
            n = value;
        } else {
            var t = normalizeSignedText(value);
            if (!t) return { error: 'empty' };
            if (!/^-?\d+(\.\d+)?$/.test(t)) return { error: 'format' };
            var dot = t.indexOf('.');
            if (dot >= 0 && t.length - dot - 1 > 2) return { error: 'scale' };
            n = Number(t);
        }
        if (!isFinite(n)) return { error: 'format' };
        var rounded = Math.round(n * 100) / 100;
        if (Math.abs(n - rounded) > 1e-6) return { error: 'scale' };
        return { value: rounded };
    }

    function parseSheet(kind, matrix, lineOffset) {
        var spec = KINDS[kind];
        var ok = [];
        var errors = [];
        var seen = {};
        var total = 0;
        var matched = 0;
        var unmatched = 0;
        var settledCount = 0;
        var preview = [];
        (matrix || []).forEach(function (row, index) {
            var cells = row || [];
            var phoneRaw = cellText(cells[0]);
            var qtyRaw = cellText(cells[1]);
            var remark = cellText(cells[2]);
            if (!phoneRaw && !qtyRaw && !remark) return;
            total += 1;
            var lineNo = index + (lineOffset || 2);
            function fail(msg) {
                errors.push('第 ' + lineNo + ' 行' + msg);
                preview.push({
                    index: lineNo,
                    phone: phoneRaw,
                    qty: qtyRaw,
                    remark: remark,
                    level: 'error',
                    reason: msg
                });
            }
            if (!phoneRaw) {
                fail('请填写会员手机号');
                return;
            }
            var found = findByPhone(phoneRaw);
            if (found.error === 'format') {
                fail('会员手机号须为 11 位数字');
                return;
            }
            if (found.error === 'miss') {
                unmatched += 1;
                fail('会员管理表匹配不到用户');
                return;
            }
            if (found.error === 'multi') {
                fail('会员手机号匹配到多位会员');
                return;
            }
            matched += 1;
            var id = found.id;
            var rec = baseline[id];
            if (isClosedStatus(rec.status)) {
                fail((rec.status || '注销') + '会员不可调整');
                return;
            }
            var signed = null;
            var rawAmount = null;
            var settleMode = '';
            var settled = false;
            if (kind === 'growth') {
                var parsedGrowth = parseGrowthCell(cells[1]);
                if (parsedGrowth.error === 'scale') {
                    fail(spec.qtyLabel + '最多保留 2 位小数');
                    return;
                }
                if (parsedGrowth.error || parsedGrowth.value == null) {
                    fail(spec.qtyLabel + '须为数字，最多 2 位小数；正数增加，负数减少');
                    return;
                }
                if (parsedGrowth.value === 0) {
                    fail(spec.qtyLabel + '不能为 0');
                    return;
                }
                var settledGrowth = settleGrowthDelta(parsedGrowth.value);
                if (!settledGrowth.amount) {
                    fail(spec.qtyLabel + '按不足1时「' + GROWTH_LTO_LABEL[settledGrowth.mode] + '」折算后为 0');
                    return;
                }
                signed = settledGrowth.raw < 0 ? -settledGrowth.amount : settledGrowth.amount;
                rawAmount = settledGrowth.raw;
                settleMode = settledGrowth.mode;
                settled = Math.abs(Math.abs(rawAmount) - settledGrowth.amount) > 1e-8;
            } else {
                signed = parseSignedAmount(qtyRaw);
                if (signed == null) {
                    fail(spec.qtyLabel + '须为整数；正数增加，负数减少');
                    return;
                }
                if (signed === 0) {
                    fail(spec.qtyLabel + '不能为 0');
                    return;
                }
            }
            if (remark.length > 200) {
                fail('备注最多 200 字');
                return;
            }
            if (seen[id]) {
                fail('会员手机号重复');
                return;
            }
            var dir = signed > 0 ? 'add' : 'sub';
            var amount = Math.abs(signed);
            var field = kind === 'growth' ? 'growth' : 'points';
            var cur = currentValue(id, field);
            if (dir === 'sub' && cur < amount) {
                fail((kind === 'growth' ? '成长值' : '积分') + '不足（当前 ' + cur + '）');
                return;
            }
            seen[id] = true;
            if (settled) settledCount += 1;
            var applyRow = {
                id: id,
                dir: dir,
                amount: amount,
                remark: remark,
                rawAmount: rawAmount,
                settleMode: settleMode,
                settled: settled
            };
            ok.push(applyRow);
            var actionText = (dir === 'sub' ? '减少 ' : '增加 ') + amount;
            var mark = '有效，' + actionText;
            if (settled) {
                mark = '有效，按不足1时' + (GROWTH_LTO_LABEL[settleMode] || '计1分') + '入库为' + actionText;
            }
            preview.push({
                index: lineNo,
                phone: phoneRaw,
                qty: kind === 'growth' && rawAmount != null ? formatGrowth(rawAmount) : qtyRaw,
                remark: remark,
                level: 'ok',
                reason: mark,
                apply: applyRow
            });
        });
        return { total: total, ok: ok, errors: errors, matched: matched, unmatched: unmatched, settled: settledCount, preview: preview };
    }

    function downloadTemplate(kind) {
        if (!window.XLSX) {
            toast('Excel 组件未加载', 'warning');
            return;
        }
        var spec = KINDS[kind];
        var wb = window.XLSX.utils.book_new();
        var ws = window.XLSX.utils.aoa_to_sheet([spec.headers]);
        ws['!cols'] = spec.headers.map(function (name) {
            return { wch: Math.max(18, String(name).length * 2 + 2) };
        });
        window.XLSX.utils.book_append_sheet(wb, ws, spec.title);
        window.XLSX.writeFile(wb, spec.templateName);
    }

    function closeModal() {
        document.querySelectorAll('[data-member-batch-modal]').forEach(function (node) {
            node.remove();
        });
        document.body.style.overflow = '';
    }

    function wizardStepHtml(current) {
        function item(step, label) {
            var cls = 'order-batch-wizard__step';
            if (current > step) cls += ' is-done';
            else if (current === step) cls += ' is-current';
            return (
                '<span class="' + cls + '">' +
                '<span class="order-batch-wizard__dot"></span>' +
                '<svg class="order-batch-wizard__check" viewBox="0 0 16 16" aria-hidden="true">' +
                '<circle cx="8" cy="8" r="8" fill="#67c23a"></circle>' +
                '<path d="M4.6 8.2l2.1 2.1 4.7-4.7" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path>' +
                '</svg>' +
                '<span>' + label + '</span>' +
                '</span>'
            );
        }
        return (
            '<div class="order-batch-wizard__steps">' +
            item(1, '上传文件') +
            '<span class="order-batch-wizard__chevron">›</span>' +
            item(2, '数据预览') +
            '<span class="order-batch-wizard__chevron">›</span>' +
            item(3, '导入结果') +
            '</div>'
        );
    }

    function countPreview(rows) {
        var total = rows.length;
        var err = 0;
        rows.forEach(function (row) {
            if (row.level === 'error') err += 1;
        });
        return { total: total, valid: total - err, error: err, warn: 0 };
    }

    function downloadFailDetails(kind, rows) {
        if (!window.XLSX) {
            toast('Excel 组件未加载', 'warning');
            return;
        }
        var spec = KINDS[kind];
        var aoa = [['行号', '会员手机号', spec.qtyLabel, '备注', '失败原因']];
        (rows || []).forEach(function (row) {
            aoa.push([row.index, row.phone, row.qty, row.remark, row.reason]);
        });
        var wb = window.XLSX.utils.book_new();
        var ws = window.XLSX.utils.aoa_to_sheet(aoa);
        window.XLSX.utils.book_append_sheet(wb, ws, '失败详情');
        var stamp = new Date();
        function pad(n) { return n < 10 ? '0' + n : String(n); }
        var name = spec.title + '_失败详情_' + stamp.getFullYear() + pad(stamp.getMonth() + 1) + pad(stamp.getDate()) + pad(stamp.getHours()) + pad(stamp.getMinutes()) + pad(stamp.getSeconds()) + '.xlsx';
        window.XLSX.writeFile(wb, name);
    }

    function openModal(kind) {
        var spec = KINDS[kind];
        if (!spec) return;
        syncRows();
        closeModal();
        var state = {
            step: 1,
            file: null,
            previewRows: [],
            onlyError: false,
            result: null
        };
        var backdrop = document.createElement('div');
        backdrop.className = 'order-proxy-express-overlay';
        backdrop.setAttribute('data-member-batch-modal', '1');
        document.body.appendChild(backdrop);
        document.body.style.overflow = 'hidden';

        function closeWizard() {
            closeModal();
        }

        function renderPreviewTable(rows) {
            var list = state.onlyError ? rows.filter(function (row) { return row.level === 'error'; }) : rows;
            if (!list.length) {
                return '<div class="order-batch-wizard__table-wrap"><table class="order-batch-wizard__table"><tbody><tr><td>没有可展示的数据</td></tr></tbody></table></div>';
            }
            var shown = list.slice(0, 500);
            var html =
                '<div class="order-batch-wizard__table-wrap"><table class="order-batch-wizard__table">' +
                '<thead><tr><th>#</th><th>会员手机号</th><th>' + escapeHtml(spec.qtyLabel) + '</th><th>备注</th><th>校验</th></tr></thead><tbody>';
            shown.forEach(function (row) {
                var trCls = row.level === 'error' ? ' is-error' : '';
                html +=
                    '<tr class="' + trCls + '">' +
                    '<td>' + row.index + '</td>' +
                    '<td>' + escapeHtml(row.phone) + '</td>' +
                    '<td>' + escapeHtml(row.qty) + '</td>' +
                    '<td>' + escapeHtml(row.remark || '') + '</td>' +
                    '<td>' + escapeHtml(row.reason) + '</td>' +
                    '</tr>';
            });
            html += '</tbody></table></div>';
            if (list.length > shown.length) {
                html += '<p class="order-proxy-upload-modal__hint">仅展示前 500 行，提交仍按全部有效行导入。</p>';
            }
            return html;
        }

        function renderFailTable(failures) {
            if (!failures || !failures.length) return '';
            var html =
                '<div class="order-batch-wizard__table-wrap"><table class="order-batch-wizard__table">' +
                '<thead><tr><th>行号</th><th>会员手机号</th><th>' + escapeHtml(spec.qtyLabel) + '</th><th>备注</th><th>失败原因</th></tr></thead><tbody>';
            failures.slice(0, 500).forEach(function (row) {
                html +=
                    '<tr>' +
                    '<td>' + row.index + '</td>' +
                    '<td>' + escapeHtml(row.phone) + '</td>' +
                    '<td>' + escapeHtml(row.qty) + '</td>' +
                    '<td>' + escapeHtml(row.remark || '') + '</td>' +
                    '<td>' + escapeHtml(row.reason) + '</td>' +
                    '</tr>';
            });
            html += '</tbody></table></div>';
            return html;
        }

        function render() {
            var body = '';
            var foot = '';
            if (state.step === 1) {
                body =
                    wizardStepHtml(1) +
                    '<div class="order-batch-wizard__drop js-batch-drop">' +
                    '<svg class="order-batch-wizard__drop-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">' +
                    '<path d="M8 30v6a4 4 0 0 0 4 4h24a4 4 0 0 0 4-4v-6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>' +
                    '<path d="M24 8v24M16 16l8-8 8 8" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>' +
                    '</svg>' +
                    '<p class="order-batch-wizard__drop-title">将文件拖到此处，或点击上传</p>' +
                    '<p class="order-batch-wizard__drop-sub">支持 .xlsx、.xls、.csv 格式</p>' +
                    (state.file ? '<p class="order-batch-wizard__drop-name">' + escapeHtml(state.file.name) + '</p>' : '') +
                    '<input type="file" data-file accept=".csv,.xlsx,.xls,text/csv" hidden>' +
                    '</div>' +
                    '<button type="button" class="order-batch-wizard__tpl" data-tpl>下载导入模板</button>';
                foot =
                    '<div class="order-proxy-upload-modal__foot">' +
                    '<button type="button" class="order-filter-btn order-filter-btn--default" data-cancel>取消</button>' +
                    '</div>';
            } else if (state.step === 2) {
                var stats = countPreview(state.previewRows);
                body =
                    wizardStepHtml(2) +
                    '<div class="order-batch-wizard__stats">' +
                    '<span>总计 <strong>' + stats.total + '</strong></span>' +
                    '<span class="order-batch-wizard__stat--ok">有效 <strong>' + stats.valid + '</strong></span>' +
                    '<span class="order-batch-wizard__stat--err">错误 <strong>' + stats.error + '</strong></span>' +
                    '<span class="order-batch-wizard__stat--warn">警告 <strong>' + stats.warn + '</strong></span>' +
                    '</div>' +
                    '<div class="order-batch-wizard__toolbar">' +
                    '<span class="order-batch-wizard__toggle' + (state.onlyError ? ' is-on' : '') + '" data-only-error>' +
                    '<span class="order-batch-wizard__switch"></span>仅显示错误行' +
                    '</span>' +
                    '</div>' +
                    renderPreviewTable(state.previewRows);
                foot =
                    '<div class="order-proxy-upload-modal__foot is-split">' +
                    '<button type="button" class="order-filter-btn order-filter-btn--default" data-cancel>取消</button>' +
                    '<div class="order-proxy-upload-modal__foot-right">' +
                    '<button type="button" class="order-filter-btn order-filter-btn--default" data-prev>上一步</button>' +
                    '<button type="button" class="order-filter-btn order-filter-btn--primary" data-ok>提交导入</button>' +
                    '</div>' +
                    '</div>';
            } else {
                var result = state.result || { success: 0, failed: 0, failures: [] };
                var total = result.success + result.failed;
                var allOk = result.failed === 0;
                body =
                    wizardStepHtml(3) +
                    '<div class="order-batch-wizard__result">' +
                    '<div class="order-batch-wizard__result-icon' + (allOk ? ' is-ok' : '') + '">' +
                    (allOk ? '✓' : '!') +
                    '</div>' +
                    '<p class="order-batch-wizard__result-title">成功导入 ' + result.success + '，导入失败 ' + result.failed + '</p>' +
                    '</div>' +
                    (result.failed
                        ? '<div class="order-batch-wizard__result-head">' +
                        '<div class="order-batch-wizard__stats">' +
                        '<span>' + total + '总计</span>' +
                        '<span class="order-batch-wizard__stat--ok">' + result.success + '成功导入</span>' +
                        '<span class="order-batch-wizard__stat--err">' + result.failed + '导入失败</span>' +
                        '</div>' +
                        '</div>' +
                        renderFailTable(result.failures)
                        : '');
                foot =
                    '<div class="order-proxy-upload-modal__foot">' +
                    (result.failed
                        ? '<button type="button" class="order-filter-btn order-filter-btn--outline" data-fail>下载失败详情</button>'
                        : '') +
                    '<button type="button" class="order-filter-btn order-filter-btn--default" data-reimport>重新导入</button>' +
                    '<button type="button" class="order-filter-btn order-filter-btn--primary" data-done>完成</button>' +
                    '</div>';
            }

            backdrop.innerHTML =
                '<div class="order-proxy-upload-modal order-proxy-batch-wizard" role="dialog" aria-modal="true">' +
                '<div class="order-proxy-upload-modal__head">' +
                '<h3 class="order-proxy-upload-modal__title">' + escapeHtml(spec.title) + '</h3>' +
                '<button type="button" class="order-proxy-upload-modal__close" data-close aria-label="关闭">×</button>' +
                '</div>' +
                '<div class="order-proxy-upload-modal__body">' +
                '<p class="order-proxy-upload-modal__hint">' + escapeHtml(spec.tip) + '</p>' +
                body +
                '</div>' +
                foot +
                '</div>';
            bindWizard();
        }

        function sheetFromFile(file, done) {
            if (!/\.(xlsx|xls|csv)$/i.test(file.name || '')) {
                toast('请上传 xlsx、xls 或 csv 文件', 'warning');
                return;
            }
            if (file.size > MAX_BYTES) {
                toast('上传文档的大小不超过 20M', 'warning');
                return;
            }
            if (!window.XLSX) {
                toast('Excel 组件未加载', 'warning');
                return;
            }
            var reader = new FileReader();
            var isCsv = /\.csv$/i.test(file.name || '');
            reader.onload = function (e) {
                try {
                    var wb = isCsv
                        ? window.XLSX.read(String(e.target.result || '').replace(/^\uFEFF/, ''), { type: 'string' })
                        : window.XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
                    var sheet = wb.Sheets[wb.SheetNames[0]];
                    var matrix = window.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true });
                    if (matrix[0] && matrix[0][0] != null) {
                        matrix[0][0] = String(matrix[0][0]).replace(/^\uFEFF/, '');
                    }
                    done(matrix);
                } catch (err) {
                    toast('Excel 解析失败', 'warning');
                }
            };
            reader.onerror = function () {
                toast('文件读取失败', 'warning');
            };
            if (isCsv) reader.readAsText(file, 'UTF-8');
            else reader.readAsArrayBuffer(file);
        }

        function goPreviewFromFile(file) {
            sheetFromFile(file, function (matrix) {
                if (!matrix.length) {
                    toast('表格里没有可调整的数据', 'warning');
                    return;
                }
                var body = matrix;
                var lineOffset = 1;
                if (kind === 'growth') {
                    if (!looksLikePhone((matrix[0] || [])[0])) {
                        body = matrix.slice(1);
                        lineOffset = 2;
                    }
                } else if (!headersMatch(kind, matrix[0])) {
                    toast('请按模板字段顺序上传，请勿错漏', 'warning');
                    return;
                } else {
                    body = matrix.slice(1);
                    lineOffset = 2;
                }
                var filled = body.filter(function (row) {
                    return (row || []).some(function (cell) { return cellText(cell) !== ''; });
                });
                if (filled.length > MAX_ROWS) {
                    toast('单个文档不超过 100000 行，请分批上传', 'warning');
                    return;
                }
                syncRows();
                var next = parseSheet(kind, body, lineOffset);
                if (!next.total) {
                    toast('表格里没有可调整的数据', 'warning');
                    return;
                }
                state.file = file;
                state.previewRows = next.preview || [];
                state.onlyError = false;
                state.step = 2;
                render();
            });
        }

        function bindWizard() {
            backdrop.querySelectorAll('[data-close],[data-cancel]').forEach(function (btn) {
                btn.addEventListener('click', closeWizard);
            });
            var drop = backdrop.querySelector('.js-batch-drop');
            var fileInput = backdrop.querySelector('[data-file]');
            if (drop && fileInput) {
                drop.addEventListener('click', function (e) {
                    if (e.target === fileInput) return;
                    fileInput.value = '';
                    fileInput.click();
                });
                drop.addEventListener('dragover', function (e) {
                    e.preventDefault();
                    drop.classList.add('is-dragover');
                });
                drop.addEventListener('dragleave', function () {
                    drop.classList.remove('is-dragover');
                });
                drop.addEventListener('drop', function (e) {
                    e.preventDefault();
                    drop.classList.remove('is-dragover');
                    var file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
                    if (file) goPreviewFromFile(file);
                });
                fileInput.addEventListener('change', function () {
                    var file = fileInput.files && fileInput.files[0];
                    if (file) goPreviewFromFile(file);
                });
            }
            var tplBtn = backdrop.querySelector('[data-tpl]');
            if (tplBtn) {
                tplBtn.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    downloadTemplate(kind);
                    toast('模板已下载', 'success');
                });
            }
            var onlyError = backdrop.querySelector('[data-only-error]');
            if (onlyError) {
                onlyError.addEventListener('click', function () {
                    state.onlyError = !state.onlyError;
                    render();
                });
            }
            var prevBtn = backdrop.querySelector('[data-prev]');
            if (prevBtn) {
                prevBtn.addEventListener('click', function () {
                    state.step = 1;
                    render();
                });
            }
            var submitBtn = backdrop.querySelector('[data-ok]');
            if (submitBtn) {
                submitBtn.addEventListener('click', function () {
                    var failures = state.previewRows.filter(function (row) { return row.level === 'error'; });
                    var okRows = [];
                    state.previewRows.forEach(function (row) {
                        if (row.level !== 'error' && row.apply) okRows.push(row.apply);
                    });
                    if (okRows.length) applyRows(kind, okRows, state.file ? state.file.name : '');
                    state.result = { success: okRows.length, failed: failures.length, failures: failures };
                    state.step = 3;
                    render();
                });
            }
            var failBtn = backdrop.querySelector('[data-fail]');
            if (failBtn) {
                failBtn.addEventListener('click', function () {
                    downloadFailDetails(kind, (state.result && state.result.failures) || []);
                    toast('失败详情已下载', 'success');
                });
            }
            var reimportBtn = backdrop.querySelector('[data-reimport]');
            if (reimportBtn) {
                reimportBtn.addEventListener('click', function () {
                    state.step = 1;
                    state.file = null;
                    state.previewRows = [];
                    state.result = null;
                    state.onlyError = false;
                    render();
                });
            }
            var doneBtn = backdrop.querySelector('[data-done]');
            if (doneBtn) doneBtn.addEventListener('click', closeWizard);
        }

        backdrop.addEventListener('click', function (ev) {
            if (ev.target === backdrop) closeWizard();
        });
        render();
    }

    function bindOnce() {
        if (bound) return;
        var tbody = tbodyEl();
        var bar = document.getElementById('memberBatchBar');
        if (!tbody || !bar) return;
        bound = true;

        bar.innerHTML =
            '<button type="button" class="product-batch__btn" data-batch-toggle>批量操作</button>' +
            '<button type="button" class="product-batch__btn" data-member-oplog>操作日志</button>' +
            '<div class="product-batch__menu" data-batch-menu hidden>' +
            '  <button type="button" class="product-batch__item" data-batch-action="points">批量调整积分</button>' +
            '  <button type="button" class="product-batch__item" data-batch-action="growth">批量调整成长值</button>' +
            '</div>';

        var menu = bar.querySelector('[data-batch-menu]');
        var toggle = bar.querySelector('[data-batch-toggle]');
        function placeMenu() {
            var rect = toggle.getBoundingClientRect();
            var menuHeight = menu.offsetHeight || 88;
            var spaceBelow = window.innerHeight - rect.bottom;
            var top = spaceBelow < menuHeight + 8 && rect.top > menuHeight + 8
                ? rect.top - menuHeight - 4
                : rect.bottom + 4;
            menu.style.left = Math.max(8, rect.left) + 'px';
            menu.style.top = Math.max(8, top) + 'px';
        }
        toggle.addEventListener('click', function (ev) {
            ev.stopPropagation();
            menu.hidden = !menu.hidden;
            if (!menu.hidden) placeMenu();
        });
        bar.querySelectorAll('[data-batch-action]').forEach(function (btn) {
            btn.addEventListener('click', function (ev) {
                ev.stopPropagation();
                menu.hidden = true;
                openModal(btn.getAttribute('data-batch-action'));
            });
        });
        var logBtn = bar.querySelector('[data-member-oplog]');
        if (logBtn) {
            logBtn.addEventListener('click', function (ev) {
                ev.stopPropagation();
                menu.hidden = true;
                if (window.MdmMemberCOplog) window.MdmMemberCOplog.open();
            });
        }
        document.addEventListener('click', function () {
            if (menu) menu.hidden = true;
        });
        document.addEventListener('scroll', function () {
            if (menu) menu.hidden = true;
        }, true);

        if (window.MutationObserver) {
            new MutationObserver(function () {
                syncRows();
            }).observe(tbody, { childList: true });
        }
    }

    function prepare() {
        bindOnce();
        syncRows();
    }

    window.MdmMemberBatchAdjust = {
        prepare: prepare
    };
})();