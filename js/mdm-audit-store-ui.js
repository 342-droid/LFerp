/**
 * 门店注册审核 — 详情弹窗、媒体预览、审核流程（由 vendor audit-store-registration 迁入）
 */
(function () {
    function escapeHtml(s) {
        return String(s ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text != null && text !== '') n.textContent = text;
        return n;
    }

    function mkBtn(label, primary) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'erp-btn' + (primary ? ' erp-btn--primary' : '');
        b.textContent = label;
        return b;
    }

    function textInput(placeholder, value) {
        var inp = document.createElement('input');
        inp.className = 'erp-input';
        inp.type = 'text';
        inp.placeholder = placeholder || '';
        inp.value = value != null ? String(value) : '';
        return inp;
    }

    function textareaInput(placeholder, value, rows) {
        var ta = document.createElement('textarea');
        ta.className = 'erp-textarea';
        ta.rows = rows || 3;
        ta.style.width = '100%';
        ta.style.boxSizing = 'border-box';
        ta.placeholder = placeholder || '';
        ta.value = value != null ? String(value) : '';
        return ta;
    }

    function selectInput(opts, value) {
        var sel = document.createElement('select');
        sel.className = 'erp-select';
        opts.forEach(function (o) {
            var opt = document.createElement('option');
            opt.value = o.value;
            opt.textContent = o.label;
            sel.appendChild(opt);
        });
        if (value != null) sel.value = String(value);
        return sel;
    }

    function closeAuditModals() {
        document.querySelectorAll('[data-audit-center-modal]').forEach(function (n) {
            n.remove();
        });
    }

    function detailRow(label, value) {
        var row = el('div', 'audit-detail-row');
        row.appendChild(el('span', 'audit-detail-row__label', label));
        var valueEl = el('span', 'audit-detail-row__value');
        if (value instanceof Node) valueEl.appendChild(value);
        else valueEl.textContent = value || '—';
        row.appendChild(valueEl);
        return row;
    }

    function mediaUrl(file) {
        if (file.url) return file.url;
        if (file.type === 'video') return 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
        var svg =
            '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="240" viewBox="0 0 360 240">' +
            '<defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1">' +
            '<stop offset="0" stop-color="#dbeafe"/><stop offset="1" stop-color="#eff6ff"/></linearGradient></defs>' +
            '<rect width="360" height="240" rx="18" fill="url(#g)"/>' +
            '<circle cx="72" cy="70" r="24" fill="#93c5fd"/>' +
            '<path d="M40 196l82-82 54 54 36-36 108 108H40z" fill="#60a5fa" opacity=".55"/>' +
            '<text x="180" y="218" text-anchor="middle" font-size="15" font-family="Arial, sans-serif" fill="#1d4ed8">' +
            escapeHtml(file.name) +
            '</text></svg>';
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }

    function openMediaPreview(file) {
        var backdrop = el('div', 'erp-modal-backdrop');
        backdrop.setAttribute('data-audit-center-modal', '1');
        var modal = el('div', 'erp-modal erp-modal--store-wide');
        var header = el('div', 'erp-modal__header');
        header.appendChild(el('h2', 'erp-modal__title', file.name));
        var actions = el('div', 'erp-modal__header-actions');
        var close = el('button', 'erp-modal__header-btn');
        close.type = 'button';
        close.innerHTML = '&times;';
        close.addEventListener('click', function () {
            backdrop.remove();
        });
        actions.appendChild(close);
        header.appendChild(actions);

        var body = el('div', 'erp-modal__body');
        var preview = el('div', 'audit-media-preview');
        if (file.type === 'video') {
            var video = el('video', 'audit-media-preview__video');
            video.controls = true;
            video.autoplay = true;
            video.src = mediaUrl(file);
            preview.appendChild(video);
        } else {
            var img = el('img', 'audit-media-preview__image');
            img.src = mediaUrl(file);
            img.alt = file.name;
            preview.appendChild(img);
        }
        body.appendChild(preview);

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

    function mediaGrid(files) {
        if (!Array.isArray(files) || files.length === 0) return '—';
        var wrap = el('div', 'audit-media-grid');
        files.forEach(function (file) {
            var card = el('div', 'audit-media-card');
            if (file.type === 'video') {
                var video = el('video', 'audit-media-card__video');
                video.controls = true;
                video.preload = 'metadata';
                video.src = mediaUrl(file);
                card.appendChild(video);
            } else {
                var img = el('img', 'audit-media-card__image');
                img.src = mediaUrl(file);
                img.alt = file.name;
                img.addEventListener('click', function () {
                    openMediaPreview(file);
                });
                card.appendChild(img);
            }
            card.appendChild(el('div', 'audit-media-card__caption', file.name));
            wrap.appendChild(card);
        });
        return wrap;
    }

    function appendRegistrationFields(body, row) {
        var isFranchiseOrPartner = row.partnerDivision === '加盟店' || row.partnerDivision === '合作店';
        var isPeerStore = row.partnerDivision === '同行店';

        body.appendChild(el('div', 'supplier-detail-section-title', '主体字段'));
        body.appendChild(detailRow('主体名称', row.subjectName));
        body.appendChild(detailRow('绑定BD', row.bd));
        body.appendChild(detailRow('主体类型', '门店'));
        body.appendChild(detailRow('联系人', row.contact));
        body.appendChild(detailRow('手机号码', row.phone));

        body.appendChild(el('div', 'supplier-detail-section-title', '门店档案字段'));
        body.appendChild(detailRow('门店名称', row.storeName));
        body.appendChild(detailRow('门店简称', row.shortName));
        body.appendChild(detailRow('门店合作类型', row.partnerDivision));
        body.appendChild(detailRow('门店类型', row.storeType));
        body.appendChild(detailRow('配送仓库', row.warehouse));
        body.appendChild(detailRow('省市区', row.region));
        body.appendChild(detailRow('详细地址', row.address));
        body.appendChild(detailRow('经纬度', row.latlng));
        body.appendChild(detailRow('门店门头照', mediaGrid(row.facadePhoto)));
        body.appendChild(detailRow('有无冷藏柜', row.hasRefrigeratedCabinet));
        body.appendChild(detailRow('冷藏柜照片', mediaGrid(row.refrigeratedPhotos)));
        body.appendChild(detailRow('有无冷冻柜', row.hasFreezerCabinet));
        body.appendChild(detailRow('冷冻柜照片', mediaGrid(row.freezerPhotos)));

        if (isFranchiseOrPartner) {
            body.appendChild(el('div', 'supplier-detail-section-title', '加盟店 / 合作店补充资料'));
            body.appendChild(detailRow('门店面积（㎡）', row.storeArea));
            body.appendChild(detailRow('门店楼层', row.storeFloors));
            body.appendChild(detailRow('店门口口述视频', mediaGrid(row.videoStorefrontIntro)));
            body.appendChild(detailRow('店内口述视频', mediaGrid(row.videoInteriorIntro)));
            body.appendChild(detailRow('门店方圆500米入住户数', row.householdsWithin500m));
            body.appendChild(detailRow('日均客单量', row.dailyOrderVolume));
            body.appendChild(detailRow('店内工作人员总数', row.staffCount));
            body.appendChild(detailRow('实际经营者对直播业务的理解', row.liveCommerceUnderstanding));
            body.appendChild(detailRow('门店日常运营服务理解与配合', row.dailyOpsCooperationNote));
            body.appendChild(detailRow('私域直播投入产出期望', row.privateLiveRoiExpectation));
            body.appendChild(detailRow('私域直播/社区团购熟悉程度', row.privateCommerceFamiliarity));
            body.appendChild(detailRow('周边小区及居住人群描述', row.surroundingCommunityNote));
            body.appendChild(detailRow('拉到1000人信心说明', row.confidenceReach1000));
            body.appendChild(detailRow('特殊情况说明', row.specialCircumstancesNote));
            body.appendChild(detailRow('特殊情况配图', mediaGrid(row.specialCircumstancesPhotos)));
        }

        if (isPeerStore) {
            body.appendChild(el('div', 'supplier-detail-section-title', '同行店补充资料'));
            body.appendChild(detailRow('已合作其他平台情况', row.otherPlatformsCooperation));
            body.appendChild(detailRow('近三天上播及销量截图', mediaGrid(row.broadcastSalesScreenshots)));
        }
    }

    function approveAudit(row) {
        if (row.auditStatus === '待审核') {
            row.auditStatus = '待总监审核';
            row.mdmStatus = '未生成';
            return;
        }
        if (row.auditStatus === '待总监审核') {
            row.auditStatus = '审核成功';
            row.mdmStatus = '已生成主体与门店档案';
        }
    }

    function rejectAudit(row) {
        row.auditStatus = '审核失败';
        row.mdmStatus = '未生成';
    }

    function submitEditedAudit(row) {
        row.auditStatus = '待总监审核';
        row.mdmStatus = '未生成';
    }

    function editRow(label, control, fieldKey) {
        var row = el('div', 'audit-detail-row');
        row.appendChild(el('span', 'audit-detail-row__label', label));
        var value = el('span', 'audit-detail-row__value');
        if (fieldKey) control.setAttribute('data-audit-field', fieldKey);
        value.appendChild(control);
        row.appendChild(value);
        return row;
    }

    /** 与 appendRegistrationFields 同结构：可编辑项用表单控件，附件类与审核详情一致为只读预览。 */
    function appendEditableFields(body, row, opts) {
        opts = opts || {};
        var onPartnerChange = opts.onPartnerChange;

        var isFranchiseOrPartner = row.partnerDivision === '加盟店' || row.partnerDivision === '合作店';
        var isPeerStore = row.partnerDivision === '同行店';

        body.appendChild(el('div', 'supplier-detail-section-title', '主体字段'));
        body.appendChild(editRow('主体名称', textInput('请输入主体名称', row.subjectName), 'subjectName'));
        body.appendChild(editRow('绑定BD', textInput('请输入绑定BD', row.bd), 'bd'));
        body.appendChild(detailRow('主体类型', '门店'));
        body.appendChild(editRow('联系人', textInput('请输入联系人', row.contact), 'contact'));
        body.appendChild(editRow('手机号码', textInput('请输入手机号码', row.phone), 'phone'));

        body.appendChild(el('div', 'supplier-detail-section-title', '门店档案字段'));
        body.appendChild(editRow('门店名称', textInput('请输入门店名称', row.storeName), 'storeName'));
        body.appendChild(editRow('门店简称', textInput('请输入门店简称', row.shortName), 'shortName'));
        var partnerSel = selectInput(
            [
                { value: '加盟店', label: '加盟店' },
                { value: '合作店', label: '合作店' },
                { value: '同行店', label: '同行店' }
            ],
            row.partnerDivision
        );
        partnerSel.setAttribute('data-audit-field', 'partnerDivision');
        body.appendChild(editRow('门店合作类型', partnerSel));
        body.appendChild(editRow('门店类型', textInput('请输入门店类型', row.storeType), 'storeType'));
        body.appendChild(editRow('配送仓库', textInput('请输入配送仓库', row.warehouse), 'warehouse'));
        body.appendChild(editRow('省市区', textInput('请输入省市区', row.region), 'region'));
        body.appendChild(editRow('详细地址', textInput('请输入详细地址', row.address), 'address'));
        body.appendChild(editRow('经纬度', textInput('例如 120.09,30.28', row.latlng), 'latlng'));
        body.appendChild(detailRow('门店门头照', mediaGrid(row.facadePhoto)));
        body.appendChild(
            editRow(
                '有无冷藏柜',
                selectInput(
                    [
                        { value: '有', label: '有' },
                        { value: '无', label: '无' }
                    ],
                    row.hasRefrigeratedCabinet
                ),
                'hasRefrigeratedCabinet'
            )
        );
        body.appendChild(detailRow('冷藏柜照片', mediaGrid(row.refrigeratedPhotos)));
        body.appendChild(
            editRow(
                '有无冷冻柜',
                selectInput(
                    [
                        { value: '有', label: '有' },
                        { value: '无', label: '无' }
                    ],
                    row.hasFreezerCabinet
                ),
                'hasFreezerCabinet'
            )
        );
        body.appendChild(detailRow('冷冻柜照片', mediaGrid(row.freezerPhotos)));

        if (isFranchiseOrPartner) {
            body.appendChild(el('div', 'supplier-detail-section-title', '加盟店 / 合作店补充资料'));
            body.appendChild(editRow('门店面积（㎡）', textInput('', row.storeArea), 'storeArea'));
            body.appendChild(editRow('门店楼层', textInput('', row.storeFloors), 'storeFloors'));
            body.appendChild(detailRow('店门口口述视频', mediaGrid(row.videoStorefrontIntro)));
            body.appendChild(detailRow('店内口述视频', mediaGrid(row.videoInteriorIntro)));
            body.appendChild(
                editRow('门店方圆500米入住户数', textInput('', row.householdsWithin500m), 'householdsWithin500m')
            );
            body.appendChild(editRow('日均客单量', textInput('', row.dailyOrderVolume), 'dailyOrderVolume'));
            body.appendChild(editRow('店内工作人员总数', textInput('', row.staffCount), 'staffCount'));
            body.appendChild(
                editRow(
                    '实际经营者对直播业务的理解',
                    textareaInput('', row.liveCommerceUnderstanding, 3),
                    'liveCommerceUnderstanding'
                )
            );
            body.appendChild(
                editRow(
                    '门店日常运营服务理解与配合',
                    textareaInput('', row.dailyOpsCooperationNote, 3),
                    'dailyOpsCooperationNote'
                )
            );
            body.appendChild(
                editRow(
                    '私域直播投入产出期望',
                    textareaInput('', row.privateLiveRoiExpectation, 3),
                    'privateLiveRoiExpectation'
                )
            );
            body.appendChild(
                editRow(
                    '私域直播/社区团购熟悉程度',
                    textareaInput('', row.privateCommerceFamiliarity, 3),
                    'privateCommerceFamiliarity'
                )
            );
            body.appendChild(
                editRow(
                    '周边小区及居住人群描述',
                    textareaInput('', row.surroundingCommunityNote, 3),
                    'surroundingCommunityNote'
                )
            );
            body.appendChild(
                editRow('拉到1000人信心说明', textareaInput('', row.confidenceReach1000, 3), 'confidenceReach1000')
            );
            body.appendChild(
                editRow('特殊情况说明', textareaInput('', row.specialCircumstancesNote, 3), 'specialCircumstancesNote')
            );
            body.appendChild(detailRow('特殊情况配图', mediaGrid(row.specialCircumstancesPhotos)));
        }

        if (isPeerStore) {
            body.appendChild(el('div', 'supplier-detail-section-title', '同行店补充资料'));
            body.appendChild(
                editRow(
                    '已合作其他平台情况',
                    textareaInput('', row.otherPlatformsCooperation, 3),
                    'otherPlatformsCooperation'
                )
            );
            body.appendChild(detailRow('近三天上播及销量截图', mediaGrid(row.broadcastSalesScreenshots)));
        }

        if (typeof onPartnerChange === 'function') {
            partnerSel.addEventListener('change', function () {
                onPartnerChange(partnerSel);
            });
        }
    }

    var AUDIT_ROWS = [
        {
            id: 'WF-STORE-20260507001',
            source: 'PC 创建门店',
            subjectName: '冷丰演示门店',
            storeName: '冷丰演示门店文一西路店',
            shortName: '冷丰-文一西路',
            bd: '王强',
            contact: '周敏',
            phone: '138****2201',
            auditStatus: '待审核',
            mdmStatus: '未生成',
            submittedAt: '2026-05-07 15:20',
            storeType: '社区生鲜店',
            partnerDivision: '加盟店',
            warehouse: '华东 RDC-杭州',
            region: '浙江省 / 杭州市 / 西湖区',
            address: '文一西路 558 号 1 层临街',
            latlng: '120.0912,30.2866',
            facadePhoto: [{ type: 'image', name: '门店门头照-文一西路.jpg' }],
            hasRefrigeratedCabinet: '有',
            refrigeratedPhotos: [
                { type: 'image', name: '冷藏柜-1.jpg' },
                { type: 'image', name: '冷藏柜-2.jpg' }
            ],
            hasFreezerCabinet: '无',
            freezerPhotos: '—',
            storeArea: '120',
            storeFloors: '1F',
            videoStorefrontIntro: [{ type: 'video', name: '店门口口述视频.mp4' }],
            videoInteriorIntro: [{ type: 'video', name: '店内口述视频.mp4' }],
            householdsWithin500m: '约 1200 户',
            dailyOrderVolume: '工作日约 80 单',
            staffCount: '5',
            liveCommerceUnderstanding: '了解社区直播，可配合门店陈列与直播讲解。',
            dailyOpsCooperationNote: '可配合售后、配送交接与社群运营。',
            privateLiveRoiExpectation: '期望 2-3 个月形成稳定复购。',
            privateCommerceFamiliarity: '曾参与社区团购，熟悉基础操作。',
            surroundingCommunityNote: '周边成熟小区多，家庭客群占比高。',
            confidenceReach1000: '老板有多个社群资源，有信心达成。',
            specialCircumstancesNote: '无',
            specialCircumstancesPhotos: '—'
        },
        {
            id: 'WF-STORE-20260507002',
            source: 'PC 创建门店',
            subjectName: '五角场体验店',
            storeName: '五角场体验店',
            shortName: '五角场体验',
            bd: '李四',
            contact: '孙丽',
            phone: '188****7765',
            auditStatus: '待总监审核',
            mdmStatus: '未生成',
            submittedAt: '2026-05-07 14:58',
            storeType: '团购自提点',
            partnerDivision: '合作店',
            warehouse: '沪东前置仓',
            region: '上海市 / 市辖区 / 杨浦区',
            address: '五角场商圈政通路 99 号',
            latlng: '121.5142,31.3028',
            facadePhoto: [{ type: 'image', name: '五角场门头照.jpg' }],
            hasRefrigeratedCabinet: '有',
            refrigeratedPhotos: [{ type: 'image', name: '冷藏柜照片.jpg' }],
            hasFreezerCabinet: '有',
            freezerPhotos: [{ type: 'image', name: '冷冻柜照片.jpg' }],
            storeArea: '156',
            storeFloors: '1F',
            videoStorefrontIntro: [{ type: 'video', name: '店前两分钟口述.mp4' }],
            videoInteriorIntro: [{ type: 'video', name: '店内一分钟口述.mp4' }],
            householdsWithin500m: '约 3000 户',
            dailyOrderVolume: '日均约 160 单',
            staffCount: '8',
            liveCommerceUnderstanding: '老板认可直播带货与社群复购模式。',
            dailyOpsCooperationNote: '具备固定店员，可承接日常运营。',
            privateLiveRoiExpectation: '可接受前期投入，关注复购增长。',
            privateCommerceFamiliarity: '熟悉私域社群，做过团购接龙。',
            surroundingCommunityNote: '周边办公与居民混合，午晚高峰明显。',
            confidenceReach1000: '已有老客群基础。',
            specialCircumstancesNote: '需总监确认区域保护边界。',
            specialCircumstancesPhotos: [
                { type: 'image', name: '区域保护说明-1.jpg' },
                { type: 'image', name: '区域保护说明-2.jpg' }
            ]
        },
        {
            id: 'WF-STORE-20260506001',
            source: 'PC 创建门店',
            subjectName: '滨江便民店',
            storeName: '滨江便民店春晓路店',
            shortName: '滨江-春晓路',
            bd: '王强',
            contact: '刘芳',
            phone: '139****3308',
            auditStatus: '审核失败',
            mdmStatus: '未生成',
            submittedAt: '2026-05-06 09:12',
            storeType: '社区便利店',
            partnerDivision: '加盟店',
            warehouse: '华东 RDC-杭州',
            region: '浙江省 / 杭州市 / 滨江区',
            address: '春晓路 198 号',
            latlng: '120.2120,30.2080',
            facadePhoto: [{ type: 'image', name: '滨江门头.jpg' }],
            hasRefrigeratedCabinet: '有',
            refrigeratedPhotos: [{ type: 'image', name: '滨江冷藏.jpg' }],
            hasFreezerCabinet: '无',
            freezerPhotos: '—',
            storeArea: '88',
            storeFloors: '1F',
            videoStorefrontIntro: [{ type: 'video', name: '滨江店门口.mp4' }],
            videoInteriorIntro: [{ type: 'video', name: '滨江店内.mp4' }],
            householdsWithin500m: '约 800 户',
            dailyOrderVolume: '约 50 单',
            staffCount: '3',
            liveCommerceUnderstanding: '愿意尝试直播，配合店内讲解。',
            dailyOpsCooperationNote: '可配合日常售后与交接。',
            privateLiveRoiExpectation: '先试运营再看投入产出。',
            privateCommerceFamiliarity: '对私域团购了解有限。',
            surroundingCommunityNote: '周边新建小区与沿街商铺混合。',
            confidenceReach1000: '需补充社群拉新方案。',
            specialCircumstancesNote: '需补充门头清晰照与视频。',
            specialCircumstancesPhotos: '—'
        },
        {
            id: 'WF-STORE-20260506008',
            source: 'PC 创建门店',
            subjectName: '张江快闪店',
            storeName: '张江快闪店',
            shortName: '张江快闪',
            bd: '赵小九',
            contact: '陈晨',
            phone: '186****9001',
            auditStatus: '审核成功',
            mdmStatus: '已生成主体与门店档案',
            submittedAt: '2026-05-06 18:36',
            storeType: '快闪零售',
            partnerDivision: '同行店',
            warehouse: '沪东前置仓',
            region: '上海市 / 市辖区 / 浦东新区',
            address: '张江路 88 号',
            latlng: '121.6321,31.2047',
            facadePhoto: [{ type: 'image', name: '张江快闪门头照.jpg' }],
            hasRefrigeratedCabinet: '无',
            refrigeratedPhotos: '—',
            hasFreezerCabinet: '无',
            freezerPhotos: '—',
            otherPlatformsCooperation: '已合作美团优选和社区团购平台。',
            broadcastSalesScreenshots: [
                { type: 'image', name: '上播销量截图-第1天.jpg' },
                { type: 'image', name: '上播销量截图-第2天.jpg' },
                { type: 'image', name: '上播销量截图-第3天.jpg' }
            ]
        }
    ];

    function getRecordByTableRow(tr) {
        if (!tr) return null;
        var cells = tr.querySelectorAll('td');
        if (!cells.length) return null;
        var id = cells[0].textContent.trim();
        for (var i = 0; i < AUDIT_ROWS.length; i++) {
            if (AUDIT_ROWS[i].id === id) return AUDIT_ROWS[i];
        }
        return null;
    }

    function statusCellHtml(text) {
        var active = text === '审核成功' || text.indexOf('已生成') === 0;
        return (
            '<span class="status ' + (active ? 'active' : 'inactive') + '">' + escapeHtml(text) + '</span>'
        );
    }

    function renderActionHtml(rec) {
        var d =
            '<a href="#" class="mdm-audit-detail">详情</a>';
        if (rec.auditStatus === '待审核' || rec.auditStatus === '待总监审核') {
            return d + '　<a href="#" class="mdm-audit-review">审核</a>';
        }
        if (rec.auditStatus === '审核失败') {
            return d + '　<a href="#" class="mdm-audit-edit">编辑</a>';
        }
        return d;
    }

    function applyRowToDom(tr, rec) {
        var cells = tr.querySelectorAll('td');
        if (cells.length < 11) return;
        cells[2].textContent = rec.subjectName || '';
        cells[3].textContent = rec.storeName || '';
        cells[4].textContent = rec.bd || '';
        cells[5].textContent = rec.contact || '';
        cells[6].textContent = rec.phone || '';
        cells[7].innerHTML = statusCellHtml(rec.auditStatus);
        cells[8].innerHTML = statusCellHtml(rec.mdmStatus);
        cells[10].className = 'action-links';
        cells[10].innerHTML = renderActionHtml(rec);
    }

    function openAuditDetail(row) {
        closeAuditModals();
        var backdrop = el('div', 'erp-modal-backdrop');
        backdrop.setAttribute('data-audit-center-modal', '1');
        var modal = el('div', 'erp-modal erp-modal--store-wide');
        var header = el('div', 'erp-modal__header');
        header.appendChild(el('h2', 'erp-modal__title', '门店注册审核详情'));
        var actions = el('div', 'erp-modal__header-actions');
        var close = el('button', 'erp-modal__header-btn');
        close.type = 'button';
        close.innerHTML = '&times;';
        close.addEventListener('click', function () {
            backdrop.remove();
        });
        actions.appendChild(close);
        header.appendChild(actions);

        var body = el('div', 'erp-modal__body');
        appendRegistrationFields(body, row);
        body.appendChild(el('div', 'supplier-detail-section-title', '状态信息'));
        body.appendChild(detailRow('审核状态', row.auditStatus));
        body.appendChild(detailRow('MDM状态', row.mdmStatus));

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

    function readEditableFromBody(body) {
        var out = {};
        body.querySelectorAll('[data-audit-field]').forEach(function (inp) {
            var k = inp.getAttribute('data-audit-field');
            if (k) out[k] = inp.value;
        });
        return out;
    }

    function applyEditableToRow(row, patch) {
        if (!patch || typeof patch !== 'object') return;
        Object.keys(patch).forEach(function (k) {
            row[k] = patch[k];
        });
    }

    function openAuditReview(row, pm, startInEdit) {
        closeAuditModals();
        var backdrop = el('div', 'erp-modal-backdrop');
        backdrop.setAttribute('data-audit-center-modal', '1');
        var modal = el('div', 'erp-modal erp-modal--store-wide');
        var header = el('div', 'erp-modal__header');
        header.appendChild(el('h2', 'erp-modal__title', '审核门店注册申请'));
        var actions = el('div', 'erp-modal__header-actions');
        var close = el('button', 'erp-modal__header-btn');
        close.type = 'button';
        close.innerHTML = '&times;';
        close.addEventListener('click', function () {
            backdrop.remove();
        });
        actions.appendChild(close);
        header.appendChild(actions);

        var body = el('div', 'erp-modal__body');
        var footer = el('div', 'erp-modal__footer');

        function findTr() {
            var tbody = document.getElementById((pm && pm.config && pm.config.tableBodyId) || 'tableBody');
            if (!tbody) return null;
            var trs = tbody.querySelectorAll('tr');
            for (var i = 0; i < trs.length; i++) {
                if (trs[i].querySelectorAll('td')[0] && trs[i].querySelectorAll('td')[0].textContent.trim() === row.id)
                    return trs[i];
            }
            return null;
        }

        function onDone() {
            var tr = findTr();
            if (tr) applyRowToDom(tr, row);
            if (pm && typeof pm.refreshPagination === 'function') pm.refreshPagination();
        }

        function renderReview() {
            body.innerHTML = '';
            footer.innerHTML = '';
            var phaseLabel =
                row.auditStatus === '待审核'
                    ? 'BD 审核'
                    : row.auditStatus === '待总监审核'
                      ? 'BD 总监终审'
                      : row.auditStatus === '审核失败'
                        ? '审核失败（待修改资料）'
                        : '—';
            body.appendChild(detailRow('当前环节', phaseLabel));
            body.appendChild(detailRow('审核状态', row.auditStatus));
            appendRegistrationFields(body, row);

            var cancel = mkBtn('取消', false);
            cancel.addEventListener('click', function () {
                backdrop.remove();
            });
            footer.appendChild(cancel);

            if (row.auditStatus === '待审核') {
                var edit = mkBtn('编辑', false);
                edit.addEventListener('click', renderEdit);
                var reject = mkBtn('驳回', false);
                reject.addEventListener('click', function () {
                    rejectAudit(row);
                    backdrop.remove();
                    onDone();
                    showToast('已驳回申请（演示）', 'info');
                });
                var approve = mkBtn('审核通过', true);
                approve.addEventListener('click', function () {
                    approveAudit(row);
                    backdrop.remove();
                    onDone();
                    showToast('审核已处理（演示）', 'success');
                });
                footer.appendChild(edit);
                footer.appendChild(reject);
                footer.appendChild(approve);
            } else if (row.auditStatus === '待总监审核') {
                var reject2 = mkBtn('驳回', false);
                reject2.addEventListener('click', function () {
                    rejectAudit(row);
                    backdrop.remove();
                    onDone();
                    showToast('已驳回申请（演示）', 'info');
                });
                var approve2 = mkBtn('审核通过', true);
                approve2.addEventListener('click', function () {
                    approveAudit(row);
                    backdrop.remove();
                    onDone();
                    showToast('审核已处理（演示）', 'success');
                });
                footer.appendChild(reject2);
                footer.appendChild(approve2);
            } else if (row.auditStatus === '审核失败') {
                var editFail = mkBtn('编辑资料', false);
                editFail.addEventListener('click', renderEdit);
                footer.appendChild(editFail);
            }
        }

        function renderEdit() {
            body.innerHTML = '';
            footer.innerHTML = '';
            body.appendChild(detailRow('当前状态', '编辑资料'));

            function partnerChangeHandler(partnerSel) {
                var patch = readEditableFromBody(body);
                applyEditableToRow(row, patch);
                row.partnerDivision = partnerSel.value;
                while (body.children.length > 1) {
                    body.removeChild(body.lastElementChild);
                }
                appendEditableFields(body, row, { onPartnerChange: partnerChangeHandler });
            }

            appendEditableFields(body, row, { onPartnerChange: partnerChangeHandler });

            var cancel = mkBtn('取消', false);
            cancel.addEventListener('click', function () {
                if (startInEdit && row.auditStatus === '审核失败') backdrop.remove();
                else renderReview();
            });
            var save = mkBtn('保存资料', false);
            save.addEventListener('click', function () {
                var vals = readEditableFromBody(body);
                applyEditableToRow(row, vals);
                onDone();
                if (startInEdit && row.auditStatus === '审核失败') {
                    backdrop.remove();
                } else renderReview();
            });
            var submit = mkBtn('保存并提交', true);
            submit.addEventListener('click', function () {
                var vals = readEditableFromBody(body);
                applyEditableToRow(row, vals);
                submitEditedAudit(row);
                backdrop.remove();
                onDone();
                showToast('资料已保存并提交（演示）', 'success');
            });
            footer.appendChild(cancel);
            footer.appendChild(save);
            footer.appendChild(submit);
        }

        if (startInEdit) renderEdit();
        else renderReview();

        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);
        backdrop.appendChild(modal);
        backdrop.addEventListener('click', function (ev) {
            if (ev.target === backdrop) backdrop.remove();
        });
        document.body.appendChild(backdrop);
    }

    window.MdmAuditStoreUi = {
        openDetail: function (tr) {
            var rec = getRecordByTableRow(tr);
            if (!rec) {
                showToast('未找到该申请单详情数据', 'error');
                return;
            }
            openAuditDetail(rec);
        },
        openReview: function (tr, pm, startInEdit) {
            var rec = getRecordByTableRow(tr);
            if (!rec) {
                showToast('未找到该申请单', 'error');
                return;
            }
            openAuditReview(rec, pm, startInEdit);
        }
    };
})();
