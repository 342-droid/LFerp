/**
 * 统一进件（门店 / 供应商 / 直播间 / 承运商）— 由 vendor unified-onboarding-ui.js 迁入
 */
(function () {
    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text != null && text !== '') n.textContent = text;
        return n;
    }

    function textInput(placeholder, value) {
        var inp = document.createElement('input');
        inp.className = 'erp-input';
        inp.type = 'text';
        inp.placeholder = placeholder || '';
        if (value != null && value !== '') inp.value = value;
        return inp;
    }

    function selectInput(options, value) {
        var sel = document.createElement('select');
        sel.className = 'erp-select';
        options.forEach(function (o) {
            var opt = document.createElement('option');
            opt.value = o.value;
            opt.textContent = o.label;
            sel.appendChild(opt);
        });
        if (value != null && value !== '') sel.value = String(value);
        return sel;
    }

    function mkBtn(label, primary, outlinePrimary) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'erp-btn' + (primary ? ' erp-btn--primary' : '');
        if (outlinePrimary) b.classList.add('erp-btn--outline-primary');
        b.textContent = label;
        return b;
    }

    function sfLabel(text, required) {
        var lab = el('label', 'store-form__label');
        if (required) {
            var star = el('span', 'store-form__req', '*');
            lab.appendChild(star);
        }
        lab.appendChild(document.createTextNode(text));
        return lab;
    }

    function sectionTitle(text) {
        return el('div', 'unified-onboard-section-title', text);
    }

    function ogRow(parent, label, req, node) {
        var r = el('div', 'store-form__row');
        r.appendChild(sfLabel(label, req));
        var c = el('div', 'store-form__control');
        c.appendChild(node);
        r.appendChild(c);
        parent.appendChild(r);
    }

    function uploadClickBox(caption) {
        var wrap = el('div', '');
        var box = el('div', 'store-upload-box onboard-upload--click', '点击上传');
        wrap.appendChild(box);
        if (caption) wrap.appendChild(el('div', 'store-upload-box__cap', caption));
        return wrap;
    }

    function enterpriseTypeSelect() {
        return selectInput(
            [
                { value: '', label: '请选择经营类型' },
                { value: 'mall', label: '商场及企业' },
                { value: 'food', label: '餐饮' },
                { value: 'retail', label: '零售' },
                { value: 'other', label: '其他' }
            ],
            ''
        );
    }

    function scenarioTypeSelect() {
        return selectInput(
            [
                { value: '', label: '请选择场景类型' },
                { value: 'offline', label: '线下实体' },
                { value: 'wx', label: '公众号/小程序' },
                { value: 'app', label: 'APP' },
                { value: 'pc', label: 'PC网站' }
            ],
            ''
        );
    }

    function clearNode(n) {
        while (n && n.firstChild) n.removeChild(n.firstChild);
    }

    function removeUnifiedOnboardingModals() {
        document.querySelectorAll('[data-unified-onboarding]').forEach(function (x) {
            x.remove();
        });
    }

    /**
     * @param {{ title: string, merchantShortNameDefault?: string, variant?: string }} opts
     */
    function openUnifiedOnboardingModal(opts) {
        removeUnifiedOnboardingModals();

        var variant = opts.variant || 'store';
        var backdrop = el(
            'div',
            variant === 'resource' ? 'store-archive-modal-backdrop' : 'store-archive-modal-backdrop'
        );
        backdrop.setAttribute('data-unified-onboarding', '1');
        if (variant === 'store') backdrop.setAttribute('data-store-archive-ui', '1');
        else backdrop.setAttribute('data-resource-archive-ui', '1');

        var modal = el('div', 'erp-modal erp-modal--onboarding');
        var fullscreen = false;

        var header = el('div', 'erp-modal__header');
        header.appendChild(el('h2', 'erp-modal__title', opts.title || '进件'));
        var ha = el('div', 'erp-modal__header-actions');
        var bf = el('button', 'erp-modal__header-btn');
        bf.type = 'button';
        bf.innerHTML = '&#9723;';
        bf.title = '全屏';
        bf.addEventListener('click', function () {
            fullscreen = !fullscreen;
            modal.classList.toggle('erp-modal--fullscreen', fullscreen);
            bf.title = fullscreen ? '退出全屏' : '全屏';
        });
        var bx = el('button', 'erp-modal__header-btn');
        bx.type = 'button';
        bx.innerHTML = '&times;';
        bx.addEventListener('click', function () {
            backdrop.remove();
        });
        ha.appendChild(bf);
        ha.appendChild(bx);
        header.appendChild(ha);

        var body = el('div', 'erp-modal__body');

        var s1 = el('section', 'store-onboard-section store-onboard-section--white');
        s1.appendChild(sectionTitle('商户类型'));
        var catRow = el('div', 'store-form__row');
        catRow.appendChild(sfLabel('商户类别', true));
        var radioWrap = el('div', 'store-form__control');
        var radioRow = el('div', 'store-radio-row');
        [
            ['enterprise', '企业'],
            ['indi', '个体户']
        ].forEach(function (pair, idx) {
            var labEl = el('label', '');
            var inp = el('input');
            inp.type = 'radio';
            inp.name = 'uo-merchant-cat';
            inp.value = pair[0];
            if (idx === 0) inp.checked = true;
            labEl.appendChild(inp);
            labEl.appendChild(document.createTextNode(' ' + pair[1]));
            radioRow.appendChild(labEl);
        });
        radioWrap.appendChild(radioRow);
        catRow.appendChild(radioWrap);
        s1.appendChild(catRow);

        s1.appendChild(sectionTitle('营业执照信息'));
        var licRow = el('div', 'store-form__row');
        licRow.appendChild(sfLabel('营业执照', true));
        var licCtrl = el('div', 'store-form__control');
        licCtrl.appendChild(uploadClickBox());
        licCtrl.appendChild(el('div', 'store-form__upload-hint', '支持 JPG/PNG，单张不超过 5MB'));
        licRow.appendChild(licCtrl);
        s1.appendChild(licRow);

        var gLic = el('div', 'unified-onboard-grid');
        s1.appendChild(gLic);
        ogRow(gLic, '营业执照名称', false, textInput('请输入营业执照名称'));
        ogRow(gLic, '证件代码', false, textInput('请输入证件代码'));
        ogRow(gLic, '执照起始日期', true, textInput('请选择起始日期'));

        var licExpRow = el('div', 'store-form__row unified-onboard-grid__full');
        licExpRow.appendChild(sfLabel('执照有效期', false));
        var licExpCtrl = el('div', 'store-form__control store-form__phone-row');
        licExpCtrl.appendChild(textInput('请选择有效期'));
        var longLab = el('label', '');
        var longChk = document.createElement('input');
        longChk.type = 'checkbox';
        longLab.appendChild(longChk);
        longLab.appendChild(document.createTextNode(' 长期'));
        licExpCtrl.appendChild(longLab);
        licExpRow.appendChild(licExpCtrl);
        gLic.appendChild(licExpRow);

        ogRow(gLic, '注册地址', false, textInput('请输入注册地址'));
        body.appendChild(s1);

        var s2 = el('section', 'store-onboard-section');
        s2.appendChild(sectionTitle('法人基本信息'));
        var idTypeRow = el('div', 'store-form__row');
        idTypeRow.appendChild(sfLabel('证件类型', true));
        var idTypeCtrl = el('div', 'store-form__control');
        var idRadio = el('div', 'store-radio-row');
        [
            ['idcard', '身份证'],
            ['passport', '护照'],
            ['hkmo', '港澳通行证']
        ].forEach(function (pair, idx) {
            var lb = el('label', '');
            var inp = el('input');
            inp.type = 'radio';
            inp.name = 'uo-id-doc-type';
            inp.value = pair[0];
            if (idx === 0) inp.checked = true;
            lb.appendChild(inp);
            lb.appendChild(document.createTextNode(' ' + pair[1]));
            idRadio.appendChild(lb);
        });
        idTypeCtrl.appendChild(idRadio);
        idTypeRow.appendChild(idTypeCtrl);
        s2.appendChild(idTypeRow);

        var idUpRow = el('div', 'store-form__row');
        idUpRow.appendChild(sfLabel('上传证件', true));
        var idUpCtrl = el('div', 'store-form__control');
        var idPair = el('div', 'store-upload-grid');
        idPair.appendChild(uploadClickBox('上传身份证人像面'));
        idPair.appendChild(uploadClickBox('上传身份证国徽面'));
        idUpCtrl.appendChild(idPair);
        idUpRow.appendChild(idUpCtrl);
        s2.appendChild(idUpRow);

        var gLegal = el('div', 'unified-onboard-grid');
        s2.appendChild(gLegal);
        ogRow(gLegal, '法人姓名', true, textInput('请输入法人姓名'));
        ogRow(gLegal, '身份证号', true, textInput('请输入证件号码'));
        ogRow(gLegal, '身份证起始日期', true, textInput('请选择起始日期'));
        ogRow(gLegal, '身份证有效期', true, textInput('请选择有效期'));
        body.appendChild(s2);

        var s3 = el('section', 'store-onboard-section store-onboard-section--white');
        s3.appendChild(sectionTitle('商户信息'));
        var gMer = el('div', 'unified-onboard-grid');
        s3.appendChild(gMer);
        ogRow(
            gMer,
            '商户简称',
            false,
            textInput('可输入10个汉字，或20个字母', opts.merchantShortNameDefault || '')
        );

        var regionOb = el('div', 'store-form__row');
        regionOb.appendChild(sfLabel('商户所在地区', true));
        var rc = el('div', 'store-form__control');
        rc.appendChild(
            textInput('请输入省 / 市 / 区，例如：浙江省 / 杭州市 / 西湖区')
        );
        regionOb.appendChild(rc);
        s3.appendChild(regionOb);

        ogRow(gMer, '详细地址', true, textInput('请输入详细地址'));
        ogRow(gMer, '成立时间', false, textInput('请选择成立时间'));
        ogRow(gMer, '企业类型', true, enterpriseTypeSelect());
        ogRow(gMer, '联系人姓名', true, textInput('请输入联系人姓名'));
        ogRow(gMer, '手机号码', true, textInput('请输入手机号码'));
        ogRow(gMer, '场景类型', true, scenarioTypeSelect());
        ogRow(gMer, '电子邮箱', true, textInput('请输入电子邮箱'));
        body.appendChild(s3);

        var s4 = el('section', 'store-onboard-section');
        s4.appendChild(sectionTitle('结算信息'));

        var settleIntro = el('div', 'store-form__row');
        settleIntro.appendChild(sfLabel('进件类型', true));
        var settleIntroCtrl = el('div', 'store-form__control');
        var cardRow = el('div', 'onboard-settle-cards');
        var settleRadios = [];
        [
            ['pub', '法人对公进件'],
            ['private', '法人对私进件'],
            ['nonlegal', '非法人进件']
        ].forEach(function (pair, i) {
            var card = el('label', 'onboard-settle-card');
            var inp = el('input');
            inp.type = 'radio';
            inp.name = 'uo-settle-type';
            inp.value = pair[0];
            if (i === 0) inp.checked = true;
            settleRadios.push(inp);
            card.appendChild(inp);
            card.appendChild(el('div', 'onboard-settle-card__label', pair[1]));
            cardRow.appendChild(card);
        });
        settleIntroCtrl.appendChild(cardRow);
        settleIntro.appendChild(settleIntroCtrl);
        s4.appendChild(settleIntro);

        function syncSettleCards() {
            var cards = cardRow.querySelectorAll('.onboard-settle-card');
            for (var i = 0; i < cards.length; i++) {
                var inp = settleRadios[i];
                if (inp)
                    cards[i].classList.toggle('is-selected', !!inp.checked);
            }
        }
        settleRadios.forEach(function (inp, i) {
            inp.addEventListener('change', function () {
                syncSettleCards();
                renderSettleDynamic();
            });
            var cardEl = cardRow.children[i];
            if (cardEl)
                cardEl.addEventListener('click', function (ev) {
                    if (ev.target.tagName === 'INPUT' && ev.target.type === 'radio') return;
                    inp.checked = true;
                    syncSettleCards();
                    renderSettleDynamic();
                });
        });
        syncSettleCards();

        var settleDynamic = el('div', 'onboard-settle-dynamic');
        s4.appendChild(settleDynamic);

        function renderSettleDynamic() {
            clearNode(settleDynamic);
            var checked = body.querySelector('input[name="uo-settle-type"]:checked');
            var val = checked ? checked.value : 'pub';

            if (val === 'pub') {
                ogRow(settleDynamic, '开户许可证', true, uploadClickBox());
                ogRow(settleDynamic, '开户名', false, textInput('请输入开户名'));
                ogRow(settleDynamic, '开户城市', false, textInput('请输入开户城市'));
                ogRow(settleDynamic, '银行卡号', false, textInput('请输入银行卡号'));
                ogRow(settleDynamic, '开户支行', false, textInput('请输入开户支行'));
                return;
            }

            if (val === 'private') {
                ogRow(settleDynamic, '银行卡照片', true, uploadClickBox());
                ogRow(settleDynamic, '开户名', false, textInput('请输入开户名'));
                ogRow(settleDynamic, '开户支行', false, textInput('请输入开户支行'));
                ogRow(settleDynamic, '银行卡号', false, textInput('请输入银行卡号'));
                return;
            }

            ogRow(settleDynamic, '银行卡照片', true, uploadClickBox());
            var idPair2 = el('div', 'store-form__row');
            idPair2.appendChild(sfLabel('身份证照片', true));
            var idc = el('div', 'store-form__control');
            var grid = el('div', 'store-upload-grid');
            grid.appendChild(uploadClickBox('上传身份证人像面'));
            grid.appendChild(uploadClickBox('上传身份证国徽面'));
            idc.appendChild(grid);
            idPair2.appendChild(idc);
            settleDynamic.appendChild(idPair2);

            var authRow = el('div', 'store-form__row');
            authRow.appendChild(sfLabel('法人授权函', true));
            var authCtrl = el('div', 'store-form__control');
            authCtrl.appendChild(uploadClickBox());
            authCtrl.appendChild(
                el(
                    'div',
                    'store-form__upload-hint',
                    '下载模板并打印，填写信息并授权签章'
                )
            );
            var btnRow = el('div', 'onboard-auth-actions');
            var bTpl = mkBtn('下载模板', false, true);
            var bEx = mkBtn('下载示例', false, true);
            bTpl.addEventListener('click', function () {
                showToast('模板下载（演示）', 'info');
            });
            bEx.addEventListener('click', function () {
                showToast('示例下载（演示）', 'info');
            });
            btnRow.appendChild(bTpl);
            btnRow.appendChild(bEx);
            authCtrl.appendChild(btnRow);
            authRow.appendChild(authCtrl);
            settleDynamic.appendChild(authRow);

            ogRow(settleDynamic, '身份证号', false, textInput('请输入身份证号'));
            ogRow(settleDynamic, '身份证起始日期', false, textInput('请选择起始日期'));
            ogRow(settleDynamic, '身份证有效期', false, textInput('请选择有效期'));
            ogRow(settleDynamic, '开户名', false, textInput('请输入开户名'));
            ogRow(settleDynamic, '银行卡号', false, textInput('请输入银行卡号'));
            ogRow(settleDynamic, '开户城市', false, textInput('请输入开户城市'));
            ogRow(settleDynamic, '开户支行', false, textInput('请输入开户支行'));
        }

        renderSettleDynamic();
        body.appendChild(s4);

        var s5 = el('section', 'store-onboard-section store-onboard-section--white');
        s5.appendChild(sectionTitle('门店信息'));
        var tri = el('div', 'store-upload-grid');
        [
            ['门头照', '门头照'],
            ['内设照', '内设照'],
            ['收银台照', '收银台照']
        ].forEach(function (pair) {
            var w = el('div', '');
            w.appendChild(sfLabel(pair[0], true));
            w.appendChild(uploadClickBox(pair[1]));
            tri.appendChild(w);
        });
        s5.appendChild(tri);

        s5.appendChild(sectionTitle('门店协议'));
        var agreeRow = el('div', 'store-form__row');
        agreeRow.appendChild(sfLabel('电子协议', false));
        var agreeCtrl = el('div', 'store-form__control');
        var genBtn = mkBtn('生成电子协议', true, false);
        genBtn.addEventListener('click', function () {
            showToast('电子协议生成（演示）', 'info');
        });
        agreeCtrl.appendChild(genBtn);
        agreeRow.appendChild(agreeCtrl);
        s5.appendChild(agreeRow);
        body.appendChild(s5);

        var footer = el('div', 'erp-modal__footer');
        var bBack = mkBtn('返回', false, true);
        var bOk = mkBtn('确定', true, false);
        bBack.addEventListener('click', function () {
            backdrop.remove();
        });
        bOk.addEventListener('click', function () {
            showToast('进件资料已保存（演示，未提交渠道）', 'success');
            backdrop.remove();
        });
        footer.appendChild(bBack);
        footer.appendChild(bOk);

        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);
        backdrop.appendChild(modal);
        backdrop.addEventListener('click', function (ev) {
            if (ev.target === backdrop) backdrop.remove();
        });
        document.body.appendChild(backdrop);
    }

    window.MdmUnifiedOnboardingUi = {
        openModal: openUnifiedOnboardingModal,
        removeModals: removeUnifiedOnboardingModals
    };
})();
