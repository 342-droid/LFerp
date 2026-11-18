/**
 * 资源中心档案「新增 / 编辑」宽屏表单 — 与 vendor/lf-master-erp 中 store-archive-ui /
 * resource-archive-ui / warehouse-archive-ui 的字段与分区一致（静态演示）。
 * 编辑入口由 mdm-erp-lists 拦截列表「编辑」，按行预填后打开与新增相同的 erp-modal--store-wide。
 */
(function (global) {
    var STORE_BIND_BD_ENUM = ['张伟', '刘芳'];
    var SUPPLIER_INBOUND_WAREHOUSE_BIND_KEY = 'mdm_supplier_inbound_warehouse_bindings_v1';
    /** 门店/供应商档案基础信息场地照（与进件 store_*_pic 键对齐） */
    var ARCHIVE_VENUE_PHOTOS_KEY = 'mdm_archive_venue_photos_v1';

    function venuePhotoMapKey(kind, entityId) {
        return String(kind || '') + '::' + String(entityId || '').trim();
    }

    function readVenuePhotos(kind, entityId) {
        var map = readJsonStore(ARCHIVE_VENUE_PHOTOS_KEY);
        var one = map[venuePhotoMapKey(kind, entityId)] || {};
        return {
            store_header_pic: one.store_header_pic || '',
            store_indoor_pic: one.store_indoor_pic || '',
            store_cashier_desk_pic: one.store_cashier_desk_pic || ''
        };
    }

    function writeVenuePhotos(kind, entityId, photos) {
        var id = String(entityId || '').trim();
        if (!id) return;
        var map = readJsonStore(ARCHIVE_VENUE_PHOTOS_KEY);
        var prev = map[venuePhotoMapKey(kind, id)] || {};
        var next = photos || {};
        map[venuePhotoMapKey(kind, id)] = {
            store_header_pic:
                next.store_header_pic != null ? next.store_header_pic : prev.store_header_pic || '',
            store_indoor_pic:
                next.store_indoor_pic != null ? next.store_indoor_pic : prev.store_indoor_pic || '',
            store_cashier_desk_pic:
                next.store_cashier_desk_pic != null
                    ? next.store_cashier_desk_pic
                    : prev.store_cashier_desk_pic || ''
        };
        writeJsonStore(ARCHIVE_VENUE_PHOTOS_KEY, map);
    }

    /** 进件成功前：进件侧场地照回写档案基础信息 */
    function syncVenuePhotosFromOnboarding(kind, entityId, fields) {
        var f = fields || {};
        function asVal(v) {
            if (v === true) return '已上传';
            if (typeof v === 'string' && v.trim()) return v.trim();
            return '';
        }
        writeVenuePhotos(kind, entityId, {
            store_header_pic: asVal(f.store_header_pic),
            store_indoor_pic: asVal(f.store_indoor_pic),
            store_cashier_desk_pic: asVal(f.store_cashier_desk_pic)
        });
    }

    function removeArchiveFormModals() {
        document.querySelectorAll('[data-mdm-archive-form="1"]').forEach(function (n) {
            n.remove();
        });
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

    function writeJsonStore(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value || {}));
        } catch (e) {}
    }

    function selectedLabel(sel) {
        if (!sel || sel.selectedIndex < 0) return '';
        var opt = sel.options[sel.selectedIndex];
        return opt ? String(opt.text || '').trim() : '';
    }

    function syncStoreReceiveFromForm(storeId, storeName, refs) {
        if (!window.MdmReceiveAddressStore || !refs) return;
        window.MdmReceiveAddressStore.syncStoreFromArchive({
            id: storeId,
            name: storeName || (refs.nameInp && refs.nameInp.value),
            contactName: refs.contactInp && refs.contactInp.value,
            phone: refs.phoneInp && refs.phoneInp.value,
            region: refs.regionInp && refs.regionInp.value,
            detailAddress: refs.addressTa && refs.addressTa.value,
            fulfillWarehouse: selectedLabel(refs.warehouseSel)
        });
    }

    function seedWarehouseReceiveFromForm(warehouseId, refs) {
        if (!window.MdmReceiveAddressStore || !refs) return;
        var region = refs.regionInp ? String(refs.regionInp.value || '').trim() : '';
        var detail = refs.detailTa ? String(refs.detailTa.value || '').trim() : '';
        window.MdmReceiveAddressStore.seedWarehouseFromArchive(
            {
                id: warehouseId,
                name: refs.nameInp && refs.nameInp.value,
                admin: refs.adminInp && refs.adminInp.value,
                phone: refs.phoneInp && refs.phoneInp.value,
                region: region,
                detailAddress: detail,
                location: [region, detail].filter(Boolean).join(' ')
            },
            { onlyIfEmpty: true }
        );
    }

    function saveSupplierInboundWarehouseBinding(supplierId, supplierName, warehouseName) {
        var id = String(supplierId || '').trim();
        var name = String(supplierName || '').trim();
        var wh = String(warehouseName || '').trim();
        if (!id && !name) return;
        var data = readJsonStore(SUPPLIER_INBOUND_WAREHOUSE_BIND_KEY);
        var map = data && typeof data === 'object' ? data : {};
        var key = id ? 'id:' + id : 'name:' + name;
        map[key] = wh || '';
        if (id && name) map['name:' + name] = wh || '';
        writeJsonStore(SUPPLIER_INBOUND_WAREHOUSE_BIND_KEY, map);
    }

    function readSupplierInboundWarehouseBinding(supplierId, supplierName) {
        var id = String(supplierId || '').trim();
        var name = String(supplierName || '').trim();
        var map = readJsonStore(SUPPLIER_INBOUND_WAREHOUSE_BIND_KEY);
        if (!map || typeof map !== 'object') return '';
        if (id && map['id:' + id]) return String(map['id:' + id] || '');
        if (name && map['name:' + name]) return String(map['name:' + name] || '');
        return '';
    }

    function sfLabel(text, required) {
        var lab = document.createElement('label');
        lab.className = 'store-form__label';
        if (required) {
            var s = document.createElement('span');
            s.className = 'store-form__req';
            s.textContent = '*';
            lab.appendChild(s);
        }
        lab.appendChild(document.createTextNode(text));
        return lab;
    }

    function formRow(label, required, control) {
        var r = document.createElement('div');
        r.className = 'store-form__row';
        r.appendChild(sfLabel(label, required));
        var c = document.createElement('div');
        c.className = 'store-form__control';
        c.appendChild(control);
        r.appendChild(c);
        return r;
    }

    function txt(placeholder, value) {
        var i = document.createElement('input');
        i.type = 'text';
        i.className = 'erp-input';
        i.placeholder = placeholder || '';
        if (value != null && value !== '') i.value = value;
        return i;
    }

    function sel(options, value) {
        var s = document.createElement('select');
        s.className = 'erp-select';
        options.forEach(function (o) {
            var op = document.createElement('option');
            op.value = o.value;
            op.textContent = o.label;
            s.appendChild(op);
        });
        if (value != null) s.value = value;
        return s;
    }

    function smsRow() {
        var wrap = document.createElement('div');
        wrap.className = 'store-form__phone-row';
        var i = txt('请输入手机号码', '');
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'erp-btn erp-btn--primary erp-btn--sms';
        b.textContent = '获取验证码';
        b.addEventListener('click', function () {
            if (typeof showToast === 'function') showToast('验证码已发送（演示验证码：123456）', 'info');
        });
        wrap.appendChild(i);
        wrap.appendChild(b);
        return wrap;
    }

    function txtAreaWithCount(placeholder, max, initial) {
        var ta = document.createElement('textarea');
        ta.className = 'erp-input store-form__textarea';
        ta.placeholder = placeholder;
        ta.maxLength = max;
        ta.value = initial || '';
        var w = document.createElement('div');
        w.className = 'store-form__textarea-wrap';
        var cnt = document.createElement('div');
        cnt.className = 'store-form__counter';
        function sync() {
            cnt.textContent = ta.value.length + ' / ' + max;
        }
        ta.addEventListener('input', sync);
        sync();
        w.appendChild(ta);
        w.appendChild(cnt);
        return w;
    }

    function uploadMock(btnLabel, hint) {
        var up = document.createElement('div');
        up.className = 'store-form__upload';
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'erp-btn erp-btn--primary';
        b.textContent = btnLabel;
        up.appendChild(b);
        var h = document.createElement('div');
        h.className = 'store-form__upload-hint';
        h.textContent = hint || '支持 JPG/PNG，单张图片不超过 5M';
        up.appendChild(h);
        return up;
    }

    /** 可切换已上传状态的演示上传控件；requiredMsg 非空则必填 */
    function uploadMockTracked(btnLabel, hint, initialUploaded, requiredMsg) {
        var up = uploadMock(btnLabel, hint);
        up.setAttribute('data-upload-tracked', '1');
        up.setAttribute('data-upload-state', initialUploaded ? '1' : '0');
        if (requiredMsg) up.setAttribute('data-upload-required-msg', requiredMsg);
        var b = up.querySelector('button');
        var h = up.querySelector('.store-form__upload-hint');
        function syncHint() {
            var on = up.getAttribute('data-upload-state') === '1';
            if (b) b.textContent = on ? '重新上传' : btnLabel;
            if (h) h.textContent = on ? '已上传（演示）' : hint || '支持 JPG/PNG，单张图片不超过 5M';
        }
        if (b) {
            b.addEventListener('click', function () {
                up.setAttribute('data-upload-state', '1');
                syncHint();
                if (typeof showToast === 'function') showToast('演示：已标记上传', 'success');
            });
        }
        syncHint();
        return up;
    }

    function readUploadTracked(el) {
        return !!(el && el.getAttribute('data-upload-state') === '1');
    }

    /** 新增/编辑门店仅收门头/场地照；内景与收银台在详情基础信息中上传 */
    function appendStoreHeaderPhotoField(body, refs, opts) {
        opts = opts || {};
        var initial = opts.initial || {};
        var headerRequired = opts.headerRequired !== false;
        refs.headerPicUp = uploadMockTracked(
            '+ 上传门头/场地照',
            '支持 JPG/PNG，单张图片不超过 5M',
            !!initial.store_header_pic,
            headerRequired ? '请上传门头/场地照' : ''
        );
        body.appendChild(formRow('门头/场地照', headerRequired, refs.headerPicUp));
    }

    function collectVenuePhotosFromRefs(refs) {
        var out = {};
        if (refs && refs.headerPicUp) {
            out.store_header_pic = readUploadTracked(refs.headerPicUp) ? '已上传' : '';
        }
        if (refs && refs.indoorPicUp) {
            out.store_indoor_pic = readUploadTracked(refs.indoorPicUp) ? '已上传' : '';
        }
        if (refs && refs.cashierPicUp) {
            out.store_cashier_desk_pic = readUploadTracked(refs.cashierPicUp) ? '已上传' : '';
        }
        return out;
    }

    function sectionTitle(text) {
        var d = document.createElement('div');
        d.className = 'supplier-detail-section-title';
        d.textContent = text;
        return d;
    }

    function sectionHint(text) {
        var d = document.createElement('div');
        d.className = 'store-form__section-hint';
        d.textContent = text;
        return d;
    }

    /**
     * 门店档案表单可折叠块（默认收起）
     * @returns {{ wrap: HTMLElement, body: HTMLElement }}
     */
    function makeFormCollapse(title, defaultCollapsed) {
        var collapsed = defaultCollapsed !== false;
        var wrap = document.createElement('div');
        wrap.className = 'store-form__collapse' + (collapsed ? ' is-collapsed' : '');
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'store-form__collapse-toggle';
        btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        var titleEl = document.createElement('span');
        titleEl.className = 'store-form__collapse-title';
        titleEl.textContent = title;
        var chevron = document.createElement('span');
        chevron.className = 'store-form__collapse-chevron';
        chevron.setAttribute('aria-hidden', 'true');
        btn.appendChild(titleEl);
        btn.appendChild(chevron);
        var bodyEl = document.createElement('div');
        bodyEl.className = 'store-form__collapse-body';
        btn.addEventListener('click', function () {
            var nowCollapsed = wrap.classList.toggle('is-collapsed');
            btn.setAttribute('aria-expanded', nowCollapsed ? 'false' : 'true');
        });
        wrap.appendChild(btn);
        wrap.appendChild(bodyEl);
        return { wrap: wrap, body: bodyEl };
    }

    function radioGroup(label, required, name, items, selectedVal) {
        var row = document.createElement('div');
        row.className = 'store-form__row';
        row.appendChild(sfLabel(label, required));
        var c = document.createElement('div');
        c.className = 'store-form__control';
        var rr = document.createElement('div');
        rr.className = 'store-radio-row';
        items.forEach(function (it) {
            var lb = document.createElement('label');
            var inp = document.createElement('input');
            inp.type = 'radio';
            inp.name = name;
            inp.value = it[0];
            if (selectedVal === it[0]) inp.checked = true;
            lb.appendChild(inp);
            lb.appendChild(document.createTextNode(' ' + it[1]));
            rr.appendChild(lb);
        });
        c.appendChild(rr);
        row.appendChild(c);
        return row;
    }

    function mapMockRow(withCoordHint) {
        var mapRow = document.createElement('div');
        mapRow.className = 'store-form__row';
        mapRow.appendChild(sfLabel('', false));
        var mapCtrl = document.createElement('div');
        mapCtrl.className = 'store-form__control';
        var map = document.createElement('div');
        map.className = 'store-archive__map-mock';
        map.textContent = '地图定位示意（高德 · 原型）';
        mapCtrl.appendChild(map);
        if (withCoordHint) {
            var hint = document.createElement('div');
            hint.className = 'store-archive__coord-hint';
            hint.textContent = '当前坐标（演示）：39.928359, 116.416334';
            mapCtrl.appendChild(hint);
        }
        mapRow.appendChild(mapCtrl);
        return mapRow;
    }

    function mountStoreBizFields(body, refs) {
        var api = window.StoreBizStructure;
        if (!api) return;
        refs.bizLineSel = sel(
            [{ value: '', label: '请选择事业线' }].concat(
                api.lines().map(function (n) {
                    return { value: n, label: n };
                })
            ),
            ''
        );
        refs.bizLineSel.setAttribute('data-required-msg', '请选择事业线');
        body.appendChild(formRow('事业线', true, refs.bizLineSel));

        refs.brandSel = sel([{ value: '', label: '请先选择事业线' }], '');
        refs.brandSel.setAttribute('data-required-msg', '请选择品牌名称');
        refs.brandSel.disabled = true;
        body.appendChild(formRow('品牌名称', true, refs.brandSel));

        var wrap = document.createElement('div');
        refs.bizChecks = document.createElement('div');
        refs.bizChecks.className = 'store-form__checks';
        refs.bizHidden = document.createElement('input');
        refs.bizHidden.type = 'hidden';
        refs.bizHidden.setAttribute('data-required-msg', '请选择业务线');
        var tip = document.createElement('div');
        tip.className = 'store-form__field-tip';
        tip.textContent = '请先选择事业线和品牌名称。业务线可多选，选项随品牌变化。';
        wrap.appendChild(refs.bizChecks);
        wrap.appendChild(refs.bizHidden);
        wrap.appendChild(tip);
        body.appendChild(formRow('业务线', true, wrap));

        function selectedBiz() {
            return Array.prototype.map.call(refs.bizChecks.querySelectorAll('input:checked'), function (el) {
                return el.value;
            });
        }
        function syncHidden() {
            refs.bizHidden.value = api.formatBiz(selectedBiz());
        }
        function paintBiz(keep) {
            var opts = api.bizLines(refs.bizLineSel.value, refs.brandSel.value);
            var keepSet = keep || [];
            refs.bizChecks.innerHTML = '';
            if (!opts.length) {
                tip.textContent = refs.bizLineSel.value
                    ? '请先选择品牌名称。业务线可多选。'
                    : '请先选择事业线和品牌名称。业务线可多选，选项随品牌变化。';
                syncHidden();
                return;
            }
            tip.textContent = '可多选。更换品牌后，不在该品牌下的业务线会取消勾选。';
            opts.forEach(function (name) {
                var lab = document.createElement('label');
                lab.className = 'store-form__check';
                var cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.value = name;
                if (keepSet.indexOf(name) >= 0) cb.checked = true;
                cb.addEventListener('change', syncHidden);
                lab.appendChild(cb);
                lab.appendChild(document.createTextNode(name));
                refs.bizChecks.appendChild(lab);
            });
            syncHidden();
        }
        function paintBrands(keepBrand, keepBiz) {
            var brandList = api.brands(refs.bizLineSel.value);
            var cur = keepBrand || '';
            refs.brandSel.innerHTML = '';
            var ph = document.createElement('option');
            ph.value = '';
            ph.textContent = brandList.length ? '请选择品牌名称' : '请先选择事业线';
            refs.brandSel.appendChild(ph);
            brandList.forEach(function (n) {
                var op = document.createElement('option');
                op.value = n;
                op.textContent = n;
                refs.brandSel.appendChild(op);
            });
            refs.brandSel.disabled = !brandList.length;
            refs.brandSel.value = brandList.indexOf(cur) >= 0 ? cur : '';
            paintBiz(refs.brandSel.value ? keepBiz : []);
        }
        refs.bizLineSel.addEventListener('change', function () {
            paintBrands('', []);
        });
        refs.brandSel.addEventListener('change', function () {
            paintBiz([]);
        });
        refs.setBizStructure = function (line, brand, biz) {
            refs.bizLineSel.value = api.lines().indexOf(line) >= 0 ? line : '';
            paintBrands(brand, api.normalizeBiz(biz));
        };
        paintBrands('', []);
    }

    function writeStoreBizAttrs(tr, refs) {
        if (!tr || !refs) return;
        tr.setAttribute('data-biz-line', refs.bizLineSel ? refs.bizLineSel.value : '');
        tr.setAttribute('data-brand-name', refs.brandSel ? refs.brandSel.value : '');
        tr.setAttribute('data-biz-lines', refs.bizHidden ? refs.bizHidden.value : '');
    }

    function yesNoSelect(placeholder) {
        return sel(
            [
                { value: '', label: placeholder },
                { value: 'yes', label: '有' },
                { value: 'no', label: '无' }
            ],
            ''
        );
    }

    function collectEnabledBdNamesFromRows(rows) {
        var list = [];
        var seen = {};
        rows.forEach(function (tr) {
            var c = tr.querySelectorAll('td');
            if (c.length < 13) return;
            var name = String((c[1].textContent || '').trim());
            if (!name) return;
            var stNode = c[12].querySelector('.status');
            var statusText = String((stNode ? stNode.textContent : c[12].textContent) || '').trim();
            if (statusText !== '开启') return;
            if (!seen[name]) {
                seen[name] = true;
                list.push(name);
            }
        });
        return list;
    }

    function updateBdSelectOptions(selectEl, bdNames, selectedName) {
        if (!selectEl) return;
        var names = Array.isArray(bdNames) ? bdNames : [];
        selectEl.innerHTML = '';
        var placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = '请选择绑定BD';
        selectEl.appendChild(placeholder);
        names.forEach(function (name) {
            var op = document.createElement('option');
            op.value = name;
            op.textContent = name;
            selectEl.appendChild(op);
        });
        if (selectedName) {
            selectEl.value = selectedName;
            if (selectEl.value !== selectedName) {
                selectOptionByLabelText(selectEl, selectedName);
            }
        }
    }

    function fetchEnabledBdNamesFromPeoplePage(callback) {
        if (typeof fetch !== 'function') {
            callback([]);
            return;
        }
        fetch('mdm_people_bd.html', { cache: 'no-store' })
            .then(function (res) {
                if (!res || !res.ok) return '';
                return res.text();
            })
            .then(function (html) {
                if (!html) return [];
                var parser = new DOMParser();
                var doc = parser.parseFromString(html, 'text/html');
                var rows = doc.querySelectorAll('#tableBody tr');
                return collectEnabledBdNamesFromRows(rows);
            })
            .then(function (list) {
                callback(list || []);
            })
            .catch(function () {
                callback([]);
            });
    }

    function hydrateBdSelectFromPeoplePage(selectEl, selectedName) {
        updateBdSelectOptions(selectEl, STORE_BIND_BD_ENUM, selectedName);
    }

    function fillWarehouseOptions(selectEl, warehouses, selectedName, placeholder) {
        selectEl.replaceChildren(new Option(placeholder, ''));
        (warehouses || []).forEach(function (warehouse) {
            if (!warehouse || warehouse.enabled === false) return;
            var option = new Option(warehouse.name, warehouse.name);
            if (warehouse.id) option.dataset.warehouseId = warehouse.id;
            selectEl.appendChild(option);
        });
        if (selectedName) {
            selectEl.value = selectedName;
            if (!selectEl.value) {
                selectEl.appendChild(new Option(selectedName, selectedName));
                selectEl.value = selectedName;
            }
        }
        selectEl.disabled = false;
    }

    function hydrateArchiveWarehouseSelect(selectEl, selectedName, placeholder) {
        var fallback = [
            { name: '沪南一号仓', id: 'WH001', enabled: true },
            { name: '合作仓-苏州', id: 'WH002', enabled: true }
        ];
        selectEl.disabled = true;
        if (!window.MdmErpLists || typeof window.MdmErpLists.ensureEnabledWarehouseOptions !== 'function') {
            fillWarehouseOptions(selectEl, fallback, selectedName, placeholder);
            return;
        }
        window.MdmErpLists.ensureEnabledWarehouseOptions(function (warehouses) {
            fillWarehouseOptions(
                selectEl,
                warehouses && warehouses.length ? warehouses : fallback,
                selectedName,
                placeholder
            );
        });
    }

    function warehouseSelectionAvailable(selectEl, previous) {
        if (selectEl.disabled) {
            showToast('正在读取仓库档案，请稍后重试', 'error');
            return false;
        }
        var option = selectEl.selectedOptions[0];
        if (!option || option.value === previous || !option.value) return true;
        var id = option.dataset.warehouseId;
        if (!id || !window.MdmErpLists || typeof window.MdmErpLists.archiveStatus !== 'function') return true;
        if (window.MdmErpLists.archiveStatus('warehouse', id, '启用') === '启用') return true;
        showToast('所选仓库已停用，请重新选择', 'error');
        return false;
    }

    function hydrateInboundWarehouseSelect(selectEl, selectedName) {
        hydrateArchiveWarehouseSelect(selectEl, selectedName, '请选择入库仓库');
    }

    /** 结算信息关键字段是否变更（结款方式 / 策略 / 起算 / 周期） */
    function isSupplierSettleChanged(before, after) {
        if (!before || !after) return !!after;
        if (Boolean(before.followPlatform) !== Boolean(after.followPlatform)) return true;
        if (String(before.payMethod || '') !== String(after.payMethod || '')) return true;
        if (!after.followPlatform) {
            if (String(before.trigger || '') !== String(after.trigger || '')) return true;
            if (String(before.cycle || '') !== String(after.cycle || '')) return true;
        }
        return false;
    }

    function settleSummaryText(cfg) {
        if (!cfg || !window.LFSettleCycleStore) return '—';
        var S = window.LFSettleCycleStore;
        var parts = [
            S.payMethodLabel ? S.payMethodLabel(cfg.payMethod) : cfg.payMethod,
            S.strategyLabel ? S.strategyLabel(cfg.followPlatform) : '',
            cfg.followPlatform
                ? '跟随平台'
                : (S.triggerLabel ? S.triggerLabel(cfg.trigger) : cfg.trigger) +
                  ' / ' +
                  (S.cycleLabel ? S.cycleLabel(cfg.cycle) : cfg.cycle)
        ];
        return parts.filter(Boolean).join(' · ');
    }

    /**
     * 结算信息变更后二次确认：是否发放结算信息变更补充协议；
     * 确认后写入合同任务并推送供应商 App 待签。
     */
    function confirmIssueSettleSupplement(supplierId, supplierName, settleCfg) {
        var exist = document.getElementById('mdmSettleSupConfirm');
        if (exist) exist.remove();
        var backdrop = document.createElement('div');
        backdrop.id = 'mdmSettleSupConfirm';
        backdrop.className = 'store-archive-modal-backdrop resource-archive-modal-backdrop';
        backdrop.innerHTML =
            '<div class="erp-modal" role="dialog" aria-modal="true" style="max-width:480px">' +
            '<div class="erp-modal__header"><h2 class="erp-modal__title">发放结算信息补充协议</h2></div>' +
            '<div class="erp-modal__body">' +
            '<p style="margin:0 0 10px;line-height:1.6;color:#333">供应商 <strong>' +
            String(supplierName || '') +
            '</strong> 的结算信息已变更：</p>' +
            '<p style="margin:0 0 12px;padding:10px 12px;background:#f7f8fa;border-radius:8px;font-size:13px;color:#666;line-height:1.5">' +
            settleSummaryText(settleCfg) +
            '</p>' +
            '<p style="margin:0;line-height:1.6;color:#333">是否发放<strong>结算信息变更补充协议</strong>？确认后将自动下发至供应商 App，由供应商完成电子签署。</p>' +
            '</div>' +
            '<div class="erp-modal__footer">' +
            '<button type="button" class="erp-btn" data-c="cancel">暂不发放</button>' +
            '<button type="button" class="erp-btn erp-btn--primary" data-c="ok">确认发放</button>' +
            '</div></div>';
        document.body.appendChild(backdrop);
        function close() {
            backdrop.remove();
        }
        backdrop.addEventListener('click', function (ev) {
            if (ev.target === backdrop) close();
        });
        backdrop.querySelector('[data-c="cancel"]').addEventListener('click', close);
        backdrop.querySelector('[data-c="ok"]').addEventListener('click', function () {
            close();
            if (!window.LfContract || typeof window.LfContract.issueSupplierSettleSupplement !== 'function') {
                if (typeof showToast === 'function') {
                    showToast('合同模块未加载，无法下发补充协议（演示）', 'error');
                }
                return;
            }
            var task = window.LfContract.issueSupplierSettleSupplement({
                supplierId: supplierId,
                name: supplierName,
                bizRef: 'supplier-settle-sup:' + (supplierId || supplierName),
                settleSnapshot: settleCfg,
                initiator: '供应商档案·结算变更'
            });
            if (task && typeof showToast === 'function') {
                showToast('已下发结算信息补充协议，待供应商 App 签署（演示）', 'success');
            }
            });
    }

    function storeFullPhone(tr) {
        var full = tr && tr.getAttribute('data-phone');
        if (full) return full;
        var td = tr && tr.querySelectorAll('td')[7];
        var shown = td ? String(td.textContent || '').trim() : '';
        return shown.replace('****', '0000');
    }

    /* 【857】演示用验证码 */
    var STORE_PHONE_DEMO_CODE = '123456';

    function showStorePhoneConfirm(message, onOk) {
        var backdrop = document.createElement('div');
        backdrop.className = 'erp-modal-backdrop mdm-people-warm-confirm-backdrop';
        backdrop.setAttribute('data-mdm-archive-form', '1');
        backdrop.style.zIndex = '3000';
        var modal = document.createElement('div');
        modal.className = 'erp-modal erp-modal--confirm';
        modal.innerHTML =
            '<div class="erp-modal__header"><h2 class="erp-modal__title">更换门店店长</h2>' +
            '<div class="erp-modal__header-actions"><button type="button" class="erp-modal__header-btn" data-act="x" aria-label="关闭">&times;</button></div></div>' +
            '<div class="erp-modal__body"><div class="erp-modal-confirm__row"><div class="erp-modal-confirm__icon">!</div>' +
            '<div class="erp-modal-confirm__msg" style="white-space:pre-line"></div></div></div>' +
            '<div class="erp-modal__footer"><button type="button" class="erp-btn" data-act="cancel">取消</button>' +
            '<button type="button" class="erp-btn erp-btn--primary" data-act="ok">确认</button></div>';
        modal.querySelector('.erp-modal-confirm__msg').textContent = message;
        backdrop.appendChild(modal);
        function hide() {
            backdrop.remove();
        }
        modal.querySelector('[data-act="x"]').addEventListener('click', hide);
        modal.querySelector('[data-act="cancel"]').addEventListener('click', hide);
        backdrop.addEventListener('click', function (e) {
            if (e.target === backdrop) hide();
        });
        modal.querySelector('[data-act="ok"]').addEventListener('click', function () {
            hide();
            if (typeof onOk === 'function') onOk();
        });
        document.body.appendChild(backdrop);
    }

    function mountEntryMaterials(body, refs) {
        if (!window.MdmEntryMaterials || !body || !refs) return;
        refs.entryMaterials = window.MdmEntryMaterials.mount(body, { skin: 'pc', role: 'subject' });
    }

    function hydrateArchiveMaterials(refs, kind, name) {
        if (!refs || !refs.entryMaterials || !window.MdmEntryMaterials || !name) return;
        var data = window.MdmEntryMaterials.loadForArchive(kind, name);
        if (data) window.MdmEntryMaterials.fill(refs.entryMaterials, data);
    }

    function persistArchiveMaterials(refs, kind, name) {
        if (!refs || !refs.entryMaterials || !window.MdmEntryMaterials || !name) return;
        window.MdmEntryMaterials.saveForArchive(kind, name, window.MdmEntryMaterials.read(refs.entryMaterials));
    }

    function fieldHidden(el) {
        if (!el) return true;
        var node = el;
        while (node && node !== document.body) {
            if (node.classList && node.classList.contains('subj-wiz__sink')) return true;
            if (node.style && node.style.display === 'none') return true;
            node = node.parentNode;
        }
        return false;
    }

    function attachWideModal(title, bodyEl, onConfirm, beforeValidate, dressKind) {
        removeArchiveFormModals();
        var backdrop = document.createElement('div');
        backdrop.className = 'store-archive-modal-backdrop resource-archive-modal-backdrop';
        backdrop.setAttribute('data-mdm-archive-form', '1');
        var useDrawer = dressKind && window.MdmSubjectAddWizard && typeof window.MdmSubjectAddWizard.dress === 'function';
        if (useDrawer) backdrop.classList.add('subj-wiz-backdrop');
        var modal = document.createElement('div');
        modal.className = useDrawer ? 'modal-content subj-wiz' : 'erp-modal erp-modal--store-wide';
        var head = document.createElement('div');
        head.className = useDrawer ? 'modal-header' : 'erp-modal__header';
        var h2 = document.createElement('h2');
        h2.className = useDrawer ? 'modal-title' : 'erp-modal__title';
        h2.textContent = title;
        head.appendChild(h2);
        var bx = document.createElement('button');
        bx.type = 'button';
        bx.className = useDrawer ? 'close' : 'erp-modal__header-btn';
        bx.innerHTML = '&times;';
        bx.setAttribute('aria-label', '关闭');
        bx.addEventListener('click', function () {
            backdrop.remove();
        });
        if (useDrawer) head.appendChild(bx);
        else {
            var ha = document.createElement('div');
            ha.className = 'erp-modal__header-actions';
            ha.appendChild(bx);
            head.appendChild(ha);
        }
        var bw = document.createElement('div');
        bw.className = useDrawer ? 'modal-form' : 'erp-modal__body';
        bw.appendChild(bodyEl);
        var foot = document.createElement('div');
        foot.className = useDrawer ? 'modal-footer' : 'erp-modal__footer';
        var bc = document.createElement('button');
        bc.type = 'button';
        bc.className = useDrawer ? 'btn btn-secondary' : 'erp-btn';
        bc.textContent = '取消';
        var ok = document.createElement('button');
        ok.type = 'button';
        ok.className = useDrawer ? 'btn btn-primary' : 'erp-btn erp-btn--primary';
        ok.textContent = '确定';
        bc.addEventListener('click', function () {
            backdrop.remove();
        });
        ok.addEventListener('click', function () {
            if (typeof beforeValidate === 'function' && beforeValidate() === false) return;
            var requiredEls = bodyEl.querySelectorAll('[data-required-msg]');
            for (var i = 0; i < requiredEls.length; i++) {
                var one = requiredEls[i];
                if (!one || one.disabled || fieldHidden(one)) continue;
                var val = typeof one.value === 'string' ? one.value.trim() : '';
                if (!val) {
                    if (typeof showToast === 'function') {
                        showToast(one.getAttribute('data-required-msg') || '请完善必填项', 'error');
                    }
                    one.focus && one.focus();
                    return;
                }
            }
            var uploadReq = bodyEl.querySelectorAll('[data-upload-required-msg]');
            for (var u = 0; u < uploadReq.length; u++) {
                var upEl = uploadReq[u];
                if (fieldHidden(upEl)) continue;
                if (upEl.getAttribute('data-upload-state') !== '1') {
                    if (typeof showToast === 'function') {
                        showToast(upEl.getAttribute('data-upload-required-msg') || '请上传必填照片', 'error');
                    }
                    return;
                }
            }
            if (bodyEl.querySelector('[data-entry-materials]') && window.MdmEntryMaterials) {
                var entryErr = window.MdmEntryMaterials.validate(bodyEl.querySelector('[data-entry-materials]'));
                if (entryErr) {
                    if (typeof showToast === 'function') showToast(entryErr, 'error');
                    return;
                }
            }
            if (typeof onConfirm === 'function') {
                var shouldContinue = onConfirm();
                if (shouldContinue === false) return;
                backdrop.remove();
                if (typeof showToast === 'function') {
                    showToast(typeof shouldContinue === 'string' ? shouldContinue : '已提交（演示）', 'success');
                }
                return;
            }
            backdrop.remove();
            if (typeof showToast === 'function') showToast('已提交（演示）', 'success');
        });
        foot.appendChild(bc);
        foot.appendChild(ok);
        modal.appendChild(head);
        modal.appendChild(bw);
        modal.appendChild(foot);
        backdrop.appendChild(modal);
        backdrop.addEventListener('click', function (ev) {
            if (ev.target === backdrop) backdrop.remove();
        });
        document.body.appendChild(backdrop);
        if (useDrawer) window.MdmSubjectAddWizard.dress(backdrop, dressKind, { keepTitle: true, archive: true });
    }

    function cellPlainText(td) {
        if (!td) return '';
        return String(td.textContent || '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function selectOptionByLabelText(selectEl, labelText) {
        if (!selectEl || labelText == null || labelText === '') return false;
        var t = String(labelText).trim();
        for (var i = 0; i < selectEl.options.length; i++) {
            if (selectEl.options[i].text.trim() === t) {
                selectEl.selectedIndex = i;
                return true;
            }
        }
        return false;
    }

    var STORE_SUBJECTS = [
        { value: '', label: '请选择主体名称' },
        { value: '307892034956427264', label: '冷丰演示门店' },
        { value: '307892034956427265', label: '五角场体验店' },
        { value: '307892034956427266', label: '张江快闪店' },
        { value: 'm2', label: '演示主体-B' }
    ];

    var SUP_SUBJECTS = [
        { value: '', label: '请选择主体名称' },
        { value: '307403295087919104', label: '小牛供应链' },
        { value: '307403295087919105', label: '珠宝集采中心' },
        { value: '307403295087919106', label: '华东辅料仓配' },
        { value: 'm2', label: '演示主体-B' }
    ];

    var LIVE_SUBJECTS = [
        { value: '', label: '请选择主体名称' },
        { value: '307403295087919301', label: '品牌日播间-A' },
        { value: '307403295087919302', label: '区域直播-沪南' },
        { value: '307403295087919303', label: '工厂溯源专场' },
        { value: 'm2', label: '演示主体-B' }
    ];

    var CAR_SUBJECTS = [
        { value: '', label: '请选择主体名称' },
        { value: '307403295087919401', label: '顺丰同城承运' },
        { value: '307403295087919402', label: '德邦干线承运' },
        { value: '307403295087919403', label: '区域城配联盟' },
        { value: 'm2', label: '演示主体-B' }
    ];

    var WH_SUBJECTS = [
        { value: '', label: '请选择主体名称' },
        { value: '307403295087919501', label: '沪南一号仓' },
        { value: '307403295087919502', label: '合作仓-苏州' },
        { value: '307403295087919503', label: '自建仓-杭州' },
        { value: '307403295087919504', label: '同城周转仓主体' },
        { value: 'm2', label: '演示主体-B' }
    ];

    var LIVE_ANCHORS = [
        { value: '', label: '请选择主播名称' },
        { value: 'ANC5001', label: '周琳' },
        { value: 'ANC5002', label: '吴悦' },
        { value: 'ANC5003', label: '郑可' }
    ];

    function compactStoreRegion(path) {
        if (window.MdmStoreCode && typeof window.MdmStoreCode.compactRegion === 'function') {
            return window.MdmStoreCode.compactRegion(path);
        }
        return String(path || '')
            .replace(/\s*\/\s*/g, '/')
            .trim();
    }

    function bindStoreCodeField(refs, options) {
        var existingCode = String((options && options.storeCode) || '').trim();
        var originalRegion = '';
        function refresh() {
            var api = window.MdmStoreCode;
            var region = refs.regionInp ? String(refs.regionInp.value || '').trim() : '';
            if (!refs.codeInp) return;
            if (!api) {
                refs.codeInp.value = existingCode;
                return;
            }
            if (existingCode) {
                var oldCity = api.cityCodeOf(originalRegion);
                var newCity = api.cityCodeOf(region);
                if (originalRegion && newCity && oldCity && newCity !== oldCity) {
                    refs.codeInp.value = api.peekNextCode(region, existingCode);
                    refs.codeInp.setAttribute('data-reallocated', '1');
                } else {
                    refs.codeInp.value = existingCode;
                    refs.codeInp.removeAttribute('data-reallocated');
                }
                return;
            }
            /* 新建不预占编码。入驻审核通过后才分配。 */
            refs.codeInp.value = '';
            refs.codeInp.removeAttribute('data-reallocated');
        }
        refs.refreshStoreCode = refresh;
        refs.captureOriginalRegion = function () {
            originalRegion = refs.regionInp ? String(refs.regionInp.value || '').trim() : '';
            refresh();
        };
        if (refs.regionInp) {
            refs.regionInp.addEventListener('input', refresh);
            refs.regionInp.addEventListener('change', refresh);
        }
        refresh();
    }

    function createStoreFormBundle(options) {
        var opts = options || {};
        var optsInitialVenuePhotos = opts.initialVenuePhotos || {};
        var refs = {};
        var body = document.createElement('div');
        body.appendChild(sectionTitle('基础信息'));
        refs.subjectSel = sel(STORE_SUBJECTS, '');
        refs.subjectSel.setAttribute('data-required-msg', '请选择主体名称');
        body.appendChild(formRow('主体名称', true, refs.subjectSel));
        var codeWrap = document.createElement('div');
        refs.codeInp = txt('入驻审核通过后生成', opts.storeCode || '');
        refs.codeInp.readOnly = true;
        refs.codeInp.style.background = '#f5f5f5';
        var codeTip = document.createElement('div');
        codeTip.style.cssText = 'margin-top:6px;font-size:12px;color:#999;line-height:1.5;';
        codeTip.textContent = opts.storeCode
            ? '8 位编码：3 位城市码（IATA）+ 5 位顺序码；按城市生成，注销后不回收。'
            : '入驻审核通过后按城市生成，注销后不回收。';
        codeWrap.appendChild(refs.codeInp);
        codeWrap.appendChild(codeTip);
        body.appendChild(formRow('门店编码', false, codeWrap));
        refs.contactInp = txt('请输入联系人', '');
        body.appendChild(formRow('联系人', true, refs.contactInp));
        var phoneRowWrap = smsRow();
        refs.phoneInp = phoneRowWrap.querySelector('input');
        /* 【857】店长手机号用于查找接任用户，实际重绑「门店主体 ID ↔ 店长 ID」 */
        refs.phoneTip = document.createElement('div');
        refs.phoneTip.style.cssText = 'display:none;margin-top:6px;font-size:12px;color:#d46b08;line-height:1.5;';
        refs.phoneTip.textContent =
            '确认后，接任店长可登录并管理本店，原店长不再拥有本店管理权限。';
        var phoneCtl = document.createElement('div');
        phoneCtl.appendChild(phoneRowWrap);
        phoneCtl.appendChild(refs.phoneTip);
        refs.phoneFormRow = formRow('手机号码', true, phoneCtl);
        body.appendChild(refs.phoneFormRow);
        refs.verifyInp = txt('请输入验证码', '');
        refs.verifyRow = formRow('验证码', true, refs.verifyInp);
        body.appendChild(refs.verifyRow);
        refs.isPhoneChanged = function () {
            if (refs.originalPhone == null) return false;
            return String(refs.phoneInp.value || '').trim() !== refs.originalPhone;
        };
        refs.phoneInp.addEventListener('input', function () {
            if (refs.originalPhone == null) return;
            var changed = refs.isPhoneChanged();
            refs.phoneTip.style.display = '';
            refs.verifyRow.style.display = changed ? '' : 'none';
        });
        var nameWrap = document.createElement('div');
        nameWrap.className = 'store-form__input-count';
        var nameInp = txt('请输入门店名称', '');
        refs.nameInp = nameInp;
        nameInp.maxLength = 50;
        nameInp.setAttribute('data-required-msg', '请输入门店名称');
        var nc = document.createElement('span');
        nc.className = 'store-form__counter';
        nc.textContent = '0 / 50';
        nameInp.addEventListener('input', function () {
            nc.textContent = nameInp.value.length + ' / 50';
            if (refs.shortNameInp && !refs.shortNameLocked) refs.shortNameInp.value = nameInp.value;
        });
        nameWrap.appendChild(nameInp);
        nameWrap.appendChild(nc);
        body.appendChild(formRow('门店名称', true, nameWrap));
        refs.shortNameInp = txt('', '');
        refs.shortNameInp.readOnly = true;
        refs.shortNameInp.style.background = '#f5f5f5';
        var shortWrap = document.createElement('div');
        shortWrap.appendChild(refs.shortNameInp);
        var shortTip = document.createElement('div');
        shortTip.style.cssText = 'margin-top:6px;font-size:12px;color:#999;line-height:1.5;';
        shortTip.textContent = '取门店名称，不可改；仓储站点维护储位后回写为「储位编码-储位名称」。';
        shortWrap.appendChild(shortTip);
        body.appendChild(formRow('门店简称', false, shortWrap));
        refs.bindBdSel = sel([{ value: '', label: '请选择绑定BD' }], '');
        refs.bindBdSel.setAttribute('data-required-msg', '请选择绑定BD');
        body.appendChild(formRow('绑定BD', true, refs.bindBdSel));
        hydrateBdSelectFromPeoplePage(refs.bindBdSel, '');
        var partnerSel = sel(
            [
                { value: '', label: '请选择门店合作类型' },
                { value: 'franchise', label: '加盟店' },
                { value: 'joint', label: '联营店' },
                { value: 'direct', label: '直营店' }
            ],
            ''
        );
        refs.partnerSel = partnerSel;
        partnerSel.setAttribute('data-required-msg', '请选择门店合作类型');
        body.appendChild(formRow('门店合作类型', true, partnerSel));
        refs.storeTypeInp = txt('如社区生鲜店、团购自提点等', '');
        refs.storeTypeInp.setAttribute('data-required-msg', '请输入门店类型');
        body.appendChild(formRow('门店类型', true, refs.storeTypeInp));
        mountStoreBizFields(body, refs);
        refs.warehouseSel = sel([], '');
        refs.warehouseSel.setAttribute('data-required-msg', '请选择配送仓库');
        body.appendChild(formRow('配送仓库', true, refs.warehouseSel));
        var regionRow = document.createElement('div');
        regionRow.className = 'store-form__row';
        regionRow.appendChild(sfLabel('门店地址', true));
        var rc = document.createElement('div');
        rc.className = 'store-form__control';
        var regionHidden = document.createElement('input');
        regionHidden.type = 'hidden';
        regionHidden.setAttribute('data-required-msg', '请选择门店地址');
        refs.regionInp = regionHidden;
        rc.appendChild(regionHidden);
        if (window.MdmStoreRegionCascader && typeof window.MdmStoreRegionCascader.create === 'function') {
            refs.regionCascader = window.MdmStoreRegionCascader.create(rc, '', {
                onChange: function (path) {
                    regionHidden.value = compactStoreRegion(path);
                    if (typeof refs.refreshStoreCode === 'function') refs.refreshStoreCode();
                }
            });
            rc.appendChild(refs.regionCascader.wrap);
        } else {
            regionHidden.type = 'text';
            regionHidden.className = 'erp-input';
            regionHidden.placeholder = '省 / 市 / 区';
        }
        regionRow.appendChild(rc);
        body.appendChild(regionRow);
        var addressWrap = txtAreaWithCount('请输入详细地址，输入后将自动在地图上定位', 200, '');
        refs.addressTa = addressWrap.querySelector('textarea');
        if (refs.addressTa) refs.addressTa.setAttribute('data-required-msg', '请输入详细地址');
        body.appendChild(formRow('详细地址', true, addressWrap));
        body.appendChild(mapMockRow(false));
        appendStoreHeaderPhotoField(body, refs, {
            headerRequired: true,
            initial: optsInitialVenuePhotos || {}
        });
        body.appendChild(formRow('有无冷藏柜', false, yesNoSelect('请选择有无冷藏柜')));
        body.appendChild(formRow('冷藏柜照片', false, uploadMock('+ 上传冷藏柜照片', '最多 5 张')));
        body.appendChild(formRow('有无冷冻柜', false, yesNoSelect('请选择有无冷冻柜')));
        body.appendChild(formRow('冷冻柜照片', false, uploadMock('+ 上传冷冻柜照片', '最多 5 张')));

        var franchise = document.createElement('div');
        franchise.style.display = 'none';
        franchise.appendChild(sectionHint('加盟店资料'));
        franchise.appendChild(formRow('门店面积', true, txt('请输入门店面积（㎡）', '')));
        franchise.appendChild(formRow('门店楼层', true, txt('请输入门店楼层', '')));
        franchise.appendChild(formRow('店门口口述视频', false, uploadMock('+ 上传店门口视频', '店前两分钟口述视频')));
        franchise.appendChild(formRow('店内口述视频', false, uploadMock('+ 上传店内视频', '店内一分钟口述视频')));
        /* 门店经营与认知、特殊情况说明：分两个可折叠板块，默认收起 */
        var franchiseOpsCollapse = makeFormCollapse('门店经营与认知', true);
        franchiseOpsCollapse.body.appendChild(
            formRow('门店方圆500米入住户数', false, txt('请输入实际入住总户数', ''))
        );
        franchiseOpsCollapse.body.appendChild(formRow('日均客单量', false, txt('请输入日均客单量', '')));
        franchiseOpsCollapse.body.appendChild(
            formRow('店内工作人员总数', false, txt('请输入工作人员总数', ''))
        );
        franchiseOpsCollapse.body.appendChild(
            formRow(
                '实际经营者对直播业务的理解',
                false,
                txtAreaWithCount('请输入老板对直播业务的理解', 500, '')
            )
        );
        franchiseOpsCollapse.body.appendChild(
            formRow(
                '门店日常运营服务理解与配合',
                false,
                txtAreaWithCount('请输入日常运营服务理解与配合情况', 500, '')
            )
        );
        franchiseOpsCollapse.body.appendChild(
            formRow(
                '私域直播投入产出期望',
                false,
                txtAreaWithCount('请输入老板对私域直播 ROI 的期望', 500, '')
            )
        );
        franchiseOpsCollapse.body.appendChild(
            formRow('私域直播/社区团购熟悉程度', false, txtAreaWithCount('请输入了解程度', 500, ''))
        );
        franchiseOpsCollapse.body.appendChild(
            formRow('周边小区及居住人群描述', false, txtAreaWithCount('请输入周边小区及人群描述', 500, ''))
        );
        franchiseOpsCollapse.body.appendChild(
            formRow('拉到1000人信心说明', false, txtAreaWithCount('请输入信心说明', 500, ''))
        );
        franchise.appendChild(franchiseOpsCollapse.wrap);

        var franchiseSpecialCollapse = makeFormCollapse('特殊情况说明', true);
        franchiseSpecialCollapse.body.appendChild(
            formRow('特殊情况说明', false, txtAreaWithCount('选填，供审核人员查阅', 500, ''))
        );
        franchiseSpecialCollapse.body.appendChild(
            formRow('特殊情况配图', false, uploadMock('+ 上传特殊情况配图', '最多 6 张'))
        );
        franchise.appendChild(franchiseSpecialCollapse.wrap);
        body.appendChild(franchise);

        function syncPartner() {
            var v = partnerSel.value;
            var franchiseLike = v === 'franchise' || v === 'joint' || v === 'direct';
            franchise.style.display = franchiseLike ? '' : 'none';
        }
        partnerSel.addEventListener('change', syncPartner);
        syncPartner();

        function fillFromArchiveRow(tr) {
            var c = tr.querySelectorAll('td');
            if (c.length < 11) return;
            selectOptionByLabelText(refs.subjectSel, cellPlainText(c[1]));
            refs.contactInp.value = cellPlainText(c[6]);
            /* 【857】编辑弹窗显示完整手机号（列表仍脱敏）；演示数据无完整号时把 **** 补成 0000 */
            /* 编辑页联系手机号 = 店长交接；改号即更换本店店长 */
            var fullPhone = storeFullPhone(tr);
            if (refs.phoneInp) {
                refs.phoneInp.value = fullPhone;
                refs.phoneInp.placeholder = '请输入联系手机号';
                refs.phoneInp.setAttribute('aria-label', '联系手机号');
                refs.phoneInp.setAttribute('data-required-msg', '请输入联系手机号');
            }
            refs.originalPhone = fullPhone;
            var phoneLabel = refs.phoneFormRow && refs.phoneFormRow.querySelector('label');
            if (phoneLabel) phoneLabel.innerHTML = '<span style="color:#ff4d4f">*</span> 联系手机号';
            if (refs.verifyInp) {
                refs.verifyInp.value = '';
                refs.verifyInp.setAttribute('data-required-msg', '请输入验证码');
            }
            if (refs.verifyRow) refs.verifyRow.style.display = 'none';
            if (refs.phoneTip) {
                refs.phoneTip.style.display = '';
                refs.phoneTip.style.color = '#d46b08';
                refs.phoneTip.textContent =
                    '确认后，接任店长可登录并管理本店，原店长不再拥有本店管理权限。';
            }
            var smsBtn = refs.phoneFormRow && refs.phoneFormRow.querySelector('.erp-btn--sms');
            if (smsBtn) smsBtn.style.display = '';
            refs.nameInp.value = cellPlainText(c[2]);
            var storeCode = cellPlainText(c[0]);
            var mapped = window.MdmStoreSiteSlot && window.MdmStoreSiteSlot.getByStore(storeCode);
            refs.shortNameLocked = !!(mapped && mapped.fromSite);
            refs.shortNameInp.value =
                mapped && mapped.fromSite
                    ? window.MdmStoreSiteSlot.composeShortName(mapped.slotCode, mapped.slotName)
                    : refs.nameInp.value;
            var bindBdName = cellPlainText(c[5]);
            if (bindBdName === '—') bindBdName = '';
            hydrateBdSelectFromPeoplePage(refs.bindBdSel, bindBdName);
            var partnerLabel = cellPlainText(c[3]);
            if (partnerLabel === '生鲜店' || partnerLabel === '同行店') partnerLabel = '加盟店';
            if (partnerLabel === '合作店') partnerLabel = '联营店';
            var pmap = { 加盟店: 'franchise', 联营店: 'joint', 直营店: 'direct' };
            if (pmap[partnerLabel]) {
                refs.partnerSel.value = pmap[partnerLabel];
            } else if (partnerLabel && partnerLabel !== '—') {
                var legacyOpt = document.createElement('option');
                legacyOpt.value = partnerLabel;
                legacyOpt.textContent = partnerLabel;
                refs.partnerSel.appendChild(legacyOpt);
                refs.partnerSel.value = partnerLabel;
            } else {
                refs.partnerSel.value = '';
            }
            refs.storeTypeInp.value = cellPlainText(c[4]);
            hydrateArchiveWarehouseSelect(refs.warehouseSel, cellPlainText(c[8]), '请选择配送仓库');
            var regionVal = tr.getAttribute('data-region') || '';
            refs.regionInp.value = compactStoreRegion(regionVal);
            if (refs.regionCascader && typeof refs.regionCascader.setValue === 'function') {
                refs.regionCascader.setValue(regionVal);
            }
            if (refs.addressTa) refs.addressTa.value = tr.getAttribute('data-address') || '';
            if (typeof refs.captureOriginalRegion === 'function') refs.captureOriginalRegion();
            if (typeof refs.setBizStructure === 'function') {
                refs.setBizStructure(
                    tr.getAttribute('data-biz-line') || '',
                    tr.getAttribute('data-brand-name') || '',
                    tr.getAttribute('data-biz-lines') || ''
                );
            }
            syncPartner();
            hydrateArchiveMaterials(refs, 'store', refs.nameInp.value);
        }

        bindStoreCodeField(refs, { storeCode: opts.storeCode || '' });
        mountEntryMaterials(body, refs);
        return { body: body, fillFromArchiveRow: fillFromArchiveRow, refs: refs };
    }

    function buildStoreAddBody(initialVenuePhotos) {
        return createStoreFormBundle({ initialVenuePhotos: initialVenuePhotos || {} }).body;
    }

    function createSupplierFormBundle(options) {
        var refs = {};
        var body = document.createElement('div');
        var kind = 'supplier';
        var includeInboundWarehouse = !!(options && options.includeInboundWarehouse);
        var initialInboundWarehouse = String(
            (options && options.initialInboundWarehouse) || ''
        ).trim();
        refs.subjectSel = sel(SUP_SUBJECTS, '');
        refs.subjectSel.setAttribute('data-required-msg', '请选择主体名称');
        body.appendChild(formRow('主体名称', true, refs.subjectSel));
        refs.nameInp = txt('请输入供应商名称', '');
        refs.nameInp.setAttribute('data-required-msg', '请输入供应商名称');
        body.appendChild(formRow('供应商名称', true, refs.nameInp));
        /* 供应商别名：仅 PC、由平台运营维护；写路径必填。
           存量空别名不迁库，列表空显示「-」；编辑预填名称。C 端：别名 || 名称。 */
        refs.shortNameInp = txt('请输入供应商别名', '');
        refs.shortNameInp.setAttribute('data-required-msg', '请输入供应商别名');
        body.appendChild(formRow('供应商别名', true, refs.shortNameInp));
        var aliasTip = document.createElement('div');
        aliasTip.className = 'store-form__tip';
        aliasTip.style.cssText = 'margin:-4px 0 12px 168px;font-size:12px;color:#999;line-height:1.5;';
        aliasTip.textContent =
            '必填，由平台运营维护，用于 C 端供应商标题。存量未填列表显示「-」，编辑时若为空会按名称预填，提示「请填写对外简称」。';
        body.appendChild(aliasTip);
        refs.typeSel = sel(
            [
                { value: '', label: '请选择供应商类型' },
                { value: 'brand', label: '品牌商' },
                { value: 'agent', label: '代理商' },
                { value: 'person', label: '个人' }
            ],
            ''
        );
        refs.typeSel.setAttribute('data-required-msg', '请选择供应商类型');
        body.appendChild(formRow('供应商类型', true, refs.typeSel));
        var regRow = document.createElement('div');
        regRow.className = 'store-form__row';
        regRow.appendChild(sfLabel('供应商地址', true));
        var regC = document.createElement('div');
        regC.className = 'store-form__control';
        refs.regionInp = txt('省 / 市 / 区（级联示意）', '');
        refs.regionInp.setAttribute('data-required-msg', '请填写供应商地址');
        regC.appendChild(refs.regionInp);
        regRow.appendChild(regC);
        body.appendChild(regRow);
        var detailWrap = txtAreaWithCount('请输入详细地址，输入后将自动在地图上定位', 200, '');
        refs.detailTa = detailWrap.querySelector('textarea');
        if (refs.detailTa) refs.detailTa.setAttribute('data-required-msg', '请输入详细地址');
        body.appendChild(formRow('详细地址', true, detailWrap));
        body.appendChild(mapMockRow(false));
        if (includeInboundWarehouse) {
            refs.inboundWarehouseSel = sel([{ value: '', label: '请选择入库仓库' }], '');
            refs.inboundWarehouseSel.setAttribute('data-required-msg', '请选择入库仓库');
            body.appendChild(formRow('入库仓库', true, refs.inboundWarehouseSel));
            hydrateInboundWarehouseSelect(refs.inboundWarehouseSel, initialInboundWarehouse);
        }
        var supPhoneWrap = smsRow();
        refs.phoneInp = supPhoneWrap.querySelector('input');
        body.appendChild(formRow('手机号码', true, supPhoneWrap));
        refs.verifyInp = txt('请输入验证码', '');
        body.appendChild(formRow('验证码', true, refs.verifyInp));
        refs.contactInp = txt('请输入联系人', '');
        body.appendChild(formRow('联系人', true, refs.contactInp));
        var payMethodName = kind + '-pay';
        refs.payMethodRow = radioGroup(
            '结款方式',
            true,
            payMethodName,
            [['goods_first', '先货后款']],
            'goods_first'
        );
        body.appendChild(refs.payMethodRow);
        body.appendChild(
            radioGroup('结算类型', true, kind + '-settle', [['order', '订单结算']], 'order')
        );

        /* 结算策略 →（独立配置时）起算节点 + 周期 */
        var platCfg =
            window.LFSettleCycleStore && window.LFSettleCycleStore.loadConfig
                ? window.LFSettleCycleStore.loadConfig()
                : { trigger: 'fulfill', cycle: '1' };
        var settleStrategyName = kind + '-settle-strategy';
        /* 枚举：平台通用配置 | 供应商独立配置 */
        refs.settleStrategyRow = radioGroup(
            '结算策略',
            true,
            settleStrategyName,
            [
                ['inherit', '平台通用配置'],
                ['override', '供应商独立配置']
            ],
            'inherit'
        );
        var strategyTip = document.createElement('div');
        strategyTip.className = 'store-archive__coord-hint';
        strategyTip.style.marginTop = '6px';
        strategyTip.textContent =
            '平台通用配置：起算节点与周期随结算中心「通用配置」同步，平台变更后自动生效（已生成清分不变）。独立配置：本供应商单独维护，不再随平台默认变更。';
        refs.settleStrategyRow.querySelector('.store-form__control').appendChild(strategyTip);
        body.appendChild(refs.settleStrategyRow);

        refs.settleTriggerSel = sel(
            [
                { value: '', label: '请选择起算节点' },
                { value: 'fulfill', label: '订单履约确认后' },
                { value: 'aftersale', label: '售后期结束' }
            ],
            platCfg.trigger || 'fulfill'
        );
        refs.settleTriggerSel.setAttribute('data-required-msg', '请选择结算起算节点');
        refs.settleTriggerRow = formRow('结算起算节点', true, refs.settleTriggerSel);
        body.appendChild(refs.settleTriggerRow);
        var cycleOpts = [{ value: '', label: '请选择结算周期' }].concat(
            (window.LFSettleCycleStore && window.LFSettleCycleStore.CYCLE_OPTIONS) || [
                { value: '1', label: '1天' },
                { value: '7', label: '7天' },
                { value: '15', label: '15天' },
                { value: '30', label: '30天' },
                { value: 'month', label: '自然月1日' }
            ]
        );
        refs.settleCycleSel = sel(cycleOpts, platCfg.cycle || '1');
        refs.settleCycleSel.setAttribute('data-required-msg', '请选择结算周期');
        refs.settleCycleRow = formRow('结算周期', true, refs.settleCycleSel);
        body.appendChild(refs.settleCycleRow);

        function readSettleStrategy() {
            var checked = refs.settleStrategyRow.querySelector(
                'input[name="' + settleStrategyName + '"]:checked'
            );
            return checked && checked.value === 'override' ? 'override' : 'inherit';
        }

        function setSettleStrategy(mode) {
            var val = mode === 'override' ? 'override' : 'inherit';
            var radios = refs.settleStrategyRow.querySelectorAll(
                'input[name="' + settleStrategyName + '"]'
            );
            for (var i = 0; i < radios.length; i++) {
                radios[i].checked = radios[i].value === val;
            }
        }

        function applySettleStrategyUI() {
            var inherit = readSettleStrategy() === 'inherit';
            var cfg =
                window.LFSettleCycleStore && window.LFSettleCycleStore.loadConfig
                    ? window.LFSettleCycleStore.loadConfig()
                    : platCfg;
            if (inherit) {
                refs.settleTriggerSel.value = cfg.trigger || 'fulfill';
                refs.settleCycleSel.value = cfg.cycle || '1';
            }
            /* 隐藏时禁用，跳过必填校验 */
            refs.settleTriggerSel.disabled = inherit;
            refs.settleCycleSel.disabled = inherit;
            refs.settleTriggerRow.style.display = inherit ? 'none' : '';
            refs.settleCycleRow.style.display = inherit ? 'none' : '';
        }

        var strategyRadios = refs.settleStrategyRow.querySelectorAll(
            'input[name="' + settleStrategyName + '"]'
        );
        for (var si = 0; si < strategyRadios.length; si++) {
            strategyRadios[si].addEventListener('change', applySettleStrategyUI);
        }
        applySettleStrategyUI();

        function fillFromArchiveRow(tr) {
            var c = tr.querySelectorAll('td');
            if (c.length < 9) return;
            selectOptionByLabelText(refs.subjectSel, cellPlainText(c[1]));
            refs.nameInp.value = cellPlainText(c[2]);
            var nameVal = cellPlainText(c[2]);
            var shortName = cellPlainText(c[3])
                .replace(/待补/g, '')
                .replace(/[—\-]/g, ' ')
                .trim();
            if (!shortName && tr.getAttribute('data-short-name')) {
                shortName = String(tr.getAttribute('data-short-name') || '').trim();
            }
            /* 历史空别名：预填供应商名称，提示填写对外简称 */
            refs.shortNameInp.value = shortName || nameVal;
            if (!shortName && nameVal) {
                aliasTip.textContent = '请填写对外简称';
            }
            refs.regionInp.value = cellPlainText(c[4]);
            if (refs.detailTa) refs.detailTa.value = cellPlainText(c[5]);
            var tmap = { 品牌商: 'brand', 代理商: 'agent', 个人: 'person' };
            refs.typeSel.value = tmap[cellPlainText(c[6])] || '';
            refs.contactInp.value = cellPlainText(c[7]);
            if (refs.phoneInp) refs.phoneInp.value = cellPlainText(c[8]);
            refs.verifyInp.value = '';
            var sid = cellPlainText(c[0]);
            var sname = cellPlainText(c[2]);
            if (window.LFSettleCycleStore && window.LFSettleCycleStore.getSupplier) {
                var sc = window.LFSettleCycleStore.getSupplier(sid, sname);
                setSettleStrategy(sc.followPlatform === false ? 'override' : 'inherit');
                refs.settleTriggerSel.value = sc.trigger || 'fulfill';
                refs.settleCycleSel.value = sc.cycle || '1';
                setPayMethod(sc.payMethod || 'goods_first');
                applySettleStrategyUI();
            }
            hydrateArchiveMaterials(refs, 'supplier', refs.nameInp ? refs.nameInp.value : '');
        }

        function readPayMethod() {
            var checked = refs.payMethodRow.querySelector(
                'input[name="' + payMethodName + '"]:checked'
            );
            return checked && checked.value === 'pay_first' ? 'pay_first' : 'goods_first';
        }

        function setPayMethod(mode) {
            var val = mode === 'pay_first' ? 'pay_first' : 'goods_first';
            var radios = refs.payMethodRow.querySelectorAll('input[name="' + payMethodName + '"]');
            for (var pi = 0; pi < radios.length; pi++) {
                radios[pi].checked = radios[pi].value === val;
            }
        }

        refs.readSettleCycle = function () {
            var inherit = readSettleStrategy() === 'inherit';
            return {
                trigger: refs.settleTriggerSel.value || 'fulfill',
                cycle: refs.settleCycleSel.value || '1',
                followPlatform: inherit,
                payMethod: readPayMethod()
            };
        };

        mountEntryMaterials(body, refs);
        return { body: body, fillFromArchiveRow: fillFromArchiveRow, refs: refs };
    }

    function buildSupplierAddBody() {
        return createSupplierFormBundle({ includeInboundWarehouse: true }).body;
    }

    var TRADER_LICENSE_TYPES = ['商业保理公司', '融资租赁公司', '持牌金融机构', '地方金融组织'];

    function traderOptions(placeholder, values) {
        return [{ value: '', label: placeholder }].concat(
            values.map(function (value) {
                return { value: value, label: value };
            })
        );
    }

    function providerBindOptions() {
        var opts = [{ value: '', label: '请选择绑定服务商' }];
        var seen = {};
        var api = window.MdmProviderArchiveStore;
        if (api && typeof api.list === 'function') {
            api.list().forEach(function (item) {
                var name = String((item && (item.name || item.subjectName)) || '').trim();
                if (!name || name === '—' || seen[name]) return;
                seen[name] = true;
                opts.push({ value: name, label: name });
            });
        }
        return opts;
    }

    function markRequired(el, message) {
        if (!el) return;
        el.setAttribute('data-required-msg', message);
    }

    function createTraderFormBundle(mode) {
        var isProvider = mode === 'provider';
        var noun = isProvider ? '服务商' : '贸易商';
        var refs = {};
        var body = document.createElement('div');
        var subjects = [{ value: '', label: '请选择主体名称' }];
        var archiveApi = isProvider ? window.MdmProviderArchiveStore : window.MdmTraderArchiveStore;
        if (archiveApi && typeof archiveApi.list === 'function') {
            archiveApi.list().forEach(function (item) {
                var name = String((item && item.subjectName) || '').trim();
                if (!name || name === '—') return;
                if (subjects.some(function (opt) { return opt.label === name; })) return;
                subjects.push({ value: name, label: name });
            });
        }
        body.appendChild(sectionTitle('基础信息'));
        refs.subjectSel = sel(subjects, '');
        markRequired(refs.subjectSel, '请选择主体名称');
        body.appendChild(formRow('主体名称', true, refs.subjectSel));
        refs.subjectTypeInp = txt('', noun);
        refs.subjectTypeInp.value = noun;
        refs.subjectTypeInp.disabled = true;
        body.appendChild(formRow('主体类型', true, refs.subjectTypeInp));
        refs.nameInp = txt('请输入' + noun + '名称', '');
        markRequired(refs.nameInp, '请输入' + noun + '名称');
        body.appendChild(formRow(noun + '名称', true, refs.nameInp));
        refs.shortNameInp = txt('请输入' + noun + '简称', '');
        body.appendChild(formRow(noun + '简称', false, refs.shortNameInp));
        if (isProvider) {
            refs.providerTypeSel = sel(traderOptions('请选择服务商类型', TRADER_LICENSE_TYPES), '');
            markRequired(refs.providerTypeSel, '请选择服务商类型');
            body.appendChild(formRow('服务商类型', true, refs.providerTypeSel));
        } else {
            var bindOpts = providerBindOptions();
            var defaultBind = bindOpts.some(function (opt) { return opt.value === '冷丰'; }) ? '冷丰' : '';
            refs.boundSel = sel(bindOpts, defaultBind);
            markRequired(refs.boundSel, '请选择绑定服务商');
            body.appendChild(formRow('绑定服务商', true, refs.boundSel));
        }
        refs.regionInp = txt('省 / 市 / 区', '');
        markRequired(refs.regionInp, '请输入' + noun + '地址');
        body.appendChild(formRow(noun + '地址', true, refs.regionInp));
        var detailWrap = txtAreaWithCount('请输入详细地址', 200, '');
        refs.detailTa = detailWrap.querySelector('textarea');
        markRequired(refs.detailTa, '请输入详细地址');
        body.appendChild(formRow('详细地址', true, detailWrap));
        body.appendChild(mapMockRow(false));
        var phoneWrap = smsRow();
        refs.phoneInp = phoneWrap.querySelector('input');
        markRequired(refs.phoneInp, '请输入手机号码');
        body.appendChild(formRow('手机号码', true, phoneWrap));
        refs.verifyInp = txt('请输入验证码', '');
        markRequired(refs.verifyInp, '请输入验证码');
        body.appendChild(formRow('验证码', true, refs.verifyInp));
        refs.contactInp = txt('请输入联系人姓名', '');
        markRequired(refs.contactInp, '请输入联系人姓名');
        body.appendChild(formRow('联系人姓名', true, refs.contactInp));
        body.appendChild(
            radioGroup(noun + '状态', true, (isProvider ? 'provider' : 'trader') + '-status-' + Date.now(), [
                ['正常', '正常'],
                ['冻结', '冻结']
            ], '正常')
        );
        refs.statusName = body.querySelector('input[type="radio"]').name;

        function dashToEmpty(value) {
            var text = String(value || '').trim();
            return text === '—' || text === '-' ? '' : text;
        }

        function ensureSubjectOption(label) {
            var name = dashToEmpty(label);
            if (!name) return;
            var exists = false;
            for (var i = 0; i < refs.subjectSel.options.length; i++) {
                if (refs.subjectSel.options[i].text.trim() === name) exists = true;
            }
            if (!exists) {
                var op = document.createElement('option');
                op.value = name;
                op.textContent = name;
                refs.subjectSel.appendChild(op);
            }
            selectOptionByLabelText(refs.subjectSel, name);
        }

        function fillFromArchiveRow(tr) {
            var c = tr.querySelectorAll('td');
            var id =
                tr.getAttribute(isProvider ? 'data-provider-id' : 'data-trader-id') || cellPlainText(c[0]);
            var stored = archiveApi && archiveApi.get ? archiveApi.get(id) : null;
            ensureSubjectOption((stored && stored.subjectName) || cellPlainText(c[1]));
            refs.subjectTypeInp.value = noun;
            refs.nameInp.value = dashToEmpty((stored && stored.name) || cellPlainText(c[3]));
            refs.shortNameInp.value = dashToEmpty((stored && stored.shortName) || cellPlainText(c[4]));
            if (refs.providerTypeSel) {
                refs.providerTypeSel.value = dashToEmpty((stored && stored.providerType) || cellPlainText(c[7]));
            }
            if (refs.boundSel) {
                var bound = dashToEmpty((stored && stored.boundProvider) || cellPlainText(c[7]));
                refs.boundSel.value = bound;
                if (refs.boundSel.value !== bound) refs.boundSel.value = '';
            }
            refs.regionInp.value = dashToEmpty((stored && stored.region) || cellPlainText(c[5]));
            if (refs.detailTa) refs.detailTa.value = dashToEmpty((stored && stored.detailAddr) || cellPlainText(c[6]));
            if (refs.phoneInp) refs.phoneInp.value = dashToEmpty((stored && stored.phone) || cellPlainText(c[9]));
            refs.contactInp.value = dashToEmpty((stored && stored.contact) || cellPlainText(c[8]));
            var status = dashToEmpty((stored && stored.status) || (c[11] && cellPlainText(c[11]))) || '正常';
            body.querySelectorAll('input[name="' + refs.statusName + '"]').forEach(function (inp) {
                inp.checked = inp.value === status;
            });
            hydrateArchiveMaterials(refs, 'trader', refs.nameInp.value);
        }

        function collect() {
            var statusEl = body.querySelector('input[name="' + refs.statusName + '"]:checked');
            return {
                subjectName: refs.subjectSel.options[refs.subjectSel.selectedIndex]
                    ? refs.subjectSel.options[refs.subjectSel.selectedIndex].text.trim()
                    : '',
                subjectType: noun,
                name: refs.nameInp.value.trim(),
                shortName: refs.shortNameInp.value.trim(),
                providerType: refs.providerTypeSel ? refs.providerTypeSel.value.trim() : '',
                boundProvider: refs.boundSel ? refs.boundSel.value.trim() : '',
                region: refs.regionInp.value.trim(),
                detailAddr: refs.detailTa ? refs.detailTa.value.trim() : '',
                phone: refs.phoneInp ? refs.phoneInp.value.trim() : '',
                contact: refs.contactInp.value.trim(),
                status: statusEl ? statusEl.value : '正常'
            };
        }

        function validate() {
            var raw = refs.phoneInp ? String(refs.phoneInp.value || '').trim() : '';
            var digits = raw.replace(/\D/g, '');
            if (raw.indexOf('*') === -1 && digits.length !== 11) {
                if (typeof showToast === 'function') showToast('请输入11位手机号码', 'error');
                if (refs.phoneInp) refs.phoneInp.focus();
                return false;
            }
            var code = refs.verifyInp ? refs.verifyInp.value.replace(/\D/g, '') : '';
            if (code.length !== 6) {
                if (typeof showToast === 'function') showToast('请输入6位数字验证码', 'error');
                if (refs.verifyInp) refs.verifyInp.focus();
                return false;
            }
            return true;
        }

        mountEntryMaterials(body, refs);
        return { body: body, refs: refs, fillFromArchiveRow: fillFromArchiveRow, collect: collect, validate: validate };
    }

    function createCarrierFormBundle() {
        var refs = {};
        var body = document.createElement('div');
        var kind = 'carrier';
        refs.subjectSel = sel(CAR_SUBJECTS, '');
        body.appendChild(formRow('主体名称', true, refs.subjectSel));
        refs.nameInp = txt('请输入承运商名称', '');
        body.appendChild(formRow('承运商名称', true, refs.nameInp));
        refs.typeSel = sel(
            [
                { value: '', label: '请选择承运类型' },
                { value: 'instant', label: '三方即时配' },
                { value: 'line', label: '干线整车' },
                { value: 'city', label: '城配共配' }
            ],
            ''
        );
        body.appendChild(formRow('承运类型', true, refs.typeSel));
        var regRow = document.createElement('div');
        regRow.className = 'store-form__row';
        regRow.appendChild(sfLabel('承运商地址', true));
        var regC = document.createElement('div');
        regC.className = 'store-form__control';
        refs.regionInp = txt('省 / 市 / 区（级联示意）', '');
        regC.appendChild(refs.regionInp);
        regRow.appendChild(regC);
        body.appendChild(regRow);
        var detailWrap = txtAreaWithCount('请输入详细地址，输入后将自动在地图上定位', 200, '');
        refs.detailTa = detailWrap.querySelector('textarea');
        body.appendChild(formRow('详细地址', true, detailWrap));
        body.appendChild(mapMockRow(false));
        var carPhoneWrap = smsRow();
        refs.phoneInp = carPhoneWrap.querySelector('input');
        body.appendChild(formRow('手机号码', true, carPhoneWrap));
        refs.verifyInp = txt('请输入验证码', '');
        body.appendChild(formRow('验证码', true, refs.verifyInp));
        refs.contactInp = txt('请输入联系人', '');
        body.appendChild(formRow('联系人', true, refs.contactInp));
        body.appendChild(
            radioGroup('结算类型', true, kind + '-settle', [
                ['purchase', '采购结算'],
                ['order', '订单结算']
            ], 'order')
        );
        body.appendChild(
            radioGroup('配送方式', true, kind + '-deliver', [
                ['pickup', '自提'],
                ['delivery', '配送'],
                ['both', '自提+配送']
            ], 'both')
        );
        body.appendChild(
            radioGroup('结款方式', true, kind + '-pay', [
                ['goods_first', '先货后款'],
                ['pay_first', '先款后货']
            ], 'pay_first')
        );
        body.appendChild(
            radioGroup('结算周期', true, kind + '-cycle', [
                ['now', '现结'],
                ['day', '日结'],
                ['week', '周结'],
                ['month', '月结']
            ], 'now')
        );

        function fillFromArchiveRow(tr) {
            var c = tr.querySelectorAll('td');
            if (c.length < 8) return;
            selectOptionByLabelText(refs.subjectSel, cellPlainText(c[1]));
            refs.nameInp.value = cellPlainText(c[2]);
            refs.regionInp.value = cellPlainText(c[3]);
            if (refs.detailTa) refs.detailTa.value = cellPlainText(c[4]);
            var tmap = { 三方即时配: 'instant', 干线整车: 'line', 城配共配: 'city' };
            refs.typeSel.value = tmap[cellPlainText(c[5])] || '';
            refs.contactInp.value = cellPlainText(c[6]);
            if (refs.phoneInp) refs.phoneInp.value = cellPlainText(c[7]);
            refs.verifyInp.value = '';
        }

        return { body: body, fillFromArchiveRow: fillFromArchiveRow };
    }

    function buildCarrierAddBody() {
        return createCarrierFormBundle().body;
    }

    function createLiveRoomFormBundle() {
        var refs = {};
        var body = document.createElement('div');
        body.appendChild(sectionTitle('基础信息'));
        refs.subjectSel = sel(LIVE_SUBJECTS, '');
        body.appendChild(formRow('主体名称', true, refs.subjectSel));
        refs.nameInp = txt('请输入直播间名称', '');
        body.appendChild(formRow('直播间名称', true, refs.nameInp));
        refs.typeSel = sel(
            [
                { value: '', label: '请选择直播类型' },
                { value: 'official', label: '官方直播' },
                { value: 'regional', label: '区域直播' },
                { value: 'targeted', label: '定向直播' }
            ],
            ''
        );
        body.appendChild(formRow('直播类型', true, refs.typeSel));
        refs.anchorSel = sel(LIVE_ANCHORS, '');
        body.appendChild(formRow('主播名称', false, refs.anchorSel));
        var coverRow = document.createElement('div');
        coverRow.className = 'store-form__row';
        coverRow.appendChild(sfLabel('直播封面', false));
        var cc = document.createElement('div');
        cc.className = 'store-form__control';
        var mock = document.createElement('div');
        mock.className = 'store-archive__map-mock';
        mock.textContent = '+ 上传封面';
        cc.appendChild(mock);
        var note = document.createElement('p');
        note.className = 'erp-page__note';
        note.textContent = '建议尺寸 750×450px，支持 jpg/png，大小不超过 2MB';
        cc.appendChild(note);
        coverRow.appendChild(cc);
        body.appendChild(coverRow);
        var introWrap = txtAreaWithCount('请输入直播简介（可选）', 500, '');
        refs.introTa = introWrap.querySelector('textarea');
        body.appendChild(formRow('直播简介', false, introWrap));
        body.appendChild(sectionTitle('分发与可见范围'));
        body.appendChild(
            radioGroup('观看权限', true, 'liveRoom-mdm-view', [
                ['all', '全部用户可见'],
                ['store_members', '仅门店会员可见']
            ], 'all')
        );
        body.appendChild(sectionTitle('联系与核验'));
        var livePhoneWrap = smsRow();
        refs.phoneInp = livePhoneWrap.querySelector('input');
        body.appendChild(formRow('手机号码', true, livePhoneWrap));
        refs.verifyInp = txt('请输入验证码', '');
        body.appendChild(formRow('验证码', true, refs.verifyInp));
        refs.contactInp = txt('请输入负责人', '');
        body.appendChild(formRow('负责人', true, refs.contactInp));

        function fillFromArchiveRow(tr) {
            var c = tr.querySelectorAll('td');
            if (c.length < 9) return;
            selectOptionByLabelText(refs.subjectSel, cellPlainText(c[1]));
            refs.nameInp.value = cellPlainText(c[2]);
            var typMap = { 官方直播: 'official', 区域直播: 'regional', 定向直播: 'targeted' };
            refs.typeSel.value = typMap[cellPlainText(c[3])] || '';
            var aid = cellPlainText(c[4]);
            if (aid) refs.anchorSel.value = aid;
            refs.verifyInp.value = '';
            refs.contactInp.value = cellPlainText(c[6]);
            if (refs.phoneInp) refs.phoneInp.value = cellPlainText(c[7]);
            var vm = { 全部用户可见: 'all', 仅门店会员可见: 'store_members' };
            var vv = vm[cellPlainText(c[8])] || 'all';
            body.querySelectorAll('input[name="liveRoom-mdm-view"]').forEach(function (r) {
                r.checked = r.value === vv;
            });
        }

        return { body: body, fillFromArchiveRow: fillFromArchiveRow };
    }

    function buildLiveRoomAddBody() {
        return createLiveRoomFormBundle().body;
    }

    function createWarehouseFormBundle() {
        var refs = {};
        var body = document.createElement('div');
        refs.subjectSel = sel(WH_SUBJECTS, '');
        body.appendChild(formRow('主体名称', true, refs.subjectSel));
        var nameWrap = document.createElement('div');
        nameWrap.className = 'store-form__input-count';
        var nameInp = txt('请输入仓库名称', '');
        refs.nameInp = nameInp;
        nameInp.maxLength = 100;
        nameInp.setAttribute('data-required-msg', '请输入仓库名称');
        var nc = document.createElement('span');
        nc.className = 'store-form__counter';
        nc.textContent = '0 / 100';
        nameInp.addEventListener('input', function () {
            nc.textContent = nameInp.value.length + ' / 100';
        });
        nameWrap.appendChild(nameInp);
        nameWrap.appendChild(nc);
        body.appendChild(formRow('仓库名称', true, nameWrap));
        refs.kindInp = txt('', '仓库');
        refs.kindInp.disabled = true;
        body.appendChild(formRow('仓库类型', true, refs.kindInp));
        refs.typeSel = sel(
            [
                { value: '', label: '请选择仓库级别' },
                { value: 'grid', label: '网格仓' },
                { value: 'center', label: '中心仓' }
            ],
            ''
        );
        refs.typeSel.setAttribute('data-required-msg', '请选择仓库级别');
        body.appendChild(formRow('仓库级别', true, refs.typeSel));
        function syncWarehouseLevelDisabled() {
            var kind = String((refs.kindInp && refs.kindInp.value) || '').trim();
            var isStoreKind = kind === '门店';
            refs.typeSel.disabled = isStoreKind;
            if (isStoreKind) refs.typeSel.value = '';
        }
        syncWarehouseLevelDisabled();
        refs.adminInp = txt('请输入仓库管理员名称', '');
        refs.adminInp.setAttribute('data-required-msg', '请输入仓库管理员');
        body.appendChild(formRow('仓库管理员', true, refs.adminInp));
        var phoneRowWrap = smsRow();
        refs.phoneInp = phoneRowWrap.querySelector('input');
        if (refs.phoneInp) refs.phoneInp.setAttribute('data-required-msg', '请输入手机号码');
        body.appendChild(formRow('手机号码', true, phoneRowWrap));
        refs.verifyInp = txt('请输入验证码', '');
        refs.verifyInp.setAttribute('data-required-msg', '请输入验证码');
        body.appendChild(formRow('验证码', true, refs.verifyInp));
        var div = document.createElement('div');
        div.className = 'warehouse-form__divider';
        div.appendChild(document.createTextNode('地址与面积（选填）'));
        body.appendChild(div);
        var regRow = document.createElement('div');
        regRow.className = 'store-form__row';
        regRow.appendChild(sfLabel('仓库地址', false));
        var regC = document.createElement('div');
        regC.className = 'store-form__control';
        refs.regionInp = txt('省 / 市 / 区（级联示意）', '');
        regC.appendChild(refs.regionInp);
        regRow.appendChild(regC);
        body.appendChild(regRow);
        var whDetailWrap = txtAreaWithCount('请输入详细地址，输入后将自动在地图上定位', 200, '');
        refs.detailTa = whDetailWrap.querySelector('textarea');
        body.appendChild(formRow('详细地址', false, whDetailWrap));
        body.appendChild(mapMockRow(false));
        var areaRow = document.createElement('div');
        areaRow.className = 'store-form__row';
        areaRow.appendChild(sfLabel('仓库面积（m²）', false));
        var areaC = document.createElement('div');
        areaC.className = 'store-form__control';
        refs.areaInp = document.createElement('input');
        refs.areaInp.type = 'number';
        refs.areaInp.className = 'erp-input';
        refs.areaInp.min = '0';
        refs.areaInp.step = 'any';
        refs.areaInp.placeholder = '请输入仓库面积';
        areaC.appendChild(refs.areaInp);
        areaRow.appendChild(areaC);
        body.appendChild(areaRow);

        function fillFromArchiveRow(tr) {
            var c = tr.querySelectorAll('td');
            if (c.length < 9) return;
            selectOptionByLabelText(refs.subjectSel, cellPlainText(c[1]));
            refs.nameInp.value = cellPlainText(c[2]);
            var kindText = cellPlainText(c[3]);
            if (refs.kindInp) refs.kindInp.value = kindText && kindText !== '—' ? kindText : '仓库';
            syncWarehouseLevelDisabled();
            var wht = cellPlainText(c[4]);
            refs.typeSel.value =
                wht === '网格仓' ? 'grid'
                : wht === '中心仓' ? 'center'
                : '';
            syncWarehouseLevelDisabled();
            refs.adminInp.value = cellPlainText(c[5]);
            refs.phoneInp.value = cellPlainText(c[6]);
            refs.verifyInp.value = '';
            if (refs.regionInp) refs.regionInp.value = '';
            if (refs.detailTa) refs.detailTa.value = '';
            if (refs.areaInp) {
                var a9 = cellPlainText(c[9]);
                var num = parseFloat(String(a9).replace(/[^\d.]/g, ''));
                refs.areaInp.value = !isNaN(num) ? String(num) : '';
            }
            hydrateArchiveMaterials(refs, 'warehouse', refs.nameInp.value);
        }

        mountEntryMaterials(body, refs);
        return { body: body, fillFromArchiveRow: fillFromArchiveRow, refs: refs };
    }

    function buildWarehouseAddBody() {
        return createWarehouseFormBundle().body;
    }

    var FIRST_STORE_KEY = 'lf_first_store_archives_v1';
    var FIRST_SUPPLIER_KEY = 'lf_first_supplier_archives_v1';
    var FIRST_WAREHOUSE_KEY = 'lf_first_warehouse_archives_v1';

    function readQueue(key) {
        try {
            var list = JSON.parse(localStorage.getItem(key) || '[]');
            return Array.isArray(list) ? list : [];
        } catch (e) {
            return [];
        }
    }

    function pushQueue(key, row) {
        var list = readQueue(key);
        list.unshift(row);
        try { localStorage.setItem(key, JSON.stringify(list)); } catch (e) {}
    }

    function takeQueue(key) {
        var list = readQueue(key);
        try { localStorage.removeItem(key); } catch (e) {}
        return list;
    }

    function hideLabeledRows(body, labels) {
        Array.prototype.forEach.call(body.querySelectorAll('.store-form__row'), function (row) {
            var lab = row.querySelector('.store-form__label');
            var text = lab ? lab.textContent.replace(/\*/g, '').trim() : '';
            if (labels.indexOf(text) < 0) return;
            row.style.display = 'none';
            row.querySelectorAll('[data-required-msg]').forEach(function (el) {
                el.removeAttribute('data-required-msg');
            });
            var next = row.nextElementSibling;
            if (next && next.classList && next.classList.contains('store-form__tip')) next.style.display = 'none';
        });
    }

    function firstArchiveBanner(kind) {
        var tip = document.createElement('div');
        tip.className = 'mdm-biz-tip';
        tip.setAttribute('role', 'note');
        var where = kind === 'supplier' ? '供应商档案' : '门店档案';
        tip.innerHTML = '以下为<strong>首个' + (kind === 'supplier' ? '供应商' : '门店') + '</strong>，和主体一起提交。这里只填这家实际业务自己的信息，创建后只在' + where + '查看和编辑。联系人、手机取上方主体信息。营业执照、法人身份证、法人实名电话、整套结算信息写在下方主体资料里，保存后可在主体详情修改，并默认同步到这一家。';
        return tip;
    }

    function businessOnlyBanner(kind) {
        var tip = document.createElement('div');
        tip.className = 'mdm-biz-tip';
        tip.setAttribute('role', 'note');
        var who = kind === 'supplier' ? '供应商' : '门店';
        tip.innerHTML = '这里只填这家<strong>' + who + '</strong>自己的信息。营业执照、法人身份证、法人实名电话、整套结算信息在主体详情维护，本页不填写。';
        return tip;
    }

    function ensureOption(sel, text) {
        var value = String(text || '').trim();
        if (!sel || !value) return;
        var found = false;
        Array.prototype.forEach.call(sel.options, function (opt) {
            if (opt.value === value || opt.textContent === value) found = true;
        });
        if (!found) sel.appendChild(new Option(value, value));
        sel.value = value;
    }

    function validateFirstArchive(bundle) {
        if (!bundle || !bundle.body) return '档案信息未加载';
        var nodes = bundle.body.querySelectorAll('[data-required-msg]');
        var i;
        for (i = 0; i < nodes.length; i++) {
            var one = nodes[i];
            var row = one.closest ? one.closest('.store-form__row') : null;
            if (row && row.style.display === 'none') continue;
            if (one.disabled) continue;
            if (!String(one.value || '').trim()) return one.getAttribute('data-required-msg') || '请完善档案信息';
        }
        if (bundle.refs && bundle.refs.entryMaterials && window.MdmEntryMaterials) {
            var entryErr = window.MdmEntryMaterials.validate(bundle.refs.entryMaterials);
            if (entryErr) return entryErr;
        }
        var uploads = bundle.body.querySelectorAll('[data-upload-required-msg]');
        for (i = 0; i < uploads.length; i++) {
            var up = uploads[i];
            var upRow = up.closest ? up.closest('.store-form__row') : null;
            if (upRow && upRow.style.display === 'none') continue;
            if (up.getAttribute('data-upload-state') !== '1') {
                return up.getAttribute('data-upload-required-msg') || '请上传必填照片';
            }
        }
        var warehouse = bundle.refs && (bundle.refs.warehouseSel || bundle.refs.inboundWarehouseSel);
        if (warehouse && warehouse.disabled) return '正在读取仓库档案，请稍后重试';
        return '';
    }

    function copySubjectIntoArchive(kind, subject, refs) {
        subject = subject || {};
        if (refs.contactInp) refs.contactInp.value = subject.contact || refs.contactInp.value || '';
        if (refs.phoneInp) refs.phoneInp.value = subject.phone || refs.phoneInp.value || '';
        if (refs.nameInp && !String(refs.nameInp.value || '').trim()) refs.nameInp.value = subject.name || '';
        if (kind === 'store') ensureOption(refs.bindBdSel, subject.bd);
        if (kind === 'supplier') {
            refs.shortNameInp.value = subject.alias || refs.shortNameInp.value || subject.name || '';
        }
        if (kind === 'trader' && refs.subjectTypeSel) {
            refs.subjectTypeSel.value = subject.subjectType === '服务商' ? '服务商' : '贸易商';
        }
    }

    function saveSubjectMaterials(subject, kind, archiveName, root) {
        if (!window.MdmEntryMaterials || !root) return;
        var data = window.MdmEntryMaterials.read(root);
        var id = subject && subject.id ? String(subject.id).trim() : '';
        if (id && typeof window.MdmEntryMaterials.saveSubject === 'function') {
            window.MdmEntryMaterials.saveSubject(id, data);
            window.MdmEntryMaterials.bindFirst(id, kind, archiveName);
        }
        if (archiveName) window.MdmEntryMaterials.save(kind, archiveName, data);
    }

    function commitFirstStore(subject, bundle) {
        var refs = bundle.refs || {};
        copySubjectIntoArchive('store', subject, refs);
        var name = refs.nameInp ? String(refs.nameInp.value || '').trim() : '';
        var region = refs.regionInp ? String(refs.regionInp.value || '').trim() : '';
        if (!warehouseSelectionAvailable(refs.warehouseSel, '')) return false;
        if (name) writeVenuePhotos('store', 'name:' + name, collectVenuePhotosFromRefs(refs));
        saveSubjectMaterials(subject, 'store', name, refs.entryMaterials);
        return true;
    }

    function commitFirstSupplier(subject, bundle) {
        var refs = bundle.refs || {};
        copySubjectIntoArchive('supplier', subject, refs);
        if (refs.inboundWarehouseSel && !warehouseSelectionAvailable(refs.inboundWarehouseSel, '')) return false;
        var name = refs.nameInp ? String(refs.nameInp.value || '').trim() : '';
        var shortName = refs.shortNameInp ? String(refs.shortNameInp.value || '').trim() : '';
        var typeMap = { brand: '品牌商', agent: '代理商', person: '个人' };
        var typeValue = refs.typeSel ? refs.typeSel.value : '';
        saveSubjectMaterials(subject, 'supplier', name, refs.entryMaterials);
        var warehouse = refs.inboundWarehouseSel ? String(refs.inboundWarehouseSel.value || '').trim() : '';
        saveSupplierInboundWarehouseBinding('', name, warehouse);
        var id = 'SUP' + Date.now();
        if (window.MdmSupplierArchiveStore) {
            window.MdmSupplierArchiveStore.upsert({ id: id, name: name, shortName: shortName });
        }
        if (window.LFSettleCycleStore && refs.readSettleCycle) {
            if (refs.settleTriggerSel) refs.settleTriggerSel.disabled = false;
            if (refs.settleCycleSel) refs.settleCycleSel.disabled = false;
            window.LFSettleCycleStore.saveSupplier(id, name, refs.readSettleCycle());
        }
        var row = {
            id: id,
            subjectName: subject.name || '—',
            name: name,
            shortName: shortName || '-',
            region: refs.regionInp ? String(refs.regionInp.value || '').trim() : '',
            detail: refs.detailTa ? String(refs.detailTa.value || '').trim() : '',
            typeLabel: typeMap[typeValue] || typeValue || '—',
            contact: subject.contact || '—',
            phone: subject.phone || '—',
            warehouse: warehouse
        };
        var appended = window.MdmErpLists && typeof window.MdmErpLists.appendArchiveSupplierRow === 'function'
            ? window.MdmErpLists.appendArchiveSupplierRow(row)
            : null;
        if (!appended) pushQueue(FIRST_SUPPLIER_KEY, row);
        return true;
    }

    function commitFirstWarehouse(subject, bundle) {
        var refs = bundle.refs || {};
        copySubjectIntoArchive('warehouse', subject, refs);
        var name = refs.nameInp ? String(refs.nameInp.value || '').trim() : '';
        saveSubjectMaterials(subject, 'warehouse', name, refs.entryMaterials);
        var id = 'WH' + Date.now();
        seedWarehouseReceiveFromForm(id, refs);
        var levelMap = { grid: '网格仓', center: '中心仓' };
        var levelValue = refs.typeSel ? refs.typeSel.value : '';
        var region = refs.regionInp ? String(refs.regionInp.value || '').trim() : '';
        var detail = refs.detailTa ? String(refs.detailTa.value || '').trim() : '';
        var areaNum = refs.areaInp ? String(refs.areaInp.value || '').trim() : '';
        var row = {
            id: id,
            subjectName: subject.name || '—',
            name: name,
            kind: '仓库',
            level: levelMap[levelValue] || levelValue || '—',
            admin: refs.adminInp ? String(refs.adminInp.value || '').trim() : '',
            phone: subject.phone || '',
            location: [region, detail].filter(Boolean).join(' ') || '—',
            area: areaNum ? areaNum + ' m²' : '—'
        };
        var appended = window.MdmErpLists && typeof window.MdmErpLists.appendArchiveWarehouseRow === 'function'
            ? window.MdmErpLists.appendArchiveWarehouseRow(row)
            : null;
        if (!appended) pushQueue(FIRST_WAREHOUSE_KEY, row);
        return true;
    }

    function commitFirstTrader(subject, bundle) {
        var refs = bundle.refs || {};
        copySubjectIntoArchive('trader', subject, refs);
        var traderName = refs.nameInp ? String(refs.nameInp.value || '').trim() : '';
        saveSubjectMaterials(subject, 'trader', traderName, refs.entryMaterials);
        if (!bundle.collect) return false;
        var payload = bundle.collect();
        payload.subjectId = subject.id || '';
        payload.subjectName = subject.name || payload.subjectName;
        payload.subjectType = subject.subjectType === '服务商' ? '服务商' : '贸易商';
        payload.contact = subject.contact || payload.contact;
        payload.phone = subject.phone || payload.phone;
        if (!window.MdmTraderArchiveStore || typeof window.MdmTraderArchiveStore.add !== 'function') {
            if (typeof showToast === 'function') showToast('贸易商档案存储未加载', 'error');
            return false;
        }
        var created = window.MdmTraderArchiveStore.add(payload);
        if (!created) {
            if (typeof showToast === 'function') showToast('贸易商档案未写入，请检查必填项', 'error');
            return false;
        }
        return true;
    }

    function buildFirstArchive(kind) {
        if (kind === 'warehouse') {
            var warehouseBundle = createWarehouseFormBundle();
            hideLabeledRows(warehouseBundle.body, ['主体名称', '手机号码', '验证码']);
            warehouseBundle.kind = kind;
            return warehouseBundle;
        }
        if (kind === 'trader') {
            var traderBundle = createTraderFormBundle();
            hideLabeledRows(traderBundle.body, ['主体名称', '主体类型', '手机号码', '验证码', '联系人姓名']);
            traderBundle.kind = kind;
            return traderBundle;
        }
        var bundle = kind === 'supplier'
            ? createSupplierFormBundle({ includeInboundWarehouse: true })
            : createStoreFormBundle({});
        if (kind !== 'supplier' && bundle.refs.warehouseSel) {
            hydrateArchiveWarehouseSelect(bundle.refs.warehouseSel, '', '请选择配送仓库');
        }
        var hide = kind === 'supplier'
            ? ['主体名称', '供应商别名', '手机号码', '验证码', '联系人']
            : ['主体名称', '联系人', '手机号码', '验证码', '绑定BD'];
        hideLabeledRows(bundle.body, hide);
        bundle.body.insertBefore(firstArchiveBanner(kind), bundle.body.firstChild);
        bundle.kind = kind;
        return bundle;
    }

    var ENTRY_AUDIT_KEY = 'lf_entry_audit_queue_v1';
    var ENTRY_AUDIT_TIP = '已提交入驻审核，审核全部通过后发起合同签署';

    function entryAuditNow() {
        var d = new Date();
        var p = function (n) { return String(n).padStart(2, '0'); };
        return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
    }

    /* 门店、供应商、贸易商新建后进入入驻审核。仓库不进审核、不签合同。 */
    function enqueueEntryAudit(opts) {
        opts = opts || {};
        var typeMap = { store: '门店', supplier: '供应商', trader: '贸易商' };
        var subjectType = opts.subjectType || typeMap[opts.kind] || '';
        if (opts.kind === 'warehouse' || subjectType === '仓库') return null;
        if (subjectType !== '门店' && subjectType !== '供应商' && subjectType !== '贸易商' && subjectType !== '服务商') {
            return null;
        }
        var prefix = subjectType === '供应商' ? 'WF-SUP-' : (subjectType === '门店' ? 'WF-STORE-' : 'WF-TRD-');
        var list = [];
        try {
            list = JSON.parse(localStorage.getItem(ENTRY_AUDIT_KEY) || '[]');
        } catch (e) {
            list = [];
        }
        if (!Array.isArray(list)) list = [];
        var row = {
            id: prefix + Date.now(),
            source: opts.source || 'PC 创建',
            subjectName: String(opts.subjectName || '').trim() || '—',
            subjectType: subjectType === '服务商' ? '服务商' : subjectType,
            storeName: String(opts.storeName || opts.subjectName || '').trim() || '—',
            shortName: String(opts.shortName || '').trim(),
            bd: String(opts.bd || '').trim() || '—',
            contact: String(opts.contact || '').trim(),
            phone: String(opts.phone || '').trim(),
            partnerDivision: opts.partnerDivision || '',
            bizLine: opts.bizLine || '',
            brandName: opts.brandName || '',
            address: opts.address || '',
            region: opts.region || '',
            storeType: opts.storeType || '',
            warehouse: opts.warehouse || '',
            bizLines: opts.bizLines || '',
            auditStatus: '待审核',
            mdmStatus: '未生成',
            createdBy: '当前用户',
            submittedAt: entryAuditNow(),
            auditLogs: [],
            fromCreate: true
        };
        list.unshift(row);
        try {
            localStorage.setItem(ENTRY_AUDIT_KEY, JSON.stringify(list));
        } catch (e2) {}
        return row;
    }

    global.MdmResourceArchiveForms = {
        readVenuePhotos: readVenuePhotos,
        enqueueEntryAudit: enqueueEntryAudit,
        entryAuditTip: ENTRY_AUDIT_TIP,
        buildFirstArchive: buildFirstArchive,
        validateFirstArchive: validateFirstArchive,
        commitFirstArchive: function (kind, subject, bundle) {
            if (kind === 'supplier') return commitFirstSupplier(subject, bundle);
            if (kind === 'warehouse') return commitFirstWarehouse(subject, bundle);
            if (kind === 'trader') return commitFirstTrader(subject, bundle);
            return commitFirstStore(subject, bundle);
        },
        takeFirstStores: function () { return takeQueue(FIRST_STORE_KEY); },
        takeFirstSuppliers: function () { return takeQueue(FIRST_SUPPLIER_KEY); },
        takeFirstWarehouses: function () { return takeQueue(FIRST_WAREHOUSE_KEY); },
        writeVenuePhotos: writeVenuePhotos,
        syncVenuePhotosFromOnboarding: syncVenuePhotosFromOnboarding,
        openStoreAdd: function () {
            var bundle = createStoreFormBundle({});
            hydrateArchiveWarehouseSelect(bundle.refs.warehouseSel, '', '请选择配送仓库');
            if (bundle.refs.partnerSel && !bundle.refs.partnerSel.value) {
                bundle.refs.partnerSel.value = 'franchise';
                bundle.refs.partnerSel.dispatchEvent(new Event('change'));
            }
            attachWideModal('添加门店', bundle.body, function () {
                if (!warehouseSelectionAvailable(bundle.refs.warehouseSel, '')) return false;
                var refs = bundle.refs || {};
                var name = refs.nameInp ? String(refs.nameInp.value || '').trim() : '';
                var region = refs.regionInp ? String(refs.regionInp.value || '').trim() : '';
                if (!region) {
                    if (typeof showToast === 'function') showToast('请选择门店地址', 'error');
                    return false;
                }
                if (name) writeVenuePhotos('store', 'name:' + name, collectVenuePhotosFromRefs(refs));
                var partnerMap = { franchise: '加盟店', joint: '联营店', direct: '直营店' };
                var partnerValue = refs.partnerSel && refs.partnerSel.value;
                var partnerLabel = partnerMap[partnerValue] || partnerValue || '—';
                persistArchiveMaterials(refs, 'store', name);
                enqueueEntryAudit({
                    kind: 'store',
                    source: 'PC 创建门店',
                    subjectName: selectedLabel(refs.subjectSel),
                    storeName: name,
                    shortName: name,
                    bd: selectedLabel(refs.bindBdSel),
                    contact: refs.contactInp ? String(refs.contactInp.value || '').trim() : '',
                    phone: refs.phoneInp ? String(refs.phoneInp.value || '').trim() : '',
                    partnerDivision: partnerLabel,
                    storeType: refs.storeTypeInp ? String(refs.storeTypeInp.value || '').trim() : '',
                    warehouse: selectedLabel(refs.warehouseSel),
                    bizLine: refs.bizLineSel ? refs.bizLineSel.value : '',
                    brandName: refs.brandSel ? refs.brandSel.value : '',
                    bizLines: refs.bizHidden ? refs.bizHidden.value : '',
                    region: region,
                    address: refs.addressTa ? String(refs.addressTa.value || '').trim() : ''
                });
                return ENTRY_AUDIT_TIP;
            }, null, '门店');
        },
        /* 【857】操作列「更换手机号」：快捷更换本门店店长 */
        openStorePhoneChange: function (tr) {
            if (!tr) return;
            var cells = tr.querySelectorAll('td');
            var storeId = cells[0] ? cellPlainText(cells[0]) : '';
            var subjectId = cells[1] ? cellPlainText(cells[1]) : '—';
            var storeName = cells[2] ? cellPlainText(cells[2]) : '';
            var originalPhone = storeFullPhone(tr);
            var body = document.createElement('div');
            body.appendChild(sectionTitle('接任店长信息'));
            var info = document.createElement('div');
            info.className = 'mdm-biz-tip mdm-biz-tip--flush';
            info.setAttribute('role', 'note');
            info.innerHTML =
                '门店：<strong>' +
                (storeName || '—') +
                '</strong>（' +
                (storeId || '—') +
                '）';
            body.appendChild(info);
            var phoneRowWrap = smsRow();
            var phoneInp = phoneRowWrap.querySelector('input');
            phoneInp.value = originalPhone;
            phoneInp.placeholder = '请输入接任店长手机号';
            phoneInp.setAttribute('aria-label', '接任店长手机号');
            phoneInp.setAttribute('data-required-msg', '请输入接任店长手机号');
            var phoneTip = document.createElement('div');
            phoneTip.style.cssText = 'margin-top:6px;font-size:12px;color:#666;line-height:1.5;';
            phoneTip.textContent =
                '确认后，接任店长可登录并管理本店，原店长不再拥有本店管理权限。';
            var phoneCtl = document.createElement('div');
            phoneCtl.appendChild(phoneRowWrap);
            phoneCtl.appendChild(phoneTip);
            body.appendChild(formRow('接任店长手机号', true, phoneCtl));
            var verifyInp = txt('请输入验证码', '');
            verifyInp.setAttribute('data-required-msg', '请输入验证码');
            var verifyRow = formRow('验证码', true, verifyInp);
            body.appendChild(verifyRow);
            function isPhoneChanged() {
                return String(phoneInp.value || '').trim() !== originalPhone;
            }
            function syncVerifyVisibility() {
                verifyRow.style.display = isPhoneChanged() ? '' : 'none';
            }
            syncVerifyVisibility();
            phoneInp.addEventListener('input', syncVerifyVisibility);
            function validatePhoneChange() {
                var toast = function (m) {
                    if (typeof showToast === 'function') showToast(m, 'error');
                };
                if (!isPhoneChanged()) {
                    toast('接任店长手机号未变更');
                    return null;
                }
                var newPhone = String(phoneInp.value || '').trim();
                if (!newPhone) {
                    toast('请输入接任店长手机号');
                    phoneInp.focus();
                    return null;
                }
                if (!/^1\d{10}$/.test(newPhone)) {
                    toast('请输入正确的 11 位手机号');
                    phoneInp.focus();
                    return null;
                }
                var code = String(verifyInp.value || '').trim();
                if (!code) {
                    toast('请输入验证码');
                    verifyInp.focus();
                    return null;
                }
                if (code !== STORE_PHONE_DEMO_CODE) {
                    toast('验证码错误或已过期');
                    verifyInp.focus();
                    return null;
                }
                var masked = newPhone.slice(0, 3) + '****' + newPhone.slice(7);
                var otherStore = '';
                var tbody = tr.parentNode;
                if (tbody) {
                    Array.prototype.forEach.call(tbody.querySelectorAll('tr'), function (row) {
                        if (row === tr || otherStore) return;
                        var tds = row.querySelectorAll('td');
                        if (tds[7] && storeFullPhone(row) === newPhone) otherStore = cellPlainText(tds[2]);
                    });
                }
                return { phone: newPhone, masked: masked, otherStore: otherStore };
            }
            var pending = null;
            attachWideModal(
                '更换门店店长',
                body,
                function () {
                    if (!pending) return false;
                    var pc = pending;
                    var msg =
                        '确认更换门店【' + storeName + '】的店长？\n' +
                        '门店：' + (storeName || '—') + '（' + (storeId || '—') + '）\n' +
                        '原店长：' + (originalPhone || '—') + '\n' +
                        '接任店长：' + pc.phone + '\n' +
                        '确认后，接任店长可登录并管理本店，原店长不再拥有本店管理权限。';
                    if (pc.otherStore) {
                        msg +=
                            '\n该手机号已是门店【' +
                            pc.otherStore +
                            '】的店长登录号，保存后接任店长可同时管理本店及其原有门店。';
                    }
                    showStorePhoneConfirm(msg, function () {
                        if (cells[7]) cells[7].textContent = pc.masked;
                        tr.setAttribute('data-phone', pc.phone);
                        if (window.MdmOperationLog) {
                            window.MdmOperationLog.record(
                                'store',
                                storeId,
                                '更换门店店长',
                                { 原店长手机号: originalPhone },
                                { 接任店长手机号: pc.phone, 主体: subjectId }
                            );
                        }
                        removeArchiveFormModals();
                        if (typeof showToast === 'function') {
                            showToast('已更换门店店长，接任店长可使用 ' + pc.phone + ' 登录并管理本店', 'success');
                        }
                    });
                    return false;
                },
                function () {
                    pending = validatePhoneChange();
                    return pending !== null;
                }
            );
        },
        openStoreEdit: function (tr) {
            if (!tr) return;
            var cells = tr.querySelectorAll('td');
            var storeId = cells[0] ? cellPlainText(cells[0]) : '';
            var storeName = cells[2] ? cellPlainText(cells[2]) : '';
            var initial = readVenuePhotos('store', storeId);
            if (!initial.store_header_pic && storeName) {
                initial = readVenuePhotos('store', 'name:' + storeName);
            }
            var bundle = createStoreFormBundle({
                initialVenuePhotos: initial,
                storeCode: storeId
            });
            bundle.fillFromArchiveRow(tr);
            var refs = bundle.refs || {};
            function storeSnapshot() {
                return {
                    '门店编码': cellPlainText(cells[0]),
                    '配送仓库': cellPlainText(cells[8]),
                    '门店简称': tr.getAttribute('data-short-name') || storeName,
                    '所在地区': tr.getAttribute('data-region') || '',
                    '详细地址': tr.getAttribute('data-address') || ''
                };
            }
            var before = storeSnapshot();
            function applyEdit() {
                if (!warehouseSelectionAvailable(refs.warehouseSel, before['配送仓库'])) return false;
                var region = refs.regionInp ? String(refs.regionInp.value || '').trim() : '';
                var nextCode = storeId;
                var api = window.MdmStoreCode;
                if (refs.codeInp && refs.codeInp.getAttribute('data-reallocated') === '1' && api) {
                    nextCode = api.allocateNextCode(region, storeId) || storeId;
                    if (refs.codeInp) refs.codeInp.value = nextCode;
                    if (nextCode !== storeId && typeof showToast === 'function') {
                        showToast('跨城搬迁已按新城市重新分配门店编码 ' + nextCode, 'success');
                    }
                }
                if (cells[0] && nextCode) cells[0].textContent = nextCode;
                if (region) tr.setAttribute('data-region', region);
                if (refs.addressTa) tr.setAttribute('data-address', String(refs.addressTa.value || '').trim());
                writeVenuePhotos('store', nextCode || storeId, collectVenuePhotosFromRefs(refs));
                if (storeName) {
                    writeVenuePhotos('store', 'name:' + storeName, collectVenuePhotosFromRefs(refs));
                }
                var nextName =
                    refs.nameInp ? String(refs.nameInp.value || '').trim() : storeName;
                var nextShort = nextName;
                if (window.MdmStoreSiteSlot) {
                    var mapped = window.MdmStoreSiteSlot.getByStore(nextCode || storeId);
                    if (mapped && mapped.fromSite) {
                        nextShort = window.MdmStoreSiteSlot.composeShortName(mapped.slotCode, mapped.slotName);
                    } else {
                        window.MdmStoreSiteSlot.syncFromStore({
                            storeCode: nextCode || storeId,
                            storeName: nextName || storeName,
                            source: 'store'
                        });
                    }
                }
                tr.setAttribute('data-short-name', nextShort || nextName || storeName);
                var bindings = readJsonStore('mdm_store_warehouse_bindings_v1');
                if (nextCode !== storeId) bindings[storeId] = '';
                bindings[nextCode] = selectedLabel(refs.warehouseSel);
                writeJsonStore('mdm_store_warehouse_bindings_v1', bindings);
                cells[8].textContent = bindings[nextCode];
                syncStoreReceiveFromForm(nextCode || storeId, nextName || storeName, refs);
                if (window.MdmOperationLog) window.MdmOperationLog.record('store', nextCode || storeId,
                    '编辑门店', before, storeSnapshot());
                persistArchiveMaterials(refs, 'store', nextName || storeName);
                return true;
            }
            /* 【857】店长手机号变更：重绑本店主体 ID ↔ 店长 ID，先于其他必填校验 */
            function checkPhoneChange() {
                if (!(refs.isPhoneChanged && refs.isPhoneChanged())) return { changed: false };
                var toast = function (m) {
                    if (typeof showToast === 'function') showToast(m, 'error');
                };
                var newPhone = String(refs.phoneInp.value || '').trim();
                if (!newPhone) {
                    toast('请输入手机号码');
                    refs.phoneInp.focus();
                    return null;
                }
                if (!/^1\d{10}$/.test(newPhone)) {
                    toast('请输入正确的 11 位手机号');
                    refs.phoneInp.focus();
                    return null;
                }
                var code = String(refs.verifyInp.value || '').trim();
                if (!code) {
                    toast('请输入验证码');
                    refs.verifyInp.focus();
                    return null;
                }
                if (code !== STORE_PHONE_DEMO_CODE) {
                    toast('验证码错误或已过期');
                    refs.verifyInp.focus();
                    return null;
                }
                var masked = newPhone.slice(0, 3) + '****' + newPhone.slice(7);
                var otherStore = '';
                var tbody = tr.parentNode;
                if (tbody) {
                    Array.prototype.forEach.call(tbody.querySelectorAll('tr'), function (row) {
                        if (row === tr || otherStore) return;
                        var tds = row.querySelectorAll('td');
                        if (tds[7] && storeFullPhone(row) === newPhone) otherStore = cellPlainText(tds[2]);
                    });
                }
                return { changed: true, phone: newPhone, masked: masked, otherStore: otherStore };
            }
            var phoneCheck = null;
            attachWideModal(
                '编辑门店',
                bundle.body,
                function () {
                    if (!phoneCheck || !phoneCheck.changed) {
                        return applyEdit() !== false;
                    }
                    var pc = phoneCheck;
                    var subjectId = cellPlainText(cells[1]) || (refs.subjectSel && selectedLabel(refs.subjectSel)) || '—';
                    var storeCode = cellPlainText(cells[0]) || storeId || '—';
                    var msg =
                        '确认更换门店【' + (refs.nameInp.value || storeName) + '】的店长？\n' +
                        '门店主体：' + subjectId + '（ID 不变）\n' +
                        '门店编码：' + storeCode + '\n' +
                        '原店长：' + (refs.originalPhone || '—') + '\n' +
                        '接任店长：' + pc.phone + '\n' +
                        '确认后，接任店长可登录并管理本店，原店长不再拥有本店管理权限。';
                    if (pc.otherStore) {
                        msg += '\n该手机号已是门店【' + pc.otherStore + '】的店长登录号，保存后接任用户可同时管理本店及其原有门店。';
                    }
                    showStorePhoneConfirm(msg, function () {
                        if (cells[7]) cells[7].textContent = pc.masked;
                        tr.setAttribute('data-phone', pc.phone);
                        if (applyEdit() === false) return;
                        removeArchiveFormModals();
                        if (typeof showToast === 'function') {
                            showToast('已更换门店店长，接任店长可使用 ' + pc.phone + ' 登录并管理本店', 'success');
                        }
                    });
                    return false;
                },
                function () {
                    phoneCheck = checkPhoneChange();
                    return phoneCheck !== null;
                },
                '门店'
            );
        },
        openTraderAdd: function (onSaved) {
            var bundle = createTraderFormBundle();
            attachWideModal('新增贸易商', bundle.body, function () {
                if (!bundle.validate()) return false;
                var payload = bundle.collect();
                if (!window.MdmTraderArchiveStore || typeof window.MdmTraderArchiveStore.add !== 'function') {
                    if (typeof showToast === 'function') showToast('贸易商档案存储未加载', 'error');
                    return false;
                }
                var created = window.MdmTraderArchiveStore.add(payload);
                if (!created) {
                    if (typeof showToast === 'function') showToast('新增失败，请检查必填项', 'error');
                    return false;
                }
                if (typeof onSaved === 'function') onSaved(created);
                persistArchiveMaterials(bundle.refs, 'trader', payload.name);
                enqueueEntryAudit({
                    kind: 'trader',
                    source: 'PC 创建贸易商',
                    subjectName: payload.subjectName,
                    subjectType: payload.subjectType,
                    storeName: payload.name,
                    shortName: payload.shortName,
                    contact: payload.contact,
                    phone: payload.phone,
                    address: payload.detailAddr || ''
                });
                return ENTRY_AUDIT_TIP;
            }, null, '贸易商');
        },
        openTraderEdit: function (tr, onSaved) {
            if (!tr) return;
            var bundle = createTraderFormBundle();
            bundle.fillFromArchiveRow(tr);
            attachWideModal('编辑贸易商', bundle.body, function () {
                if (!bundle.validate()) return false;
                var payload = bundle.collect();
                var id = tr.getAttribute('data-trader-id') || (tr.querySelector('td') && tr.querySelector('td').textContent.trim());
                if (!window.MdmTraderArchiveStore || typeof window.MdmTraderArchiveStore.update !== 'function') {
                    if (typeof showToast === 'function') showToast('贸易商档案存储未加载', 'error');
                    return false;
                }
                var updated = window.MdmTraderArchiveStore.update(Object.assign({ id: id }, payload));
                if (!updated) {
                    if (typeof showToast === 'function') showToast('保存失败', 'error');
                    return false;
                }
                if (typeof onSaved === 'function') onSaved(updated);
                persistArchiveMaterials(bundle.refs, 'trader', payload.name);
            }, null, '贸易商');
        },
        openProviderAdd: function (onSaved) {
            var bundle = createTraderFormBundle('provider');
            attachWideModal('新增服务商', bundle.body, function () {
                if (!bundle.validate()) return false;
                var payload = bundle.collect();
                if (!window.MdmProviderArchiveStore || typeof window.MdmProviderArchiveStore.add !== 'function') {
                    if (typeof showToast === 'function') showToast('服务商档案存储未加载', 'error');
                    return false;
                }
                var created = window.MdmProviderArchiveStore.add(payload);
                if (!created) {
                    if (typeof showToast === 'function') showToast('新增失败，请检查必填项', 'error');
                    return false;
                }
                if (typeof onSaved === 'function') onSaved(created);
            });
        },
        openProviderEdit: function (tr, onSaved) {
            if (!tr) return;
            var bundle = createTraderFormBundle('provider');
            bundle.fillFromArchiveRow(tr);
            attachWideModal('编辑服务商', bundle.body, function () {
                if (!bundle.validate()) return false;
                var payload = bundle.collect();
                var id = tr.getAttribute('data-provider-id') || (tr.querySelector('td') && tr.querySelector('td').textContent.trim());
                if (!window.MdmProviderArchiveStore || typeof window.MdmProviderArchiveStore.update !== 'function') {
                    if (typeof showToast === 'function') showToast('服务商档案存储未加载', 'error');
                    return false;
                }
                var updated = window.MdmProviderArchiveStore.update(Object.assign({ id: id }, payload));
                if (!updated) {
                    if (typeof showToast === 'function') showToast('保存失败', 'error');
                    return false;
                }
                if (typeof onSaved === 'function') onSaved(updated);
            });
        },
        openSupplierAdd: function () {
            var bundle = createSupplierFormBundle({ includeInboundWarehouse: true });
            attachWideModal('新增供应商', bundle.body, function () {
                if (!warehouseSelectionAvailable(bundle.refs.inboundWarehouseSel, '')) return false;
                var name =
                    bundle.refs && bundle.refs.nameInp
                        ? String(bundle.refs.nameInp.value || '').trim()
                        : '';
                var shortName =
                    bundle.refs && bundle.refs.shortNameInp
                        ? String(bundle.refs.shortNameInp.value || '').trim()
                        : '';
                var selectedWarehouse =
                    bundle.refs && bundle.refs.inboundWarehouseSel
                        ? String(bundle.refs.inboundWarehouseSel.value || '').trim()
                        : '';
                var supplierId = 'SUP' + Date.now();
                if (name) {
                    saveSupplierInboundWarehouseBinding(supplierId, name, selectedWarehouse);
                    if (window.MdmSupplierArchiveStore) {
                        window.MdmSupplierArchiveStore.upsert({
                            id: supplierId,
                            name: name,
                            shortName: shortName
                        });
                    }
                }
                if (window.LFSettleCycleStore && bundle.refs && bundle.refs.readSettleCycle) {
                    if (bundle.refs.settleTriggerSel) bundle.refs.settleTriggerSel.disabled = false;
                    if (bundle.refs.settleCycleSel) bundle.refs.settleCycleSel.disabled = false;
                    window.LFSettleCycleStore.saveSupplier(supplierId, name, bundle.refs.readSettleCycle());
                }
                var typeMap = { brand: '品牌商', agent: '代理商', person: '个人' };
                var typeValue = bundle.refs && bundle.refs.typeSel ? bundle.refs.typeSel.value : '';
                var row = {
                    id: supplierId,
                    subjectName: selectedLabel(bundle.refs.subjectSel) || '—',
                    name: name,
                    shortName: shortName || '-',
                    region: bundle.refs.regionInp ? String(bundle.refs.regionInp.value || '').trim() : '',
                    detail: bundle.refs.detailTa ? String(bundle.refs.detailTa.value || '').trim() : '',
                    typeLabel: typeMap[typeValue] || typeValue || '—',
                    contact: bundle.refs.contactInp ? String(bundle.refs.contactInp.value || '').trim() : '—',
                    phone: bundle.refs.phoneInp ? String(bundle.refs.phoneInp.value || '').trim() : '—',
                    warehouse: selectedWarehouse
                };
                if (window.MdmErpLists && typeof window.MdmErpLists.appendArchiveSupplierRow === 'function') {
                    window.MdmErpLists.appendArchiveSupplierRow(row);
                }
                persistArchiveMaterials(bundle.refs, 'supplier', name);
                enqueueEntryAudit({
                    kind: 'supplier',
                    source: 'PC 创建供应商',
                    subjectName: selectedLabel(bundle.refs.subjectSel),
                    storeName: name,
                    shortName: shortName,
                    contact: bundle.refs.contactInp ? String(bundle.refs.contactInp.value || '').trim() : '',
                    phone: bundle.refs.phoneInp ? String(bundle.refs.phoneInp.value || '').trim() : '',
                    address: bundle.refs.detailTa ? String(bundle.refs.detailTa.value || '').trim() : ''
                });
                return ENTRY_AUDIT_TIP;
            }, null, '供应商');
        },
        openSupplierEdit: function (tr) {
            if (!tr) return;
            var cells = tr.querySelectorAll('td');
            var supplierId = cells[0] ? cellPlainText(cells[0]) : '';
            var supplierName = cells[2] ? cellPlainText(cells[2]) : '';
            var inboundWarehouse = readSupplierInboundWarehouseBinding(supplierId, supplierName);
            var bundle = createSupplierFormBundle({
                includeInboundWarehouse: true,
                initialInboundWarehouse: inboundWarehouse
            });
            bundle.fillFromArchiveRow(tr);
            var before = {
                '供应商名称': bundle.refs.nameInp.value.trim(),
                '供应商简称': bundle.refs.shortNameInp.value.trim(),
                '入库仓库': bundle.refs.inboundWarehouseSel
                    ? bundle.refs.inboundWarehouseSel.value
                    : ''
            };
            var settleBefore =
                window.LFSettleCycleStore && window.LFSettleCycleStore.getSupplier
                    ? window.LFSettleCycleStore.getSupplier(supplierId, supplierName)
                    : null;
            attachWideModal('编辑供应商', bundle.body, function () {
                if (!warehouseSelectionAvailable(bundle.refs.inboundWarehouseSel, before['入库仓库'])) {
                    return false;
                }
                var nextName =
                    bundle.refs && bundle.refs.nameInp
                        ? String(bundle.refs.nameInp.value || '').trim()
                        : supplierName;
                var nextShort =
                    bundle.refs && bundle.refs.shortNameInp
                        ? String(bundle.refs.shortNameInp.value || '').trim()
                        : '';
                var selectedWarehouse =
                    bundle.refs && bundle.refs.inboundWarehouseSel
                        ? String(bundle.refs.inboundWarehouseSel.value || '').trim()
                        : '';
                if (cells[2]) cells[2].textContent = nextName || supplierName;
                if (cells[3]) {
                    cells[3].setAttribute('data-field', 'shortName');
                    cells[3].textContent = nextShort || '-';
                }
                tr.setAttribute('data-short-name', nextShort);
                saveSupplierInboundWarehouseBinding(
                    supplierId,
                    nextName || supplierName,
                    selectedWarehouse
                );
                if (window.MdmOperationLog) {
                    window.MdmOperationLog.record('supplier', supplierId, '编辑供应商', before, {
                        '供应商名称': nextName || supplierName,
                        '供应商简称': nextShort,
                        '入库仓库': selectedWarehouse
                    });
                }
                if (window.MdmSupplierArchiveStore) {
                    window.MdmSupplierArchiveStore.upsert({
                        id: supplierId,
                        name: nextName || supplierName,
                        shortName: nextShort
                    });
                }
                var settleChanged = false;
                var settleAfter = null;
                if (window.LFSettleCycleStore && bundle.refs && bundle.refs.readSettleCycle) {
                    /* 禁用态 select 不进 required 校验，保存前临时启用以读值 */
                    if (bundle.refs.settleTriggerSel) bundle.refs.settleTriggerSel.disabled = false;
                    if (bundle.refs.settleCycleSel) bundle.refs.settleCycleSel.disabled = false;
                    var nextSettle = bundle.refs.readSettleCycle();
                    settleChanged = isSupplierSettleChanged(settleBefore, nextSettle);
                    window.LFSettleCycleStore.saveSupplier(
                        supplierId,
                        nextName || supplierName,
                        nextSettle
                    );
                    settleAfter = window.LFSettleCycleStore.getSupplier(
                        supplierId,
                        nextName || supplierName
                    );
                    if (cells[11] && window.LFSettleCycleStore.formatSupplierSettleSummary) {
                        cells[11].textContent = window.LFSettleCycleStore.formatSupplierSettleSummary(
                            supplierId,
                            nextName || supplierName
                        );
                    }
                }
                if (settleChanged) {
                    var finalName = nextName || supplierName;
                    var finalId = supplierId;
                    setTimeout(function () {
                        confirmIssueSettleSupplement(finalId, finalName, settleAfter);
                    }, 80);
                }
                persistArchiveMaterials(bundle.refs, 'supplier', nextName || supplierName);
            }, null, '供应商');
        },
        openLiveRoomAdd: function () {
            attachWideModal('新增直播间', buildLiveRoomAddBody());
        },
        openLiveRoomEdit: function (tr) {
            if (!tr) return;
            var bundle = createLiveRoomFormBundle();
            bundle.fillFromArchiveRow(tr);
            attachWideModal('编辑直播间', bundle.body);
        },
        openCarrierAdd: function () {
            attachWideModal('新增承运商', buildCarrierAddBody());
        },
        openCarrierEdit: function (tr) {
            if (!tr) return;
            var bundle = createCarrierFormBundle();
            bundle.fillFromArchiveRow(tr);
            attachWideModal('编辑承运商', bundle.body);
        },
        openWarehouseAdd: function () {
            var bundle = createWarehouseFormBundle();
            attachWideModal('新增仓库', bundle.body, function () {
                var name =
                    bundle.refs && bundle.refs.nameInp
                        ? String(bundle.refs.nameInp.value || '').trim()
                        : '';
                seedWarehouseReceiveFromForm(name || 'NEW-WH-' + String(Date.now()).slice(-6), bundle.refs);
                persistArchiveMaterials(bundle.refs, 'warehouse', name);
            }, null, '仓库');
        },
        openWarehouseEdit: function (tr) {
            if (!tr) return;
            var cells = tr.querySelectorAll('td');
            var warehouseId = cells[0] ? cellPlainText(cells[0]) : '';
            var bundle = createWarehouseFormBundle();
            bundle.fillFromArchiveRow(tr);
            var before = { '仓库名称': bundle.refs.nameInp.value.trim() };
            attachWideModal('编辑仓库', bundle.body, function () {
                seedWarehouseReceiveFromForm(warehouseId, bundle.refs);
                var nextName = bundle.refs.nameInp.value.trim();
                var nameCell = cells[2].querySelector('.subject-name-link') || cells[2];
                nameCell.textContent = nextName;
                if (window.MdmOperationLog) window.MdmOperationLog.record('warehouse', warehouseId, '修改仓库', before,
                    { '仓库名称': nextName });
                persistArchiveMaterials(bundle.refs, 'warehouse', nextName);
            }, null, '仓库');
        },
        close: removeArchiveFormModals
    };
})(typeof window !== 'undefined' ? window : this);
