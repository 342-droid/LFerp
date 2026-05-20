/**
 * BD推广员详情 — 列表左移进入全屏详情（基础信息 / 已绑定门店 / 分佣明细 / 业绩报表）
 */
(function () {
    var TAB_IDS = ['base', 'stores', 'comm', 'perf'];
    var TAB_LABELS = ['基础信息', '已绑定门店', '分佣明细', '业绩报表'];

    function el(tag, cls, text) {
        var node = document.createElement(tag);
        if (cls) node.className = cls;
        if (text != null && text !== '') node.textContent = String(text);
        return node;
    }

    function dash(v) {
        return v != null && String(v).trim() !== '' ? String(v).trim() : '—';
    }

    function rowToRecord(tr) {
        if (!tr) return null;
        var c = tr.querySelectorAll('td');
        if (c.length < 14) return null;
        var statusEl = c[12].querySelector('.status');
        var statusText = statusEl ? statusEl.textContent.trim() : '';
        var phoneRaw = tr.getAttribute('data-bd-phone-raw') || '';
        return {
            id: c[0].textContent.trim(),
            name: c[1].textContent.trim(),
            phone: phoneRaw || c[2].textContent.trim(),
            phoneDisplay: c[2].textContent.trim(),
            category: c[3].textContent.trim(),
            identity: c[4].textContent.trim(),
            superior: c[5].textContent.trim(),
            storeCount: c[6].textContent.trim(),
            totalCommission: c[7].textContent.trim(),
            totalWithdraw: c[8].textContent.trim(),
            createTime: c[11].textContent.trim(),
            enabled: statusText === '开启',
            memberNo: tr.getAttribute('data-bd-member-no') || '—',
            joinTime: tr.getAttribute('data-bd-join-time') || c[11].textContent.trim(),
            settleIdCard: tr.getAttribute('data-bd-id-card') || '',
            settleBankName: tr.getAttribute('data-bd-bank-name') || '',
            settleBankCard: tr.getAttribute('data-bd-bank-card') || '',
            settleAccountName: tr.getAttribute('data-bd-account-name') || '',
            settleBankCity: tr.getAttribute('data-bd-bank-city') || ''
        };
    }

    function persistSettlementToRow(tr, settle) {
        if (!tr || !settle) return;
        tr.setAttribute('data-bd-id-card', settle.idCard || '');
        tr.setAttribute('data-bd-bank-name', settle.bankName || '');
        tr.setAttribute('data-bd-bank-card', settle.bankCard || '');
        tr.setAttribute('data-bd-account-name', settle.accountName || '');
        tr.setAttribute('data-bd-bank-city', settle.bankCity || '');
    }

    function buildSettleInput(label, placeholder, value, id) {
        var field = el('div', 'mdm-bd-settle-field');
        field.appendChild(el('label', '', label));
        var inp = el('input', '');
        inp.type = 'text';
        inp.id = id;
        inp.placeholder = placeholder;
        inp.value = value || '';
        field.appendChild(inp);
        return field;
    }

    function buildSettleUpload(label, id) {
        var block = el('div', 'mdm-bd-settle-upload');
        block.appendChild(el('label', '', label));
        var box = el('div', 'mdm-bd-settle-upload-box');
        box.id = id;
        box.textContent = '+';
        box.title = '点击上传（演示）';
        box.addEventListener('click', function () {
            if (typeof showToast === 'function') showToast('上传功能（演示）', 'info');
        });
        block.appendChild(box);
        return block;
    }

    function buildSettlementCard(rec, sourceTr) {
        var card = el('div', 'mdm-bd-detail-card mdm-bd-settle-card');
        var head = el('div', 'mdm-bd-detail-card__head');
        head.appendChild(el('h3', 'mdm-bd-detail-card__title', '结算信息'));

        var editBtn = el('button', 'mdm-bd-detail-btn mdm-bd-detail-btn--primary mdm-bd-detail-btn--sm');
        editBtn.type = 'button';
        editBtn.innerHTML = iconEdit() + '<span>编辑</span>';
        head.appendChild(editBtn);
        card.appendChild(head);

        var viewHost = el('div', 'mdm-bd-settle-view');
        var editHost = el('div', 'mdm-bd-settle-edit');
        card.appendChild(viewHost);
        card.appendChild(editHost);

        function getSettle() {
            return {
                idCard: rec.settleIdCard || '',
                bankName: rec.settleBankName || '',
                bankCard: rec.settleBankCard || '',
                accountName: rec.settleAccountName || '',
                bankCity: rec.settleBankCity || ''
            };
        }

        function paintView() {
            var s = getSettle();
            viewHost.innerHTML = '';
            viewHost.appendChild(
                buildKvGrid(
                    [
                        ['身份证号', s.idCard],
                        ['开户行', s.bankName],
                        ['银行卡号', s.bankCard],
                        ['开户名', s.accountName],
                        ['开户行所在城市', s.bankCity]
                    ],
                    3
                )
            );
        }

        function paintEdit() {
            var s = getSettle();
            editHost.innerHTML = '';

            var form = el('div', 'mdm-bd-settle-form');
            var grid = el('div', 'mdm-bd-settle-form-grid');
            grid.appendChild(
                buildSettleInput(
                    '身份证号',
                    '请输入身份证号（明文传入，后端加密）',
                    s.idCard,
                    'bdSettleIdCard'
                )
            );
            grid.appendChild(buildSettleInput('开户行', '请输入开户行', s.bankName, 'bdSettleBankName'));
            grid.appendChild(
                buildSettleInput('银行卡号', '请输入银行卡号', s.bankCard, 'bdSettleBankCard')
            );
            grid.appendChild(
                buildSettleInput('开户名', '请输入开户名', s.accountName, 'bdSettleAccountName')
            );
            grid.appendChild(
                buildSettleInput(
                    '开户行所在城市',
                    '请输入开户行所在城市',
                    s.bankCity,
                    'bdSettleBankCity'
                )
            );
            form.appendChild(grid);

            var uploads = el('div', 'mdm-bd-settle-uploads');
            uploads.appendChild(buildSettleUpload('身份证人像面照片', 'bdSettleIdFront'));
            uploads.appendChild(buildSettleUpload('身份证国徽面照片', 'bdSettleIdBack'));
            uploads.appendChild(buildSettleUpload('银行卡照片', 'bdSettleBankPhoto'));
            form.appendChild(uploads);

            var footer = el('div', 'mdm-bd-settle-form-footer');
            var btnCancel = el('button', 'mdm-bd-detail-btn mdm-bd-detail-btn--default');
            btnCancel.type = 'button';
            btnCancel.textContent = '取消';
            var btnOk = el('button', 'mdm-bd-detail-btn mdm-bd-detail-btn--primary');
            btnOk.type = 'button';
            btnOk.textContent = '确定';

            btnCancel.addEventListener('click', function () {
                card.classList.remove('is-editing');
            });
            btnOk.addEventListener('click', function () {
                rec.settleIdCard = (document.getElementById('bdSettleIdCard').value || '').trim();
                rec.settleBankName = (document.getElementById('bdSettleBankName').value || '').trim();
                rec.settleBankCard = (document.getElementById('bdSettleBankCard').value || '').trim();
                rec.settleAccountName = (document.getElementById('bdSettleAccountName').value || '').trim();
                rec.settleBankCity = (document.getElementById('bdSettleBankCity').value || '').trim();
                persistSettlementToRow(sourceTr, getSettle());
                card.classList.remove('is-editing');
                paintView();
                if (typeof showToast === 'function') showToast('结算信息已保存（演示）', 'success');
            });

            footer.appendChild(btnCancel);
            footer.appendChild(btnOk);
            form.appendChild(footer);
            editHost.appendChild(form);
        }

        editBtn.addEventListener('click', function () {
            paintEdit();
            card.classList.add('is-editing');
        });

        paintView();
        return card;
    }

    function ensurePageStack() {
        var main = document.querySelector('.main-content');
        if (!main || document.getElementById('mdmBdPageStack')) return;

        var stack = el('div', 'mdm-bd-page-stack');
        stack.id = 'mdmBdPageStack';

        var listView = el('div', 'mdm-bd-list-view');
        listView.id = 'mdmBdListView';

        var nodes = [];
        for (var i = 0; i < main.childNodes.length; i++) {
            nodes.push(main.childNodes[i]);
        }
        nodes.forEach(function (n) {
            listView.appendChild(n);
        });

        var detailView = el('div', 'mdm-bd-detail-view');
        detailView.id = 'mdmBdDetailView';
        detailView.setAttribute('aria-hidden', 'true');

        stack.appendChild(listView);
        stack.appendChild(detailView);
        main.appendChild(stack);
    }

    function iconSearch() {
        return (
            '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">' +
            '<circle cx="6" cy="6" r="4.5" stroke="currentColor" stroke-width="1.2"/>' +
            '<path d="M9.5 9.5L12 12" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>'
        );
    }

    function iconReset() {
        return (
            '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">' +
            '<path d="M11 7A4 4 0 1 1 7 3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>' +
            '<path d="M7 1v2.5H4.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        );
    }

    function iconEdit() {
        return (
            '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">' +
            '<path d="M9.5 2.5l2 2L5 11H3v-2L9.5 2.5z" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/></svg>'
        );
    }

    function emptyBoxSvg() {
        return (
            '<svg class="mdm-bd-empty__icon" width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">' +
            '<path d="M12 24l20-10 20 10v24H12V24z" stroke="#d9d9d9" stroke-width="2" fill="#fafafa"/>' +
            '<path d="M24 34h16M24 40h10" stroke="#e8e8e8" stroke-width="2" stroke-linecap="round"/>' +
            '<path d="M32 14v10" stroke="#d9d9d9" stroke-width="2" stroke-linecap="round"/></svg>'
        );
    }

    function buildKvGrid(items, columns) {
        columns = columns || 4;
        var grid = el('div', 'mdm-bd-kv-grid');
        grid.style.gridTemplateColumns = 'repeat(' + columns + ', minmax(0, 1fr))';
        items.forEach(function (item, idx) {
            var cell = el('div', 'mdm-bd-kv-item');
            if ((idx + 1) % columns === 0) cell.classList.add('is-col-last');
            var lastRowStart = items.length - (((items.length - 1) % columns) + 1);
            if (idx >= lastRowStart) cell.classList.add('is-row-last');
            cell.appendChild(el('div', 'mdm-bd-kv-item__label', item[0]));
            cell.appendChild(el('div', 'mdm-bd-kv-item__value', dash(item[1])));
            grid.appendChild(cell);
        });
        return grid;
    }

    function buildMetricBar(items) {
        var bar = el('div', 'mdm-bd-metric-bar');
        items.forEach(function (item, idx) {
            if (idx > 0) bar.appendChild(el('div', 'mdm-bd-metric-bar__divider'));
            var block = el('div', 'mdm-bd-metric-item');
            block.appendChild(el('div', 'mdm-bd-metric-item__label', item[0]));
            block.appendChild(el('div', 'mdm-bd-metric-item__value', item[1]));
            bar.appendChild(block);
        });
        return bar;
    }

    function buildToolbar(opts) {
        opts = opts || {};
        var row = el('div', 'mdm-bd-detail-toolbar');
        var left = el('div', 'mdm-bd-detail-toolbar__left');

        if (opts.dateRange) {
            left.appendChild(el('span', 'mdm-bd-detail-toolbar__label', '选择日期'));
            var dateWrap = el('div', 'mdm-bd-detail-date-range');
            dateWrap.innerHTML =
                '<span class="mdm-bd-detail-date-range__icon" aria-hidden="true">📅</span>' +
                '<input type="text" class="mdm-bd-detail-date-range__input" placeholder="开始日期 - 结束日期" readonly>';
            left.appendChild(dateWrap);
        }

        row.appendChild(left);

        var actions = el('div', 'mdm-bd-detail-toolbar__actions');
        var btnQuery = el('button', 'mdm-bd-detail-btn mdm-bd-detail-btn--primary');
        btnQuery.type = 'button';
        btnQuery.innerHTML = iconSearch() + '<span>查询</span>';
        var btnReset = el('button', 'mdm-bd-detail-btn mdm-bd-detail-btn--default');
        btnReset.type = 'button';
        btnReset.innerHTML = iconReset() + '<span>重置</span>';
        btnReset.addEventListener('click', function () {
            row.querySelectorAll('input[type="text"]').forEach(function (inp) {
                if (!inp.readOnly || inp.classList.contains('mdm-bd-detail-date-range__input')) inp.value = '';
            });
            if (typeof opts.onReset === 'function') opts.onReset();
        });
        btnQuery.addEventListener('click', function () {
            if (typeof showToast === 'function') showToast('查询完成（演示）', 'info');
        });
        actions.appendChild(btnQuery);
        actions.appendChild(btnReset);
        row.appendChild(actions);
        return row;
    }

    function buildPaginationHost() {
        var host = el('div', 'mdm-bd-detail-pagination');
        host.innerHTML =
            '<span class="mdm-bd-detail-pagination__total">共 0 条</span>' +
            '<div class="mdm-bd-detail-pagination__mid">' +
            '<div class="mdm-bd-detail-page-size"><span>10</span><span class="mdm-bd-detail-page-size__arrow">▼</span></div>' +
            '<div class="mdm-bd-detail-page-nav">' +
            '<button type="button" class="mdm-bd-detail-page-btn" disabled aria-label="上一页">‹</button>' +
            '<button type="button" class="mdm-bd-detail-page-btn is-active">1</button>' +
            '<button type="button" class="mdm-bd-detail-page-btn" disabled aria-label="下一页">›</button>' +
            '</div></div>' +
            '<div class="mdm-bd-detail-pagination__goto">' +
            '<span>前往</span><input type="text" value="1" readonly><span>页</span></div>';
        return host;
    }

    function buildDataTable(headers, highlightHeaderIndex) {
        var wrap = el('div', 'mdm-bd-detail-table-wrap');
        var table = el('table', 'mdm-bd-detail-table');
        var thead = el('thead');
        var trh = el('tr');
        headers.forEach(function (h, idx) {
            var th = el('th', highlightHeaderIndex === idx ? 'is-muted' : '', h);
            trh.appendChild(th);
        });
        thead.appendChild(trh);
        table.appendChild(thead);

        var tbody = el('tbody');
        var emptyTr = el('tr', 'mdm-bd-detail-table__empty-row');
        var emptyTd = el('td');
        emptyTd.colSpan = headers.length;
        emptyTd.innerHTML =
            '<div class="mdm-bd-empty">' + emptyBoxSvg() + '<p>暂无数据</p></div>';
        emptyTr.appendChild(emptyTd);
        tbody.appendChild(emptyTr);
        table.appendChild(tbody);

        wrap.appendChild(table);
        return wrap;
    }

    function panelBase(rec, sourceTr) {
        var root = el('div', 'mdm-bd-detail-tab-panel');

        var card1 = el('div', 'mdm-bd-detail-card');
        card1.appendChild(el('h3', 'mdm-bd-detail-card__title', '基础信息'));
        card1.appendChild(
            buildKvGrid([
                ['BD推广员ID', rec.id],
                ['BD姓名', rec.name],
                ['手机号码', rec.phone],
                ['BD分类', rec.category],
                ['BD身份', rec.identity],
                ['BD上级', rec.superior === '—' ? '—' : rec.superior],
                ['会员编号', rec.memberNo],
                ['加入时间', rec.joinTime]
            ])
        );
        root.appendChild(card1);

        root.appendChild(buildSettlementCard(rec, sourceTr));
        return root;
    }

    function panelStores() {
        var root = el('div', 'mdm-bd-detail-tab-panel mdm-bd-detail-tab-panel--table');
        var card = el('div', 'mdm-bd-detail-card mdm-bd-detail-card--flush');
        card.appendChild(buildToolbar());
        card.appendChild(
            buildDataTable(
                [
                    '门店业务编号',
                    '门店名称',
                    '联系电话',
                    '进件状态',
                    '微信授权状态',
                    '支付宝授权状态',
                    '运作状态',
                    '门店状态',
                    '创建时间'
                ],
                3
            )
        );
        card.appendChild(buildPaginationHost());
        root.appendChild(card);
        return root;
    }

    function panelCommission(rec) {
        var root = el('div', 'mdm-bd-detail-tab-panel mdm-bd-detail-tab-panel--table');
        var card = el('div', 'mdm-bd-detail-card mdm-bd-detail-card--flush');
        card.appendChild(
            buildMetricBar([
                ['累计分佣', rec.totalCommission || '¥0.00'],
                ['订单数', '0'],
                ['商品销售数', '0']
            ])
        );
        card.appendChild(buildToolbar());
        card.appendChild(
            buildDataTable([
                '订单ID',
                '商品信息',
                '下单时间',
                '实付金额',
                '买家信息',
                '佣金',
                '结算状态',
                '分佣比例'
            ])
        );
        card.appendChild(buildPaginationHost());
        root.appendChild(card);
        return root;
    }

    function panelPerformance() {
        var root = el('div', 'mdm-bd-detail-tab-panel mdm-bd-detail-tab-panel--table');
        var card = el('div', 'mdm-bd-detail-card mdm-bd-detail-card--flush');
        card.appendChild(
            buildMetricBar([
                ['总成交订单数', '0'],
                ['总成交金额', '¥0.00'],
                ['总退款订单数', '0'],
                ['总退款金额', '¥0.00']
            ])
        );
        card.appendChild(buildToolbar({ dateRange: true }));
        card.appendChild(
            buildDataTable(['日期', '成交订单数', '成交金额', '退款订单数', '退款金额'])
        );
        card.appendChild(buildPaginationHost());
        root.appendChild(card);
        return root;
    }

    function closeDetail() {
        var stack = document.getElementById('mdmBdPageStack');
        var detailView = document.getElementById('mdmBdDetailView');
        if (!stack || !detailView) return;
        stack.classList.remove('is-detail-open');
        detailView.setAttribute('aria-hidden', 'true');
        setTimeout(function () {
            detailView.innerHTML = '';
        }, 280);
    }

    function openFromRow(tr, initialTab) {
        ensurePageStack();
        var rec = rowToRecord(tr);
        if (!rec) {
            if (typeof showToast === 'function') showToast('无法读取 BD 数据', 'error');
            return;
        }

        var stack = document.getElementById('mdmBdPageStack');
        var detailView = document.getElementById('mdmBdDetailView');
        if (!stack || !detailView) return;

        detailView.innerHTML = '';

        var page = el('div', 'mdm-bd-detail-page');

        var top = el('div', 'mdm-bd-detail-top');
        var backBtn = el('button', 'mdm-bd-detail-back');
        backBtn.type = 'button';
        backBtn.innerHTML = '<span class="mdm-bd-detail-back__arrow">&lt;</span> 返回';
        backBtn.addEventListener('click', closeDetail);
        top.appendChild(backBtn);

        var hero = el('div', 'mdm-bd-detail-hero');
        var nameRow = el('div', 'mdm-bd-detail-name-row');
        nameRow.appendChild(el('h1', 'mdm-bd-detail-name', rec.name));
        var tag = el('span', 'mdm-bd-detail-status' + (rec.enabled ? ' is-enabled' : ' is-disabled'));
        tag.textContent = rec.enabled ? '启用' : '禁用';
        nameRow.appendChild(tag);
        hero.appendChild(nameRow);
        hero.appendChild(el('div', 'mdm-bd-detail-meta', 'BD推广员ID：' + rec.id));
        top.appendChild(hero);
        page.appendChild(top);

        var tabsWrap = el('div', 'mdm-bd-detail-tabs');
        var bodyHost = el('div', 'mdm-bd-detail-body');
        var panels = {
            base: panelBase(rec, tr),
            stores: panelStores(),
            comm: panelCommission(rec),
            perf: panelPerformance()
        };

        var tabs = TAB_IDS.map(function (id, i) {
            var btn = el('button', 'mdm-bd-detail-tab' + (id === (initialTab || 'base') ? ' is-active' : ''));
            btn.type = 'button';
            btn.textContent = TAB_LABELS[i];
            btn.addEventListener('click', function () {
                TAB_IDS.forEach(function (tid, j) {
                    tabs[j].classList.toggle('is-active', tid === id);
                });
                bodyHost.innerHTML = '';
                bodyHost.appendChild(panels[id]);
            });
            tabsWrap.appendChild(btn);
            return btn;
        });

        page.appendChild(tabsWrap);
        page.appendChild(bodyHost);

        var tabKey = TAB_IDS.indexOf(initialTab || 'base');
        bodyHost.appendChild(panels[TAB_IDS[tabKey >= 0 ? tabKey : 0]]);

        detailView.appendChild(page);
        detailView.setAttribute('aria-hidden', 'false');

        requestAnimationFrame(function () {
            stack.classList.add('is-detail-open');
        });
    }

    window.MdmBdPromoterDetail = {
        rowToRecord: rowToRecord,
        openFromRow: openFromRow,
        close: closeDetail
    };
})();
