/**
 * 资源中心档案「新增 / 编辑」宽屏表单 — 与 vendor/lf-master-erp 中 store-archive-ui /
 * resource-archive-ui / warehouse-archive-ui 的字段与分区一致（静态演示）。
 * 编辑入口由 mdm-erp-lists 拦截列表「编辑」，按行预填后打开与新增相同的 erp-modal--store-wide。
 */
(function (global) {
    function removeArchiveFormModals() {
        document.querySelectorAll('[data-mdm-archive-form="1"]').forEach(function (n) {
            n.remove();
        });
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
            if (typeof showToast === 'function') showToast('验证码已发送（演示）', 'info');
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

    function attachWideModal(title, bodyEl) {
        removeArchiveFormModals();
        var backdrop = document.createElement('div');
        backdrop.className = 'store-archive-modal-backdrop resource-archive-modal-backdrop';
        backdrop.setAttribute('data-mdm-archive-form', '1');
        var modal = document.createElement('div');
        modal.className = 'erp-modal erp-modal--store-wide';
        var head = document.createElement('div');
        head.className = 'erp-modal__header';
        var h2 = document.createElement('h2');
        h2.className = 'erp-modal__title';
        h2.textContent = title;
        head.appendChild(h2);
        var ha = document.createElement('div');
        ha.className = 'erp-modal__header-actions';
        var bx = document.createElement('button');
        bx.type = 'button';
        bx.className = 'erp-modal__header-btn';
        bx.innerHTML = '&times;';
        bx.setAttribute('aria-label', '关闭');
        bx.addEventListener('click', function () {
            backdrop.remove();
        });
        ha.appendChild(bx);
        head.appendChild(ha);
        var bw = document.createElement('div');
        bw.className = 'erp-modal__body';
        bw.appendChild(bodyEl);
        var foot = document.createElement('div');
        foot.className = 'erp-modal__footer';
        var bc = document.createElement('button');
        bc.type = 'button';
        bc.className = 'erp-btn';
        bc.textContent = '取消';
        var ok = document.createElement('button');
        ok.type = 'button';
        ok.className = 'erp-btn erp-btn--primary';
        ok.textContent = '确定';
        bc.addEventListener('click', function () {
            backdrop.remove();
        });
        ok.addEventListener('click', function () {
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

    function guessWarehouseSelectValue(whCellText) {
        var s = String(whCellText || '');
        if (/苏州|苏/.test(s)) return 'wh2';
        if (/沪|上海|华东|SH|仓|履约/.test(s)) return 'wh1';
        return '';
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

    function createStoreFormBundle() {
        var refs = {};
        var body = document.createElement('div');
        body.appendChild(sectionTitle('基础信息'));
        refs.subjectSel = sel(STORE_SUBJECTS, '');
        body.appendChild(formRow('主体名称', true, refs.subjectSel));
        refs.contactInp = txt('请输入联系人', '');
        body.appendChild(formRow('联系人', true, refs.contactInp));
        var phoneRowWrap = smsRow();
        refs.phoneInp = phoneRowWrap.querySelector('input');
        body.appendChild(formRow('手机号码', true, phoneRowWrap));
        refs.verifyInp = txt('请输入验证码', '');
        body.appendChild(formRow('验证码', true, refs.verifyInp));
        var nameWrap = document.createElement('div');
        nameWrap.className = 'store-form__input-count';
        var nameInp = txt('请输入门店名称', '');
        refs.nameInp = nameInp;
        nameInp.maxLength = 50;
        var nc = document.createElement('span');
        nc.className = 'store-form__counter';
        nc.textContent = '0 / 50';
        nameInp.addEventListener('input', function () {
            nc.textContent = nameInp.value.length + ' / 50';
        });
        nameWrap.appendChild(nameInp);
        nameWrap.appendChild(nc);
        body.appendChild(formRow('门店名称', true, nameWrap));
        refs.shortNameInp = txt('请输入门店简称', '');
        body.appendChild(formRow('门店简称', false, refs.shortNameInp));
        var partnerSel = sel(
            [
                { value: '', label: '请选择门店合作类型' },
                { value: 'franchise', label: '加盟店' },
                { value: 'partner', label: '合作店' },
                { value: 'peer', label: '同行店' }
            ],
            ''
        );
        refs.partnerSel = partnerSel;
        body.appendChild(formRow('门店合作类型', true, partnerSel));
        refs.storeTypeInp = txt('如社区生鲜店、团购自提点等', '');
        body.appendChild(formRow('门店类型', true, refs.storeTypeInp));
        refs.warehouseSel = sel(
            [
                { value: '', label: '请选择配送仓库' },
                { value: 'wh1', label: '沪南一号仓' },
                { value: 'wh2', label: '苏州合作仓' }
            ],
            ''
        );
        body.appendChild(formRow('配送仓库', true, refs.warehouseSel));
        var regionRow = document.createElement('div');
        regionRow.className = 'store-form__row';
        regionRow.appendChild(sfLabel('门店地址', true));
        var rc = document.createElement('div');
        rc.className = 'store-form__control';
        var regHint = document.createElement('input');
        regHint.type = 'text';
        regHint.className = 'erp-input';
        regHint.placeholder = '省 / 市 / 区（与 LF 级联选择器一致 · 演示可手输）';
        refs.regionInp = regHint;
        rc.appendChild(regHint);
        regionRow.appendChild(rc);
        body.appendChild(regionRow);
        var addressWrap = txtAreaWithCount('请输入详细地址，输入后将自动在地图上定位', 200, '');
        refs.addressTa = addressWrap.querySelector('textarea');
        body.appendChild(formRow('详细地址', true, addressWrap));
        body.appendChild(mapMockRow(false));
        body.appendChild(formRow('门店门头照', true, uploadMock('+ 点击上传')));
        body.appendChild(formRow('有无冷藏柜', false, yesNoSelect('请选择有无冷藏柜')));
        body.appendChild(formRow('冷藏柜照片', false, uploadMock('+ 上传冷藏柜照片', '最多 5 张')));
        body.appendChild(formRow('有无冷冻柜', false, yesNoSelect('请选择有无冷冻柜')));
        body.appendChild(formRow('冷冻柜照片', false, uploadMock('+ 上传冷冻柜照片', '最多 5 张')));

        var franchise = document.createElement('div');
        franchise.style.display = 'none';
        franchise.appendChild(sectionHint('加盟店 / 合作店补充资料'));
        franchise.appendChild(formRow('门店面积', true, txt('请输入门店面积（㎡）', '')));
        franchise.appendChild(formRow('门店楼层', true, txt('请输入门店楼层', '')));
        franchise.appendChild(formRow('店门口口述视频', false, uploadMock('+ 上传店门口视频', '店前两分钟口述视频')));
        franchise.appendChild(formRow('店内口述视频', false, uploadMock('+ 上传店内视频', '店内一分钟口述视频')));
        franchise.appendChild(formRow('门店方圆500米入住户数', false, txt('请输入实际入住总户数', '')));
        franchise.appendChild(formRow('日均客单量', false, txt('请输入日均客单量', '')));
        franchise.appendChild(formRow('店内工作人员总数', false, txt('请输入工作人员总数', '')));
        franchise.appendChild(
            formRow(
                '实际经营者对直播业务的理解',
                false,
                txtAreaWithCount('请输入老板对直播业务的理解', 500, '')
            )
        );
        franchise.appendChild(
            formRow(
                '门店日常运营服务理解与配合',
                false,
                txtAreaWithCount('请输入日常运营服务理解与配合情况', 500, '')
            )
        );
        franchise.appendChild(
            formRow(
                '私域直播投入产出期望',
                false,
                txtAreaWithCount('请输入老板对私域直播 ROI 的期望', 500, '')
            )
        );
        franchise.appendChild(
            formRow('私域直播/社区团购熟悉程度', false, txtAreaWithCount('请输入了解程度', 500, ''))
        );
        franchise.appendChild(
            formRow('周边小区及居住人群描述', false, txtAreaWithCount('请输入周边小区及人群描述', 500, ''))
        );
        franchise.appendChild(formRow('拉到1000人信心说明', false, txtAreaWithCount('请输入信心说明', 500, '')));
        franchise.appendChild(
            formRow('特殊情况说明', false, txtAreaWithCount('如涉及区域保护、特殊沟通，请填写说明', 500, ''))
        );
        franchise.appendChild(formRow('特殊情况配图', false, uploadMock('+ 上传特殊情况配图', '最多 6 张')));
        body.appendChild(franchise);

        var peer = document.createElement('div');
        peer.style.display = 'none';
        peer.appendChild(sectionHint('同行店补充资料'));
        peer.appendChild(
            formRow('已合作其他平台情况', false, txtAreaWithCount('目前门店已合作的其他平台情况', 500, ''))
        );
        peer.appendChild(formRow('近三天上播及销量截图', false, uploadMock('+ 上传经营截图', '最多 6 张')));
        body.appendChild(peer);

        function syncPartner() {
            var v = partnerSel.value;
            franchise.style.display = v === 'franchise' || v === 'partner' ? '' : 'none';
            peer.style.display = v === 'peer' ? '' : 'none';
        }
        partnerSel.addEventListener('change', syncPartner);
        syncPartner();

        function fillFromArchiveRow(tr) {
            var c = tr.querySelectorAll('td');
            if (c.length < 11) return;
            selectOptionByLabelText(refs.subjectSel, cellPlainText(c[1]));
            refs.contactInp.value = cellPlainText(c[6]);
            if (refs.phoneInp) refs.phoneInp.value = cellPlainText(c[7]);
            refs.verifyInp.value = '';
            refs.nameInp.value = cellPlainText(c[2]);
            refs.shortNameInp.value = '';
            var pmap = { 加盟店: 'franchise', 合作店: 'partner', 同行店: 'peer' };
            refs.partnerSel.value = pmap[cellPlainText(c[3])] || '';
            refs.storeTypeInp.value = cellPlainText(c[4]);
            refs.warehouseSel.value = guessWarehouseSelectValue(cellPlainText(c[8]));
            refs.regionInp.value = cellPlainText(c[9]);
            if (refs.addressTa) refs.addressTa.value = cellPlainText(c[10]);
            syncPartner();
        }

        return { body: body, fillFromArchiveRow: fillFromArchiveRow };
    }

    function buildStoreAddBody() {
        return createStoreFormBundle().body;
    }

    function createSupplierFormBundle() {
        var refs = {};
        var body = document.createElement('div');
        var kind = 'supplier';
        refs.subjectSel = sel(SUP_SUBJECTS, '');
        body.appendChild(formRow('主体名称', true, refs.subjectSel));
        refs.nameInp = txt('请输入供应商名称', '');
        body.appendChild(formRow('供应商名称', true, refs.nameInp));
        refs.typeSel = sel(
            [
                { value: '', label: '请选择供应商类型' },
                { value: 'brand', label: '品牌商' },
                { value: 'agent', label: '代理商' },
                { value: 'person', label: '个人' }
            ],
            ''
        );
        body.appendChild(formRow('供应商类型', true, refs.typeSel));
        var regRow = document.createElement('div');
        regRow.className = 'store-form__row';
        regRow.appendChild(sfLabel('供应商地址', true));
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
        var supPhoneWrap = smsRow();
        refs.phoneInp = supPhoneWrap.querySelector('input');
        body.appendChild(formRow('手机号码', true, supPhoneWrap));
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
            var tmap = { 品牌商: 'brand', 代理商: 'agent', 个人: 'person' };
            refs.typeSel.value = tmap[cellPlainText(c[5])] || '';
            refs.contactInp.value = cellPlainText(c[6]);
            if (refs.phoneInp) refs.phoneInp.value = cellPlainText(c[7]);
            refs.verifyInp.value = '';
        }

        return { body: body, fillFromArchiveRow: fillFromArchiveRow };
    }

    function buildSupplierAddBody() {
        return createSupplierFormBundle().body;
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
        var nc = document.createElement('span');
        nc.className = 'store-form__counter';
        nc.textContent = '0 / 100';
        nameInp.addEventListener('input', function () {
            nc.textContent = nameInp.value.length + ' / 100';
        });
        nameWrap.appendChild(nameInp);
        nameWrap.appendChild(nc);
        body.appendChild(formRow('仓库名称', true, nameWrap));
        refs.typeSel = sel(
            [
                { value: '', label: '请选择仓库类型' },
                { value: 'warehouse', label: '仓库' },
                { value: 'store', label: '门店' }
            ],
            ''
        );
        body.appendChild(formRow('仓库类型', true, refs.typeSel));
        refs.relatedSel = sel(
            [
                { value: '', label: '请选择门店（单选，按照当前权限展示）' },
                { value: '1', label: '冷丰演示门店' },
                { value: '2', label: '五角场体验店' },
                { value: '3', label: '仓库商家4.18' }
            ],
            ''
        );
        body.appendChild(formRow('关联门店', true, refs.relatedSel));
        refs.adminInp = txt('请输入仓库管理员名称', '');
        body.appendChild(formRow('仓库管理员', true, refs.adminInp));
        refs.phoneInp = txt('请输入手机号码', '');
        body.appendChild(formRow('手机号码', true, refs.phoneInp));
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
            if (c.length < 8) return;
            selectOptionByLabelText(refs.subjectSel, cellPlainText(c[1]));
            refs.nameInp.value = cellPlainText(c[2]);
            var wht = cellPlainText(c[3]);
            refs.typeSel.value = wht === '门店' ? 'store' : wht === '仓库' ? 'warehouse' : '';
            var relTxt = cellPlainText(c[4]);
            if (relTxt && relTxt !== '—') {
                selectOptionByLabelText(refs.relatedSel, relTxt);
            } else {
                refs.relatedSel.value = '';
            }
            refs.adminInp.value = cellPlainText(c[5]);
            refs.phoneInp.value = cellPlainText(c[6]);
            if (refs.regionInp) refs.regionInp.value = '';
            if (refs.detailTa) refs.detailTa.value = '';
            if (refs.areaInp) {
                var a9 = cellPlainText(c[9]);
                var num = parseFloat(String(a9).replace(/[^\d.]/g, ''));
                refs.areaInp.value = !isNaN(num) ? String(num) : '';
            }
        }

        return { body: body, fillFromArchiveRow: fillFromArchiveRow };
    }

    function buildWarehouseAddBody() {
        return createWarehouseFormBundle().body;
    }

    global.MdmResourceArchiveForms = {
        openStoreAdd: function () {
            attachWideModal('添加门店', buildStoreAddBody());
        },
        openStoreEdit: function (tr) {
            if (!tr) return;
            var bundle = createStoreFormBundle();
            bundle.fillFromArchiveRow(tr);
            attachWideModal('编辑门店', bundle.body);
        },
        openSupplierAdd: function () {
            attachWideModal('新增供应商', buildSupplierAddBody());
        },
        openSupplierEdit: function (tr) {
            if (!tr) return;
            var bundle = createSupplierFormBundle();
            bundle.fillFromArchiveRow(tr);
            attachWideModal('编辑供应商', bundle.body);
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
            attachWideModal('新增仓库', buildWarehouseAddBody());
        },
        openWarehouseEdit: function (tr) {
            if (!tr) return;
            var bundle = createWarehouseFormBundle();
            bundle.fillFromArchiveRow(tr);
            attachWideModal('编辑仓库', bundle.body);
        },
        close: removeArchiveFormModals
    };
})(typeof window !== 'undefined' ? window : this);
