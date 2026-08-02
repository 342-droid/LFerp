/**
 * 资源中心档案 — 右侧滑出详情抽屉 + 多页签（对齐 vendor store-archive-ui / resource-archive-ui）
 */
(function () {
    var SUPPLIER_INBOUND_WAREHOUSE_BIND_KEY = 'mdm_supplier_inbound_warehouse_bindings_v1';
    var SUPPLIER_RECEIVE_ADDR_KEY = 'mdm_supplier_receive_addr_v1';
    var SUPPLIER_PAYMENT_AGREEMENT = {
        name: '斗拱平台综合支付服务协议',
        url: 'https://cloudpnrcdn.oss-cn-shanghai.aliyuncs.com/opps/api/prod/download_file/PaymentServiceAgreement.htm'
    };
    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text != null && text !== '') n.textContent = text;
        return n;
    }

    function mkBtn(label, primary, outlinePrimary) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'erp-btn' + (primary ? ' erp-btn--primary' : '');
        if (outlinePrimary) b.classList.add('erp-btn--outline-primary');
        b.textContent = label;
        return b;
    }

    function empty(host) {
        while (host && host.firstChild) host.removeChild(host.firstChild);
    }

    function nz(v) {
        if (v == null || v === '') return '—';
        return String(v);
    }

    function cellPlain(td) {
        if (!td) return '—';
        return td.textContent.replace(/\s+/g, ' ').trim() || '—';
    }

    function cellStatus(td) {
        if (!td) return '—';
        var s = td.querySelector('.status');
        return (s ? s.textContent : td.textContent).trim() || '—';
    }

    function readJsonStore(key) {
        try {
            var raw = localStorage.getItem(key);
            if (!raw) return {};
            var data = JSON.parse(raw);
            return data && typeof data === 'object' ? data : {};
        } catch (e) {
            return {};
        }
    }

    function readSupplierInboundWarehouseBinding(supplierId, supplierName) {
        var id = String(supplierId || '').trim();
        var name = String(supplierName || '').trim();
        var map = readJsonStore(SUPPLIER_INBOUND_WAREHOUSE_BIND_KEY);
        if (!map || typeof map !== 'object') return '—';
        if (id && map['id:' + id]) return String(map['id:' + id] || '').trim() || '—';
        if (name && map['name:' + name]) return String(map['name:' + name] || '').trim() || '—';
        return '—';
    }

    function removeArchiveDrawers() {
        document.querySelectorAll('[data-mdm-archive-drawer]').forEach(function (n) {
            n.remove();
        });
    }

    function sectionTitle(text) {
        return el('div', 'supplier-detail-section-title', text);
    }

    function sectionTitleWithAction(text, actionEl) {
        var head = el('div', 'supplier-detail-section-head');
        head.appendChild(sectionTitle(text));
        if (actionEl) {
            var acts = el('div', 'supplier-detail-section-head__actions');
            acts.appendChild(actionEl);
            head.appendChild(acts);
        }
        return head;
    }

    function blankable(v) {
        var s = String(v == null ? '' : v).trim();
        if (!s || s === '—') return '';
        return s;
    }

    function normalizeReceiveAddress(item, fallbackId) {
        return {
            id: String((item && item.id) || fallbackId || 'addr_' + Date.now()),
            receiverName: blankable(item && item.receiverName),
            receiverPhone: blankable(item && item.receiverPhone),
            region: blankable(item && item.region),
            detailAddress: blankable(item && item.detailAddress),
            isDefault: !!(item && item.isDefault)
        };
    }

    function listStoreReceiveAddresses(store) {
        var name = blankable(store && store.contact) || '—';
        var phone = blankable(store && store.phone) || '—';
        var region = blankable(store && store.region).replace(/\//g, ' / ') || '—';
        var detail = blankable(store && store.address) || '—';
        var list = [
            {
                receiverName: name,
                receiverPhone: phone,
                region: region,
                detailAddress: detail,
                isDefault: true
            }
        ];
        if (detail !== '—') {
            list.push({
                receiverName: name,
                receiverPhone: phone,
                region: region,
                detailAddress: detail + '（备选收货点）',
                isDefault: false
            });
        } else {
            list.push({
                receiverName: '仓库收货人',
                receiverPhone: phone === '—' ? '—' : phone,
                region: region,
                detailAddress: '备用收货地址（演示）',
                isDefault: false
            });
        }
        return list;
    }

    /** 代采业务读取默认收货地址 */
    function getStoreReceiveInfo(storeId, storeFallback) {
        var list = listStoreReceiveAddresses(storeFallback || {});
        var i;
        for (i = 0; i < list.length; i++) {
            if (list[i].isDefault) return list[i];
        }
        return list[0] || {
            receiverName: '',
            receiverPhone: '',
            region: '',
            detailAddress: '',
            isDefault: false
        };
    }

    function supplierReceiveSeed(supplier) {
        return [
            normalizeReceiveAddress(
                {
                    id: 'seed_default',
                    receiverName: blankable(supplier && supplier.contactName) || blankable(supplier && supplier.name),
                    receiverPhone: blankable(supplier && supplier.phone),
                    region: blankable(supplier && supplier.region).replace(/\//g, ' / '),
                    detailAddress: blankable(supplier && supplier.detailAddress),
                    isDefault: true
                },
                'seed_default'
            )
        ];
    }

    function loadSupplierReceiveAddresses(supplierId, supplier) {
        var id = String(supplierId || '').trim();
        var map = readJsonStore(SUPPLIER_RECEIVE_ADDR_KEY);
        if (id && Object.prototype.hasOwnProperty.call(map, id)) {
            var list = map[id];
            if (!Array.isArray(list)) return [];
            return list.map(function (it, idx) {
                return normalizeReceiveAddress(it, 'addr_' + idx);
            });
        }
        return supplierReceiveSeed(supplier);
    }

    function saveSupplierReceiveAddresses(supplierId, list) {
        var id = String(supplierId || '').trim();
        if (!id) return;
        var map = readJsonStore(SUPPLIER_RECEIVE_ADDR_KEY);
        map[id] = (list || []).map(function (it, idx) {
            return normalizeReceiveAddress(it, 'addr_' + idx);
        });
        try {
            localStorage.setItem(SUPPLIER_RECEIVE_ADDR_KEY, JSON.stringify(map));
        } catch (e) {}
    }

    function ensureOneDefaultReceive(list) {
        if (!list || !list.length) return list || [];
        var hasDefault = list.some(function (it) {
            return it.isDefault;
        });
        if (!hasDefault) list[0].isDefault = true;
        return list;
    }

    function getSupplierReceiveInfo(supplierId, supplierFallback) {
        var list = loadSupplierReceiveAddresses(supplierId, supplierFallback || {});
        var i;
        for (i = 0; i < list.length; i++) {
            if (list[i].isDefault) return list[i];
        }
        return list[0] || normalizeReceiveAddress({}, 'empty');
    }

    function buildReceiveFormCell(label, value, opts) {
        opts = opts || {};
        var cls = 'supplier-detail-cell';
        if (opts.span) cls += ' supplier-detail-cell--span' + opts.span;
        var c = el('div', cls);
        c.appendChild(el('div', 'supplier-detail-cell__label', label));
        var inp = document.createElement(opts.textarea ? 'textarea' : 'input');
        if (opts.textarea) {
            inp.className = 'erp-textarea store-receive-card__address';
            inp.rows = 1;
        } else {
            inp.type = 'text';
            inp.className = 'erp-input';
        }
        inp.value = value && value !== '—' ? value : '';
        if (opts.editable) {
            inp.readOnly = false;
            inp.disabled = false;
            inp.classList.add('store-receive-card__field--editable');
            if (opts.placeholder) inp.placeholder = opts.placeholder;
            else if (opts.textarea) inp.placeholder = '请输入详细地址';
            else if (label === '收货人') inp.placeholder = '请输入收货人';
            else if (label === '收货电话') inp.placeholder = '请输入收货电话';
        } else {
            inp.readOnly = true;
            inp.disabled = true;
        }
        var body = el('div', 'supplier-detail-cell__body');
        body.appendChild(inp);
        c.appendChild(body);
        return { cell: c, input: inp };
    }

    function buildReceiveRegionCell(value, editable) {
        var c = el('div', 'supplier-detail-cell');
        c.appendChild(el('div', 'supplier-detail-cell__label', '省市区'));
        var body = el('div', 'supplier-detail-cell__body');
        var fieldRef;
        if (
            window.MdmStoreRegionCascader &&
            typeof window.MdmStoreRegionCascader.create === 'function'
        ) {
            var cascader = window.MdmStoreRegionCascader.create(body, blankable(value) || '', {
                disabled: !editable
            });
            body.appendChild(cascader.wrap);
            fieldRef = {
                get value() {
                    return cascader.getValue();
                },
                set value(v) {
                    cascader.setValue(v);
                },
                getValue: function () {
                    return cascader.getValue();
                },
                cascader: cascader
            };
        } else {
            var inp = document.createElement('input');
            inp.type = 'text';
            inp.className = 'erp-input';
            inp.value = value && value !== '—' ? value : '';
            inp.readOnly = !editable;
            inp.disabled = !editable;
            if (editable) inp.classList.add('store-receive-card__field--editable');
            body.appendChild(inp);
            fieldRef = inp;
        }
        c.appendChild(body);
        return { cell: c, input: fieldRef };
    }

    function readReceiveFieldValue(field) {
        if (!field) return '';
        if (typeof field.getValue === 'function') return blankable(field.getValue());
        return blankable(field.value);
    }

    function buildReceiveAddressCard(item, idx, actions, editable) {
        var card = el('div', 'store-receive-card');
        if (editable) card.classList.add('store-receive-card--editing');
        var head = el('div', 'store-receive-card__head');
        var titleWrap = el('div', 'store-receive-card__title-wrap');
        titleWrap.appendChild(el('span', 'store-receive-card__title', '地址' + (idx + 1)));
        if (item.isDefault) {
            titleWrap.appendChild(el('span', 'mdm-detail-tag mdm-detail-tag--success', '默认'));
        }
        head.appendChild(titleWrap);
        if (actions) head.appendChild(actions);
        card.appendChild(head);

        var grid = el('div', 'supplier-detail-grid');
        var nameCell = buildReceiveFormCell('收货人', item.receiverName, { editable: editable });
        var phoneCell = buildReceiveFormCell('收货电话', item.receiverPhone, { editable: editable });
        var regionCell = buildReceiveRegionCell(item.region, editable);
        var defaultCell = buildReceiveFormCell('默认地址', item.isDefault ? '是' : '否', { editable: false });
        var addrCell = buildReceiveFormCell('详细地址', item.detailAddress, {
            textarea: true,
            span: 4,
            editable: editable
        });
        grid.appendChild(nameCell.cell);
        grid.appendChild(phoneCell.cell);
        grid.appendChild(regionCell.cell);
        grid.appendChild(defaultCell.cell);
        grid.appendChild(addrCell.cell);
        card.appendChild(grid);
        card._fields = {
            receiverName: nameCell.input,
            receiverPhone: phoneCell.input,
            region: regionCell.input,
            detailAddress: addrCell.input
        };
        return card;
    }

    function detailCell(label, value) {
        var c = el('div', 'supplier-detail-cell');
        c.appendChild(el('div', 'supplier-detail-cell__label', label));
        var b = el('div', 'supplier-detail-cell__body');
        b.textContent = nz(value);
        c.appendChild(b);
        return c;
    }

    function detailCellWarehouse(label, value) {
        var block = el('div', 'supplier-detail-cell supplier-detail-cell--span4');
        block.appendChild(el('div', 'supplier-detail-cell__label', label));
        var body = el('div', 'supplier-detail-cell__body');
        var wh = nz(value);
        body.textContent = wh;
        if (wh !== '—' && wh.indexOf('创建门店时选择的履约仓库') >= 0) {
            body.classList.add('store-detail-warehouse-red');
        }
        block.appendChild(body);
        return block;
    }

    /** 资源档案状态类字段 → 标签样式（与 ERP 语义色一致） */
    function archiveStatusVariant(text) {
        var s = String(text || '');
        if (/正常|启用|已进件|进件成功|已开通|营业|审核/.test(s)) return 'success';
        if (/冻结|停用|已拒绝|进件失败/.test(s)) return 'danger';
        if (/进件中|未进件|未提交|筹备|停业/.test(s)) return 'warning';
        return 'neutral';
    }

    function detailCellTagged(label, raw, preferTag) {
        var c = el('div', 'supplier-detail-cell');
        c.appendChild(el('div', 'supplier-detail-cell__label', label));
        var b = el('div', 'supplier-detail-cell__body');
        if (preferTag) {
            var sp = el('span', 'mdm-detail-tag mdm-detail-tag--' + archiveStatusVariant(raw));
            sp.textContent = nz(raw);
            b.appendChild(sp);
        } else {
            b.textContent = nz(raw);
        }
        c.appendChild(b);
        return c;
    }

    function resolvePaymentAgreementInfo(fields) {
        if (
            window.MdmUnifiedOnboardingUi &&
            typeof window.MdmUnifiedOnboardingUi.resolvePaymentAgreementInfo === 'function'
        ) {
            return window.MdmUnifiedOnboardingUi.resolvePaymentAgreementInfo(fields);
        }
        var f = fields || {};
        var pa = f.payment_agreement || {};
        return {
            signed: !!(f.payment_agreement_signed || pa.signed),
            name: String(pa.name || SUPPLIER_PAYMENT_AGREEMENT.name),
            url: String(pa.url || SUPPLIER_PAYMENT_AGREEMENT.url)
        };
    }

    function detailCellLink(label, linkText, href) {
        var c = el('div', 'supplier-detail-cell');
        c.appendChild(el('div', 'supplier-detail-cell__label', label));
        var b = el('div', 'supplier-detail-cell__body');
        var a = document.createElement('a');
        a.href = href;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = linkText;
        a.className = 'erp-link';
        b.appendChild(a);
        c.appendChild(b);
        return c;
    }

    function detailCellAgreementSigned(signed) {
        var c = el('div', 'supplier-detail-cell');
        c.appendChild(el('div', 'supplier-detail-cell__label', '协议签署'));
        var b = el('div', 'supplier-detail-cell__body');
        var sp = el('span', 'mdm-detail-tag mdm-detail-tag--' + (signed ? 'success' : 'warning'));
        sp.textContent = signed ? '已签署' : '未签署';
        b.appendChild(sp);
        c.appendChild(b);
        return c;
    }

    function paymentAgreementDetailCells(fields) {
        var info = resolvePaymentAgreementInfo(fields);
        return [
            detailCellAgreementSigned(info.signed),
            detailCellLink('协议名称', '《' + info.name + '》', info.url)
        ];
    }

    function appendPaymentAgreementSection(container, fields) {
        container.appendChild(sectionTitle('签订协议'));
        var grid = el('div', 'supplier-detail-grid');
        paymentAgreementDetailCells(fields).forEach(function (cell) {
            grid.appendChild(cell);
        });
        container.appendChild(grid);
    }

    function dataTable(headers, rows) {
        var wrap = el('div', 'erp-table-scroll');
        var table = el('table', 'erp-table');
        var thead = el('thead');
        var trh = el('tr');
        headers.forEach(function (h) {
            trh.appendChild(el('th', '', h));
        });
        thead.appendChild(trh);
        var tbody = el('tbody');
        rows.forEach(function (cells) {
            var tr = el('tr');
            cells.forEach(function (cell) {
                var td = el('td', '');
                if (cell && typeof cell === 'object' && cell.node && cell.node.nodeType) {
                    td.appendChild(cell.node);
                } else if (cell && typeof cell === 'object' && typeof cell.html === 'string') {
                    td.innerHTML = cell.html;
                } else {
                    td.textContent = cell;
                }
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(thead);
        table.appendChild(tbody);
        wrap.appendChild(table);
        return wrap;
    }

    function emptyNote(text) {
        return el('div', 'store-empty', text);
    }

    function summaryBar(spans) {
        var bar = el('div', 'store-summary-bar');
        spans.forEach(function (t) {
            bar.appendChild(el('span', '', t));
        });
        return bar;
    }

    function toolbarFilters(labels, withActions) {
        var bar = el('div', 'erp-toolbar');
        labels.forEach(function (lab) {
            var grp = el('div', 'modal-form-group');
            grp.style.marginBottom = '0';
            grp.appendChild(el('label', '', lab));
            var inp = el('input', 'erp-input');
            inp.type = 'text';
            inp.placeholder = '—';
            inp.style.minWidth = '160px';
            grp.appendChild(inp);
            bar.appendChild(grp);
        });
        if (withActions) {
            var ta = el('div', 'erp-toolbar__actions');
            ta.appendChild(mkBtn('重置', false));
            ta.appendChild(mkBtn('查询', true));
            bar.appendChild(ta);
        }
        return bar;
    }

    function fakePagination() {
        var bar = el('div', 'erp-pagination');
        bar.appendChild(el('span', 'erp-pagination__total', '演示分页'));
        return bar;
    }

    function formatTs(ts) {
        if (!ts) return '—';
        var d = new Date(ts);
        if (isNaN(d.getTime())) return '—';
        return (
            d.getFullYear() +
            '-' +
            String(d.getMonth() + 1).padStart(2, '0') +
            '-' +
            String(d.getDate()).padStart(2, '0') +
            ' ' +
            String(d.getHours()).padStart(2, '0') +
            ':' +
            String(d.getMinutes()).padStart(2, '0')
        );
    }

    function onboardStatusText(st) {
        if (st === '待总监审核') return '待总监审核';
        if (st === '待财务审核') return '待财务审核';
        if (st === '待汇付审核') return '待汇付审核';
        if (st === '审核成功') return '审核成功';
        if (st === '审核失败') return '审核失败';
        if (st === 'rejected') return '审核失败';
        if (st === 'submitted') return '待BD审核';
        if (st === 'draft') return '未提交';
        return '未发起';
    }

    function onboardRecordKey(kind, id) {
        return 'archive::' + kind + '::' + String(id || '');
    }

    function getOnboardingSummary(recordKey, defaults) {
        if (
            window.MdmUnifiedOnboardingUi &&
            typeof window.MdmUnifiedOnboardingUi.getSummary === 'function'
        ) {
            return window.MdmUnifiedOnboardingUi.getSummary(recordKey, defaults || {});
        }
        return { status: '', submittedAt: null, updatedAt: null, fields: defaults || {} };
    }

    function maskMiddle(v) {
        var s = String(v || '').trim();
        if (!s) return '—';
        if (s.length <= 8) return s;
        return s.slice(0, 4) + '****' + s.slice(-4);
    }

    function maskBank(v) {
        var s = String(v || '').replace(/\s+/g, '');
        if (!s) return '—';
        if (s.length <= 8) return s;
        return s.slice(0, 4) + ' **** **** ' + s.slice(-4);
    }

    function auditStepText(node) {
        var n = String(node || '').trim();
        if (!n || n === '—') return '—';
        if (n === 'BD') return 'BD预审';
        if (n === 'BD总监') return 'BD总监审核';
        if (n === '财务') return '财务审核';
        if (n === '汇付') return '汇付审核';
        return n;
    }

    function flowStatusText(auditStatus, status) {
        if (auditStatus === '审核成功') return '成功';
        if (auditStatus === '审核失败') return '失败';
        if (auditStatus) return '审核中';
        if (status === 'draft') return '草稿';
        return '审核中';
    }

    function demoPhoto(label) {
        var text = String(label || '进件照片');
        var svg =
            '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="220" viewBox="0 0 360 220">' +
            '<defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1">' +
            '<stop offset="0" stop-color="#e2e8f0"/><stop offset="1" stop-color="#f8fafc"/></linearGradient></defs>' +
            '<rect width="360" height="220" rx="14" fill="url(#g)"/>' +
            '<rect x="24" y="24" width="312" height="130" rx="10" fill="#cbd5e1"/>' +
            '<text x="180" y="194" text-anchor="middle" font-size="15" font-family="Arial, sans-serif" fill="#334155">' +
            text +
            '</text></svg>';
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }

    function resolvePhotoSrc(v, label) {
        if (typeof v === 'string') {
            var s = v.trim();
            if (s) return s;
        }
        if (v === true) return demoPhoto(label);
        return '';
    }

    function openOnboardingDetailModal(meta) {
        var m = meta || {};
        var summary = getOnboardingSummary(m.recordKey, m.defaults || {});
        var ui =
            window.MdmUnifiedOnboardingUi && typeof window.MdmUnifiedOnboardingUi.getRecord === 'function' ?
                window.MdmUnifiedOnboardingUi :
                null;
        var rec = ui ? ui.getRecord(m.recordKey) || {} : {};
        var ext = rec.ext || {};
        var f = summary.fields || {};
        var card = f.card_info || {};
        var lic = f.license_info || {};
        var legal = f.legal_info || {};
        var auditStatus = summary.auditStatus || onboardStatusText(summary.status);
        var node = summary.nextAuditNode || rec.nextAuditNode || '';

        var backdrop = el('div', 'erp-modal-backdrop');
        var modal = el('div', 'erp-modal erp-modal--store-wide');
        var header = el('div', 'erp-modal__header');
        header.appendChild(el('h2', 'erp-modal__title', '进件详情'));
        var closeBtn = el('button', 'erp-modal__header-btn');
        closeBtn.type = 'button';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', function () {
            backdrop.remove();
        });
        var acts = el('div', 'erp-modal__header-actions');
        acts.appendChild(closeBtn);
        header.appendChild(acts);

        var body = el('div', 'erp-modal__body');
        function makePhotoCell(label, src) {
            var c = el('div', 'supplier-detail-cell');
            c.appendChild(el('div', 'supplier-detail-cell__label', label));
            var b = el('div', 'supplier-detail-cell__body');
            var v = resolvePhotoSrc(src, label);
            if (!v) {
                b.textContent = '待上传';
            } else {
                var tile = el('div');
                tile.style.width = '100%';
                tile.style.maxWidth = '180px';
                tile.style.height = '112px';
                tile.style.border = '1px solid #e5e7eb';
                tile.style.borderRadius = '8px';
                tile.style.overflow = 'hidden';
                tile.style.background = '#f8fafc';
                tile.style.display = 'flex';
                tile.style.alignItems = 'center';
                tile.style.justifyContent = 'center';
                var img = document.createElement('img');
                img.src = v;
                img.alt = label;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                img.onerror = function () {
                    tile.innerHTML = '';
                    tile.appendChild(el('span', '', '已上传'));
                };
                tile.appendChild(img);
                b.appendChild(tile);
            }
            c.appendChild(b);
            return c;
        }
        function appendSection(title, rows) {
            body.appendChild(sectionTitle(title));
            var grid = el('div', 'supplier-detail-grid');
            rows.forEach(function (it) {
                if (it[2] === 'image') {
                    grid.appendChild(makePhotoCell(it[0], it[1]));
                } else {
                    grid.appendChild(detailCell(it[0], it[1]));
                }
            });
            body.appendChild(grid);
        }

        appendSection('基础信息', [
            ['商户名称', m.merchantName || ext.merchantName || '—'],
            ['汇付商户号', m.huifuMerchantNo || ext.huifuId || '—'],
            ['主体类型', m.subjectType || ext.subjectType || '—'],
            ['所属集团主体', m.groupName || ext.groupName || '—'],
            ['进件状态', flowStatusText(auditStatus, summary.status)],
            ['驳回原因', rec.rejectReason || ext.rejectReason || '—']
        ]);
        appendSection('进件流程信息', [
            ['审核环节', auditStepText(node)],
            ['进件渠道', rec.onboardingChannel || ext.onboardingChannel || '后台'],
            ['创建时间', formatTs(rec.createdAt || summary.submittedAt)],
            ['提交汇付时间', formatTs(summary.submittedAt)],
            ['汇付审核完成时间', formatTs(rec.completedAt || ext.completedAt)],
            ['MCC行业', rec.mccIndustry || ext.mccIndustry || '—'],
            ['请求流水号', rec.reqSeqId || ext.reqSeqId || '—'],
            ['外部商户号', rec.extMerId || ext.extMerId || '—'],
            ['创建人', rec.creator || ext.creator || '—'],
            ['备注', rec.remarks || ext.remarks || '—']
        ]);
        appendSection('主体关系信息', [
            ['上级汇付号', rec.headHuifuId || ext.headHuifuId || '—'],
            ['结算主体类型', m.settlementSubject || rec.settlementBodyType || ext.settlementBodyType || '—']
        ]);
        appendSection('执照信息', [
            ['营业执照', f.license_pic, 'image'],
            ['营业执照名称', lic.name || rec.regName || ext.regName || '—'],
            ['证件代码', lic.code || rec.licenseCode || ext.licenseCode || '—'],
            ['执照起始日期', lic.start_date || rec.licenseBeginDate || ext.licenseBeginDate || '—'],
            ['执照有效期', lic.valid_date || rec.licenseEndDate || ext.licenseEndDate || '—'],
            ['注册地址', lic.address || rec.regDetail || ext.regDetail || '—']
        ]);
        appendSection('法人基本信息', [
            ['身份证人像面', f.legal_cert_front_pic, 'image'],
            ['身份证国徽面', f.legal_cert_back_pic, 'image'],
            ['法人姓名', legal.legal_name || rec.legalName || ext.legalName || '—'],
            ['身份证号', legal.id_no || maskMiddle(rec.legalIdNo || ext.legalIdNo)],
            ['身份证起始日期', legal.id_start_date || rec.legalCertBeginDate || ext.legalCertBeginDate || '—'],
            ['身份证有效期', legal.id_valid_date || rec.legalCertEndDate || ext.legalCertEndDate || '—']
        ]);
        appendSection('商户信息', [
            ['商户简称', f.short_name || '—'],
            ['小票名称', f.receipt_name || '—'],
            ['实际经营地址', f.detail_addr || '—'],
            ['法人手机号', f.legal_mobile_no || '—'],
            ['管理员手机号', f.contact_mobile_no || m.contactMobile || '—'],
            ['管理员邮箱', f.contact_email || '—']
        ]);
        appendSection('结算信息', [
            ['开户许可证', f.open_license_pic || rec.openLicencePic || ext.openLicencePic || '', 'image'],
            ['开户名/结算户名', card.account_name || '—'],
            ['银行账号', maskBank(card.card_no)],
            ['开户银行', card.bank_name || '—'],
            ['开户支行', card.bank_branch || '—']
        ]);
        appendSection('门店场地', [
            ['经营场所名称', m.merchantName || rec.placeName || ext.placeName || '—'],
            ['门头/场地照', f.store_header_pic, 'image'],
            ['内景/工作区域照', f.store_indoor_pic, 'image'],
            ['收银台/前台照', f.store_cashier_desk_pic, 'image']
        ]);
        if (resolveOnboardingKind(m.title) === 'supplier') {
            appendPaymentAgreementSection(body, f);
        }

        var footer = el('div', 'erp-modal__footer');
        var ok = mkBtn('关闭', true);
        ok.addEventListener('click', function () {
            backdrop.remove();
        });
        footer.appendChild(ok);
        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);
        backdrop.appendChild(modal);
        backdrop.addEventListener('click', function (ev) {
            if (ev.target === backdrop) backdrop.remove();
        });
        document.body.appendChild(backdrop);
    }

    function resolveOnboardingKind(title, extraOpts) {
        if (extraOpts && extraOpts.onboardingKind) return extraOpts.onboardingKind;
        if (title === '供应商进件') return 'supplier';
        if (title === '直播间进件') return 'liveRoom';
        if (title === '承运商进件') return 'carrier';
        if (title === '门店进件') return 'store';
        return '';
    }

    function openOnboardResource(title, shortName, defaults, recordKey, extraOpts) {
        if (
            !window.MdmUnifiedOnboardingUi ||
            typeof window.MdmUnifiedOnboardingUi.openModal !== 'function'
        ) {
            if (typeof showToast === 'function') showToast('进件模块未加载', 'error');
            return;
        }
        var kind = resolveOnboardingKind(title, extraOpts);
        var modalOpts = {
            title: title,
            merchantShortNameDefault: shortName || '',
            fieldDefaults: defaults || {},
            recordKey: recordKey,
            variant: 'resource',
            onboardingKind: kind,
            forceView: !!(extraOpts && extraOpts.forceView)
        };
        if (kind === 'supplier' && extraOpts && extraOpts.supplierId) {
            modalOpts.onRecordChange = function (payload) {
                if (
                    window.MdmSupplierArchiveUi &&
                    typeof window.MdmSupplierArchiveUi.syncRow === 'function'
                ) {
                    var tr =
                        window.MdmSupplierArchiveUi.findRow &&
                        typeof window.MdmSupplierArchiveUi.findRow === 'function'
                            ? window.MdmSupplierArchiveUi.findRow(extraOpts.supplierId)
                            : null;
                    if (tr) window.MdmSupplierArchiveUi.syncRow(tr, payload);
                }
            };
        }
        window.MdmUnifiedOnboardingUi.openModal(modalOpts);
    }

    function openOnboardStore(shortName, defaults, recordKey, extraOpts) {
        if (
            window.MdmUnifiedOnboardingUi &&
            typeof window.MdmUnifiedOnboardingUi.openModal === 'function'
        ) {
            window.MdmUnifiedOnboardingUi.openModal({
                title: '门店进件',
                merchantShortNameDefault: shortName || '',
                fieldDefaults: defaults || {},
                recordKey: recordKey,
                variant: 'store',
                forceView: !!(extraOpts && extraOpts.forceView)
            });
        } else if (typeof showToast === 'function') {
            showToast('进件模块未加载', 'error');
        }
    }

    var ONBOARD_LIST_HEADERS = [
        '商户名称',
        '主体类型',
        '所属集团',
        '进件状态',
        '汇付商户号',
        '结算主体',
        '联系人手机号',
        '提交时间',
        '操作'
    ];

    function storeOnboardingDefaults(store) {
        return {
            short_name: nz(store.name) === '—' ? '' : store.name,
            receipt_name: nz(store.name) === '—' ? '' : store.name,
            detail_addr: nz(store.address) === '—' ? '' : store.address,
            legal_mobile_no: '',
            contact_mobile_no: nz(store.phone) === '—' ? '' : store.phone,
            contact_email: '',
            card_info: {
                account_name: '',
                card_no: '',
                bank_name: '',
                bank_branch: ''
            },
            license_info: {},
            legal_info: {},
            license_pic: '',
            legal_cert_front_pic: '',
            legal_cert_back_pic: '',
            open_license_pic: '',
            store_header_pic: '档案门头照',
            store_indoor_pic: '',
            store_cashier_desk_pic: ''
        };
    }

    function resourceOnboardingDefaults(name, detailAddr, phone) {
        return {
            short_name: nz(name) === '—' ? '' : name,
            receipt_name: nz(name) === '—' ? '' : name,
            detail_addr: nz(detailAddr) === '—' ? '' : detailAddr,
            legal_mobile_no: '',
            contact_mobile_no: nz(phone) === '—' ? '' : phone,
            contact_email: '',
            card_info: {
                account_name: '',
                card_no: '',
                bank_name: '',
                bank_branch: ''
            },
            license_info: {},
            legal_info: {},
            license_pic: '',
            legal_cert_front_pic: '',
            legal_cert_back_pic: '',
            open_license_pic: '',
            store_header_pic: '',
            store_indoor_pic: '',
            store_cashier_desk_pic: ''
        };
    }

    function cardInfoText(card) {
        var c = card || {};
        var parts = [];
        if (c.account_name) parts.push(c.account_name);
        if (c.card_no) parts.push(c.card_no);
        if (c.bank_name) parts.push(c.bank_name);
        if (c.bank_branch) parts.push(c.bank_branch);
        return parts.length ? parts.join(' / ') : '待填写';
    }

    function uploadedText(v) {
        return v ? '已上传' : '待上传';
    }

    function cloneObj(v) {
        if (!v || typeof v !== 'object') return v;
        try {
            return JSON.parse(JSON.stringify(v));
        } catch (e) {
            return v;
        }
    }

    function firstMissingOnboardingField(fields) {
        var f = fields || {};
        var lic = f.license_info || {};
        var legal = f.legal_info || {};
        var checks = [
            { key: 'short_name', label: '商户简称' },
            { key: 'receipt_name', label: '小票名称' },
            { key: 'detail_addr', label: '实际经营地址' },
            { key: 'legal_mobile_no', label: '法人手机号' },
            { key: 'contact_mobile_no', label: '管理员手机号' },
            { key: 'contact_email', label: '管理员邮箱' },
            { key: 'license_pic', label: '营业执照(F07)' },
            { key: 'name', label: '营业执照名称', bucket: lic },
            { key: 'code', label: '证件代码', bucket: lic },
            { key: 'start_date', label: '执照起始日期', bucket: lic },
            { key: 'valid_date', label: '执照有效期', bucket: lic },
            { key: 'address', label: '注册地址', bucket: lic },
            { key: 'legal_cert_front_pic', label: '法人身份证人像面(F02)' },
            { key: 'legal_cert_back_pic', label: '法人身份证国徽面(F03)' },
            { key: 'legal_name', label: '法人姓名', bucket: legal },
            { key: 'id_no', label: '身份证号', bucket: legal },
            { key: 'id_start_date', label: '身份证起始日期', bucket: legal },
            { key: 'id_valid_date', label: '身份证有效期', bucket: legal },
            { key: 'open_license_pic', label: '开户许可证' },
            { key: 'store_header_pic', label: '门头/场地照(F22)' },
            { key: 'store_indoor_pic', label: '内景/工作区域照(F24)' },
            { key: 'store_cashier_desk_pic', label: '收银台/前台照(F105)' }
        ];
        var i;
        for (i = 0; i < checks.length; i++) {
            var check = checks[i];
            var val = check.bucket ? check.bucket[check.key] : f[check.key];
            if (!val || !String(val).trim()) return check.label;
        }
        var card = f.card_info || {};
        if (!card.account_name || !String(card.account_name).trim()) return '银行卡户名';
        if (!card.card_no || !String(card.card_no).trim()) return '银行卡号';
        if (!card.bank_name || !String(card.bank_name).trim()) return '开户行';
        if (!card.bank_branch || !String(card.bank_branch).trim()) return '开户支行';
        return '';
    }

    function submitOnboardingRecord(meta) {
        var ui = window.MdmUnifiedOnboardingUi;
        if (!ui || typeof ui.upsertRecord !== 'function' || typeof ui.getRecord !== 'function') {
            if (typeof showToast === 'function') showToast('进件模块未加载', 'error');
            return false;
        }
        var recordKey = meta.recordKey;
        var fallbackDefaults = cloneObj(meta.defaults || {});
        var summary = getOnboardingSummary(recordKey, fallbackDefaults);
        var fields = summary.fields || fallbackDefaults;
        var missing = firstMissingOnboardingField(fields);
        if (missing) {
            if (typeof showToast === 'function') showToast('请先完善：' + missing, 'error');
            return false;
        }
        if (meta.title === '供应商进件') {
            var agreementInfo = resolvePaymentAgreementInfo(fields);
            if (!agreementInfo.signed) {
                if (typeof showToast === 'function') {
                    showToast('请先阅读并勾选《斗拱平台综合支付服务协议》', 'error');
                }
                return false;
            }
        }
        var now = Date.now();
        var oldRec = ui.getRecord(recordKey) || {};
        var rec = {
            key: String(recordKey || ''),
            title: meta.title || oldRec.title || '',
            merchantShortName: meta.shortName || oldRec.merchantShortName || '',
            status: 'submitted',
            fields: cloneObj(fields),
            updatedAt: now,
            submittedAt: oldRec.submittedAt || now,
            auditChain: '门店 -> BD -> 财务 -> 汇付',
            nextAuditNode: 'BD'
        };
        ui.upsertRecord(recordKey, rec);
        if (typeof showToast === 'function') showToast('已提交上级审核', 'success');
        return true;
    }

    function makeOnboardActionCell(meta, refresh) {
        var m = meta || {};
        var wrap = el('div', 'action-links');
        var status = m.onboardStatus;
        var editable =
            status !== 'submitted' &&
            status !== '待BD审核' &&
            status !== '待总监审核' &&
            status !== '待财务审核' &&
            status !== '待汇付审核' &&
            status !== '审核成功';
        var submitLabel = status === '审核失败' || status === 'rejected' ? '重新提交' : '提交进件';
        function opBtn(label, onClick) {
            var btn = el('button', 'erp-link-like-btn', label);
            btn.type = 'button';
            btn.style.border = 'none';
            btn.style.background = 'transparent';
            btn.style.color = '#1677ff';
            btn.style.cursor = 'pointer';
            btn.style.padding = '0';
            btn.style.marginRight = '10px';
            btn.style.fontSize = '12px';
            btn.addEventListener('click', function (ev) {
                ev.preventDefault();
                onClick();
            });
            return btn;
        }
        wrap.appendChild(
            opBtn('查看', function () {
                openOnboardingDetailModal(m);
            })
        );
        if (editable) {
            wrap.appendChild(
                opBtn('删除', function () {
                    if (
                        window.MdmUnifiedOnboardingUi &&
                        typeof window.MdmUnifiedOnboardingUi.removeRecord === 'function'
                    ) {
                        window.MdmUnifiedOnboardingUi.removeRecord(m.recordKey);
                        if (typeof showToast === 'function') showToast('已删除进件草稿', 'success');
                        refresh();
                    }
                })
            );
            wrap.appendChild(
                opBtn('编辑', function () {
                    m.openModal(false);
                })
            );
            wrap.appendChild(
                opBtn(submitLabel, function () {
                    if (status === '审核失败' || status === 'rejected') {
                        m.openModal(false);
                        return;
                    }
                    if (submitOnboardingRecord(m)) refresh();
                })
            );
        }
        return { node: wrap };
    }

    function buildOnboardListRow(meta, refresh) {
        var m = meta || {};
        return [
            nz(m.merchantName),
            nz(m.subjectType),
            nz(m.groupName),
            onboardStatusText(m.onboardStatus),
            nz(m.huifuMerchantNo),
            nz(m.settlementSubject),
            nz(m.contactMobile),
            nz(m.submitTime),
            makeOnboardActionCell(m, refresh)
        ];
    }

    function onboardingDetailCells(fields, kind) {
        var f = fields || {};
        var card = f.card_info || {};
        var lic = f.license_info || {};
        var legal = f.legal_info || {};
        var cells = [
            detailCell('商户简称', f.short_name || '—'),
            detailCell('小票名称', f.receipt_name || '—'),
            detailCell('实际经营地址', f.detail_addr || '—'),
            detailCell('法人手机号', f.legal_mobile_no || '—'),
            detailCell('管理员手机号', f.contact_mobile_no || '—'),
            detailCell('管理员邮箱', f.contact_email || '—'),
            detailCell('银行卡信息配置', cardInfoText(card)),
            detailCell('营业执照(F07)', f.license_pic ? '已上传' : '待上传'),
            detailCell('营业执照名称', lic.name || '—'),
            detailCell('证件代码', lic.code || '—'),
            detailCell('执照起始日期', lic.start_date || '—'),
            detailCell('执照有效期', lic.valid_date || '—'),
            detailCell('注册地址', lic.address || '—'),
            detailCell('法人身份证人像面(F02)', f.legal_cert_front_pic ? '已上传' : '待上传'),
            detailCell('法人身份证国徽面(F03)', f.legal_cert_back_pic ? '已上传' : '待上传'),
            detailCell('法人姓名', legal.legal_name || '—'),
            detailCell('身份证号', legal.id_no || '—'),
            detailCell('身份证起始日期', legal.id_start_date || '—'),
            detailCell('身份证有效期', legal.id_valid_date || '—'),
            detailCell('开户许可证', f.open_license_pic ? '已上传' : '待上传'),
            detailCell('门头/场地照(F22)', f.store_header_pic ? '已上传' : '待上传'),
            detailCell('内景/工作区域照(F24)', f.store_indoor_pic ? '已上传' : '待上传'),
            detailCell('收银台/前台照(F105)', f.store_cashier_desk_pic ? '已上传' : '待上传')
        ];
        if (kind === 'supplier') {
            cells = cells.concat(paymentAgreementDetailCells(f));
        }
        return cells;
    }

    function rowToStore(tr) {
        var c = tr.querySelectorAll('td');
        if (c.length < 20) return null;
        var name = cellPlain(c[2]);
        var partner = cellPlain(c[3]);
        var isFP = partner === '加盟店' || partner === '合作店';
        var isPeer = partner === '同行店';
        return {
            name: name,
            storeId: cellPlain(c[0]),
            orgId: cellPlain(c[1]),
            subjectName: cellPlain(c[1]),
            contact: cellPlain(c[6]),
            phone: cellPlain(c[7]),
            shortName: '—',
            partnerDivision: partner,
            storeType: cellPlain(c[4]),
            bd: cellPlain(c[5]),
            fulfillWarehouse: cellPlain(c[8]),
            region: cellPlain(c[9]),
            address: cellPlain(c[10]),
            latlng: cellPlain(c[11]),
            withdrawPhone: cellPlain(c[12]),
            opStatus: cellPlain(c[13]),
            onboardStatus: cellPlain(c[14]),
            settleType: cellPlain(c[15]),
            settleCycle: cellPlain(c[16]),
            splitService: cellPlain(c[17]),
            storeStatus: cellStatus(c[18]),
            createTime: cellPlain(c[19]),
            onboardChannelGuess: cellPlain(c[15]) !== '—' ? '支付宝/微信（演示）' : '—',
            hasRefrigerator: false,
            hasFreezer: false,
            detailTags: [],
            isFranchiseOrPartner: isFP,
            isPeerStore: isPeer
        };
    }

    function storeHeroTags(store) {
        var tags = [];
        var st = store.storeStatus;
        if (st === '正常') tags.push({ kind: 'orange', label: '门店正常' });
        else if (st === '停用') tags.push({ kind: 'gray', label: '停用' });
        else if (st === '冻结') tags.push({ kind: 'gray', label: '冻结' });
        if (store.opStatus && store.opStatus !== '—') {
            tags.push({ kind: 'gray', label: store.opStatus });
        }
        return tags;
    }

    function panelStoreBase(store) {
        var p = el('div', 'supplier-detail-tab');
        p.appendChild(sectionTitle('基础信息'));

        var grid = el('div', 'supplier-detail-grid');
        var regionDisp = store.region ? store.region.replace(/\//g, ' / ') : '—';

        grid.appendChild(detailCell('门店ID', store.storeId));
        grid.appendChild(detailCell('主体名称', store.subjectName));
        grid.appendChild(detailCell('联系人', store.contact));
        grid.appendChild(detailCell('手机号码', store.phone));

        grid.appendChild(detailCell('门店名称', store.name));
        grid.appendChild(detailCell('门店简称', store.shortName));
        grid.appendChild(detailCell('门店合作类型', store.partnerDivision));
        grid.appendChild(detailCell('门店类型', store.storeType));

        grid.appendChild(detailCell('绑定BD', store.bd));
        grid.appendChild(detailCell('配送仓库', store.fulfillWarehouse));
        grid.appendChild(detailCell('省市区', regionDisp));
        grid.appendChild(detailCell('详细地址', store.address));

        grid.appendChild(detailCell('经纬度', store.latlng));
        grid.appendChild(detailCell('运营状态', store.opStatus));
        grid.appendChild(detailCell('进件状态', store.onboardStatus));
        grid.appendChild(detailCell('结算类型', store.settleType));

        grid.appendChild(detailCell('结算周期', store.settleCycle));
        grid.appendChild(detailCell('分账服务', store.splitService));
        grid.appendChild(detailCellTagged('门店状态', store.storeStatus, true));
        grid.appendChild(detailCell('可提现手机号', store.withdrawPhone));

        var thumbRow = el('div', 'supplier-detail-cell');
        thumbRow.appendChild(el('div', 'supplier-detail-cell__label', '门店门头照'));
        var tw = el('div', 'store-detail-thumb-row');
        tw.appendChild(el('div', 'store-detail-thumb store-detail-thumb--lg'));
        thumbRow.appendChild(tw);
        grid.appendChild(thumbRow);

        grid.appendChild(detailCellWarehouse('门店仓库', store.fulfillWarehouse));

        var fr = el('div', 'supplier-detail-cell');
        fr.appendChild(el('div', 'supplier-detail-cell__label', '冷藏柜 / 冷冻柜'));
        var frRow = el('div', 'store-detail-fridge-row');
        frRow.appendChild(el('span', 'store-detail-yesno', '无'));
        fr.appendChild(frRow);
        grid.appendChild(fr);

        if (store.isFranchiseOrPartner) {
            grid.appendChild(detailCell('门店面积（㎡）', '—'));
            grid.appendChild(detailCell('门店楼层', '—'));
            grid.appendChild(detailCell('店门口口述视频', '—'));
            grid.appendChild(detailCell('店内口述视频', '—'));
            grid.appendChild(detailCell('门店方圆500米入住户数', '—'));
            grid.appendChild(detailCell('日均客单量', '—'));
            grid.appendChild(detailCell('店内工作人员总数', '—'));
            grid.appendChild(detailCell('实际经营者对直播业务的理解', '—'));
            grid.appendChild(detailCell('门店日常运营服务理解与配合', '—'));
            grid.appendChild(detailCell('私域直播投入产出期望', '—'));
            grid.appendChild(detailCell('私域直播/社区团购熟悉程度', '—'));
            grid.appendChild(detailCell('周边小区及居住人群描述', '—'));
            grid.appendChild(detailCell('拉到1000人信心说明', '—'));
            grid.appendChild(detailCell('特殊情况说明', '—'));
            grid.appendChild(detailCell('特殊情况配图', '—'));
        }
        if (store.isPeerStore) {
            grid.appendChild(detailCell('已合作其他平台情况', '—'));
            grid.appendChild(detailCell('近三天上播及销量截图', '—'));
        }

        grid.appendChild(detailCell('创建时间', store.createTime));
        p.appendChild(grid);

        appendStoreReceiveSection(p, store);
        return p;
    }

    function appendStoreReceiveSection(panel, store) {
        panel.appendChild(sectionTitle('收货信息'));
        var list = listStoreReceiveAddresses(store);
        var wrap = el('div', 'store-receive-list');
        list.forEach(function (item, idx) {
            wrap.appendChild(buildReceiveAddressCard(item, idx));
        });
        panel.appendChild(wrap);
    }

    function appendSupplierReceiveSection(panel, supplier) {
        var supplierId = supplier.id || 'unknown';
        var addBtn = mkBtn('新增地址', true);
        panel.appendChild(sectionTitleWithAction('收货地址', addBtn));

        var wrap = el('div', 'store-receive-list');
        panel.appendChild(wrap);
        var editingId = null;
        var draftItem = null;

        function persistAndRender(list) {
            ensureOneDefaultReceive(list);
            saveSupplierReceiveAddresses(supplierId, list);
            editingId = null;
            draftItem = null;
            render();
        }

        function displayList() {
            var list = loadSupplierReceiveAddresses(supplierId, supplier).slice();
            if (draftItem) {
                var exists = list.some(function (it) {
                    return it.id === draftItem.id;
                });
                if (!exists) list.push(draftItem);
            }
            return list;
        }

        function readCardFields(card, baseItem) {
            var f = card._fields || {};
            return normalizeReceiveAddress(
                {
                    id: baseItem.id,
                    receiverName:
                        f.receiverName != null
                            ? readReceiveFieldValue(f.receiverName)
                            : baseItem.receiverName,
                    receiverPhone:
                        f.receiverPhone != null
                            ? readReceiveFieldValue(f.receiverPhone)
                            : baseItem.receiverPhone,
                    region: f.region != null ? readReceiveFieldValue(f.region) : baseItem.region,
                    detailAddress:
                        f.detailAddress != null
                            ? readReceiveFieldValue(f.detailAddress)
                            : baseItem.detailAddress,
                    isDefault: !!baseItem.isDefault
                },
                baseItem.id
            );
        }

        function validateReceiveFields(data) {
            if (!data.receiverName || !data.receiverPhone || !data.region || !data.detailAddress) {
                if (typeof showToast === 'function') showToast('收货信息不完整，请填写全部必填项', 'error');
                return false;
            }
            return true;
        }

        function render() {
            empty(wrap);
            var list = displayList();
            if (!list.length) {
                wrap.appendChild(emptyNote('暂无收货地址'));
                return;
            }
            list.forEach(function (item, idx) {
                var isDraft = !!(draftItem && draftItem.id === item.id);
                var isEditing = editingId === item.id || isDraft;
                var savedCount = loadSupplierReceiveAddresses(supplierId, supplier).length;
                var actions = el('div', 'store-receive-card__actions');
                var editOrSave = el(
                    'button',
                    'store-receive-card__link' + (isEditing ? ' store-receive-card__link--save' : ''),
                    isEditing ? '保存' : '编辑'
                );
                editOrSave.type = 'button';
                actions.appendChild(editOrSave);

                if (isDraft) {
                    var cancelLink = el('button', 'store-receive-card__link', '取消');
                    cancelLink.type = 'button';
                    cancelLink.addEventListener('click', function () {
                        draftItem = null;
                        editingId = null;
                        render();
                    });
                    actions.appendChild(cancelLink);
                } else {
                    if (!item.isDefault && !isEditing) {
                        var setDefault = el('button', 'store-receive-card__link', '设为默认');
                        setDefault.type = 'button';
                        setDefault.addEventListener('click', function () {
                            var next = loadSupplierReceiveAddresses(supplierId, supplier).map(function (it) {
                                it.isDefault = it.id === item.id;
                                return it;
                            });
                            persistAndRender(next);
                            if (typeof showToast === 'function') showToast('已设为默认地址', 'success');
                        });
                        actions.appendChild(setDefault);
                    }
                    if (!isEditing && !item.isDefault && savedCount > 1) {
                        var delLink = el('button', 'store-receive-card__link store-receive-card__link--danger', '删除');
                        delLink.type = 'button';
                        delLink.addEventListener('click', function () {
                            var current = loadSupplierReceiveAddresses(supplierId, supplier);
                            var target = null;
                            current.forEach(function (it) {
                                if (it.id === item.id) target = it;
                            });
                            if (target && target.isDefault) {
                                if (typeof showToast === 'function') showToast('默认地址不可删除', 'error');
                                return;
                            }
                            if (current.length <= 1) {
                                if (typeof showToast === 'function') showToast('至少保留一个收货地址', 'error');
                                return;
                            }
                            if (!window.confirm('确认删除该收货地址吗？')) return;
                            var next = current.filter(function (it) {
                                return it.id !== item.id;
                            });
                            persistAndRender(next);
                            if (typeof showToast === 'function') showToast('收货地址已删除', 'success');
                        });
                        actions.appendChild(delLink);
                    }
                }

                var card = buildReceiveAddressCard(item, idx, actions, isEditing);

                editOrSave.addEventListener('click', function () {
                    if (!isEditing) {
                        if (editingId || draftItem) {
                            if (typeof showToast === 'function') showToast('请先保存当前正在编辑的地址', 'error');
                            return;
                        }
                        editingId = item.id;
                        render();
                        return;
                    }
                    var data = readCardFields(card, item);
                    if (!validateReceiveFields(data)) return;

                    var next = loadSupplierReceiveAddresses(supplierId, supplier);
                    if (isDraft) {
                        if (data.isDefault || !next.length) {
                            next.forEach(function (it) {
                                it.isDefault = false;
                            });
                            data.isDefault = true;
                        }
                        next.push(data);
                        persistAndRender(next);
                        if (typeof showToast === 'function') showToast('收货地址已新增', 'success');
                        return;
                    }
                    next = next.map(function (it) {
                        return it.id === item.id ? data : it;
                    });
                    persistAndRender(next);
                    if (typeof showToast === 'function') showToast('地址更新成功', 'success');
                });

                wrap.appendChild(card);
                if (isEditing && card._fields && card._fields.receiverName) {
                    setTimeout(function () {
                        card._fields.receiverName.focus();
                    }, 0);
                }
            });
        }

        addBtn.addEventListener('click', function () {
            if (editingId || draftItem) {
                if (typeof showToast === 'function') showToast('请先保存当前正在编辑的地址', 'error');
                return;
            }
            var saved = loadSupplierReceiveAddresses(supplierId, supplier);
            draftItem = normalizeReceiveAddress(
                {
                    id: 'draft_' + Date.now(),
                    receiverName: '',
                    receiverPhone: '',
                    region: '',
                    detailAddress: '',
                    isDefault: saved.length === 0
                },
                'draft_' + Date.now()
            );
            editingId = draftItem.id;
            render();
        });

        render();
    }

    function panelStoreOnboarding(store) {
        var p = el('div', 'supplier-detail-tab');
        var recordKey = onboardRecordKey('store', store.storeId);
        var onboardingDefaults = storeOnboardingDefaults(store);

        p.appendChild(sectionTitle('进件信息'));
        var onboardingGrid = el('div', 'supplier-detail-grid');
        function renderOnboardingInfo() {
            onboardingGrid.innerHTML = '';
            var onboardingSummary = getOnboardingSummary(recordKey, onboardingDefaults);
            onboardingDetailCells(onboardingSummary.fields).forEach(function (cell) {
                onboardingGrid.appendChild(cell);
            });
        }
        renderOnboardingInfo();
        p.appendChild(onboardingGrid);

        p.appendChild(sectionTitle('商户进件'));
        var onboardBlock = el('div', 'store-onboard-section store-onboard-section--white');
        var bar = el('div', 'erp-actions-row supplier-detail-onboard-actions');
        var go = mkBtn('去进件', true);
        go.addEventListener('click', function () {
            openOnboardStore(store.name, onboardingDefaults, recordKey);
        });
        bar.appendChild(go);
        onboardBlock.appendChild(bar);
        var tableWrap = el('div');
        function renderOnboardingTable() {
            var onboardingSummary = getOnboardingSummary(recordKey, onboardingDefaults);
            tableWrap.innerHTML = '';
            tableWrap.appendChild(
                dataTable(
                    ONBOARD_LIST_HEADERS,
                    [
                        buildOnboardListRow(
                            {
                                merchantName: store.name,
                                subjectType: '门店',
                                groupName: store.subjectName,
                                onboardStatus: onboardingSummary.auditStatus || onboardingSummary.status,
                                huifuMerchantNo: 'HF-' + String(store.storeId || '').replace(/\s+/g, ''),
                                settlementSubject: store.settleType,
                                contactMobile: store.phone,
                                submitTime: formatTs(onboardingSummary.submittedAt),
                                recordKey: recordKey,
                                defaults: onboardingDefaults,
                                title: '门店进件',
                                shortName: store.name,
                                openModal: function (forceView) {
                                    openOnboardStore(store.name, onboardingDefaults, recordKey, {
                                        forceView: !!forceView
                                    });
                                }
                            },
                            function () {
                                renderOnboardingInfo();
                                renderOnboardingTable();
                            }
                        )
                    ]
                )
            );
        }
        renderOnboardingTable();
        onboardBlock.appendChild(tableWrap);
        onboardBlock.appendChild(
            el('p', 'erp-page__note mdm-detail-note', '进件审核流程：门店 → BD → 财务 → 汇付（审核操作在审核中心，MDM仅发起与保存）。')
        );
        p.appendChild(onboardBlock);
        return p;
    }

    function panelStoreCustomers() {
        var root = el('div', 'supplier-detail-tab');
        root.appendChild(
            toolbarFilters(['用户ID', '手机号码'], true)
        );
        root.appendChild(
            dataTable(
                [
                    '用户ID',
                    '用户昵称',
                    '用户头像',
                    '手机号码',
                    '下单次数',
                    '累计下单金额',
                    '观看时长',
                    '用户等级',
                    '用户当前积分'
                ],
                []
            )
        );
        root.appendChild(emptyNote('暂无数据'));
        root.appendChild(fakePagination());
        return root;
    }

    /** 门店档案 · 账户信息 + 台账明细（替换原分佣明细） */
    function panelStoreAccount(store) {
        var root = el('div', 'supplier-detail-tab');
        var snap =
            window.StoreWalletDemo && typeof window.StoreWalletDemo.snapshot === 'function'
                ? window.StoreWalletDemo.snapshot()
                : null;
        var money =
            window.StoreWalletDemo && typeof window.StoreWalletDemo.money === 'function'
                ? window.StoreWalletDemo.money
                : function (n) {
                      return '¥' + Number(n || 0).toFixed(2);
                  };

        var depositActual = snap ? snap.depositActual : 2000;
        var depositRequired = snap ? snap.depositRequired : 2000;
        var depositGap = snap ? snap.depositGap : 0;
        var available = snap ? snap.available : 0;
        var goodsQuota = snap ? snap.goodsQuota : 0;
        var withdrawable = snap ? snap.withdrawable : 0;
        var pending = snap ? snap.pending : 0;
        var commissionTotal = snap ? snap.commissionTotal : 0;
        var merchantNo = snap ? snap.merchantNo : '—';
        var payStatus = snap ? snap.balancePayStatus : '—';
        var rule =
            snap && snap.ruleSnapshot
                ? 'D=' + snap.ruleSnapshot.D + ' / L=' + snap.ruleSnapshot.L + ' · ' + snap.ruleSnapshot.version
                : 'D=2000 / L=8000';

        root.appendChild(
            summaryBar([
                '余额可用：' + money(available),
                '保证金：' + money(depositActual) + (depositGap > 0 ? '（缺口 ' + money(depositGap) + '）' : ''),
                '可提现：' + money(withdrawable),
                '累计佣金入账：' + money(commissionTotal)
            ])
        );

        root.appendChild(sectionTitle('账户信息'));
        var grid = el('div', 'supplier-detail-grid');
        [
            ['门店名称', (store && store.name) || (snap && snap.storeName) || '—'],
            ['汇付商户号', merchantNo],
            ['余额支付开通', payStatus],
            ['资金规则快照', rule],
            ['保证金应保有', money(depositRequired)],
            ['保证金实有', money(depositActual)],
            ['保证金缺口', depositGap > 0 ? money(depositGap) : '无'],
            ['余额可用（可支付）', money(available)],
            ['不可提现货款水位', money(goodsQuota)],
            ['可提现（佣金/充值）', money(withdrawable)],
            ['处理中金额', money(pending)]
        ].forEach(function (pair) {
            grid.appendChild(detailCell(pair[0], pair[1]));
        });
        root.appendChild(grid);

        root.appendChild(sectionTitle('台账明细'));
        var filterBar = el('div', 'erp-toolbar');
        var typeGrp = el('div', 'modal-form-group');
        typeGrp.style.marginBottom = '0';
        typeGrp.appendChild(el('label', '', '类型'));
        var typeInput = el('input', 'erp-input');
        typeInput.type = 'text';
        typeInput.placeholder = '如：佣金入账';
        typeInput.style.minWidth = '140px';
        typeGrp.appendChild(typeInput);
        var bizGrp = el('div', 'modal-form-group');
        bizGrp.style.marginBottom = '0';
        bizGrp.appendChild(el('label', '', '业务单号'));
        var bizInput = el('input', 'erp-input');
        bizInput.type = 'text';
        bizInput.placeholder = '业务单号';
        bizInput.style.minWidth = '160px';
        bizGrp.appendChild(bizInput);
        var searchBtn = mkBtn('查询', true);
        var resetBtn = mkBtn('重置', false);
        filterBar.appendChild(typeGrp);
        filterBar.appendChild(bizGrp);
        filterBar.appendChild(searchBtn);
        filterBar.appendChild(resetBtn);
        root.appendChild(filterBar);

        var tableHost = el('div', 'store-wallet-ledger-host');
        root.appendChild(tableHost);
        var emptyHost = el('div');
        root.appendChild(emptyHost);

        function renderLedgerTable() {
            empty(tableHost);
            empty(emptyHost);
            var typeKw = (typeInput.value || '').trim();
            var bizKw = (bizInput.value || '').trim();
            var ledgers = snap && snap.ledgers ? snap.ledgers : [];
            var filtered = ledgers.filter(function (item) {
                if (typeKw && String(item.type || '').indexOf(typeKw) < 0) return false;
                if (bizKw && String(item.bizNo || '').indexOf(bizKw) < 0) return false;
                return true;
            });
            var rows = filtered.map(function (item) {
                var dirLabel = item.dir === 'in' ? '收入' : item.dir === 'out' ? '支出' : '锁定';
                var sign = item.dir === 'in' ? '+' : item.dir === 'out' ? '-' : '';
                return [
                    item.time,
                    item.type,
                    dirLabel,
                    sign + money(item.amount),
                    item.account,
                    item.bizNo || '—',
                    item.channelNo || '—',
                    item.remark || '—'
                ];
            });
            tableHost.appendChild(
                dataTable(
                    ['时间', '类型', '方向', '金额', '账户', '业务单号', '渠道流水', '说明'],
                    rows
                )
            );
            if (!rows.length) emptyHost.appendChild(emptyNote('暂无台账'));
        }

        searchBtn.addEventListener('click', renderLedgerTable);
        resetBtn.addEventListener('click', function () {
            typeInput.value = '';
            bizInput.value = '';
            renderLedgerTable();
        });
        renderLedgerTable();
        return root;
    }

    function panelCommProdPerf(kind) {
        var root = el('div', 'supplier-detail-tab');
        if (kind === 'comm') {
            root.appendChild(summaryBar(['累计分佣：¥—', '订单数：—', '商品销售数：—']));
            root.appendChild(toolbarFilters(['商品名称', '订单ID'], true));
            var dr = el('div', 'erp-toolbar');
            dr.appendChild(el('label', '', '下单时间'));
            var inp = el('input', 'erp-input');
            inp.placeholder = '开始日期 — 结束日期';
            dr.appendChild(inp);
            root.appendChild(dr);
            root.appendChild(
                dataTable(
                    [
                        '订单ID',
                        '下单时间',
                        '商品信息',
                        '实付金额',
                        '买家信息',
                        '佣金',
                        '交易状态',
                        '分佣比例'
                    ],
                    []
                )
            );
        } else if (kind === 'prod') {
            root.appendChild(
                summaryBar([
                    '商品成交金额：¥—',
                    '商品退款金额：¥—',
                    '商品数量：—',
                    '未核销：—',
                    '已核销：—',
                    '已过期：—',
                    '已退款：—',
                    '退款中：—'
                ])
            );
            root.appendChild(toolbarFilters(['商品名称', '商品类目'], true));
            root.appendChild(
                dataTable(
                    [
                        '商品ID',
                        '商品信息',
                        '商品类目',
                        '成交金额',
                        '退款金额',
                        '商品数量',
                        '未核销',
                        '已核销',
                        '已过期',
                        '已退款'
                    ],
                    []
                )
            );
        } else {
            root.appendChild(
                summaryBar([
                    '总成交订单数：—',
                    '总成交金额：¥—',
                    '总退款订单数：—',
                    '总退款金额：¥—'
                ])
            );
            root.appendChild(toolbarFilters(['选择日期'], true));
            root.appendChild(
                dataTable(['日期', '成交订单数', '成交金额', '退款订单数', '退款金额'], [])
            );
        }
        root.appendChild(emptyNote('暂无数据'));
        return root;
    }

    function loadStoreOrderSettings(storeId) {
        var key = 'lf_store_order_config_' + storeId;
        var defaults = { storeQueue: 'on', pendingShipmentVerify: 'on' };
        try {
            var raw = localStorage.getItem(key);
            if (!raw) return defaults;
            return Object.assign({}, defaults, JSON.parse(raw));
        } catch (e) {
            return defaults;
        }
    }

    function panelStoreOrderConfig(store) {
        var storeId = store.storeId || 'unknown';
        var settings = loadStoreOrderSettings(storeId);
        var root = el('div', 'supplier-detail-tab store-order-config');
        var ui = window.OrderConfigUi;
        var copy = ui ? ui.STORE_DETAIL_COPY : {};

        if (ui) {
            ui.appendOrderConfigItem({
                root: root,
                fieldKey: 'storeQueue',
                label: '门店排队',
                settings: settings,
                nameSuffix: '_' + storeId,
                required: true,
                onHint: copy.storeQueueOn
            });
            ui.appendOrderConfigItem({
                root: root,
                fieldKey: 'pendingShipmentVerify',
                label: '待发货订单核销',
                settings: settings,
                nameSuffix: '_' + storeId,
                required: true,
                staticHint: copy.pendingVerifyDesc,
                warnTip: copy.pendingVerifyWarn,
                warnTipAlways: true
            });
        }

        var saveBar = el('div', 'store-order-config__footer');
        var saveBtn = mkBtn('保存', true);
        saveBtn.addEventListener('click', function () {
            var storeQueueInput = root.querySelector('input[name="storeOrder_storeQueue_' + storeId + '"]:checked');
            var pendingInput = root.querySelector('input[name="storeOrder_pendingShipmentVerify_' + storeId + '"]:checked');
            var data = {
                storeQueue: storeQueueInput ? storeQueueInput.value : 'on',
                pendingShipmentVerify: pendingInput ? pendingInput.value : 'on'
            };
            localStorage.setItem('lf_store_order_config_' + storeId, JSON.stringify(data));
            if (typeof showToast === 'function') showToast('订单配置已保存（演示）', 'success');
        });
        saveBar.appendChild(saveBtn);
        root.appendChild(saveBar);
        return root;
    }

    function attachDrawer(opts) {
        removeArchiveDrawers();
        var backdrop = el('div', 'store-drawer-backdrop');
        backdrop.setAttribute('data-mdm-archive-drawer', '1');
        var drawer = el('aside', 'store-drawer store-drawer--interactive');
        drawer.setAttribute('data-mdm-archive-drawer', '1');
        if (opts.wideClass) drawer.classList.add(opts.wideClass);

        var header = el('div', 'store-drawer__header');
        header.appendChild(el('h2', 'store-drawer__title', opts.title));
        var btnClose = el('button', 'store-drawer__close');
        btnClose.type = 'button';
        btnClose.setAttribute('aria-label', '关闭');
        btnClose.innerHTML = '&times;';
        function shut() {
            document.removeEventListener('keydown', onDocKey);
            backdrop.remove();
            drawer.remove();
        }
        function onDocKey(ev) {
            if (ev.key === 'Escape') shut();
        }
        document.addEventListener('keydown', onDocKey);
        btnClose.addEventListener('click', shut);
        header.appendChild(btnClose);

        var hero = el('div', 'store-drawer__hero store-drawer__hero--elevated');
        var nameRow = el('div', 'store-drawer__name-row');
        nameRow.appendChild(el('span', 'store-drawer__name', opts.heroName));
        (opts.heroTags || []).forEach(function (t) {
            nameRow.appendChild(
                el('span', 'store-drawer__tag store-drawer__tag--' + t.kind, t.label)
            );
        });
        hero.appendChild(nameRow);
        (opts.metaLines || []).forEach(function (line) {
            hero.appendChild(el('div', 'store-drawer__meta', line));
        });

        var tabsWrap = el('div', 'store-drawer__tabs store-drawer__tabs--sticky');
        var bodyHost = el('div', 'store-drawer__body');

        var tabIds = opts.tabIds;
        var tabLabels = opts.tabLabels;
        var bodies = opts.bodies;
        var tabs = [];

        function showTab(id) {
            tabIds.forEach(function (tid, i) {
                tabs[i].classList.toggle('is-active', tid === id);
            });
            empty(bodyHost);
            bodyHost.appendChild(bodies[id]);
            bodyHost.scrollTop = 0;
        }

        tabIds.forEach(function (id, i) {
            var t = el('button', 'store-drawer__tab', tabLabels[i]);
            t.type = 'button';
            (function (tid) {
                t.addEventListener('click', function () {
                    showTab(tid);
                });
            })(id);
            tabsWrap.appendChild(t);
            tabs.push(t);
        });

        drawer.appendChild(header);
        drawer.appendChild(hero);
        drawer.appendChild(tabsWrap);
        drawer.appendChild(bodyHost);

        if (opts.withFooter !== false) {
            var footer = el('div', 'store-drawer__footer');
            var back = mkBtn('返回', false, true);
            var ok = mkBtn('确定', true);
            back.addEventListener('click', shut);
            ok.addEventListener('click', shut);
            footer.appendChild(back);
            footer.appendChild(ok);
            drawer.appendChild(footer);
        }

        showTab(tabIds[0]);

        backdrop.addEventListener('click', shut);
        drawer.addEventListener('click', function (e) {
            e.stopPropagation();
        });
        document.body.appendChild(backdrop);
        document.body.appendChild(drawer);
    }

    function openStore(tr) {
        var store = rowToStore(tr);
        if (!store) {
            if (typeof showToast === 'function') showToast('无法读取门店行数据', 'error');
            return;
        }
        store.detailTags = storeHeroTags(store);
        attachDrawer({
            title: '门店详情',
            heroName: store.name,
            heroTags: store.detailTags,
            metaLines: ['门店ID：' + store.storeId + ' · 所属组织：' + store.orgId],
            wideClass: 'store-drawer--store-wide',
            tabIds: ['base', 'onboard', 'cust', 'comm', 'prod', 'perf', 'orderCfg'],
            tabLabels: ['基础信息', '进件信息', '绑定客户', '账户信息', '商品统计', '业绩报表', '订单配置'],
            bodies: {
                base: panelStoreBase(store),
                onboard: panelStoreOnboarding(store),
                cust: panelStoreCustomers(),
                comm: panelStoreAccount(store),
                prod: panelCommProdPerf('prod'),
                perf: panelCommProdPerf('perf'),
                orderCfg: panelStoreOrderConfig(store)
            }
        });
    }

    function rowToSupplier(tr) {
        var c = tr.querySelectorAll('td');
        if (c.length < 17) return null;
        var supplierId = cellPlain(c[0]);
        var recordKey = onboardRecordKey('supplier', supplierId);
        var onboardFallback = cellPlain(c[14]);
        var onboard =
            window.MdmSupplierArchiveUi &&
            typeof window.MdmSupplierArchiveUi.resolveOnboardingDisplay === 'function'
                ? window.MdmSupplierArchiveUi.resolveOnboardingDisplay(recordKey, onboardFallback)
                : onboardFallback;
        var shortName = cellPlain(c[3]);
        if (shortName === '—' || shortName === '-') shortName = '';
        if (!shortName && tr.getAttribute('data-short-name')) {
            shortName = String(tr.getAttribute('data-short-name') || '').trim();
        }
        return {
            id: supplierId,
            subjectName: cellPlain(c[1]),
            name: cellPlain(c[2]),
            shortName: shortName,
            region: cellPlain(c[4]),
            detailAddress: cellPlain(c[5]),
            typeLabel: cellPlain(c[6]),
            contactName: cellPlain(c[7]),
            phone: cellPlain(c[8]),
            createTime: cellPlain(c[9]),
            productCount: cellPlain(c[10]),
            settleInfo: cellPlain(c[11]),
            withdrawPhone: cellPlain(c[12]),
            deliveryMode: cellPlain(c[13]),
            onboard: onboard,
            balancePay: cellPlain(c[15]),
            status: cellStatus(c[16]),
            inboundWarehouse: readSupplierInboundWarehouseBinding(supplierId, cellPlain(c[2]))
        };
    }

    function panelResourceBaseSupplier(r) {
        var p = el('div', 'supplier-detail-tab');
        p.appendChild(sectionTitle('基础信息'));
        var grid = el('div', 'supplier-detail-grid');
        grid.appendChild(detailCell('供应商ID', r.id));
        grid.appendChild(detailCell('主体名称', r.subjectName));
        grid.appendChild(detailCell('供应商名称', r.name));
        grid.appendChild(detailCell('供应商简称', r.shortName || '—'));
        grid.appendChild(detailCell('供应商类型', r.typeLabel));
        grid.appendChild(detailCell('供应商地址', r.region));
        var addr = el('div', 'supplier-detail-cell supplier-detail-cell--span4');
        addr.appendChild(el('div', 'supplier-detail-cell__label', '详细地址'));
        var addrBody = el('div', 'supplier-detail-cell__body supplier-detail-cell__body--multiline');
        addrBody.textContent = nz(r.detailAddress);
        addr.appendChild(addrBody);
        grid.appendChild(addr);
        grid.appendChild(detailCell('负责人姓名', r.contactName));
        grid.appendChild(detailCell('入库仓库', r.inboundWarehouse));
        grid.appendChild(detailCell('手机号码', r.phone));
        grid.appendChild(detailCell('创建时间', r.createTime));
        grid.appendChild(detailCell('供应商品数量', r.productCount));
        grid.appendChild(detailCell('结算信息', r.settleInfo));
        grid.appendChild(detailCell('可提现手机号', r.withdrawPhone));
        grid.appendChild(detailCell('配送方式', r.deliveryMode));
        grid.appendChild(detailCell('进件状态', r.onboard));
        grid.appendChild(detailCell('余额支付', r.balancePay));
        grid.appendChild(detailCellTagged('供应商状态', r.status, true));
        p.appendChild(grid);
        appendSupplierReceiveSection(p, r);
        return p;
    }

    function panelSupplierOnboarding(r) {
        var recordKey = onboardRecordKey('supplier', r.id);
        var onboardingDefaults = resourceOnboardingDefaults(r.name, r.detailAddress, r.phone);
        var p = el('div', 'supplier-detail-tab');

        p.appendChild(sectionTitle('进件信息'));
        var onboardingGrid = el('div', 'supplier-detail-grid');
        function renderOnboardingInfo() {
            onboardingGrid.innerHTML = '';
            var onboardingSummary = getOnboardingSummary(recordKey, onboardingDefaults);
            onboardingDetailCells(onboardingSummary.fields, 'supplier').forEach(function (cell) {
                onboardingGrid.appendChild(cell);
            });
        }
        renderOnboardingInfo();
        p.appendChild(onboardingGrid);

        p.appendChild(sectionTitle('供应商进件'));
        var onboard = el('div', 'store-onboard-section store-onboard-section--white');
        var bar = el('div', 'erp-actions-row supplier-detail-onboard-actions');
        var go = mkBtn('去进件', true);
        go.addEventListener('click', function () {
            openOnboardResource('供应商进件', r.shortName || r.name, onboardingDefaults, recordKey, {
                supplierId: r.id
            });
        });
        bar.appendChild(go);
        onboard.appendChild(bar);
        var tableWrap = el('div');
        function renderOnboardingTable() {
            var onboardingSummary = getOnboardingSummary(recordKey, onboardingDefaults);
            tableWrap.innerHTML = '';
            tableWrap.appendChild(
                dataTable(
                    ONBOARD_LIST_HEADERS,
                    [
                        buildOnboardListRow(
                            {
                                merchantName: r.name,
                                subjectType: '供应商',
                                groupName: r.subjectName,
                                onboardStatus: onboardingSummary.auditStatus || onboardingSummary.status,
                                huifuMerchantNo: 'HF-' + String(r.id || '').replace(/\s+/g, ''),
                                settlementSubject: r.settleInfo,
                                contactMobile: r.phone,
                                submitTime: formatTs(onboardingSummary.submittedAt),
                                recordKey: recordKey,
                                defaults: onboardingDefaults,
                                title: '供应商进件',
                                shortName: r.shortName || r.name,
                                openModal: function (forceView) {
                                    openOnboardResource(
                                        '供应商进件',
                                        r.shortName || r.name,
                                        onboardingDefaults,
                                        recordKey,
                                        {
                                        forceView: !!forceView,
                                        supplierId: r.id
                                    });
                                }
                            },
                            function () {
                                renderOnboardingInfo();
                                renderOnboardingTable();
                            }
                        )
                    ]
                )
            );
        }
        renderOnboardingTable();
        onboard.appendChild(tableWrap);
        onboard.appendChild(
            el('p', 'erp-page__note mdm-detail-note', '进件审核流程：门店 → BD → 财务 → 汇付（审核操作在审核中心，MDM仅发起与保存）。')
        );
        p.appendChild(onboard);
        return p;
    }

    function panelResourceCommLike(tabKind) {
        return panelCommProdPerf(tabKind === 'comm' ? 'comm' : tabKind === 'prod' ? 'prod' : 'perf');
    }

    function openSupplier(tr) {
        var r = rowToSupplier(tr);
        if (!r) {
            if (typeof showToast === 'function') showToast('无法读取供应商行数据', 'error');
            return;
        }
        var tags = [];
        if (r.status === '正常') tags.push({ kind: 'orange', label: '正常' });
        else tags.push({ kind: 'gray', label: r.status });
        attachDrawer({
            title: '供应商详情',
            heroName: r.shortName || r.name,
            heroTags: tags,
            metaLines: ['供应商ID：' + r.id + ' · 所属组织：' + r.subjectName],
            wideClass: 'store-drawer--supplier-wide',
            tabIds: ['base', 'onboard', 'comm', 'prod', 'perf'],
            tabLabels: ['基础信息', '进件信息', '分佣明细', '商品统计', '业绩报表'],
            bodies: {
                base: panelResourceBaseSupplier(r),
                onboard: panelSupplierOnboarding(r),
                comm: panelResourceCommLike('comm'),
                prod: panelResourceCommLike('prod'),
                perf: panelResourceCommLike('perf')
            }
        });
    }

    function rowToLiveRoom(tr) {
        var c = tr.querySelectorAll('td');
        if (c.length < 12) return null;
        return {
            id: cellPlain(c[0]),
            subjectName: cellPlain(c[1]),
            name: cellPlain(c[2]),
            typeLabel: cellPlain(c[3]),
            anchorId: cellPlain(c[4]),
            anchorName: cellPlain(c[5]),
            contactName: cellPlain(c[6]),
            phone: cellPlain(c[7]),
            viewPermissionLabel: cellPlain(c[8]),
            createTime: cellPlain(c[9]),
            withdrawPhone: cellPlain(c[10]),
            status: cellStatus(c[11])
        };
    }

    function panelLiveBase(r) {
        var p = el('div', 'supplier-detail-tab');
        p.appendChild(sectionTitle('基础信息'));
        var grid = el('div', 'supplier-detail-grid');
        grid.appendChild(detailCell('直播间ID', r.id));
        grid.appendChild(detailCell('主体名称', r.subjectName));
        grid.appendChild(detailCell('直播间名称', r.name));
        grid.appendChild(detailCell('直播类型', r.typeLabel));
        grid.appendChild(detailCell('主播ID', r.anchorId));
        grid.appendChild(detailCell('主播名称', r.anchorName));
        grid.appendChild(detailCell('负责人', r.contactName));
        grid.appendChild(detailCell('手机号码', r.phone));
        grid.appendChild(detailCell('观看权限', r.viewPermissionLabel));
        grid.appendChild(detailCell('创建时间', r.createTime));
        grid.appendChild(detailCell('可提现手机号', r.withdrawPhone));
        grid.appendChild(detailCellTagged('状态', r.status, true));
        p.appendChild(grid);
        return p;
    }

    function panelLiveSessions() {
        var d = el('div', 'supplier-detail-tab');
        d.appendChild(sectionTitle('直播场次（业务系统）'));
        d.appendChild(
            el(
                'p',
                'erp-page__note mdm-detail-note',
                '业务系统在本直播间下创建场次；列表需业务侧同步后展示（原型示意）。'
            )
        );
        d.appendChild(dataTable(['场次编号', '计划开播', '计划结束', '渠道', '状态'], []));
        d.appendChild(emptyNote('暂无同步数据'));
        return d;
    }

    function panelLiveSessionProducts() {
        var d = el('div', 'supplier-detail-tab');
        d.appendChild(sectionTitle('场次商品（业务系统）'));
        d.appendChild(
            el('p', 'erp-page__note mdm-detail-note', '商品挂在场次下，随场次关联展示（原型示意）。')
        );
        d.appendChild(dataTable(['场次编号', '商品ID', '商品名称', '挂场状态'], []));
        d.appendChild(emptyNote('暂无同步数据'));
        return d;
    }

    function panelLiveOnboard(r) {
        var recordKey = onboardRecordKey('liveRoom', r.id);
        var onboardingDefaults = resourceOnboardingDefaults(r.name, r.name, r.phone);
        var d = el('div', 'supplier-detail-tab');

        d.appendChild(sectionTitle('进件信息'));
        var onboardingGrid = el('div', 'supplier-detail-grid');
        function renderOnboardingInfo() {
            onboardingGrid.innerHTML = '';
            var onboardingSummary = getOnboardingSummary(recordKey, onboardingDefaults);
            onboardingDetailCells(onboardingSummary.fields).forEach(function (cell) {
                onboardingGrid.appendChild(cell);
            });
        }
        renderOnboardingInfo();
        d.appendChild(onboardingGrid);

        d.appendChild(sectionTitle('直播间进件'));
        var wrap = el('div', 'store-onboard-section store-onboard-section--white');
        var bar = el('div', 'erp-actions-row supplier-detail-onboard-actions');
        var go = mkBtn('去进件', true);
        go.addEventListener('click', function () {
            openOnboardResource('直播间进件', r.name, onboardingDefaults, recordKey);
        });
        bar.appendChild(go);
        wrap.appendChild(bar);
        var tableWrap = el('div');
        function renderOnboardingTable() {
            var onboardingSummary = getOnboardingSummary(recordKey, onboardingDefaults);
            tableWrap.innerHTML = '';
            tableWrap.appendChild(
                dataTable(
                    ONBOARD_LIST_HEADERS,
                    [
                        buildOnboardListRow(
                            {
                                merchantName: r.name,
                                subjectType: '直播间',
                                groupName: r.subjectName,
                                onboardStatus: onboardingSummary.auditStatus || onboardingSummary.status,
                                huifuMerchantNo: 'HF-' + String(r.id || '').replace(/\s+/g, ''),
                                settlementSubject: '—',
                                contactMobile: r.phone,
                                submitTime: formatTs(onboardingSummary.submittedAt),
                                recordKey: recordKey,
                                defaults: onboardingDefaults,
                                title: '直播间进件',
                                shortName: r.name,
                                openModal: function (forceView) {
                                    openOnboardResource('直播间进件', r.name, onboardingDefaults, recordKey, {
                                        forceView: !!forceView
                                    });
                                }
                            },
                            function () {
                                renderOnboardingInfo();
                                renderOnboardingTable();
                            }
                        )
                    ]
                )
            );
        }
        renderOnboardingTable();
        wrap.appendChild(tableWrap);
        wrap.appendChild(
            el('p', 'erp-page__note mdm-detail-note', '进件审核流程：门店 → BD → 财务 → 汇付（审核操作在审核中心，MDM仅发起与保存）。')
        );
        d.appendChild(wrap);
        d.appendChild(
            el('p', 'erp-page__note mdm-detail-note', '进件与结算信息走统一进件流程（原型示意）。')
        );
        return d;
    }

    function openLiveRoom(tr) {
        var r = rowToLiveRoom(tr);
        if (!r) {
            if (typeof showToast === 'function') showToast('无法读取直播间行数据', 'error');
            return;
        }
        var tags = [];
        if (r.status === '启用') tags.push({ kind: 'orange', label: '启用' });
        else tags.push({ kind: 'gray', label: r.status });
        attachDrawer({
            title: '直播间详情',
            heroName: r.name,
            heroTags: tags,
            metaLines: [
                '直播间ID：' + r.id + ' · 所属组织：' + r.subjectName,
                '主播：' + r.anchorName + '（' + r.anchorId + '）'
            ],
            wideClass: 'store-drawer--supplier-wide',
            tabIds: ['base', 'onboard', 'sessions', 'products'],
            tabLabels: ['基础信息', '进件信息', '直播场次（业务）', '场次商品（业务）'],
            bodies: {
                base: panelLiveBase(r),
                onboard: panelLiveOnboard(r),
                sessions: panelLiveSessions(),
                products: panelLiveSessionProducts()
            }
        });
    }

    function rowToCarrier(tr) {
        var c = tr.querySelectorAll('td');
        if (c.length < 15) return null;
        return {
            id: cellPlain(c[0]),
            subjectName: cellPlain(c[1]),
            name: cellPlain(c[2]),
            region: cellPlain(c[3]),
            detailAddress: cellPlain(c[4]),
            typeLabel: cellPlain(c[5]),
            contactName: cellPlain(c[6]),
            phone: cellPlain(c[7]),
            createTime: cellPlain(c[8]),
            serviceArea: cellPlain(c[9]),
            settleInfo: cellPlain(c[10]),
            withdrawPhone: cellPlain(c[11]),
            channel: cellPlain(c[12]),
            onboard: cellPlain(c[13]),
            status: cellStatus(c[14])
        };
    }

    function panelCarrierBase(r) {
        var p = el('div', 'supplier-detail-tab');
        p.appendChild(sectionTitle('基础信息'));
        var grid = el('div', 'supplier-detail-grid');
        grid.appendChild(detailCell('承运商ID', r.id));
        grid.appendChild(detailCell('主体名称', r.subjectName));
        grid.appendChild(detailCell('承运商名称', r.name));
        grid.appendChild(detailCell('承运类型', r.typeLabel));
        grid.appendChild(detailCell('承运商地址', r.region));
        var addr = el('div', 'supplier-detail-cell supplier-detail-cell--span4');
        addr.appendChild(el('div', 'supplier-detail-cell__label', '详细地址'));
        var addrBody = el('div', 'supplier-detail-cell__body supplier-detail-cell__body--multiline');
        addrBody.textContent = nz(r.detailAddress);
        addr.appendChild(addrBody);
        grid.appendChild(addr);
        grid.appendChild(detailCell('负责人姓名', r.contactName));
        grid.appendChild(detailCell('手机号码', r.phone));
        grid.appendChild(detailCell('创建时间', r.createTime));
        grid.appendChild(detailCell('服务区域', r.serviceArea));
        grid.appendChild(detailCell('结算信息', r.settleInfo));
        grid.appendChild(detailCell('可提现手机号', r.withdrawPhone));
        grid.appendChild(detailCell('进件渠道', r.channel));
        grid.appendChild(detailCell('进件状态', r.onboard));
        grid.appendChild(detailCellTagged('承运商状态', r.status, true));
        p.appendChild(grid);
        return p;
    }

    function panelCarrierOnboarding(r) {
        var recordKey = onboardRecordKey('carrier', r.id);
        var onboardingDefaults = resourceOnboardingDefaults(r.name, r.detailAddress, r.phone);
        var p = el('div', 'supplier-detail-tab');

        p.appendChild(sectionTitle('进件信息'));
        var onboardingGrid = el('div', 'supplier-detail-grid');
        function renderOnboardingInfo() {
            onboardingGrid.innerHTML = '';
            var onboardingSummary = getOnboardingSummary(recordKey, onboardingDefaults);
            onboardingDetailCells(onboardingSummary.fields).forEach(function (cell) {
                onboardingGrid.appendChild(cell);
            });
        }
        renderOnboardingInfo();
        p.appendChild(onboardingGrid);

        p.appendChild(sectionTitle('承运商进件'));
        var onboard = el('div', 'store-onboard-section store-onboard-section--white');
        var bar = el('div', 'erp-actions-row supplier-detail-onboard-actions');
        var go = mkBtn('去进件', true);
        go.addEventListener('click', function () {
            openOnboardResource('承运商进件', r.name, onboardingDefaults, recordKey);
        });
        bar.appendChild(go);
        onboard.appendChild(bar);
        var tableWrap = el('div');
        function renderOnboardingTable() {
            var onboardingSummary = getOnboardingSummary(recordKey, onboardingDefaults);
            tableWrap.innerHTML = '';
            tableWrap.appendChild(
                dataTable(
                    ONBOARD_LIST_HEADERS,
                    [
                        buildOnboardListRow(
                            {
                                merchantName: r.name,
                                subjectType: '承运商',
                                groupName: r.subjectName,
                                onboardStatus: onboardingSummary.auditStatus || onboardingSummary.status,
                                huifuMerchantNo: 'HF-' + String(r.id || '').replace(/\s+/g, ''),
                                settlementSubject: r.settleInfo,
                                contactMobile: r.phone,
                                submitTime: formatTs(onboardingSummary.submittedAt),
                                recordKey: recordKey,
                                defaults: onboardingDefaults,
                                title: '承运商进件',
                                shortName: r.name,
                                openModal: function (forceView) {
                                    openOnboardResource('承运商进件', r.name, onboardingDefaults, recordKey, {
                                        forceView: !!forceView
                                    });
                                }
                            },
                            function () {
                                renderOnboardingInfo();
                                renderOnboardingTable();
                            }
                        )
                    ]
                )
            );
        }
        renderOnboardingTable();
        onboard.appendChild(tableWrap);
        onboard.appendChild(
            el('p', 'erp-page__note mdm-detail-note', '进件审核流程：门店 → BD → 财务 → 汇付（审核操作在审核中心，MDM仅发起与保存）。')
        );
        p.appendChild(onboard);
        return p;
    }

    function openCarrier(tr) {
        var r = rowToCarrier(tr);
        if (!r) {
            if (typeof showToast === 'function') showToast('无法读取承运商行数据', 'error');
            return;
        }
        var tags = [];
        if (r.status === '正常') tags.push({ kind: 'orange', label: '正常' });
        else tags.push({ kind: 'gray', label: r.status });
        attachDrawer({
            title: '承运商详情',
            heroName: r.name,
            heroTags: tags,
            metaLines: ['承运商ID：' + r.id + ' · 所属组织：' + r.subjectName],
            wideClass: 'store-drawer--supplier-wide',
            tabIds: ['base', 'onboard', 'comm', 'prod', 'perf'],
            tabLabels: ['基础信息', '进件信息', '运单明细', '运力统计', '履约报表'],
            bodies: {
                base: panelCarrierBase(r),
                onboard: panelCarrierOnboarding(r),
                comm: panelResourceCommLike('comm'),
                prod: panelResourceCommLike('prod'),
                perf: panelResourceCommLike('perf')
            }
        });
    }

    function rowToWarehouse(tr) {
        var c = tr.querySelectorAll('td');
        if (c.length < 12) return null;
        var warehouseTypeRaw = cellPlain(c[3]);
        var warehouseType = warehouseTypeRaw === '门店' ? '门店' : '仓库';
        var levelRaw = cellPlain(c[4]);
        var levelLabel =
            warehouseType === '仓库' && (levelRaw === '中心仓' || levelRaw === '网格仓') ?
                levelRaw
            :   '';
        return {
            code: cellPlain(c[0]),
            subjectName: cellPlain(c[1]),
            name: cellPlain(c[2]),
            warehouseType: warehouseType,
            levelLabel: levelLabel,
            admin: cellPlain(c[5]),
            phone: cellPlain(c[6]),
            withdrawPhone: cellPlain(c[7]),
            location: cellPlain(c[8]),
            area: cellPlain(c[9]),
            createTime: cellPlain(c[10]),
            status: cellStatus(c[11])
        };
    }

    function panelWarehouseBase(r) {
        var p = el('div', 'supplier-detail-tab');
        p.appendChild(sectionTitle('基础信息'));
        var grid = el('div', 'supplier-detail-grid');
        grid.appendChild(detailCell('仓库编号', r.code));
        grid.appendChild(detailCell('主体名称', r.subjectName));
        grid.appendChild(detailCell('仓库名称', r.name));
        grid.appendChild(detailCell('仓库类型', r.warehouseType));
        var levelCell = el('div', 'supplier-detail-cell');
        levelCell.appendChild(el('div', 'supplier-detail-cell__label', '仓库级别'));
        var levelBody = el('div', 'supplier-detail-cell__body');
        levelBody.textContent = r.levelLabel;
        levelCell.appendChild(levelBody);
        grid.appendChild(levelCell);
        grid.appendChild(detailCell('仓库管理员', r.admin));
        grid.appendChild(detailCell('手机号码', r.phone));
        grid.appendChild(detailCell('可提现手机号', r.withdrawPhone));
        var loc = el('div', 'supplier-detail-cell supplier-detail-cell--span4');
        loc.appendChild(el('div', 'supplier-detail-cell__label', '仓库位置'));
        var locBody = el('div', 'supplier-detail-cell__body supplier-detail-cell__body--multiline');
        locBody.textContent = nz(r.location);
        loc.appendChild(locBody);
        grid.appendChild(loc);
        grid.appendChild(detailCell('仓库面积', r.area));
        grid.appendChild(detailCell('创建时间', r.createTime));
        grid.appendChild(detailCellTagged('状态', r.status, true));
        p.appendChild(grid);
        return p;
    }

    function panelWarehouseExtra(title, tableHeaders) {
        var d = el('div', 'supplier-detail-tab');
        d.appendChild(sectionTitle(title));
        d.appendChild(
            el('p', 'erp-page__note mdm-detail-note', '仓库主数据由 MDM 维护；此页签为业务侧数据占位（原型）。')
        );
        d.appendChild(dataTable(tableHeaders, []));
        d.appendChild(emptyNote('暂无数据'));
        return d;
    }

    function openWarehouse(tr) {
        var r = rowToWarehouse(tr);
        if (!r) {
            if (typeof showToast === 'function') showToast('无法读取仓库行数据', 'error');
            return;
        }
        var tags = [];
        if (r.status === '启用') tags.push({ kind: 'orange', label: '启用' });
        else tags.push({ kind: 'gray', label: r.status });
        attachDrawer({
            title: '仓库详情',
            heroName: r.name,
            heroTags: tags,
            metaLines: ['仓库编号：' + r.code + ' · 所属组织：' + r.subjectName],
            wideClass: 'store-drawer--supplier-wide',
            tabIds: ['base', 'stock', 'inout', 'ops'],
            tabLabels: ['基础信息', '库存概览', '出入库明细', '作业与统计'],
            bodies: {
                base: panelWarehouseBase(r),
                stock: panelWarehouseExtra('库存概览', ['SKU', '商品名称', '可用数量', '锁定数量', '库位']),
                inout: panelWarehouseExtra('出入库明细', ['单号', '类型', '时间', '操作人', '状态']),
                ops: panelWarehouseExtra('作业统计', ['日期', '入库单量', '出库单量', '盘点次数'])
            }
        });
    }

    window.MdmArchiveDetailDrawer = {
        openStore: openStore,
        openSupplier: openSupplier,
        openLiveRoom: openLiveRoom,
        openCarrier: openCarrier,
        openWarehouse: openWarehouse,
        openOnboardingDetail: openOnboardingDetailModal,
        getStoreReceiveInfo: getStoreReceiveInfo,
        getSupplierReceiveInfo: getSupplierReceiveInfo
    };
})();
