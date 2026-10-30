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
    var MAX_BYTES = 20 * 1024 * 1024;
    var MAX_ROWS = 100000;

    var KINDS = {
        points: {
            title: '批量调整积分',
            templateName: '批量调整积分模板.xlsx',
            headers: ['会员手机号（必填）', '调整积分（必填，正负整数）', '备注（选填，最多200字）'],
            names: ['会员手机号', '调整积分', '备注'],
            qtyLabel: '调整积分',
            tip: '按会员手机号匹配会员管理列表。调整积分为整数，正数增加，负数减少，不能为 0。备注选填，最多 200 字。注销、注销中、审核中的会员不可调整。减少时按 FIFO 优先扣最早获取的「可用」批次（冻结积分不可扣）；余额不足的行失败，匹配成功的行在确认后生效。'
        },
        growth: {
            title: '批量调整成长值',
            templateName: '批量调整成长值模板.xlsx',
            headers: ['会员手机号（必填）', '调整成长值（必填，正负整数）', '备注（选填，最多200字）'],
            names: ['会员手机号', '调整成长值', '备注'],
            qtyLabel: '调整成长值',
            tip: '按会员手机号匹配会员管理列表。调整成长值为整数，正数增加，负数减少，不能为 0。备注选填，最多 200 字。注销、注销中、审核中的会员不可调整。余额不足的行失败，匹配成功的行在确认后生效。'
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
        var fieldLabel = kind === 'growth' ? '成长值' : '积分';
        var source = '批量操作 · ' + (fileName || 'Excel');
        rows.forEach(function (row) {
            var before = currentValue(row.id, field);
            var delta = row.dir === 'sub' ? -row.amount : row.amount;
            var after = before + delta;
            if (!overrides[row.id]) overrides[row.id] = {};
            overrides[row.id][field] = after;
            persist(row.id, field, after, delta);
            var rec = baseline[row.id] || {};
            if (window.MdmMemberCOplog) {
                window.MdmMemberCOplog.record({
                    action: action,
                    memberId: row.id,
                    nickname: rec.nickname || '',
                    phone: rec.phone || '',
                    summary: (delta > 0 ? '增加 ' : '减少 ') + row.amount + '，调整后 ' + after,
                    changes: [
                        { field: '调整类型', oldValue: '—', newValue: delta > 0 ? '增加' : '减少' },
                        { field: fieldLabel, oldValue: String(before), newValue: String(after) },
                        { field: '备注', oldValue: '—', newValue: row.remark || '—' },
                        { field: '来源', oldValue: '—', newValue: source }
                    ]
                });
            }
        });
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

    function cellText(value) {
        if (value == null) return '';
        if (typeof value === 'number' && isFinite(value)) {
            if (Math.abs(value - Math.round(value)) < 1e-8) return String(Math.round(value));
            return String(value);
        }
        return String(value).trim();
    }

    function parseSignedAmount(text) {
        var t = String(text || '').trim().replace(/^\+/, '');
        if (!/^-?\d+$/.test(t)) return null;
        return Number(t);
    }

    function parseSheet(kind, matrix) {
        var spec = KINDS[kind];
        var ok = [];
        var errors = [];
        var seen = {};
        var total = 0;
        var matched = 0;
        var unmatched = 0;
        (matrix || []).forEach(function (row, index) {
            var cells = row || [];
            var phoneRaw = cellText(cells[0]);
            var qtyRaw = cellText(cells[1]);
            var remark = cellText(cells[2]);
            if (!phoneRaw && !qtyRaw && !remark) return;
            total += 1;
            var lineNo = index + 2;
            function fail(msg) {
                errors.push('第 ' + lineNo + ' 行' + msg);
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
            var signed = parseSignedAmount(qtyRaw);
            if (signed == null) {
                fail(spec.qtyLabel + '须为整数，正数增加，负数减少');
                return;
            }
            if (signed === 0) {
                fail(spec.qtyLabel + '不能为 0');
                return;
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
            ok.push({
                id: id,
                dir: dir,
                amount: amount,
                remark: remark
            });
        });
        return { total: total, ok: ok, errors: errors, matched: matched, unmatched: unmatched };
    }

    function downloadTemplate(kind) {
        if (!window.XLSX) {
            toast('Excel 组件未加载', 'warning');
            return;
        }
        var spec = KINDS[kind];
        var wb = window.XLSX.utils.book_new();
        var ws = window.XLSX.utils.aoa_to_sheet([spec.headers]);
        ws['!cols'] = [{ wch: 20 }, { wch: 46 }, { wch: 24 }];
        window.XLSX.utils.book_append_sheet(wb, ws, spec.title);
        window.XLSX.writeFile(wb, spec.templateName);
    }

    function closeModal() {
        document.querySelectorAll('[data-member-batch-modal]').forEach(function (node) {
            node.remove();
        });
    }

    function openModal(kind) {
        var spec = KINDS[kind];
        if (!spec) return;
        syncRows();
        closeModal();
        var parsed = { total: 0, ok: [], errors: [], matched: 0, unmatched: 0, fileName: '' };

        var backdrop = document.createElement('div');
        backdrop.className = 'erp-modal-backdrop';
        backdrop.setAttribute('data-member-batch-modal', '1');
        backdrop.innerHTML =
            '<div class="erp-modal erp-modal--pts-adjust erp-modal--member-batch-excel" role="dialog" aria-modal="true">' +
            '  <div class="erp-modal__header">' +
            '    <h2 class="erp-modal__title">' + escapeHtml(spec.title) + '</h2>' +
            '    <div class="erp-modal__header-actions"><button type="button" class="erp-modal__header-btn" data-close>&times;</button></div>' +
            '  </div>' +
            '  <div class="erp-modal__body">' +
            '    <div class="erp-modal-field">' +
            '      <label class="erp-modal-field__label"><span class="erp-req">*</span>批量上传</label>' +
            '      <div class="erp-modal-field__control">' +
            '        <div class="member-batch-excel-tools">' +
            '          <label class="erp-btn erp-btn--primary member-batch-excel-upload" data-upload-btn>数据上传' +
            '            <input type="file" accept=".xlsx,.xls" data-file>' +
            '          </label>' +
            '          <button type="button" class="member-batch-excel-tpl" data-tpl>模板下载</button>' +
            '        </div>' +
            '        <div class="member-batch-excel-file" data-file-chip hidden>' +
            '          <span data-file-name></span>' +
            '          <button type="button" class="member-batch-excel-file__remove" data-file-remove aria-label="删除">×</button>' +
            '        </div>' +
            '        <div class="member-batch-excel-result" data-result hidden></div>' +
            '        <div class="pts-adjust-tip">' + escapeHtml(spec.tip) + '</div>' +
            '      </div>' +
            '    </div>' +
            '  </div>' +
            '  <div class="erp-modal__footer">' +
            '    <button type="button" class="erp-btn" data-cancel>取消</button>' +
            '    <button type="button" class="erp-btn erp-btn--primary" data-ok disabled>确定</button>' +
            '  </div>' +
            '</div>';

        function paintParsed() {
            var chip = backdrop.querySelector('[data-file-chip]');
            var nameEl = backdrop.querySelector('[data-file-name]');
            var result = backdrop.querySelector('[data-result]');
            var uploadBtn = backdrop.querySelector('[data-upload-btn]');
            var fileInput = backdrop.querySelector('[data-file]');
            var okBtn = backdrop.querySelector('[data-ok]');
            var has = !!parsed.fileName;
            chip.hidden = !has;
            nameEl.textContent = parsed.fileName;
            uploadBtn.classList.toggle('is-locked', has);
            fileInput.disabled = has;
            okBtn.disabled = !parsed.ok.length;
            if (!has) {
                result.hidden = true;
                result.innerHTML = '';
                return;
            }
            var failHtml = parsed.errors.length
                ? '<ul>' + parsed.errors.slice(0, 20).map(function (line) {
                    return '<li>' + escapeHtml(line) + '</li>';
                }).join('') + (parsed.errors.length > 20 ? '<li>仅展示前 20 条失败原因</li>' : '') + '</ul>'
                : '';
            result.hidden = false;
            result.innerHTML =
                '<div>匹配数量 <strong class="member-batch-excel-ok">' + parsed.matched + '</strong></div>' +
                '<div class="member-batch-excel-bad">' + parsed.unmatched + ' 条数据会员管理表匹配不到用户</div>' +
                failHtml;
        }

        function clearFile() {
            parsed = { total: 0, ok: [], errors: [], matched: 0, unmatched: 0, fileName: '' };
            paintParsed();
        }

        function readWorkbook(file) {
            if (parsed.fileName) {
                toast('请先删除已上传的文件', 'warning');
                return;
            }
            if (!/\.xlsx?$/i.test(file.name || '')) {
                toast('请上传 xlsx 或 xls 文件', 'warning');
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
            reader.onload = function (e) {
                try {
                    var data = new Uint8Array(e.target.result);
                    var wb = window.XLSX.read(data, { type: 'array' });
                    var sheet = wb.Sheets[wb.SheetNames[0]];
                    var matrix = window.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true });
                    if (!matrix.length || !headersMatch(kind, matrix[0])) {
                        toast('请按模板字段顺序上传，请勿错漏', 'warning');
                        return;
                    }
                    var body = matrix.slice(1);
                    var filled = body.filter(function (row) {
                        return (row || []).some(function (cell) { return cellText(cell) !== ''; });
                    });
                    if (filled.length > MAX_ROWS) {
                        toast('单个文档不超过 100000 行，请分批上传', 'warning');
                        return;
                    }
                    syncRows();
                    var next = parseSheet(kind, body);
                    if (!next.total) {
                        toast('表格里没有可调整的数据', 'warning');
                        return;
                    }
                    parsed = next;
                    parsed.fileName = file.name;
                    paintParsed();
                } catch (err) {
                    toast('Excel 解析失败', 'warning');
                }
            };
            reader.readAsArrayBuffer(file);
        }

        backdrop.querySelector('[data-close]').addEventListener('click', closeModal);
        backdrop.querySelector('[data-cancel]').addEventListener('click', closeModal);
        backdrop.querySelector('[data-tpl]').addEventListener('click', function () {
            downloadTemplate(kind);
        });
        backdrop.querySelector('[data-file-remove]').addEventListener('click', clearFile);
        backdrop.querySelector('[data-file]').addEventListener('change', function (ev) {
            var file = ev.target.files && ev.target.files[0];
            ev.target.value = '';
            if (file) readWorkbook(file);
        });
        backdrop.querySelector('[data-ok]').addEventListener('click', function () {
            if (!parsed.ok.length) {
                window.alert('没有可通过的数据');
                return;
            }
            var n = parsed.ok.length;
            var failed = parsed.errors.length;
            applyRows(kind, parsed.ok, parsed.fileName);
            closeModal();
            var label = kind === 'growth' ? '成长值' : '积分';
            toast(
                '已按表格为 ' + n + ' 位会员调整' + label + (failed ? '，' + failed + ' 行未通过' : ''),
                'success'
            );
        });
        backdrop.addEventListener('click', function (ev) {
            if (ev.target === backdrop) closeModal();
        });
        document.body.appendChild(backdrop);
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
