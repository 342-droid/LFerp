/**
 * 资源中心档案 — 右侧滑出详情抽屉 + 多页签（对齐 vendor store-archive-ui / resource-archive-ui）
 */
(function () {
    var SUPPLIER_INBOUND_WAREHOUSE_BIND_KEY = 'mdm_supplier_inbound_warehouse_bindings_v1';
    var SUPPLIER_RECEIVE_ADDR_KEY = 'mdm_supplier_receive_addr_v1';
    /**
     * 门店/供应商汇付商户绑定（多商户）
     * pack: { merchants:[{merchantNo,source,isDefault,...}], defaultMerchantNo }
     * 一商户号可绑多个实体；一实体可绑多个商户号
     */
    var HUIFU_MERCHANT_BIND_KEY = 'mdm_huifu_merchant_bind_v2';
    /** 演示：商户账户余额/在途（切换默认时基于「当前默认商户」校验） */
    var HUIFU_MERCHANT_FUNDS_DEMO = {
        HF8886202608001: { balance: 1280.5, inTransit: 200 },
        HF20260424001: { balance: 0, inTransit: 0 },
        HF20260423002: { balance: 56.8, inTransit: 0 }
    };
    var SUPPLIER_PAYMENT_AGREEMENT = {
        type: '挂网协议',
        name: '斗拱平台综合支付服务协议',
        url: 'https://cloudpnrcdn.oss-cn-shanghai.aliyuncs.com/opps/api/prod/download_file/PaymentServiceAgreement.htm'
    };
    /** 演示用汇付商户目录（输入商户号后回显：商户信息 + 结算/开户许可信息） */
    var HUIFU_MERCHANT_DEMO_DIR = {
        HF8886202608001: {
            merchantNo: 'HF8886202608001',
            merchantName: '冷丰演示商户（总部）',
            shortName: '冷丰演示',
            legalName: '张演示',
            licenseCode: '91310000MA1FLDEMO',
            contactMobile: '138****8001',
            status: '进件成功',
            channel: '汇付天下',
            openLicenseNo: 'J310000ABCDEF001',
            openLicensePic: true,
            accountName: '冷丰演示商户（总部）',
            cardNo: '6222021001123456789',
            bankName: '中国工商银行',
            bankBranch: '中国工商银行上海张江支行'
        },
        HF20260424001: {
            merchantNo: 'HF20260424001',
            merchantName: '小牛供应链支付主体',
            shortName: '小牛支付',
            legalName: '牛强',
            licenseCode: '91320594MA1KXN001X',
            contactMobile: '159****7788',
            status: '进件成功',
            channel: '汇付天下',
            openLicenseNo: 'J320594ABCDEF002',
            openLicensePic: true,
            accountName: '小牛供应链有限公司',
            cardNo: '6225880210001234567',
            bankName: '招商银行',
            bankBranch: '招商银行苏州工业园支行'
        },
        HF20260423002: {
            merchantNo: 'HF20260423002',
            merchantName: '五角场体验店主体',
            shortName: '五角场店',
            legalName: '孙丽',
            licenseCode: '91310110MA1STORE02',
            contactMobile: '188****7765',
            status: '进件成功',
            channel: '汇付天下',
            openLicenseNo: 'J310110ABCDEF003',
            openLicensePic: true,
            accountName: '五角场体验店',
            cardNo: '6217001210009876543',
            bankName: '中国建设银行',
            bankBranch: '中国建设银行上海五角场支行'
        }
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

    /** 温馨提示确认弹框（对齐档案/商品列表二次确认） */
    function closeWarmConfirmModal() {
        document.querySelectorAll('[data-archive-warm-confirm="1"]').forEach(function (n) {
            n.remove();
        });
    }

    function openWarmConfirmModal(message, onConfirm, opts) {
        opts = opts || {};
        closeWarmConfirmModal();
        /* 须高于门店详情抽屉（store-drawer 2050/2060），否则弹框会被抽屉遮住 */
        var backdrop = el(
            'div',
            'erp-modal-backdrop erp-modal-backdrop--over-drawer mdm-people-warm-confirm-backdrop'
        );
        backdrop.setAttribute('data-archive-warm-confirm', '1');

        var modal = el('div', 'erp-modal erp-modal--confirm');
        var header = el('div', 'erp-modal__header');
        header.appendChild(el('h2', 'erp-modal__title', opts.title || '温馨提示'));
        var acts = el('div', 'erp-modal__header-actions');
        var closeBtn = el('button', 'erp-modal__header-btn');
        closeBtn.type = 'button';
        closeBtn.setAttribute('aria-label', '关闭');
        closeBtn.innerHTML = '&times;';
        acts.appendChild(closeBtn);
        header.appendChild(acts);

        var body = el('div', 'erp-modal__body');
        var row = el('div', 'erp-modal-confirm__row');
        row.appendChild(el('div', 'erp-modal-confirm__icon', '!'));
        var msg = el('div', 'erp-modal-confirm__msg');
        String(message || '')
            .split(/\n/)
            .forEach(function (line, i) {
                if (i > 0) msg.appendChild(document.createElement('br'));
                msg.appendChild(document.createTextNode(line));
            });
        row.appendChild(msg);
        body.appendChild(row);

        var footer = el('div', 'erp-modal__footer');
        var cancelBtn = mkBtn(opts.cancelText || '取消', false);
        var okBtn = mkBtn(opts.okText || '确定', true);
        footer.appendChild(cancelBtn);
        footer.appendChild(okBtn);

        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);
        backdrop.appendChild(modal);

        function shut() {
            closeWarmConfirmModal();
        }
        backdrop.addEventListener('click', function (ev) {
            if (ev.target === backdrop) shut();
        });
        closeBtn.addEventListener('click', shut);
        cancelBtn.addEventListener('click', shut);
        okBtn.addEventListener('click', function () {
            shut();
            if (typeof onConfirm === 'function') onConfirm();
        });
        document.body.appendChild(backdrop);
    }

    function huifuBindEntityKey(kind, entityId) {
        return String(kind || '') + ':' + String(entityId || '').trim();
    }

    function writeHuifuMerchantBindMap(map) {
        try {
            localStorage.setItem(HUIFU_MERCHANT_BIND_KEY, JSON.stringify(map || {}));
        } catch (e) {}
    }

    function readHuifuMerchantBindMap() {
        var map = readJsonStore(HUIFU_MERCHANT_BIND_KEY);
        /* 兼容 v1 单商户结构 */
        if (!map || !Object.keys(map).length) {
            try {
                var legacy = localStorage.getItem('mdm_huifu_merchant_bind_v1');
                if (legacy) {
                    var old = JSON.parse(legacy);
                    if (old && typeof old === 'object') map = old;
                }
            } catch (e) {}
        }
        return map && typeof map === 'object' ? map : {};
    }

    function normalizeHuifuMerchantItem(raw, forceDefault) {
        var m = raw || {};
        var no = String(m.merchantNo || '').trim();
        if (!no) return null;
        return {
            merchantNo: no,
            merchantName: m.merchantName || '',
            shortName: m.shortName || '',
            legalName: m.legalName || '',
            licenseCode: m.licenseCode || '',
            contactMobile: m.contactMobile || '',
            status: m.status || '',
            channel: m.channel || '汇付天下',
            openLicenseNo: m.openLicenseNo || '',
            openLicensePic: !!m.openLicensePic,
            accountName: m.accountName || '',
            cardNo: m.cardNo || '',
            bankName: m.bankName || '',
            bankBranch: m.bankBranch || '',
            source: m.source === '自主进件' ? '自主进件' : '已有商户号',
            isDefault: forceDefault != null ? !!forceDefault : !!m.isDefault,
            boundAt: m.boundAt || Date.now()
        };
    }

    function normalizeHuifuPack(raw, kind, entityId) {
        var base = {
            kind: kind,
            entityId: String(entityId || ''),
            entityName: '',
            defaultMerchantNo: '',
            merchants: []
        };
        if (!raw || typeof raw !== 'object') return base;
        base.entityName = raw.entityName || '';
        var list = [];
        if (Array.isArray(raw.merchants)) {
            raw.merchants.forEach(function (it) {
                var item = normalizeHuifuMerchantItem(it);
                if (item) list.push(item);
            });
        } else if (raw.merchantNo) {
            /* v1：单商户记录 */
            var one = normalizeHuifuMerchantItem(raw, true);
            if (one) list.push(one);
        }
        var def = String(raw.defaultMerchantNo || '').trim();
        if (!def) {
            var marked = list.find(function (x) {
                return x.isDefault;
            });
            def = marked ? marked.merchantNo : list[0] ? list[0].merchantNo : '';
        }
        list.forEach(function (x) {
            x.isDefault = x.merchantNo === def;
        });
        if (list.length && !list.some(function (x) {
            return x.isDefault;
        })) {
            list[0].isDefault = true;
            def = list[0].merchantNo;
        }
        base.merchants = list;
        base.defaultMerchantNo = def;
        return base;
    }

    function getHuifuMerchantPack(kind, entityId) {
        var key = huifuBindEntityKey(kind, entityId);
        if (!key || key.slice(-1) === ':') return normalizeHuifuPack(null, kind, entityId);
        var map = readHuifuMerchantBindMap();
        return normalizeHuifuPack(map[key], kind, entityId);
    }

    function writeHuifuMerchantPack(kind, entityId, pack) {
        var key = huifuBindEntityKey(kind, entityId);
        if (!key || key.slice(-1) === ':') return false;
        var map = readHuifuMerchantBindMap();
        var normalized = normalizeHuifuPack(pack, kind, entityId);
        if (!normalized.merchants.length) {
            delete map[key];
        } else {
            map[key] = normalized;
        }
        writeHuifuMerchantBindMap(map);
        return true;
    }

    function listHuifuMerchants(kind, entityId) {
        return getHuifuMerchantPack(kind, entityId).merchants.slice();
    }

    /** 当前默认商户（兼容旧 getHuifuMerchantBind 调用） */
    function getHuifuMerchantBind(kind, entityId) {
        var pack = getHuifuMerchantPack(kind, entityId);
        if (!pack.merchants.length) return null;
        var def = pack.merchants.find(function (m) {
            return m.isDefault;
        });
        return def || pack.merchants[0] || null;
    }

    function getHuifuMerchantFunds(merchantNo) {
        var no = String(merchantNo || '')
            .trim()
            .toUpperCase();
        if (HUIFU_MERCHANT_FUNDS_DEMO[no]) {
            return {
                balance: Number(HUIFU_MERCHANT_FUNDS_DEMO[no].balance) || 0,
                inTransit: Number(HUIFU_MERCHANT_FUNDS_DEMO[no].inTransit) || 0
            };
        }
        /* 合成号：尾号偶数有余额，奇数有在途，便于演示拦截 */
        var n = Math.abs(hashStr(no));
        var balance = n % 2 === 0 ? Number(((n % 900) + 10) / 10) : 0;
        var inTransit = n % 2 === 1 ? Number(((n % 500) + 5) / 10) : 0;
        return { balance: balance, inTransit: inTransit };
    }

    function formatHuifuMoney(n) {
        var v = Number(n) || 0;
        return '¥' + v.toFixed(2);
    }

    /**
     * 切换默认：校验「当前默认（老账户）」是否有余额/在途
     * @returns {{ ok:boolean, message?:string }}
     */
    function canSwitchHuifuDefault(kind, entityId, nextMerchantNo) {
        var pack = getHuifuMerchantPack(kind, entityId);
        var next = String(nextMerchantNo || '').trim();
        if (!next) return { ok: false, message: '商户号无效' };
        var cur = pack.merchants.find(function (m) {
            return m.isDefault;
        });
        if (!cur || cur.merchantNo === next) return { ok: true };
        var funds = getHuifuMerchantFunds(cur.merchantNo);
        if (funds.balance > 0 || funds.inTransit > 0) {
            var parts = [];
            if (funds.balance > 0) parts.push('账户余额 ' + formatHuifuMoney(funds.balance));
            if (funds.inTransit > 0) parts.push('在途资金 ' + formatHuifuMoney(funds.inTransit));
            return {
                ok: false,
                message:
                    '当前默认商户「' +
                    cur.merchantNo +
                    '」存在' +
                    parts.join('、') +
                    '，暂不支持切换默认商户'
            };
        }
        return { ok: true };
    }

    function upsertHuifuMerchant(kind, entityId, merchant, entityName) {
        var m = normalizeHuifuMerchantItem(merchant);
        if (!m) return { ok: false, message: '商户号无效' };
        var pack = getHuifuMerchantPack(kind, entityId);
        pack.entityName = String(entityName || pack.entityName || '');
        var hit = pack.merchants.find(function (x) {
            return x.merchantNo === m.merchantNo;
        });
        if (hit) {
            Object.keys(m).forEach(function (k) {
                if (k === 'isDefault' || k === 'boundAt') return;
                if (m[k] !== '' && m[k] != null) hit[k] = m[k];
            });
        } else {
            m.isDefault = pack.merchants.length === 0;
            pack.merchants.push(m);
            if (m.isDefault) pack.defaultMerchantNo = m.merchantNo;
        }
        writeHuifuMerchantPack(kind, entityId, pack);
        return { ok: true };
    }

    function setDefaultHuifuMerchant(kind, entityId, merchantNo, seedMerchant) {
        var target = String(merchantNo || '').trim();
        if (!target || target === '—') return { ok: false, message: '商户号无效' };
        var pack = getHuifuMerchantPack(kind, entityId);
        var hit = pack.merchants.find(function (m) {
            return m.merchantNo === target;
        });
        if (!hit && seedMerchant) {
            upsertHuifuMerchant(kind, entityId, seedMerchant, pack.entityName);
            pack = getHuifuMerchantPack(kind, entityId);
            hit = pack.merchants.find(function (m) {
                return m.merchantNo === target;
            });
        }
        if (!hit) return { ok: false, message: '未找到该商户号' };
        var check = canSwitchHuifuDefault(kind, entityId, target);
        if (!check.ok) return check;
        pack.defaultMerchantNo = target;
        pack.merchants.forEach(function (m) {
            m.isDefault = m.merchantNo === target;
        });
        writeHuifuMerchantPack(kind, entityId, pack);
        return { ok: true };
    }

    function saveHuifuMerchantBind(kind, entityId, merchant, entityName) {
        var m = normalizeHuifuMerchantItem(
            Object.assign({}, merchant || {}, { source: '已有商户号' })
        );
        if (!m) return { ok: false, message: '商户号无效' };
        var pack = getHuifuMerchantPack(kind, entityId);
        pack.entityName = String(entityName || pack.entityName || '');
        var exists = pack.merchants.some(function (x) {
            return x.merchantNo === m.merchantNo;
        });
        if (exists) return { ok: false, message: '该商户号已绑定' };
        m.isDefault = pack.merchants.length === 0;
        pack.merchants.push(m);
        if (m.isDefault) pack.defaultMerchantNo = m.merchantNo;
        writeHuifuMerchantPack(kind, entityId, pack);
        return { ok: true, merchant: m };
    }

    function removeHuifuMerchantBind(kind, entityId, merchantNo) {
        var pack = getHuifuMerchantPack(kind, entityId);
        var no = String(merchantNo || '').trim();
        if (!no) {
            /* 兼容旧调用：不传号则清空 */
            writeHuifuMerchantPack(kind, entityId, { merchants: [] });
            return;
        }
        var next = pack.merchants.filter(function (m) {
            return m.merchantNo !== no;
        });
        var removedDefault = pack.defaultMerchantNo === no;
        pack.merchants = next;
        if (removedDefault) {
            pack.defaultMerchantNo = next[0] ? next[0].merchantNo : '';
        }
        pack.merchants.forEach(function (m) {
            m.isDefault = m.merchantNo === pack.defaultMerchantNo;
        });
        writeHuifuMerchantPack(kind, entityId, pack);
    }

    /** 按汇付商户号查询（演示：目录命中或合法号合成） */
    function lookupHuifuMerchantByNo(merchantNo) {
        var no = String(merchantNo || '')
            .trim()
            .toUpperCase()
            .replace(/\s+/g, '');
        if (!no) return null;
        if (HUIFU_MERCHANT_DEMO_DIR[no]) {
            return Object.assign({}, HUIFU_MERCHANT_DEMO_DIR[no]);
        }
        var keys = Object.keys(HUIFU_MERCHANT_DEMO_DIR);
        var i;
        for (i = 0; i < keys.length; i++) {
            if (keys[i].toUpperCase() === no) {
                return Object.assign({}, HUIFU_MERCHANT_DEMO_DIR[keys[i]]);
            }
        }
        if (!/^HF[A-Z0-9_-]{4,}$/i.test(no)) return null;
        var tail = no.slice(-4);
        var seed = Math.abs(hashStr(no));
        return {
            merchantNo: no,
            merchantName: '汇付商户·' + tail,
            shortName: '商户' + tail,
            legalName: '法人' + tail,
            licenseCode: '91' + String(seed % 1e13).padStart(13, '0'),
            contactMobile:
                '1' +
                String(Math.abs(hashStr(no + 'm')) % 1e10)
                    .padStart(10, '0')
                    .replace(/^(\d{3})\d{4}/, '$1****'),
            status: '进件成功',
            channel: '汇付天下',
            openLicenseNo: 'J' + String(seed % 1e12).padStart(12, '0'),
            openLicensePic: true,
            accountName: '汇付商户·' + tail,
            cardNo: '6222' + String(seed % 1e15).padStart(15, '0'),
            bankName: '中国建设银行',
            bankBranch: '中国建设银行股份有限公司演示支行'
        };
    }

    function isArchiveOnboardSuccess(status) {
        var s = String(status || '').trim();
        return s === '进件成功' || s === '已进件' || s === '审核成功';
    }

    function maskHuifuCardNo(no) {
        var s = String(no || '').replace(/\s+/g, '');
        if (!s || s === '—') return '—';
        if (s.length <= 8) return s;
        return s.slice(0, 4) + ' **** **** ' + s.slice(-4);
    }

    function appendHuifuBindInfoGrid(host, title, pairs) {
        host.appendChild(el('div', 'mdm-huifu-bind__info-title', title));
        var grid = el('div', 'mdm-huifu-bind__info-grid');
        (pairs || []).forEach(function (pair) {
            var cell = el('div', 'mdm-huifu-bind__info-cell');
            cell.appendChild(el('div', 'mdm-huifu-bind__info-k', pair[0]));
            cell.appendChild(el('div', 'mdm-huifu-bind__info-v', pair[1] != null && pair[1] !== '' ? pair[1] : '—'));
            grid.appendChild(cell);
        });
        host.appendChild(grid);
    }

    function hashStr(s) {
        var h = 0;
        var str = String(s || '');
        var i;
        for (i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
        return h;
    }

    function closeHuifuBindModal() {
        document.querySelectorAll('[data-archive-huifu-bind="1"]').forEach(function (n) {
            n.remove();
        });
    }

    /**
     * 绑定汇付商户号弹框
     * @param {{ kind:string, entityId:string, entityName:string, onBound:Function }} opts
     */
    function openHuifuMerchantBindModal(opts) {
        opts = opts || {};
        closeHuifuBindModal();
        var backdrop = el(
            'div',
            'erp-modal-backdrop erp-modal-backdrop--over-drawer'
        );
        backdrop.setAttribute('data-archive-huifu-bind', '1');

        var modal = el('div', 'erp-modal erp-modal--huifu-bind');
        var header = el('div', 'erp-modal__header');
        header.appendChild(el('h2', 'erp-modal__title', '绑定商户号'));
        var acts = el('div', 'erp-modal__header-actions');
        var closeBtn = el('button', 'erp-modal__header-btn');
        closeBtn.type = 'button';
        closeBtn.setAttribute('aria-label', '关闭');
        closeBtn.innerHTML = '&times;';
        acts.appendChild(closeBtn);
        header.appendChild(acts);

        var body = el('div', 'erp-modal__body');

        var row = el('div', 'mdm-huifu-bind__row');
        row.appendChild(el('div', 'mdm-huifu-bind__label', '汇付商户号'));
        var ctrl = el('div', 'mdm-huifu-bind__control');
        var input = el('input', 'erp-input');
        input.type = 'text';
        input.placeholder = '请输入汇付商户号';
        input.autocomplete = 'off';
        ctrl.appendChild(input);
        row.appendChild(ctrl);
        body.appendChild(row);

        var infoHost = el('div', 'mdm-huifu-bind__info');
        infoHost.hidden = true;
        body.appendChild(infoHost);

        var errEl = el('div', 'mdm-huifu-bind__err');
        errEl.hidden = true;
        body.appendChild(errEl);

        var footer = el('div', 'erp-modal__footer');
        var cancelBtn = mkBtn('取消', false);
        var okBtn = mkBtn('确认关联', true);
        okBtn.disabled = true;
        footer.appendChild(cancelBtn);
        footer.appendChild(okBtn);

        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);
        backdrop.appendChild(modal);

        var currentMerchant = null;
        var lookupTimer = null;

        function shut() {
            closeHuifuBindModal();
        }

        function setErr(msg) {
            if (!msg) {
                errEl.hidden = true;
                errEl.textContent = '';
                return;
            }
            errEl.hidden = false;
            errEl.textContent = msg;
        }

        function renderMerchantInfo(m) {
            empty(infoHost);
            if (!m) {
                infoHost.hidden = true;
                return;
            }
            infoHost.hidden = false;
            appendHuifuBindInfoGrid(infoHost, '商户信息', [
                ['汇付商户号', m.merchantNo],
                ['商户名称', m.merchantName],
                ['商户简称', m.shortName],
                ['法人姓名', m.legalName],
                ['营业执照号', m.licenseCode],
                ['联系人手机', m.contactMobile],
                ['进件状态', m.status],
                ['支付渠道', m.channel || '汇付天下']
            ]);
            /* 结算信息 = 开户许可相关信息（与统一进件「结算信息」对齐） */
            appendHuifuBindInfoGrid(infoHost, '结算信息', [
                ['开户许可证', m.openLicensePic ? '已上传' : '未上传'],
                ['开户许可证核准号', m.openLicenseNo],
                ['开户名', m.accountName],
                ['银行卡号', maskHuifuCardNo(m.cardNo)],
                ['开户银行', m.bankName],
                ['开户支行', m.bankBranch]
            ]);
        }

        function runLookup() {
            var no = String(input.value || '').trim();
            currentMerchant = null;
            okBtn.disabled = true;
            if (!no) {
                renderMerchantInfo(null);
                setErr('');
                return;
            }
            var found = lookupHuifuMerchantByNo(no);
            if (!found) {
                renderMerchantInfo(null);
                setErr('未查询到该汇付商户号，请核对后重试');
                return;
            }
            setErr('');
            currentMerchant = found;
            renderMerchantInfo(found);
            okBtn.disabled = false;
        }

        function scheduleLookup() {
            if (lookupTimer) clearTimeout(lookupTimer);
            lookupTimer = setTimeout(runLookup, 280);
        }

        backdrop.addEventListener('click', function (ev) {
            if (ev.target === backdrop) shut();
        });
        closeBtn.addEventListener('click', shut);
        cancelBtn.addEventListener('click', shut);
        input.addEventListener('input', scheduleLookup);
        input.addEventListener('keydown', function (ev) {
            if (ev.key === 'Enter') {
                ev.preventDefault();
                runLookup();
            }
        });
        okBtn.addEventListener('click', function () {
            if (!currentMerchant) {
                runLookup();
                if (!currentMerchant) {
                    if (typeof showToast === 'function') showToast('请先输入有效的汇付商户号', 'error');
                    return;
                }
            }
            var res = saveHuifuMerchantBind(
                opts.kind,
                opts.entityId,
                currentMerchant,
                opts.entityName
            );
            if (!res || !res.ok) {
                if (typeof showToast === 'function') {
                    showToast((res && res.message) || '绑定失败，请重试', 'error');
                }
                return;
            }
            shut();
            if (typeof showToast === 'function') {
                showToast('已关联汇付商户号 ' + currentMerchant.merchantNo, 'success');
            }
            if (typeof opts.onBound === 'function') opts.onBound(currentMerchant);
        });

        document.body.appendChild(backdrop);
        setTimeout(function () {
            input.focus();
        }, 0);
    }

    /**
     * 进件区操作栏：去进件旁「绑定商户号」（支持继续绑定多商户；解绑/设为默认在列表）
     */
    function mountHuifuBindActions(bar, opts) {
        opts = opts || {};
        var wrap = el('div', 'mdm-huifu-bind-actions');
        bar.appendChild(wrap);

        function refreshField() {
            empty(wrap);
            var bindBtn = mkBtn('绑定商户号', false, true);
            bindBtn.addEventListener('click', function () {
                openHuifuMerchantBindModal({
                    kind: opts.kind,
                    entityId: opts.entityId,
                    entityName: opts.entityName,
                    onBound: function (merchant) {
                        refreshField();
                        if (typeof opts.onChange === 'function') opts.onChange(merchant);
                    }
                });
            });
            wrap.appendChild(bindBtn);
        }
        refreshField();
        return { refresh: refreshField };
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
            type: String(pa.type || SUPPLIER_PAYMENT_AGREEMENT.type),
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
            detailCell('协议类型', info.type || SUPPLIER_PAYMENT_AGREEMENT.type || '—'),
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

    /** 汇总条：支持「标签：值」或 [label, value, actionEl?]，排版为上标签下数值（图一样式） */
    function summaryBar(spans) {
        var bar = el('div', 'store-summary-bar store-summary-bar--stats');
        (spans || []).forEach(function (t) {
            var item = el('div', 'store-summary-bar__item');
            var label = '';
            var value = '';
            var actionEl = null;
            if (Array.isArray(t)) {
                label = String(t[0] == null ? '' : t[0]);
                value = String(t[1] == null ? '—' : t[1]);
                if (t[2] && t[2].nodeType === 1) actionEl = t[2];
            } else {
                var s = String(t == null ? '' : t);
                var idx = s.indexOf('：');
                if (idx < 0) idx = s.indexOf(':');
                if (idx > 0) {
                    label = s.slice(0, idx).trim();
                    value = s.slice(idx + 1).trim() || '—';
                } else {
                    value = s || '—';
                }
            }
            if (label) item.appendChild(el('div', 'store-summary-bar__label', label));
            var valueWrap = el('div', 'store-summary-bar__value');
            if (actionEl) {
                valueWrap.classList.add('store-summary-bar__value--with-action');
                valueWrap.appendChild(el('span', 'store-summary-bar__value-text', value));
                valueWrap.appendChild(actionEl);
            } else {
                valueWrap.textContent = value;
            }
            item.appendChild(valueWrap);
            bar.appendChild(item);
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
        return buildPaginationBar({ total: 0, page: 1, pageSize: 20 });
    }

    /** 底部分页：共 N 条 / 条每页 / 页码 / 前往（对齐列表页底栏） */
    function buildPaginationBar(opts) {
        opts = opts || {};
        var total = Number(opts.total) || 0;
        var page = Math.max(1, Number(opts.page) || 1);
        var pageSize = Number(opts.pageSize) || 20;
        var onPage = typeof opts.onPage === 'function' ? opts.onPage : null;
        var onPageSize = typeof opts.onPageSize === 'function' ? opts.onPageSize : null;
        var maxPage = Math.max(1, Math.ceil(total / pageSize) || 1);
        if (page > maxPage) page = maxPage;

        var bar = el('div', 'erp-pagination store-ledger-pagination');
        bar.appendChild(el('span', 'erp-pagination__total', '共 ' + total + ' 条'));

        var mid = el('div', 'erp-pagination__mid');
        var sizeSel = document.createElement('select');
        sizeSel.className = 'erp-pagination__size';
        [10, 20, 50].forEach(function (n) {
            var o = document.createElement('option');
            o.value = String(n);
            o.textContent = n + '条/页';
            if (n === pageSize) o.selected = true;
            sizeSel.appendChild(o);
        });
        if (onPageSize) {
            sizeSel.addEventListener('change', function () {
                onPageSize(Number(sizeSel.value) || 20);
            });
        } else {
            sizeSel.disabled = true;
        }
        mid.appendChild(sizeSel);

        var pages = el('div', 'erp-pagination__pages');
        var prev = el('button', 'erp-page-btn', '‹');
        prev.type = 'button';
        prev.disabled = page <= 1;
        if (onPage) {
            prev.addEventListener('click', function () {
                if (page > 1) onPage(page - 1);
            });
        }
        pages.appendChild(prev);
        var num = el('button', 'erp-page-btn is-active', String(page));
        num.type = 'button';
        pages.appendChild(num);
        var next = el('button', 'erp-page-btn', '›');
        next.type = 'button';
        next.disabled = page >= maxPage;
        if (onPage) {
            next.addEventListener('click', function () {
                if (page < maxPage) onPage(page + 1);
            });
        }
        pages.appendChild(next);
        mid.appendChild(pages);
        bar.appendChild(mid);

        var right = el('div', 'erp-pagination__right');
        right.appendChild(el('span', 'erp-pagination__goto-label', '前往'));
        var inp = document.createElement('input');
        inp.className = 'erp-pagination__goto-input';
        inp.type = 'number';
        inp.min = '1';
        inp.max = String(maxPage);
        inp.value = String(page);
        if (onPage) {
            inp.addEventListener('change', function () {
                var v = Math.min(maxPage, Math.max(1, Number(inp.value) || 1));
                onPage(v);
            });
        } else {
            inp.disabled = true;
        }
        right.appendChild(inp);
        right.appendChild(el('span', 'erp-pagination__goto-label', '页'));
        bar.appendChild(right);
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

    /* 档案列表/详情「进件状态」：与供应商档案四态一致 */
    function archiveOnboardEnum(summary, fallback) {
        var s = summary || {};
        if (
            window.MdmSupplierArchiveUi &&
            typeof window.MdmSupplierArchiveUi.resolveOnboardingDisplay === 'function'
        ) {
            return window.MdmSupplierArchiveUi.resolveOnboardingDisplay(
                s.recordKey || '',
                fallback
            );
        }
        if (s.auditStatus === '审核成功') return '进件成功';
        if (s.auditStatus === '审核失败') return '进件失败';
        if (s.status === 'submitted' || s.auditStatus) return '进件中';
        var fb = String(fallback || '').trim();
        if (fb === '已进件' || fb === '进件成功') return '进件成功';
        if (fb === '进件失败') return '进件失败';
        if (fb === '进件中' || fb === '审核中') return '进件中';
        if (!fb || fb === '—' || fb === '-' || fb === '--') return '未进件';
        return fb;
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
            if (!s) return '';
            /* 真实地址直接用；占位文案（如「档案门头照」）用演示图 */
            if (
                /^(https?:|data:|blob:|\/|\.\/|\.\.\/)/i.test(s) ||
                /\.(png|jpe?g|gif|webp|svg)(\?|#|$)/i.test(s)
            ) {
                return s;
            }
            return demoPhoto(label || s);
        }
        if (v === true) return demoPhoto(label);
        return '';
    }

    function closePhotoLightbox() {
        document.querySelectorAll('[data-archive-photo-lightbox="1"]').forEach(function (n) {
            n.remove();
        });
    }

    /** 点击缩略图放大查看 */
    function openPhotoLightbox(src, title) {
        if (!src) return;
        closePhotoLightbox();
        var backdrop = el(
            'div',
            'erp-modal-backdrop erp-modal-backdrop--over-drawer mdm-photo-lightbox'
        );
        backdrop.setAttribute('data-archive-photo-lightbox', '1');
        var box = el('div', 'mdm-photo-lightbox__box');
        var head = el('div', 'mdm-photo-lightbox__head');
        head.appendChild(el('div', 'mdm-photo-lightbox__title', title || '查看照片'));
        var closeBtn = el('button', 'erp-modal__header-btn');
        closeBtn.type = 'button';
        closeBtn.setAttribute('aria-label', '关闭');
        closeBtn.innerHTML = '&times;';
        head.appendChild(closeBtn);
        var img = document.createElement('img');
        img.className = 'mdm-photo-lightbox__img';
        img.src = src;
        img.alt = title || '照片';
        box.appendChild(head);
        box.appendChild(img);
        backdrop.appendChild(box);
        function shut() {
            closePhotoLightbox();
        }
        backdrop.addEventListener('click', function (ev) {
            if (ev.target === backdrop) shut();
        });
        closeBtn.addEventListener('click', shut);
        document.body.appendChild(backdrop);
    }

    /** 进件信息照片字段：已上传显示缩略图，可点击放大 */
    function detailCellPhoto(label, src) {
        var c = el('div', 'supplier-detail-cell');
        c.appendChild(el('div', 'supplier-detail-cell__label', label));
        var b = el('div', 'supplier-detail-cell__body');
        var url = resolvePhotoSrc(src, label);
        if (!url) {
            b.textContent = '待上传';
        } else {
            var tile = el('button', 'mdm-onboard-photo');
            tile.type = 'button';
            tile.title = '点击放大查看';
            var img = document.createElement('img');
            img.src = url;
            img.alt = label;
            img.onerror = function () {
                tile.classList.add('mdm-onboard-photo--fallback');
                tile.textContent = '已上传';
                tile.removeAttribute('title');
                tile.onclick = null;
            };
            tile.appendChild(img);
            tile.addEventListener('click', function () {
                openPhotoLightbox(url, label);
            });
            b.appendChild(tile);
        }
        c.appendChild(b);
        return c;
    }

    /**
     * 档案基础信息场地照：待上传可点上传；已上传可预览并重新上传（不回写进件成功后的进件照）
     * @param {{ kind: string, entityId: string, entityName?: string, fieldKey: string }} opts
     */
    function detailCellArchiveVenuePhoto(label, src, opts) {
        opts = opts || {};
        var kind = opts.kind || '';
        var entityId = opts.entityId || '';
        var entityName = opts.entityName || '';
        var fieldKey = opts.fieldKey || '';
        var c = el('div', 'supplier-detail-cell');
        c.appendChild(el('div', 'supplier-detail-cell__label', label));
        var b = el('div', 'supplier-detail-cell__body');
        var currentSrc = src;

        function persist(nextVal) {
            if (
                !window.MdmResourceArchiveForms ||
                typeof window.MdmResourceArchiveForms.writeVenuePhotos !== 'function'
            ) {
                return;
            }
            var patch = {};
            patch[fieldKey] = nextVal;
            if (entityId) {
                window.MdmResourceArchiveForms.writeVenuePhotos(kind, entityId, patch);
            }
            if (entityName) {
                window.MdmResourceArchiveForms.writeVenuePhotos(kind, 'name:' + entityName, patch);
            }
        }

        function render() {
            b.innerHTML = '';
            var url = resolvePhotoSrc(currentSrc, label);
            if (!url) {
                var pending = el('div', 'mdm-archive-venue-upload');
                pending.appendChild(el('span', 'mdm-archive-venue-upload__status', '待上传'));
                var upBtn = mkBtn('上传', true);
                upBtn.addEventListener('click', function () {
                    currentSrc = '已上传';
                    persist(currentSrc);
                    if (typeof showToast === 'function') {
                        showToast('已上传' + label + '（演示）', 'success');
                    }
                    render();
                });
                pending.appendChild(upBtn);
                b.appendChild(pending);
                return;
            }
            var row = el('div', 'mdm-archive-venue-upload mdm-archive-venue-upload--done');
            var tile = el('button', 'mdm-onboard-photo');
            tile.type = 'button';
            tile.title = '点击放大查看';
            var img = document.createElement('img');
            img.src = url;
            img.alt = label;
            img.onerror = function () {
                tile.classList.add('mdm-onboard-photo--fallback');
                tile.textContent = '已上传';
                tile.removeAttribute('title');
                tile.onclick = null;
            };
            tile.appendChild(img);
            tile.addEventListener('click', function () {
                openPhotoLightbox(url, label);
            });
            row.appendChild(tile);
            var reBtn = mkBtn('重新上传', false);
            reBtn.addEventListener('click', function () {
                currentSrc = '已上传';
                persist(currentSrc);
                if (typeof showToast === 'function') {
                    showToast('已重新上传' + label + '（演示）', 'success');
                }
                render();
            });
            row.appendChild(reBtn);
            b.appendChild(row);
        }

        render();
        c.appendChild(b);
        return c;
    }

    function appendArchiveVenuePhotoCells(grid, kind, entityId, entityName) {
        var venue = readArchiveVenuePhotos(kind, entityId, entityName);
        var specs = [
            { key: 'store_header_pic', label: '门头/场地照' },
            { key: 'store_indoor_pic', label: '内景/工作区域照' },
            { key: 'store_cashier_desk_pic', label: '收银台/前台照' }
        ];
        specs.forEach(function (spec) {
            grid.appendChild(
                detailCellArchiveVenuePhoto(spec.label, venue[spec.key], {
                    kind: kind,
                    entityId: entityId,
                    entityName: entityName,
                    fieldKey: spec.key
                })
            );
        });
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
        function appendSection(title, rows) {
            body.appendChild(sectionTitle(title));
            var grid = el('div', 'supplier-detail-grid');
            rows.forEach(function (it) {
                if (it[2] === 'image') {
                    grid.appendChild(detailCellPhoto(it[0], it[1]));
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
        extraOpts = extraOpts || {};
        var kind = resolveOnboardingKind(title, extraOpts);
        var modalOpts = {
            title: title,
            merchantShortNameDefault: shortName || '',
            fieldDefaults: defaults || {},
            recordKey: recordKey,
            variant: 'resource',
            onboardingKind: kind,
            forceView: !!extraOpts.forceView
        };
        modalOpts.onRecordChange = function (payload) {
            syncVenuePhotosIfOnboardingOpen(recordKey, payload);
            if (kind === 'supplier' && extraOpts.supplierId) {
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
            }
            if (payload && payload.status === 'submitted') {
                var parsed = parseArchiveOnboardKey(recordKey);
                if (parsed) {
                    var fields = payload.fields || {};
                    var card = fields.card_info || {};
                    registerAutonomousHuifuMerchant(parsed.kind, parsed.entityId, {
                        merchantName: shortName || '',
                        shortName: fields.short_name || shortName || '',
                        contactMobile: fields.contact_mobile_no || '',
                        status: '进件中',
                        entityName: shortName || '',
                        accountName: card.account_name || '',
                        cardNo: card.card_no || '',
                        bankName: card.bank_name || '',
                        bankBranch: card.bank_branch || ''
                    });
                }
            }
            if (typeof extraOpts.onChange === 'function') extraOpts.onChange(payload);
        };
        window.MdmUnifiedOnboardingUi.openModal(modalOpts);
    }

    function openOnboardStore(shortName, defaults, recordKey, extraOpts) {
        if (
            window.MdmUnifiedOnboardingUi &&
            typeof window.MdmUnifiedOnboardingUi.openModal === 'function'
        ) {
            extraOpts = extraOpts || {};
            window.MdmUnifiedOnboardingUi.openModal({
                title: '门店进件',
                merchantShortNameDefault: shortName || '',
                fieldDefaults: defaults || {},
                recordKey: recordKey,
                variant: 'store',
                forceView: !!extraOpts.forceView,
                onRecordChange: function (payload) {
                    syncVenuePhotosIfOnboardingOpen(recordKey, payload);
                    if (payload && payload.status === 'submitted') {
                        var parsed = parseArchiveOnboardKey(recordKey);
                        if (parsed) {
                            var fields = payload.fields || {};
                            var card = fields.card_info || {};
                            registerAutonomousHuifuMerchant(parsed.kind, parsed.entityId, {
                                merchantName: shortName || '',
                                shortName: fields.short_name || shortName || '',
                                contactMobile: fields.contact_mobile_no || '',
                                status: '进件中',
                                entityName: shortName || '',
                                accountName: card.account_name || '',
                                cardNo: card.card_no || '',
                                bankName: card.bank_name || '',
                                bankBranch: card.bank_branch || ''
                            });
                        }
                    }
                    if (typeof extraOpts.onChange === 'function') extraOpts.onChange(payload);
                }
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
        '是否默认',
        '结算主体',
        '联系人手机号',
        '商户号来源',
        '操作时间',
        '操作'
    ];

    /** 档案基础信息场地照（进件成功前可与进件互相同步） */
    function readArchiveVenuePhotos(kind, entityId, entityName) {
        var empty = {
            store_header_pic: '',
            store_indoor_pic: '',
            store_cashier_desk_pic: ''
        };
        if (
            !window.MdmResourceArchiveForms ||
            typeof window.MdmResourceArchiveForms.readVenuePhotos !== 'function'
        ) {
            return empty;
        }
        var byId = window.MdmResourceArchiveForms.readVenuePhotos(kind, entityId) || empty;
        if (
            (byId.store_header_pic || byId.store_indoor_pic || byId.store_cashier_desk_pic) &&
            entityId
        ) {
            return byId;
        }
        if (!entityName) return byId;
        var byName =
            window.MdmResourceArchiveForms.readVenuePhotos(kind, 'name:' + entityName) || empty;
        return {
            store_header_pic: byId.store_header_pic || byName.store_header_pic || '',
            store_indoor_pic: byId.store_indoor_pic || byName.store_indoor_pic || '',
            store_cashier_desk_pic:
                byId.store_cashier_desk_pic || byName.store_cashier_desk_pic || ''
        };
    }

    function isOnboardingAuditSuccess(summary, fallbackStatus) {
        if (summary && summary.auditStatus === '审核成功') return true;
        var st = archiveOnboardEnum(summary || {}, fallbackStatus || '');
        return st === '进件成功';
    }

    /** 进件成功前：场地照回写档案基础信息；成功后隔离，不再回传 */
    function syncVenuePhotosIfOnboardingOpen(recordKey, payload) {
        if (!payload || !payload.fields) return;
        if (payload.auditStatus === '审核成功') return;
        var parsed = parseArchiveOnboardKey(recordKey);
        if (!parsed) return;
        if (
            window.MdmResourceArchiveForms &&
            typeof window.MdmResourceArchiveForms.syncVenuePhotosFromOnboarding === 'function'
        ) {
            window.MdmResourceArchiveForms.syncVenuePhotosFromOnboarding(
                parsed.kind,
                parsed.entityId,
                payload.fields
            );
        }
    }

    function storeOnboardingDefaults(store) {
        var venue = readArchiveVenuePhotos('store', store && store.storeId, store && store.name);
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
            store_header_pic: venue.store_header_pic || '',
            store_indoor_pic: venue.store_indoor_pic || '',
            store_cashier_desk_pic: venue.store_cashier_desk_pic || ''
        };
    }

    function resourceOnboardingDefaults(name, detailAddr, phone, entityId, kind) {
        var venue = { store_header_pic: '', store_indoor_pic: '', store_cashier_desk_pic: '' };
        if (kind === 'store' || kind === 'supplier') {
            venue = readArchiveVenuePhotos(kind, entityId, name);
        }
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
            store_header_pic: venue.store_header_pic || '',
            store_indoor_pic: venue.store_indoor_pic || '',
            store_cashier_desk_pic: venue.store_cashier_desk_pic || ''
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

    function firstMissingOnboardingField(fields, kind) {
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
            { key: 'open_license_pic', label: '开户许可证' }
            /* 内景/收银台为选填；门头/场地照仅门店进件必填 */
        ];
        if (kind === 'store') {
            checks.push({ key: 'store_header_pic', label: '门头/场地照(F22)' });
        }
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

    function parseArchiveOnboardKey(recordKey) {
        var parts = String(recordKey || '').split('::');
        if (parts.length < 3 || parts[0] !== 'archive') return null;
        if (parts[1] !== 'store' && parts[1] !== 'supplier') return null;
        return { kind: parts[1], entityId: parts.slice(2).join('::') };
    }

    /** 自主进件提交后写入多商户列表（每次提交生成新商户号，支持再次进件） */
    function registerAutonomousHuifuMerchant(kind, entityId, info) {
        info = info || {};
        if (!kind || !entityId) return { ok: false };
        var autoNo = 'HF' + String(Date.now()).slice(-12);
        return upsertHuifuMerchant(
            kind,
            entityId,
            {
                merchantNo: autoNo,
                merchantName: info.merchantName || info.shortName || '',
                shortName: info.shortName || '',
                contactMobile: info.contactMobile || '',
                status: info.status || '进件中',
                source: '自主进件',
                accountName: info.accountName || '',
                cardNo: info.cardNo || '',
                bankName: info.bankName || '',
                bankBranch: info.bankBranch || ''
            },
            info.entityName || info.merchantName || ''
        );
    }

    /**
     * 列表/提交共用：校验进件必填完整性（失败 toast，通过返回 fields）
     * @returns {{ ok: boolean, fields?: object }}
     */
    function validateOnboardingRecordReady(meta) {
        var ui = window.MdmUnifiedOnboardingUi;
        if (!ui || typeof ui.getRecord !== 'function') {
            if (typeof showToast === 'function') showToast('进件模块未加载', 'error');
            return { ok: false };
        }
        var recordKey = meta.recordKey;
        var fallbackDefaults = cloneObj(meta.defaults || {});
        var summary = getOnboardingSummary(recordKey, fallbackDefaults);
        var fields = summary.fields || fallbackDefaults;
        var missingKind =
            meta.title === '门店进件' ? 'store'
            : meta.title === '供应商进件' ? 'supplier'
            : meta.kind || '';
        var missing = firstMissingOnboardingField(fields, missingKind);
        if (missing) {
            if (typeof showToast === 'function') showToast('请先完善：' + missing, 'error');
            return { ok: false };
        }
        if (meta.title === '供应商进件') {
            var agreementInfo = resolvePaymentAgreementInfo(fields);
            if (!agreementInfo.signed) {
                if (typeof showToast === 'function') {
                    showToast('请先阅读并勾选《斗拱平台综合支付服务协议》', 'error');
                }
                return { ok: false };
            }
        }
        return { ok: true, fields: fields };
    }

    function submitOnboardingRecord(meta) {
        var ui = window.MdmUnifiedOnboardingUi;
        if (!ui || typeof ui.upsertRecord !== 'function' || typeof ui.getRecord !== 'function') {
            if (typeof showToast === 'function') showToast('进件模块未加载', 'error');
            return false;
        }
        var checked = validateOnboardingRecordReady(meta);
        if (!checked.ok) return false;
        var fields = checked.fields || {};
        var recordKey = meta.recordKey;
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
        var parsed = parseArchiveOnboardKey(recordKey);
        if (parsed) {
            var card = (fields && fields.card_info) || {};
            registerAutonomousHuifuMerchant(parsed.kind, parsed.entityId, {
                merchantName: meta.merchantName || meta.shortName || '',
                shortName: (fields && fields.short_name) || meta.shortName || '',
                contactMobile: (fields && fields.contact_mobile_no) || meta.contactMobile || '',
                status: '进件中',
                entityName: meta.merchantName || meta.shortName || '',
                accountName: card.account_name || '',
                cardNo: card.card_no || '',
                bankName: card.bank_name || '',
                bankBranch: card.bank_branch || ''
            });
        }
        if (typeof showToast === 'function') showToast('已提交上级审核', 'success');
        return true;
    }

    /**
     * 列表「查看」用：对齐详情页「进件信息」字段；用绑定商户/汇付目录补全空值
     */
    function buildOnboardViewFields(meta) {
        var m = meta || {};
        var summary = getOnboardingSummary(m.recordKey, m.defaults || {});
        var fields = cloneObj(summary.fields || m.defaults || {}) || {};
        var no = String(m.huifuMerchantNo || '').trim();
        var packItem = null;
        if (m.bindKind && m.bindEntityId && no && no !== '—') {
            packItem =
                listHuifuMerchants(m.bindKind, m.bindEntityId).find(function (it) {
                    return it.merchantNo === no;
                }) || null;
        }
        var looked = no && no !== '—' ? lookupHuifuMerchantByNo(no) : null;
        var src = Object.assign({}, looked || {}, packItem || {});
        if (!fields.short_name) {
            fields.short_name = src.shortName || m.shortName || m.merchantName || '';
        }
        if (!fields.receipt_name) fields.receipt_name = fields.short_name || '';
        if (!fields.contact_mobile_no) {
            fields.contact_mobile_no = src.contactMobile || m.contactMobile || '';
        }
        if (!fields.legal_mobile_no && src.contactMobile) {
            fields.legal_mobile_no = src.contactMobile;
        }
        fields.card_info = fields.card_info || {};
        if (!fields.card_info.account_name && src.accountName) {
            fields.card_info.account_name = src.accountName;
        }
        if (!fields.card_info.card_no && src.cardNo) fields.card_info.card_no = src.cardNo;
        if (!fields.card_info.bank_name && src.bankName) fields.card_info.bank_name = src.bankName;
        if (!fields.card_info.bank_branch && src.bankBranch) {
            fields.card_info.bank_branch = src.bankBranch;
        }
        if (!fields.open_license_pic && src.openLicensePic) fields.open_license_pic = true;
        fields.license_info = fields.license_info || {};
        if (!fields.license_info.code && src.licenseCode) {
            fields.license_info.code = src.licenseCode;
        }
        if (!fields.license_info.name && src.merchantName) {
            fields.license_info.name = src.merchantName;
        }
        fields.legal_info = fields.legal_info || {};
        if (!fields.legal_info.legal_name && src.legalName) {
            fields.legal_info.legal_name = src.legalName;
        }
        var payStatus = '—';
        var st = src.status || '';
        if (st === '进件成功') payStatus = '已开通';
        else if (m.merchantNoSource === '已有商户号' && no && no !== '—') payStatus = '已开通';
        var onboardStatus = archiveOnboardEnum(
            Object.assign({}, summary, { recordKey: m.recordKey }),
            onboardStatusText(m.onboardStatus)
        );
        if (st === '进件成功') onboardStatus = '进件成功';
        else if (st === '进件中') onboardStatus = '进件中';
        return {
            fields: fields,
            merchantNo: no && no !== '—' ? no : '—',
            shortName: fields.short_name || m.shortName || m.merchantName || '—',
            payStatus: payStatus,
            onboardStatus: onboardStatus
        };
    }

    function resolveOnboardViewKind(meta) {
        var m = meta || {};
        if (m.bindKind === 'store' || m.title === '门店进件' || m.subjectType === '门店') {
            return 'store';
        }
        if (m.bindKind === 'supplier' || m.title === '供应商进件' || m.subjectType === '供应商') {
            return 'supplier';
        }
        return 'store';
    }

    /** 进件列表「查看」：字段与详情页「进件信息」一致 */
    function openOnboardListViewModal(meta) {
        var m = meta || {};
        var kind = resolveOnboardViewKind(m);
        var view = buildOnboardViewFields(m);
        document.querySelectorAll('[data-archive-onboard-view="1"]').forEach(function (n) {
            n.remove();
        });
        var backdrop = el(
            'div',
            'erp-modal-backdrop erp-modal-backdrop--over-drawer'
        );
        backdrop.setAttribute('data-archive-onboard-view', '1');

        var modal = el('div', 'erp-modal erp-modal--store-wide');
        var header = el('div', 'erp-modal__header');
        header.appendChild(el('h2', 'erp-modal__title', '进件信息'));
        var acts = el('div', 'erp-modal__header-actions');
        var closeBtn = el('button', 'erp-modal__header-btn');
        closeBtn.type = 'button';
        closeBtn.setAttribute('aria-label', '关闭');
        closeBtn.innerHTML = '&times;';
        acts.appendChild(closeBtn);
        header.appendChild(acts);

        var body = el('div', 'erp-modal__body');
        var grid = el('div', 'supplier-detail-grid');
        var viewFields = view.fields;
        if (kind === 'supplier') {
            viewFields = ensureSupplierOnboardingFieldsForDisplay(viewFields, {
                onboard: view.onboardStatus || m.onboardStatus,
                shortName: view.shortName || m.shortName,
                name: m.merchantName || view.shortName,
                detailAddress: (m.defaults && m.defaults.detail_addr) || '',
                phone: m.contactMobile || '',
                contactName: ''
            });
        }
        onboardingDetailCells(viewFields, kind, {
            shortName: view.shortName,
            merchantNo: view.merchantNo,
            payStatus: view.payStatus,
            onboardStatus: view.onboardStatus,
            hideVenuePhotos: kind === 'supplier' ? false : undefined
        }).forEach(function (cell) {
            grid.appendChild(cell);
        });
        body.appendChild(grid);

        var footer = el('div', 'erp-modal__footer');
        var okBtn = mkBtn('关闭', true);
        footer.appendChild(okBtn);

        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);
        backdrop.appendChild(modal);

        function shut() {
            backdrop.remove();
        }
        backdrop.addEventListener('click', function (ev) {
            if (ev.target === backdrop) shut();
        });
        closeBtn.addEventListener('click', shut);
        okBtn.addEventListener('click', shut);
        document.body.appendChild(backdrop);
    }

    function appendSetDefaultAction(wrap, opBtn, meta, refresh) {
        var m = meta || {};
        var no = String(m.huifuMerchantNo || '').trim();
        if (!m.bindKind || !m.bindEntityId || !no || no === '—') return;
        if (m.isDefault) return;
        if (!m.multiMerchant) return;
        wrap.appendChild(
            opBtn('设为默认', function () {
                var check = canSwitchHuifuDefault(m.bindKind, m.bindEntityId, m.huifuMerchantNo);
                if (!check.ok) {
                    if (typeof showToast === 'function') {
                        showToast(check.message || '暂不支持切换默认商户', 'error');
                    }
                    return;
                }
                openWarmConfirmModal(
                    '确认将「' + m.huifuMerchantNo + '」设为默认商户？',
                    function () {
                        var seed =
                            m.merchantNoSource === '自主进件'
                                ? {
                                      merchantNo: m.huifuMerchantNo,
                                      merchantName: m.merchantName,
                                      shortName: m.shortName,
                                      contactMobile: m.contactMobile,
                                      status: '进件成功',
                                      source: '自主进件'
                                  }
                                : null;
                        var res = setDefaultHuifuMerchant(
                            m.bindKind,
                            m.bindEntityId,
                            m.huifuMerchantNo,
                            seed
                        );
                        if (!res || !res.ok) {
                            if (typeof showToast === 'function') {
                                showToast((res && res.message) || '设置失败', 'error');
                            }
                            return;
                        }
                        if (typeof showToast === 'function') showToast('已设为默认商户', 'success');
                        if (typeof refresh === 'function') refresh();
                    },
                    { title: '设为默认商户', okText: '确认' }
                );
            })
        );
    }

    function makeOnboardActionCell(meta, refresh) {
        var m = meta || {};
        var wrap = el('div', 'action-links');
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

        /* 所有来源均支持「查看」当前行进件信息（弹窗） */
        wrap.appendChild(
            opBtn('查看', function () {
                openOnboardListViewModal(m);
            })
        );

        /*
         * 解绑规则：仅「已有商户号」可解绑；「自主进件」不可解绑（不展示解绑）
         * 已有商户号：查看 / 解绑 /（多商户非默认）设为默认
         */
        if (m.merchantNoSource === '已有商户号') {
            wrap.appendChild(
                opBtn('解绑', function () {
                    var merchantNo = m.huifuMerchantNo || '';
                    openWarmConfirmModal(
                        '确认解绑商户号「' + (merchantNo || '—') + '」？',
                        function () {
                            if (m.bindKind && m.bindEntityId) {
                                removeHuifuMerchantBind(m.bindKind, m.bindEntityId, merchantNo);
                            }
                            if (typeof showToast === 'function') showToast('已解绑商户号', 'success');
                            if (typeof refresh === 'function') refresh();
                        },
                        { title: '解绑商户号', okText: '确认解绑' }
                    );
                })
            );
            appendSetDefaultAction(wrap, opBtn, m, refresh);
            return { node: wrap };
        }

        /* 自主进件：查看 + 原进件操作；不可解绑；多商户非默认可设为默认 */
        var status = m.onboardStatus;
        var editable =
            status !== 'submitted' &&
            status !== '待BD审核' &&
            status !== '待总监审核' &&
            status !== '待财务审核' &&
            status !== '待汇付审核' &&
            status !== '审核成功';
        var submitLabel = status === '审核失败' || status === 'rejected' ? '重新提交' : '提交进件';
        if (editable) {
            wrap.appendChild(
                opBtn('删除', function () {
                    /* 进件信息列表：删除需二次确认 */
                    openWarmConfirmModal(
                        '确认删除该进件草稿？删除后不可恢复。',
                        function () {
                            if (
                                window.MdmUnifiedOnboardingUi &&
                                typeof window.MdmUnifiedOnboardingUi.removeRecord === 'function'
                            ) {
                                window.MdmUnifiedOnboardingUi.removeRecord(m.recordKey);
                                if (typeof showToast === 'function') {
                                    showToast('已删除进件草稿', 'success');
                                }
                                refresh();
                            }
                        },
                        { title: '删除进件', okText: '确认删除' }
                    );
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
                    /* 列表：先校验必填完整性，通过后再二次确认 */
                    if (!validateOnboardingRecordReady(m).ok) return;
                    openWarmConfirmModal(
                        '确认提交进件？提交后将进入审核。',
                        function () {
                            if (submitOnboardingRecord(m)) refresh();
                        },
                        { title: '提交进件', okText: '确认提交' }
                    );
                })
            );
        }
        appendSetDefaultAction(wrap, opBtn, m, refresh);
        return { node: wrap };
    }

    function buildOnboardListRow(meta, refresh) {
        var m = meta || {};
        var source = m.merchantNoSource || '自主进件';
        var defaultText = m.isDefault ? '是' : '否';
        return [
            nz(m.merchantName),
            nz(m.subjectType),
            nz(m.groupName),
            onboardStatusText(m.onboardStatus),
            nz(m.huifuMerchantNo),
            nz(defaultText),
            nz(m.settlementSubject),
            nz(m.contactMobile),
            nz(source),
            nz(m.submitTime),
            makeOnboardActionCell(m, refresh)
        ];
    }

    /**
     * 组装进件列表行：多商户包；尚无记录时展示一条自主进件占位行
     */
    function buildEntityOnboardListRows(opts, refresh) {
        opts = opts || {};
        var kind = opts.kind;
        var entityId = opts.entityId;
        var bound = listHuifuMerchants(kind, entityId);
        var items = bound.map(function (bm) {
            var st = bm.status || '';
            var onboardStatus = opts.onboardStatus;
            if (st === '进件成功') onboardStatus = '审核成功';
            else if (st === '进件中') onboardStatus = 'submitted';
            return {
                merchantNo: bm.merchantNo,
                contactMobile: bm.contactMobile || opts.contactMobile,
                source: bm.source || '已有商户号',
                isDefault: !!bm.isDefault,
                onboardStatus: onboardStatus,
                submitTime: bm.boundAt ? formatTs(bm.boundAt) : opts.submitTime
            };
        });
        if (!items.length) {
            items.push({
                merchantNo: String(opts.fallbackMerchantNo || '').trim() || '—',
                contactMobile: opts.contactMobile,
                source: '自主进件',
                isDefault: true,
                onboardStatus: opts.onboardStatus,
                submitTime: opts.submitTime
            });
        }
        var multi = items.length > 1;
        var refreshAll = function () {
            if (typeof refresh === 'function') refresh();
        };
        return items.map(function (it) {
            return buildOnboardListRow(
                {
                    merchantName: opts.merchantName,
                    subjectType: opts.subjectType,
                    groupName: opts.groupName,
                    onboardStatus: it.onboardStatus,
                    huifuMerchantNo: it.merchantNo,
                    isDefault: !!it.isDefault,
                    multiMerchant: multi,
                    settlementSubject: opts.settlementSubject,
                    contactMobile: it.contactMobile,
                    merchantNoSource: it.source,
                    bindKind: kind,
                    bindEntityId: entityId,
                    submitTime: it.submitTime,
                    recordKey: opts.recordKey,
                    defaults: opts.defaults,
                    title: opts.title,
                    shortName: opts.shortName,
                    openModal: opts.openModal
                },
                refreshAll
            );
        });
    }

    /**
     * 进件信息字段（门店 / 供应商档案对齐）
     * 与统一进件表单 collectFields 对齐：执照/法人/商户/结算/场地照/协议；现有字段保留并补齐拆分项
     * @param {object} fields
     * @param {string} [kind] store | supplier
     * @param {object} [meta] { shortName, merchantNo, payStatus, onboardStatus, hideVenuePhotos }
     */
    function onboardingDetailCells(fields, kind, meta) {
        var f = fields || {};
        var m = meta || {};
        var card = f.card_info || {};
        var lic = f.license_info || {};
        var legal = f.legal_info || {};
        var shortName = f.short_name || m.shortName || '—';
        var merchantNo = m.merchantNo != null && m.merchantNo !== '' ? m.merchantNo : '—';
        var payStatus = m.payStatus != null && m.payStatus !== '' ? m.payStatus : '—';
        var onboardStatus =
            m.onboardStatus != null && m.onboardStatus !== '' ? m.onboardStatus : '未进件';
        var cells = [
            detailCell('商户简称', shortName),
            detailCell('汇付商户号', merchantNo),
            detailCell('余额支付开通', payStatus),
            detailCell('进件状态', onboardStatus),
            detailCell('小票名称', f.receipt_name || '—'),
            detailCell('实际经营地址', f.detail_addr || '—'),
            detailCell('法人手机号', f.legal_mobile_no || '—'),
            detailCell('管理员手机号', f.contact_mobile_no || '—'),
            detailCell('管理员邮箱', f.contact_email || '—'),
            detailCell('银行卡信息配置', cardInfoText(card)),
            detailCellPhoto('营业执照(F07)', f.license_pic),
            detailCell('营业执照名称', lic.name || '—'),
            detailCell('证件代码', lic.code || '—'),
            detailCell('执照起始日期', lic.start_date || '—'),
            detailCell('执照有效期', lic.valid_date || '—'),
            detailCell('注册地址', lic.address || '—'),
            detailCellPhoto('法人身份证人像面(F02)', f.legal_cert_front_pic),
            detailCellPhoto('法人身份证国徽面(F03)', f.legal_cert_back_pic),
            detailCell('法人姓名', legal.legal_name || '—'),
            detailCell('身份证号', legal.id_no || '—'),
            detailCell('身份证起始日期', legal.id_start_date || '—'),
            detailCell('身份证有效期', legal.id_valid_date || '—'),
            detailCellPhoto('开户许可证', f.open_license_pic),
            /* 与进件结算 OCR 字段对齐（保留上方「银行卡信息配置」合成项） */
            detailCell('开户名', card.account_name || '—'),
            detailCell('银行卡号', card.card_no || '—'),
            detailCell('开户银行', card.bank_name || '—'),
            detailCell('开户支行', card.bank_branch || '—')
        ];
        /*
         * 场地三照：供应商进件信息始终展示（对齐进件表单）；
         * 门店在进件成功后可由 hideVenuePhotos 隐藏（改到基础信息）
         */
        var showVenuePhotos = kind === 'supplier' || !m.hideVenuePhotos;
        if (showVenuePhotos) {
            cells = cells.concat([
                detailCellPhoto('门头/场地照(F22)', f.store_header_pic),
                detailCellPhoto('内景/工作区域照(F24)', f.store_indoor_pic),
                detailCellPhoto('收银台/前台照(F105)', f.store_cashier_desk_pic)
            ]);
        }
        /* 门店 / 供应商进件信息统一展示签订协议 */
        if (kind === 'store' || kind === 'supplier') {
            cells = cells.concat(paymentAgreementDetailCells(f));
        }
        return cells;
    }

    function rowToStore(tr) {
        var c = tr.querySelectorAll('td');
        if (c.length < 21) return null;
        var name = cellPlain(c[2]);
        var partner = cellPlain(c[3]);
        var isFP = partner === '加盟店' || partner === '合作店';
        var isPeer = partner === '同行店';
        var settleType = cellPlain(c[16]);
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
            balancePay: cellPlain(c[15]),
            settleType: settleType,
            settleCycle: cellPlain(c[17]),
            splitService: cellPlain(c[18]),
            storeStatus: cellStatus(c[19]),
            createTime: cellPlain(c[20]),
            onboardChannelGuess: settleType !== '—' ? '支付宝/微信（演示）' : '—',
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
        else if (st === '已禁用' || st === '停用') tags.push({ kind: 'gray', label: '已禁用' });
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
        grid.appendChild(detailCell('进件状态', archiveOnboardEnum({}, store.onboardStatus)));
        grid.appendChild(detailCell('余额支付', store.balancePay));

        grid.appendChild(detailCell('结算类型', store.settleType));
        grid.appendChild(detailCell('结算周期', store.settleCycle));
        grid.appendChild(detailCell('分账服务', store.splitService));
        grid.appendChild(detailCellTagged('门店状态', store.storeStatus, true));
        grid.appendChild(detailCell('可提现手机号', store.withdrawPhone));

        appendArchiveVenuePhotoCells(grid, 'store', store.storeId, store.name);

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

    function storeHuifuAccountMeta(store) {
        /* 与供应商进件信息一致：优先绑定商户号，余额支付取列表口径 */
        var bind = getHuifuMerchantBind('store', store && store.storeId);
        if (bind && bind.merchantNo) {
            return {
                merchantNo: bind.merchantNo,
                payStatus:
                    bind.status === '进件成功'
                        ? '已开通'
                        : store && store.balancePay
                          ? store.balancePay
                          : '—',
                bound: true
            };
        }
        var id = store && store.storeId ? String(store.storeId).replace(/\s+/g, '') : '';
        var pay = store && store.balancePay != null ? String(store.balancePay).trim() : '';
        if (!pay || pay === '—' || pay === '-') pay = '未开通';
        var snap =
            window.StoreWalletDemo && typeof window.StoreWalletDemo.snapshot === 'function'
                ? window.StoreWalletDemo.snapshot()
                : null;
        return {
            merchantNo: (snap && snap.merchantNo) || (id ? 'HF-' + id : '—'),
            payStatus: pay,
            bound: false
        };
    }

    function panelStoreOnboarding(store) {
        var p = el('div', 'supplier-detail-tab');
        var recordKey = onboardRecordKey('store', store.storeId);
        var onboardingDefaults = storeOnboardingDefaults(store);

        p.appendChild(sectionTitle('进件信息'));
        var onboardingGrid = el('div', 'supplier-detail-grid');
        function renderOnboardingInfo() {
            var huifuMeta = storeHuifuAccountMeta(store);
            onboardingGrid.innerHTML = '';
            var onboardingSummary = getOnboardingSummary(recordKey, onboardingDefaults);
            onboardingSummary.recordKey = recordKey;
            onboardingDetailCells(onboardingSummary.fields, 'store', {
                shortName: store.shortName && store.shortName !== '—' ? store.shortName : store.name,
                merchantNo: huifuMeta.merchantNo,
                payStatus: huifuMeta.payStatus,
                onboardStatus: archiveOnboardEnum(onboardingSummary, store.onboardStatus),
                hideVenuePhotos: isOnboardingAuditSuccess(
                    onboardingSummary,
                    store.onboardStatus
                )
            }).forEach(function (cell) {
                onboardingGrid.appendChild(cell);
            });
        }
        renderOnboardingInfo();
        p.appendChild(onboardingGrid);

        p.appendChild(sectionTitle('商户进件'));
        var onboardBlock = el('div', 'store-onboard-section store-onboard-section--white');
        var bar = el('div', 'erp-actions-row supplier-detail-onboard-actions');
        var bindActions = null;
        function refreshList() {
            renderOnboardingInfo();
            renderOnboardingTable();
            if (bindActions && typeof bindActions.refresh === 'function') bindActions.refresh();
        }
        var go = mkBtn('去进件', true);
        go.addEventListener('click', function () {
            openOnboardStore(
                store.name,
                storeOnboardingDefaults(store),
                recordKey,
                {
                    onChange: refreshList
                }
            );
        });
        bar.appendChild(go);
        bindActions = mountHuifuBindActions(bar, {
            kind: 'store',
            entityId: store.storeId,
            entityName: store.name,
            onChange: refreshList
        });
        onboardBlock.appendChild(bar);
        var tableWrap = el('div');
        function renderOnboardingTable() {
            var huifuMeta = storeHuifuAccountMeta(store);
            var onboardingSummary = getOnboardingSummary(recordKey, onboardingDefaults);
            tableWrap.innerHTML = '';
            tableWrap.appendChild(
                dataTable(
                    ONBOARD_LIST_HEADERS,
                    buildEntityOnboardListRows(
                        {
                            kind: 'store',
                            entityId: store.storeId,
                            merchantName: store.name,
                            subjectType: '门店',
                            groupName: store.subjectName,
                            onboardStatus: onboardingSummary.auditStatus || onboardingSummary.status,
                            fallbackMerchantNo: huifuMeta.merchantNo,
                            settlementSubject: store.settleType,
                            contactMobile: store.phone,
                            submitTime: formatTs(onboardingSummary.submittedAt),
                            recordKey: recordKey,
                            defaults: onboardingDefaults,
                            title: '门店进件',
                            shortName: store.name,
                            openModal: function (forceView) {
                                openOnboardStore(store.name, storeOnboardingDefaults(store), recordKey, {
                                    forceView: !!forceView,
                                    onChange: refreshList
                                });
                            }
                        },
                        refreshList
                    )
                )
            );
        }
        renderOnboardingTable();
        onboardBlock.appendChild(tableWrap);
        onboardBlock.appendChild(
            el(
                'p',
                'erp-page__note mdm-detail-note',
                '无论是否已有汇付商户号，均可再次「去进件」或「绑定商户号」。进件审核流程：门店 → BD → 财务 → 汇付（审核操作在审核中心，MDM仅发起与保存）。'
            )
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

    /**
     * 门店档案 · 佣金明细（经营中心清分/分佣数据转 PC 档案展示）
     * 结算规则：用户支付后即生成清分（门店明细）；结算未配置门店佣金比例则不生成
     * 数据源：StoreAppBizOrders.listStoreClearing + 钱包可提现余额
     */
    function panelStoreCommission(store) {
        var root = el('div', 'supplier-detail-tab');
        var biz = window.StoreAppBizOrders;
        var orders =
            biz && typeof biz.listStoreClearing === 'function'
                ? biz.listStoreClearing()
                : ((biz && biz.list) || []).filter(function (o) {
                      return biz && typeof biz.hasStoreClearing === 'function'
                          ? biz.hasStoreClearing(o)
                          : Number(o.commission) > 0;
                  });
        var money =
            window.StoreWalletDemo && typeof window.StoreWalletDemo.money === 'function'
                ? window.StoreWalletDemo.money
                : function (n) {
                      return '¥' + Number(n || 0).toFixed(2);
                  };
        var moneyPlain = function (n) {
            return Number(n || 0).toFixed(2);
        };
        var snap =
            window.StoreWalletDemo && typeof window.StoreWalletDemo.snapshot === 'function'
                ? window.StoreWalletDemo.snapshot()
                : null;
        var withdrawable = snap ? snap.withdrawable : 0;

        /* 与经营中心演示汇总对齐；时段金额按订单 dayKey 推算 */
        var DEMO_TODAY = '2026-08-03';
        function parseDay(str) {
            var m = String(str || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (!m) return null;
            return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
        }
        function dayKeyOf(o) {
            return o.dayKey || o.date || '';
        }
        function sumCommission(list) {
            var amt = 0;
            var cnt = 0;
            (list || []).forEach(function (o) {
                amt += Number(o.commission) || 0;
                cnt += 1;
            });
            return { amt: amt, cnt: cnt };
        }
        var totalSum = sumCommission(orders);
        var todayD = parseDay(DEMO_TODAY);
        var yestD = todayD ? new Date(todayD.getTime() - 86400000) : null;
        var weekStart = todayD ? new Date(todayD.getTime() - 6 * 86400000) : null;
        var monthStart = todayD
            ? new Date(todayD.getFullYear(), todayD.getMonth(), 1)
            : null;
        function inDemoDay(o, d) {
            var od = parseDay(dayKeyOf(o));
            return od && d && od.getTime() === d.getTime();
        }
        function inDemoFrom(o, start) {
            var od = parseDay(dayKeyOf(o));
            return od && start && od.getTime() >= start.getTime();
        }
        var todaySum = sumCommission(
            orders.filter(function (o) {
                return inDemoDay(o, todayD);
            })
        );
        var yestSum = sumCommission(
            orders.filter(function (o) {
                return inDemoDay(o, yestD);
            })
        );
        var weekSum = sumCommission(
            orders.filter(function (o) {
                return inDemoFrom(o, weekStart);
            })
        );
        var monthSum = sumCommission(
            orders.filter(function (o) {
                return inDemoFrom(o, monthStart);
            })
        );

        root.appendChild(
            summaryBar([
                ['可提现账户余额', money(withdrawable)],
                ['累计总佣金', money(totalSum.amt)],
                ['累计清分单', String(totalSum.cnt) + ' 单']
            ])
        );
        root.appendChild(
            summaryBar([
                ['今日佣金', money(todaySum.amt) + ' / ' + todaySum.cnt + '单'],
                ['昨日佣金', money(yestSum.amt) + ' / ' + yestSum.cnt + '单'],
                ['本周佣金', money(weekSum.amt) + ' / ' + weekSum.cnt + '单'],
                ['本月佣金', money(monthSum.amt) + ' / ' + monthSum.cnt + '单']
            ])
        );
        root.appendChild(
            el(
                'p',
                'erp-page__note mdm-detail-note',
                '清分口径：用户支付成功后生成门店清分明细（分佣信息）；结算未配置门店佣金比例时不生成清分，本列表不展示。'
            )
        );

        /* 结算状态：待结算 | 结算中 | 已结算 | 结算失败 | 已取消；无清分展示 — */
        var COMM_HEADERS = [
            '订单编号',
            '下单日期',
            '联系人',
            '手机号',
            '会员码',
            '履约方式',
            '购买商品',
            '实付金额',
            '退款金额',
            '所得佣金',
            '订单状态',
            '结算状态',
            '支付时间',
            '配送时间',
            '完成时间',
            '结算时间',
            '备注'
        ];

        /* dateField：按下单/支付/配送/完成/结算日期做时段筛选；custom 用自定义起止日 */
        var state = {
            dateField: 'order',
            range: '30d',
            dateStart: '',
            dateEnd: '',
            status: 'all',
            keyword: '',
            page: 1,
            pageSize: 20
        };

        function ledgerFilterField(labelText, control) {
            var grp = el('div', 'store-ledger-filter__field');
            if (labelText) {
                grp.appendChild(el('label', 'store-ledger-filter__label', labelText));
            }
            grp.appendChild(control);
            return grp;
        }
        function ledgerSelect(options, minWidth) {
            var sel = document.createElement('select');
            sel.className = 'store-ledger-filter__control';
            if (minWidth) sel.style.minWidth = minWidth;
            (options || []).forEach(function (opt) {
                var o = document.createElement('option');
                o.value = opt[0];
                o.textContent = opt[1];
                sel.appendChild(o);
            });
            return sel;
        }
        function ledgerIconBtn(label, primary, svgPath) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className =
                'store-ledger-filter__btn' + (primary ? ' store-ledger-filter__btn--primary' : '');
            btn.innerHTML =
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
                svgPath +
                '</svg><span>' +
                label +
                '</span>';
            return btn;
        }

        var filterPanel = el('div', 'store-ledger-filter');
        var filterRow = el('div', 'store-ledger-filter__row');
        /* 组合筛：日期字段 + 时段枚举 + 日期区间（区间随枚举联动） */
        var dateCombo = el('div', 'store-comm-date-combo');
        var dateFieldSelect = ledgerSelect(
            [
                ['order', '下单日期'],
                ['pay', '支付日期'],
                ['delivery', '配送日期'],
                ['finish', '完成日期'],
                ['settle', '结算日期']
            ],
            '110px'
        );
        dateFieldSelect.value = state.dateField;
        dateFieldSelect.setAttribute('aria-label', '日期字段');
        dateCombo.appendChild(dateFieldSelect);

        var rangeSelect = ledgerSelect(
            [
                ['all', '全部'],
                ['today', '今天'],
                ['yesterday', '昨天'],
                ['7d', '近7天'],
                ['30d', '近1个月'],
                ['6m', '6个月'],
                ['1y', '近一年'],
                ['custom', '自定义时间范围']
            ],
            '130px'
        );
        rangeSelect.value = state.range;
        rangeSelect.setAttribute('aria-label', '时段');
        dateCombo.appendChild(rangeSelect);

        var dateRange = el('div', 'store-ledger-daterange store-comm-date-combo__range');
        dateRange.innerHTML =
            '<svg class="store-ledger-daterange__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">' +
            '<rect x="3" y="5" width="18" height="16" rx="2"/>' +
            '<path d="M3 10h18M8 3v4M16 3v4"/>' +
            '</svg>';
        var dateStart = document.createElement('input');
        dateStart.type = 'date';
        dateStart.className = 'store-ledger-daterange__input';
        dateStart.setAttribute('aria-label', '开始日期');
        var dateSep = el('span', 'store-ledger-daterange__sep', '—');
        var dateEnd = document.createElement('input');
        dateEnd.type = 'date';
        dateEnd.className = 'store-ledger-daterange__input';
        dateEnd.setAttribute('aria-label', '结束日期');
        dateRange.appendChild(dateStart);
        dateRange.appendChild(dateSep);
        dateRange.appendChild(dateEnd);
        dateCombo.appendChild(dateRange);
        filterRow.appendChild(dateCombo);

        var statusSelect = ledgerSelect(
            [
                ['all', '全部订单'],
                ['pending_ship', '待发货'],
                ['pending_pickup', '待自提/待收货'],
                ['done', '已完成']
            ],
            '140px'
        );
        filterRow.appendChild(ledgerFilterField('订单状态', statusSelect));

        var kwInput = document.createElement('input');
        kwInput.type = 'text';
        kwInput.className = 'store-ledger-filter__control';
        kwInput.placeholder = '手机号/订单号/会员码/昵称/商品';
        kwInput.style.minWidth = '220px';
        filterRow.appendChild(ledgerFilterField('关键词', kwInput));

        var actions = el('div', 'store-ledger-filter__actions');
        var searchBtn = ledgerIconBtn(
            '查询',
            true,
            '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5" stroke-linecap="round"/>'
        );
        var resetBtn = ledgerIconBtn(
            '重置',
            false,
            '<path d="M4 4v6h6" stroke-linecap="round" stroke-linejoin="round"/>' +
                '<path d="M20 20v-6h-6" stroke-linecap="round" stroke-linejoin="round"/>' +
                '<path d="M5 19A9 9 0 0019 6.3" stroke-linecap="round"/>' +
                '<path d="M19 5A9 9 0 005 17.7" stroke-linecap="round"/>'
        );
        actions.appendChild(searchBtn);
        actions.appendChild(resetBtn);
        filterPanel.appendChild(filterRow);
        filterPanel.appendChild(actions);
        root.appendChild(filterPanel);

        var tableHost = el('div', 'store-wallet-ledger-host');
        root.appendChild(tableHost);
        var emptyHost = el('div');
        root.appendChild(emptyHost);
        var pageHost = el('div', 'store-ledger-page-host');
        root.appendChild(pageHost);

        function daysAgo(n) {
            if (!todayD) return null;
            return new Date(todayD.getTime() - n * 86400000);
        }
        function monthsAgo(n) {
            if (!todayD) return null;
            return new Date(todayD.getFullYear(), todayD.getMonth() - n, todayD.getDate());
        }
        function orderDateByField(order) {
            if (state.dateField === 'pay') return parseDay(order.payTime);
            if (state.dateField === 'delivery') return parseDay(order.deliveryTime);
            if (state.dateField === 'finish') return parseDay(order.finishTime);
            if (state.dateField === 'settle') return parseDay(order.settleTime);
            return parseDay(order.date || order.dayKey);
        }
        function dayKeyStr(d) {
            if (!d) return '';
            var y = d.getFullYear();
            var m = String(d.getMonth() + 1);
            var day = String(d.getDate());
            if (m.length < 2) m = '0' + m;
            if (day.length < 2) day = '0' + day;
            return y + '-' + m + '-' + day;
        }
        /** 时段枚举 → 起止日期（演示基准日 DEMO_TODAY） */
        function boundsForRange(rangeKey) {
            if (!todayD) return { start: '', end: '' };
            var end = todayD;
            var start = todayD;
            if (rangeKey === 'all') return { start: '', end: '' };
            if (rangeKey === 'today') {
                start = todayD;
                end = todayD;
            } else if (rangeKey === 'yesterday') {
                start = yestD || todayD;
                end = yestD || todayD;
            } else if (rangeKey === '7d') {
                start = weekStart || daysAgo(6);
                end = todayD;
            } else if (rangeKey === '30d') {
                start = daysAgo(29);
                end = todayD;
            } else if (rangeKey === '6m') {
                start = monthsAgo(6);
                end = todayD;
            } else if (rangeKey === '1y') {
                start = monthsAgo(12);
                end = todayD;
            } else if (rangeKey === 'custom') {
                /* 自定义：清空区间，由用户手动选择 */
                return { start: '', end: '' };
            }
            return { start: dayKeyStr(start), end: dayKeyStr(end) };
        }
        function applyRangePreset() {
            var b = boundsForRange(rangeSelect.value);
            if (!b) return;
            dateStart.value = b.start;
            dateEnd.value = b.end;
            state.dateStart = b.start;
            state.dateEnd = b.end;
        }
        rangeSelect.addEventListener('change', function () {
            applyRangePreset();
        });
        function onManualDateEdit() {
            if (rangeSelect.value !== 'custom') {
                rangeSelect.value = 'custom';
                state.range = 'custom';
            }
        }
        dateStart.addEventListener('change', onManualDateEdit);
        dateEnd.addEventListener('change', onManualDateEdit);
        applyRangePreset();

        function inRange(order) {
            var start = String(state.dateStart || '').trim();
            var end = String(state.dateEnd || '').trim();
            if (!start && !end) return true;
            var d = orderDateByField(order);
            if (!d) return false;
            var key = dayKeyStr(d);
            if (start && key < start) return false;
            if (end && key > end) return false;
            return true;
        }
        function matchStatus(order) {
            if (state.status === 'all') return true;
            if (state.status === 'pending_ship') return order.status === 'pending_ship';
            if (state.status === 'pending_pickup') {
                return order.status === 'pending_pickup' || order.status === 'pending_receipt';
            }
            if (state.status === 'done') return order.status === 'done';
            return true;
        }
        function matchKeyword(order) {
            var kw = String(state.keyword || '').trim().toLowerCase();
            if (!kw) return true;
            var hay = [
                order.phone,
                order.id,
                order.verifyCode,
                order.nick,
                order.contact,
                order.goods
            ].join(' ');
            return hay.toLowerCase().indexOf(kw) >= 0;
        }
        function filteredOrders() {
            return orders.filter(function (o) {
                return inRange(o) && matchStatus(o) && matchKeyword(o);
            });
        }

        function render() {
            empty(tableHost);
            empty(emptyHost);
            empty(pageHost);
            var list = filteredOrders();
            var total = list.length;
            var maxPage = Math.max(1, Math.ceil(total / state.pageSize) || 1);
            if (state.page > maxPage) state.page = maxPage;
            var startIdx = (state.page - 1) * state.pageSize;
            var pageList = list.slice(startIdx, startIdx + state.pageSize);
            var rows = pageList.map(function (o) {
                return [
                    o.id,
                    o.date || dayKeyOf(o) || '—',
                    o.contact || '—',
                    o.phone || '—',
                    o.verifyCode || '—',
                    o.shipMode || '—',
                    o.goods || '—',
                    moneyPlain(o.paid),
                    moneyPlain(o.refund),
                    moneyPlain(o.commission),
                    o.statusText || '—',
                    o.settleStatus || '—',
                    o.payTime || '—',
                    o.deliveryTime || '—',
                    o.finishTime || '—',
                    o.settleTime || '—',
                    o.remark || '—'
                ];
            });
            tableHost.appendChild(dataTable(COMM_HEADERS, rows));
            if (!total) {
                var box = el('div', 'store-empty store-empty--illus');
                box.innerHTML =
                    '<div class="store-empty__icon" aria-hidden="true"></div>' +
                    '<div class="store-empty__text">暂无清分数据</div>' +
                    '<div class="store-empty__hint">结算未配置门店佣金比例时，支付后不会生成门店明细</div>';
                emptyHost.appendChild(box);
            }
            pageHost.appendChild(
                buildPaginationBar({
                    total: total,
                    page: state.page,
                    pageSize: state.pageSize,
                    onPage: function (p) {
                        state.page = p;
                        render();
                    },
                    onPageSize: function (size) {
                        state.pageSize = size;
                        state.page = 1;
                        render();
                    }
                })
            );
        }

        searchBtn.addEventListener('click', function () {
            state.dateField = dateFieldSelect.value || 'order';
            state.range = rangeSelect.value || '30d';
            state.dateStart = dateStart.value || '';
            state.dateEnd = dateEnd.value || '';
            state.status = statusSelect.value || 'all';
            state.keyword = kwInput.value || '';
            state.page = 1;
            render();
        });
        resetBtn.addEventListener('click', function () {
            state.dateField = 'order';
            state.range = '30d';
            state.status = 'all';
            state.keyword = '';
            state.page = 1;
            dateFieldSelect.value = 'order';
            rangeSelect.value = '30d';
            applyRangePreset();
            statusSelect.value = 'all';
            kwInput.value = '';
            render();
        });
        render();
        return root;
    }

    /** 门店档案 · 账户信息（口径对齐门店 APP「我的钱包」） */
    function panelStoreAccount(store) {
        var root = el('div', 'supplier-detail-tab');
        var money =
            window.StoreWalletDemo && typeof window.StoreWalletDemo.money === 'function'
                ? window.StoreWalletDemo.money
                : function (n) {
                      return '¥' + Number(n || 0).toFixed(2);
                  };

        function resolveRule() {
            if (
                window.StoreAccountConfig &&
                typeof window.StoreAccountConfig.resolve === 'function'
            ) {
                return window.StoreAccountConfig.resolve(store && store.storeId);
            }
            return null;
        }

        function render() {
            empty(root);
            var snap =
                window.StoreWalletDemo && typeof window.StoreWalletDemo.snapshot === 'function'
                    ? window.StoreWalletDemo.snapshot()
                    : null;
            var rule = resolveRule();

            var depositActual = snap ? snap.depositActual : 2000;
            var depositRequired = snap ? snap.depositRequired : 2000;
            var depositGap = snap ? snap.depositGap : 0;
            var available = snap ? snap.available : 0;
            var goodsQuota = snap ? snap.goodsQuota : 0;
            var goodsPaid = snap ? snap.goodsQuotaPaid : goodsQuota;
            var goodsRequired =
                snap && snap.goodsQuotaRequired != null
                    ? snap.goodsQuotaRequired
                    : rule
                      ? rule.goodsQuotaRequired
                      : 8000;
            var goodsNeedFill =
                snap && snap.goodsNeedFill != null
                    ? snap.goodsNeedFill
                    : Math.max(0, Number(goodsRequired) - Number(goodsPaid));
            var withdrawable = snap ? snap.withdrawable : 0;
            var pending = snap ? snap.pending : 0;
            /* 与门店 APP 钱包一致：总金额 = 保证金余额 + 余额账户余额；保证金可提款固定 0 */
            var totalAmount = Number(depositActual || 0) + Number(available || 0);
            var depositWithdrawable = 0;

            var storeDisabled =
                store &&
                (store.storeStatus === '已禁用' || store.storeStatus === '停用');
            var unfreezeBtn = el('button', 'store-summary-bar__action-btn', '解冻');
            unfreezeBtn.type = 'button';
            if (!storeDisabled) {
                unfreezeBtn.disabled = true;
                unfreezeBtn.title = '仅门店状态为「已禁用」时可解冻保证金';
            } else if (!(Number(depositActual) > 0)) {
                unfreezeBtn.disabled = true;
                unfreezeBtn.title = '暂无保证金余额可解冻';
            }
            unfreezeBtn.addEventListener('click', function () {
                if (!storeDisabled) {
                    if (typeof showToast === 'function') {
                        showToast('仅已禁用门店可解冻保证金', 'error');
                    }
                    return;
                }
                if (!(Number(depositActual) > 0)) return;
                var tip = '确认将保证金余额 ' + money(depositActual) + ' 解冻为可提现？';
                openWarmConfirmModal(tip, function () {
                    if (
                        !window.StoreWalletDemo ||
                        typeof window.StoreWalletDemo.unfreezeDeposit !== 'function'
                    ) {
                        if (typeof showToast === 'function') showToast('解冻能力未就绪', 'error');
                        return;
                    }
                    var result = window.StoreWalletDemo.unfreezeDeposit(depositActual, {
                        remark: '门店档案·已禁用门店解冻保证金至可提现'
                    });
                    if (!result || !result.ok) {
                        if (typeof showToast === 'function') {
                            showToast((result && result.message) || '解冻失败', 'error');
                        }
                        return;
                    }
                    if (typeof showToast === 'function') {
                        showToast(
                            '已解冻 ' + money(result.amount) + ' 至可提现',
                            'success'
                        );
                    }
                    render();
                }, { okText: '确认解冻' });
            });

            var cfgEntryBtn = el('button', 'store-account-cfg-entry', '账户配置');
            cfgEntryBtn.type = 'button';
            cfgEntryBtn.addEventListener('click', function () {
                openStoreAccountConfigModal(store, money, function () {
                    render();
                });
            });
            root.appendChild(sectionTitleWithAction('账户总计', cfgEntryBtn));
            root.appendChild(
                summaryBar([
                    ['总金额', money(totalAmount)],
                    ['可提现金额', money(withdrawable)]
                ])
            );

            root.appendChild(sectionTitle('保证金账户'));
            root.appendChild(
                summaryBar([
                    ['余额', money(depositActual), unfreezeBtn],
                    ['可提款', money(depositWithdrawable)],
                    ['应保有', money(depositRequired)],
                    ['需补金额', money(depositGap)]
                ])
            );

            root.appendChild(sectionTitle('余额账户'));
            root.appendChild(
                summaryBar([
                    ['余额', money(available)],
                    ['货款', money(goodsQuota)],
                    ['可提款', money(withdrawable)],
                    ['待解冻', money(pending)]
                ])
            );
            root.appendChild(
                summaryBar([
                    ['货款应缴', money(goodsRequired)],
                    ['货款已缴', money(goodsPaid)],
                    ['货款需补', money(goodsNeedFill)]
                ])
            );
        }

        render();
        return root;
    }

    function closeStoreAccountConfigModal() {
        document.querySelectorAll('[data-archive-account-cfg="1"]').forEach(function (n) {
            n.remove();
        });
    }

    /** 门店个性化账户配置弹框（优先于平台通用配置） */
    function openStoreAccountConfigModal(store, moneyFn, onDone) {
        closeStoreAccountConfigModal();
        var money =
            typeof moneyFn === 'function'
                ? moneyFn
                : function (n) {
                      return '¥' + Number(n || 0).toFixed(2);
                  };
        var snap =
            window.StoreWalletDemo && typeof window.StoreWalletDemo.snapshot === 'function'
                ? window.StoreWalletDemo.snapshot()
                : null;
        var rule =
            window.StoreAccountConfig && typeof window.StoreAccountConfig.resolve === 'function'
                ? window.StoreAccountConfig.resolve(store && store.storeId)
                : null;
        var depositRequired = snap ? snap.depositRequired : 2000;
        var goodsRequired =
            snap && snap.goodsQuotaRequired != null
                ? snap.goodsQuotaRequired
                : rule
                  ? rule.goodsQuotaRequired
                  : 8000;
        var goodsPaid = snap ? snap.goodsQuotaPaid : 0;
        var depSource = rule && rule.depositSource === 'store' ? '本店个性化' : '平台通用';
        var goodsSource = rule && rule.goodsSource === 'store' ? '本店个性化' : '平台通用';

        var backdrop = el(
            'div',
            'erp-modal-backdrop erp-modal-backdrop--over-drawer'
        );
        backdrop.setAttribute('data-archive-account-cfg', '1');

        var modal = el('div', 'erp-modal erp-modal--account-cfg');
        var header = el('div', 'erp-modal__header');
        header.appendChild(el('h2', 'erp-modal__title', '账户配置'));
        var acts = el('div', 'erp-modal__header-actions');
        var closeBtn = el('button', 'erp-modal__header-btn');
        closeBtn.type = 'button';
        closeBtn.setAttribute('aria-label', '关闭');
        closeBtn.innerHTML = '&times;';
        acts.appendChild(closeBtn);
        header.appendChild(acts);

        var body = el('div', 'erp-modal__body');
        body.appendChild(
            el('div', 'store-account-cfg__banner', '个性化账户配置（优先于平台通用配置）')
        );

        var depRow = el('div', 'store-account-cfg__row');
        depRow.appendChild(el('div', 'store-account-cfg__label', '保证金应保有'));
        var depCtrl = el('div', 'store-account-cfg__control');
        var depInput = el('input', 'erp-input');
        depInput.type = 'number';
        depInput.min = '0';
        depInput.step = '0.01';
        depInput.value = String(depositRequired);
        depCtrl.appendChild(depInput);
        depCtrl.appendChild(el('span', 'store-account-cfg__unit', '元'));
        depCtrl.appendChild(el('span', 'store-account-cfg__meta', '当前来源：' + depSource));
        depRow.appendChild(depCtrl);
        body.appendChild(depRow);

        var goodsRow = el('div', 'store-account-cfg__row');
        goodsRow.appendChild(el('div', 'store-account-cfg__label', '货款应缴'));
        var goodsCtrl = el('div', 'store-account-cfg__control');
        var goodsInput = el('input', 'erp-input');
        goodsInput.type = 'number';
        goodsInput.min = '0';
        goodsInput.step = '0.01';
        goodsInput.value = String(goodsRequired);
        goodsCtrl.appendChild(goodsInput);
        goodsCtrl.appendChild(el('span', 'store-account-cfg__unit', '元'));
        goodsCtrl.appendChild(
            el(
                'span',
                'store-account-cfg__meta',
                '当前来源：' + goodsSource + '；已缴 ' + money(goodsPaid)
            )
        );
        goodsRow.appendChild(goodsCtrl);
        body.appendChild(goodsRow);

        body.appendChild(
            el(
                'div',
                'store-account-cfg__tip',
                '重置应保有后，按新应保有补足保证金（需补=应保有−余额）。重置货款后，需补足=货款应缴−已缴。'
            )
        );

        var footer = el('div', 'erp-modal__footer');
        var cancelBtn = mkBtn('取消', false);
        var okBtn = mkBtn('确认重置', true);
        footer.appendChild(cancelBtn);
        footer.appendChild(okBtn);

        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);
        backdrop.appendChild(modal);

        function shut() {
            closeStoreAccountConfigModal();
        }
        backdrop.addEventListener('click', function (ev) {
            if (ev.target === backdrop) shut();
        });
        closeBtn.addEventListener('click', shut);
        cancelBtn.addEventListener('click', shut);
        okBtn.addEventListener('click', function () {
            var depV = Number(depInput.value);
            var goodsV = Number(goodsInput.value);
            if (!(depV >= 0) || Number.isNaN(depV)) {
                if (typeof showToast === 'function') showToast('请输入有效应保有金额', 'error');
                return;
            }
            if (!(goodsV >= 0) || Number.isNaN(goodsV)) {
                if (typeof showToast === 'function') showToast('请输入有效货款应缴金额', 'error');
                return;
            }
            if (
                window.StoreAccountConfig &&
                typeof window.StoreAccountConfig.saveStoreOverride === 'function'
            ) {
                window.StoreAccountConfig.saveStoreOverride(store.storeId, {
                    depositRequired: depV,
                    goodsQuotaRequired: goodsV
                });
            }
            var depResult =
                window.StoreWalletDemo &&
                typeof window.StoreWalletDemo.applyStoreDepositRequired === 'function'
                    ? window.StoreWalletDemo.applyStoreDepositRequired(depV)
                    : { ok: false, message: '钱包能力未就绪' };
            if (!depResult.ok) {
                if (typeof showToast === 'function') {
                    showToast(depResult.message || '应保有重置失败', 'error');
                }
                return;
            }
            var goodsResult =
                window.StoreWalletDemo &&
                typeof window.StoreWalletDemo.applyStoreGoodsQuotaRequired === 'function'
                    ? window.StoreWalletDemo.applyStoreGoodsQuotaRequired(goodsV)
                    : { ok: false, message: '钱包能力未就绪' };
            if (!goodsResult.ok) {
                if (typeof showToast === 'function') {
                    showToast(goodsResult.message || '货款重置失败', 'error');
                }
                return;
            }
            shut();
            if (typeof showToast === 'function') {
                showToast(
                    '已重置：保证金需补 ' +
                        money(depResult.needFill) +
                        '，货款需补足 ' +
                        money(goodsResult.needFill),
                    'success'
                );
            }
            if (typeof onDone === 'function') onDone();
        });

        document.body.appendChild(backdrop);
    }

    /**
     * 门店 APP 钱包·账户明细 → MDM 账变记录
     * 账户类型 = C 端「账户」字段；支付/付款方式与 C 端同口径
     */
    function mapStoreLedgerCorpBank(item) {
        var bank = String((item && (item.bankName || item.settleBankName)) || '').trim();
        var tail = String((item && (item.bankTail || item.cardTail || item.settleCardTail)) || '').trim();
        if (!bank || !tail) {
            var snap =
                window.StoreWalletDemo && typeof window.StoreWalletDemo.snapshot === 'function'
                    ? window.StoreWalletDemo.snapshot()
                    : null;
            var settle = (snap && snap.settleAccount) || {};
            if (!bank) bank = String(settle.bankName || '').trim();
            if (!tail) tail = String(settle.cardTail || '').trim();
        }
        if (bank && tail) return bank + '(' + tail + ')';
        if (bank) return bank;
        return '';
    }

    function mapStoreLedgerBizType(rawType) {
        var t = String(rawType || '');
        var map = {
            保证金划拨入账: '保证金入账',
            保证金补齐: '保证金补缴',
            平台佣金: '佣金结算',
            佣金入账: '佣金结算',
            订单佣金: '佣金结算',
            提现申请: '提现',
            售后问责: '售后/责任类扣款',
            售后赔付: '售后/责任类扣款',
            保证金出账: '售后/责任类扣款',
            保证金划拨出账: '售后/责任类扣款',
            余额支付: '进货支付',
            进货退款: '退款'
        };
        return map[t] || t || '—';
    }

    function mapStoreLedgerDirection(item) {
        var biz = mapStoreLedgerBizType(item && item.type);
        if (
            biz === '保证金补缴' ||
            biz === '保证金解冻' ||
            (item && item.dir === 'lock') ||
            (item && item.dir === 'unlock')
        ) {
            return '划拨';
        }
        if (item && item.dir === 'in') return '收入';
        if (item && item.dir === 'out') return '支出';
        return '—';
    }

    /** 与门店 APP「账户」字段一致 */
    function mapStoreLedgerAccountType(item) {
        var biz = mapStoreLedgerBizType(item && item.type);
        var a = String((item && item.account) || '').trim();
        var sub = String((item && item.subAccount) || '');
        if (biz === '提现') {
            if (a && a.indexOf('资金到账') < 0 && a.indexOf('余额') < 0 && a.indexOf('保证金') < 0) {
                return a;
            }
            var bank = mapStoreLedgerCorpBank(item);
            if (bank) return bank;
            if (a.indexOf('银行') >= 0) return a;
            return a || '—';
        }
        if (a === '平台') return '平台';
        if (a.indexOf('资金到账') >= 0) return '资金到账账户';
        if (a.indexOf('保证金') >= 0 && a.indexOf('余额') >= 0) return '保证金账户/余额账户';
        if (a.indexOf('保证金') >= 0) return '保证金账户';
        if (a.indexOf('余额') >= 0) {
            if (sub.indexOf('货款') >= 0) return '余额账户-货款';
            return '余额账户';
        }
        return a || '—';
    }

    /** 与门店 APP 支付方式 / 付款方式取值一致 */
    function mapStoreLedgerPayWay(item) {
        var m = String((item && (item.payMethod || item.channel)) || '').trim();
        if (
            m === '平台' ||
            m === '余额账户' ||
            m === '保证金账户' ||
            m === '余额账户/保证金账户'
        ) {
            return m;
        }
        var type = String((item && item.type) || '');
        var biz = mapStoreLedgerBizType(type);
        if (biz === '提现' || type === '提现申请') {
            if (m === '保证金账户' || m === '余额账户/保证金账户') return m;
            return '余额账户';
        }
        if (m) return m;
        if (type === '保证金出账') return '保证金账户';
        if (
            biz === '进货支付' ||
            biz === '售后/责任类扣款' ||
            type === '余额支付' ||
            type === '佣金回退' ||
            type === '保证金补齐' ||
            type === '保证金划拨出账' ||
            type === '保证金划拨入账'
        ) {
            return '余额账户';
        }
        var no = String((item && item.channelNo) || '');
        if (/^WX/i.test(no)) return '微信';
        if (/^ALI|ZFB/i.test(no)) return '支付宝';
        var corp = mapStoreLedgerCorpBank(item);
        if (corp) return corp;
        return '—';
    }

    /** 变前/变后推算用：实际变动的钱包桶（余额账户 / 保证金账户） */
    function mapStoreLedgerWalletBucket(accountShown, payWay) {
        if (accountShown === '余额账户' || accountShown === '保证金账户') return accountShown;
        if (payWay === '余额账户' || payWay === '保证金账户') return payWay;
        if (payWay === '余额账户/保证金账户') return '余额账户';
        return '';
    }

    function mapStoreLedgerOperator(item) {
        var biz = mapStoreLedgerBizType(item && item.type);
        var dir = mapStoreLedgerDirection(item);
        if (dir === '划拨') return '系统';
        if (
            biz === '售后/责任类扣款' ||
            biz === '保证金入账' ||
            biz === '佣金结算' ||
            biz === '提现回退' ||
            biz === '退款'
        ) {
            return '系统';
        }
        return '门店管理员';
    }

    /**
     * 账变状态：成功 / 处理中 / 失败
     * 提现一经发起不可撤销，无「已撤销」态
     */
    function mapStoreLedgerStatus(item) {
        var raw = item && (item.ledgerStatus || item.status);
        if (raw === '已撤销') return '失败';
        if (raw === '成功' || raw === '处理中' || raw === '失败') return raw;
        var ws = item && item.withdrawStatus;
        if (ws === 'pending' || ws === 'processing') return '处理中';
        if (ws === 'failed' || ws === 'fail') return '失败';
        if (ws === 'success' || ws === 'done') return '成功';
        var biz = mapStoreLedgerBizType(item && item.type);
        var remark = String((item && item.remark) || '');
        if (biz === '提现' || (item && item.type === '提现申请')) {
            if (/失败/.test(remark)) return '失败';
            if (/已完成|成功到账/.test(remark)) return '成功';
            return '处理中';
        }
        if (item && item.type === '余额支付' && item.payStatus === 'pending') return '处理中';
        if (/充值失败|提现失败/.test(remark)) return '失败';
        return '成功';
    }

    function storeLedgerAffectsBalance(status) {
        return status === '成功' || status === '处理中';
    }

    function formatStoreLedgerAmount(dir, amount, moneyFn) {
        var n = Number(amount) || 0;
        var body = moneyFn(n);
        if (dir === '支出') return '-' + body;
        if (dir === '收入' || dir === '划拨') return '+' + body;
        return body;
    }

    /** 按时间正序推算各钱包账户变前 / 变后余额 */
    function enrichStoreLedgerRows(ledgers, moneyFn) {
        var list = (ledgers || []).slice().sort(function (a, b) {
            return String(a.time || '').localeCompare(String(b.time || ''));
        });
        var bal = { 余额账户: 0, 保证金账户: 0 };
        return list.map(function (item) {
            var accountType = mapStoreLedgerAccountType(item);
            var payWay = mapStoreLedgerPayWay(item);
            var walletBucket = mapStoreLedgerWalletBucket(accountType, payWay);
            var bizType = mapStoreLedgerBizType(item.type);
            var dir = mapStoreLedgerDirection(item);
            var status = mapStoreLedgerStatus(item);
            var amt = Number(item.amount) || 0;
            var before = walletBucket ? bal[walletBucket] || 0 : 0;
            var after = before;
            if (walletBucket && storeLedgerAffectsBalance(status)) {
                after = dir === '支出' ? before - amt : before + amt;
                bal[walletBucket] = after;
            }
            return {
                accountType: accountType,
                payWay: payWay,
                time: item.time || '—',
                bizType: bizType,
                direction: dir,
                beforeText: walletBucket ? moneyFn(before) : '—',
                amountText: formatStoreLedgerAmount(dir, amt, moneyFn),
                afterText: walletBucket ? moneyFn(after) : '—',
                status: status,
                bizNo: item.bizNo || '—',
                channelNo: item.channelNo || '—',
                operator: mapStoreLedgerOperator(item),
                remark: item.remark || '—'
            };
        });
    }

    /** 门店档案 · 账变记录（一级 Tab，位于账户信息右侧） */
    function panelStoreLedger() {
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

        var enriched = enrichStoreLedgerRows(snap && snap.ledgers ? snap.ledgers : [], money);
        /* 列表默认新在前 */
        enriched.sort(function (a, b) {
            return String(b.time || '').localeCompare(String(a.time || ''));
        });

        var LEDGER_HEADERS = [
            '账户类型',
            '资金方向',
            '支付/付款方式',
            '账变类型',
            '变前金额',
            '变动金额',
            '变后余额',
            '发生时间',
            '状态',
            '业务单号',
            '交易流水',
            '操作人',
            '说明'
        ];

        /* 资金方向 → 账变类型枚举（与门店 APP 钱包账户明细对齐） */
        var LEDGER_BIZ_TYPES_BY_DIR = {
            /* 收入无「支付退回」：支付失败整笔状态为失败，未入账则无回退 */
            收入: ['首次充值', '保证金入账', '佣金结算', '充值', '提现回退', '退款'],
            支出: ['提现', '进货支付', '售后/责任类扣款', '佣金回退'],
            划拨: ['保证金补缴', '保证金解冻']
        };
        var LEDGER_BIZ_TYPES_ALL = [].concat(
            LEDGER_BIZ_TYPES_BY_DIR['收入'],
            LEDGER_BIZ_TYPES_BY_DIR['支出'],
            LEDGER_BIZ_TYPES_BY_DIR['划拨']
        );

        /* 筛选排版对齐参考图：标签+控件横排，日期区间带日历图标，查询/重置右下角带图标 */
        function ledgerFilterField(labelText, control) {
            var grp = el('div', 'store-ledger-filter__field');
            grp.appendChild(el('label', 'store-ledger-filter__label', labelText));
            grp.appendChild(control);
            return grp;
        }
        function ledgerSelect(options, minWidth) {
            var sel = document.createElement('select');
            sel.className = 'store-ledger-filter__control';
            if (minWidth) sel.style.minWidth = minWidth;
            (options || []).forEach(function (opt) {
                var o = document.createElement('option');
                o.value = opt[0];
                o.textContent = opt[1];
                sel.appendChild(o);
            });
            return sel;
        }
        function ledgerIconBtn(label, primary, svgPath) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className =
                'store-ledger-filter__btn' + (primary ? ' store-ledger-filter__btn--primary' : '');
            btn.innerHTML =
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
                svgPath +
                '</svg><span>' +
                label +
                '</span>';
            return btn;
        }

        var filterPanel = el('div', 'store-ledger-filter');
        var filterRow = el('div', 'store-ledger-filter__row');

        var acctOpts = [['', '全部']];
        var acctSeen = {};
        ['余额账户', '保证金账户', '平台'].forEach(function (name) {
            acctSeen[name] = true;
            acctOpts.push([name, name]);
        });
        enriched.forEach(function (row) {
            var name = String(row.accountType || '').trim();
            if (!name || name === '—' || acctSeen[name]) return;
            acctSeen[name] = true;
            acctOpts.push([name, name]);
        });
        var acctSelect = ledgerSelect(acctOpts, '160px');
        filterRow.appendChild(ledgerFilterField('账户类型', acctSelect));

        var dateRange = el('div', 'store-ledger-daterange');
        dateRange.innerHTML =
            '<svg class="store-ledger-daterange__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">' +
            '<rect x="3" y="5" width="18" height="16" rx="2"/>' +
            '<path d="M3 10h18M8 3v4M16 3v4"/>' +
            '</svg>';
        var dateStart = document.createElement('input');
        dateStart.type = 'date';
        dateStart.className = 'store-ledger-daterange__input';
        dateStart.setAttribute('aria-label', '开始日期');
        var dateSep = el('span', 'store-ledger-daterange__sep', '—');
        var dateEnd = document.createElement('input');
        dateEnd.type = 'date';
        dateEnd.className = 'store-ledger-daterange__input';
        dateEnd.setAttribute('aria-label', '结束日期');
        dateRange.appendChild(dateStart);
        dateRange.appendChild(dateSep);
        dateRange.appendChild(dateEnd);
        filterRow.appendChild(ledgerFilterField('选择日期', dateRange));

        var dirSelect = ledgerSelect(
            [
                ['', '全部'],
                ['收入', '收入'],
                ['支出', '支出'],
                ['划拨', '划拨']
            ],
            '100px'
        );
        filterRow.appendChild(ledgerFilterField('资金方向', dirSelect));

        var payWayOpts = [['', '全部']];
        var payWaySeen = {};
        ['余额账户', '保证金账户', '平台', '支付宝', '微信'].forEach(function (name) {
            payWaySeen[name] = true;
            payWayOpts.push([name, name]);
        });
        enriched.forEach(function (row) {
            var name = String(row.payWay || '').trim();
            if (!name || name === '—' || payWaySeen[name]) return;
            payWaySeen[name] = true;
            payWayOpts.push([name, name]);
        });
        var payWaySelect = ledgerSelect(payWayOpts, '140px');
        filterRow.appendChild(ledgerFilterField('支付/付款方式', payWaySelect));

        var typeSelect = ledgerSelect([], '160px');
        filterRow.appendChild(ledgerFilterField('账变类型', typeSelect));

        function fillBizTypeOptions(dir, keepValue) {
            var prev = keepValue ? String(typeSelect.value || '') : '';
            var list = dir && LEDGER_BIZ_TYPES_BY_DIR[dir] ? LEDGER_BIZ_TYPES_BY_DIR[dir] : LEDGER_BIZ_TYPES_ALL;
            typeSelect.innerHTML = '';
            var allOpt = document.createElement('option');
            allOpt.value = '';
            allOpt.textContent = '全部';
            typeSelect.appendChild(allOpt);
            list.forEach(function (name) {
                var o = document.createElement('option');
                o.value = name;
                o.textContent = name;
                typeSelect.appendChild(o);
            });
            if (prev && list.indexOf(prev) >= 0) typeSelect.value = prev;
            else typeSelect.value = '';
        }
        fillBizTypeOptions('', false);
        dirSelect.addEventListener('change', function () {
            fillBizTypeOptions(dirSelect.value, false);
        });

        var statusSelect = ledgerSelect(
            [
                ['', '全部'],
                ['成功', '成功'],
                ['处理中', '处理中'],
                ['失败', '失败']
            ],
            '100px'
        );
        filterRow.appendChild(ledgerFilterField('状态', statusSelect));

        var bizInput = document.createElement('input');
        bizInput.type = 'text';
        bizInput.className = 'store-ledger-filter__control';
        bizInput.placeholder = '请输入';
        bizInput.style.minWidth = '140px';
        filterRow.appendChild(ledgerFilterField('业务单号', bizInput));

        var actions = el('div', 'store-ledger-filter__actions');
        var searchBtn = ledgerIconBtn(
            '查询',
            true,
            '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5" stroke-linecap="round"/>'
        );
        var resetBtn = ledgerIconBtn(
            '重置',
            false,
            '<path d="M4 4v6h6" stroke-linecap="round" stroke-linejoin="round"/>' +
                '<path d="M20 20v-6h-6" stroke-linecap="round" stroke-linejoin="round"/>' +
                '<path d="M5 19A9 9 0 0019 6.3" stroke-linecap="round"/>' +
                '<path d="M19 5A9 9 0 005 17.7" stroke-linecap="round"/>'
        );
        actions.appendChild(searchBtn);
        actions.appendChild(resetBtn);

        filterPanel.appendChild(filterRow);
        filterPanel.appendChild(actions);
        root.appendChild(filterPanel);

        var tableHost = el('div', 'store-wallet-ledger-host');
        root.appendChild(tableHost);
        var emptyHost = el('div');
        root.appendChild(emptyHost);
        var pageHost = el('div', 'store-ledger-page-host');
        root.appendChild(pageHost);

        var pageState = { page: 1, pageSize: 20 };

        function rowDate(timeStr) {
            var m = String(timeStr || '').match(/^(\d{4}-\d{2}-\d{2})/);
            return m ? m[1] : '';
        }

        function renderLedgerEmpty() {
            var box = el('div', 'store-empty store-empty--illus');
            box.innerHTML =
                '<div class="store-empty__icon" aria-hidden="true"></div>' +
                '<div class="store-empty__text">暂无数据</div>';
            return box;
        }

        function filteredLedgerRows() {
            var start = (dateStart.value || '').trim();
            var end = (dateEnd.value || '').trim();
            var acctKw = (acctSelect.value || '').trim();
            var payWayKw = (payWaySelect.value || '').trim();
            var typeKw = (typeSelect.value || '').trim();
            var dirKw = (dirSelect.value || '').trim();
            var statusKw = (statusSelect.value || '').trim();
            var bizKw = (bizInput.value || '').trim();
            return enriched.filter(function (row) {
                var d = rowDate(row.time);
                if (acctKw && row.accountType !== acctKw) return false;
                if (payWayKw && row.payWay !== payWayKw) return false;
                if (start && d && d < start) return false;
                if (end && d && d > end) return false;
                if (dirKw && row.direction !== dirKw) return false;
                if (typeKw && row.bizType !== typeKw) return false;
                if (statusKw && row.status !== statusKw) return false;
                if (bizKw && String(row.bizNo || '').indexOf(bizKw) < 0) return false;
                return true;
            });
        }

        function renderLedgerTable() {
            empty(tableHost);
            empty(emptyHost);
            empty(pageHost);
            var filtered = filteredLedgerRows();
            var total = filtered.length;
            var maxPage = Math.max(1, Math.ceil(total / pageState.pageSize) || 1);
            if (pageState.page > maxPage) pageState.page = maxPage;
            var startIdx = (pageState.page - 1) * pageState.pageSize;
            var pageRows = filtered.slice(startIdx, startIdx + pageState.pageSize);
            var rows = pageRows.map(function (row) {
                return [
                    row.accountType,
                    row.direction,
                    row.payWay,
                    row.bizType,
                    row.beforeText,
                    row.amountText,
                    row.afterText,
                    row.time,
                    row.status,
                    row.bizNo,
                    row.channelNo,
                    row.operator,
                    row.remark
                ];
            });
            tableHost.appendChild(dataTable(LEDGER_HEADERS, rows));
            if (!total) emptyHost.appendChild(renderLedgerEmpty());
            pageHost.appendChild(
                buildPaginationBar({
                    total: total,
                    page: pageState.page,
                    pageSize: pageState.pageSize,
                    onPage: function (p) {
                        pageState.page = p;
                        renderLedgerTable();
                    },
                    onPageSize: function (size) {
                        pageState.pageSize = size;
                        pageState.page = 1;
                        renderLedgerTable();
                    }
                })
            );
        }

        searchBtn.addEventListener('click', function () {
            pageState.page = 1;
            renderLedgerTable();
        });
        resetBtn.addEventListener('click', function () {
            acctSelect.value = '';
            dateStart.value = '';
            dateEnd.value = '';
            dirSelect.value = '';
            payWaySelect.value = '';
            fillBizTypeOptions('', false);
            statusSelect.value = '';
            bizInput.value = '';
            pageState.page = 1;
            renderLedgerTable();
        });
        renderLedgerTable();
        return root;
    }

    /**
     * 门店档案 · 银行卡（同步门店 APP 银行卡数据，仅查看不可修改）
     * 数据源：StoreBindCardDemo.listCards（与 store-app/h5/bank-cards.html 同源）
     */
    function panelStoreBankCards() {
        var root = el('div', 'supplier-detail-tab');
        var api = window.StoreBindCardDemo;
        var cards =
            api && typeof api.listCards === 'function' ? api.listCards() : [];

        function purposeTag(card) {
            if (api && typeof api.purposeLabel === 'function') return api.purposeLabel(card);
            return card && card.purpose === 'withdraw' ? '默认提现' : '快捷支付';
        }
        function moneyLimit(n) {
            var v = Number(n) || 0;
            if (v <= 0) return '—';
            return '¥' + v.toLocaleString('zh-CN');
        }
        function maskPhone(phone) {
            var s = String(phone || '').replace(/\s/g, '');
            if (s.length < 7) return s || '—';
            return s.slice(0, 3) + '****' + s.slice(-4);
        }

        if (!cards.length) {
            var empty = el('div', 'store-empty store-empty--illus');
            empty.innerHTML =
                '<div class="store-empty__icon" aria-hidden="true"></div>' +
                '<div class="store-empty__text">暂无绑定的银行卡</div>';
            root.appendChild(empty);
            return root;
        }

        var rows = cards.map(function (c) {
            var isWithdraw =
                api && typeof api.isWithdrawCard === 'function'
                    ? api.isWithdrawCard(c)
                    : c.purpose === 'withdraw';
            return [
                purposeTag(c),
                c.bankName || '—',
                c.cardType || (isWithdraw ? '企业账户' : '储蓄卡'),
                api && typeof api.maskedCardNo === 'function'
                    ? api.maskedCardNo(c)
                    : '****' + (c.cardTail || '----'),
                maskPhone(c.phone),
                moneyLimit(c.single),
                moneyLimit(c.daily)
            ];
        });
        root.appendChild(
            dataTable(
                [
                    '用途',
                    '开户银行',
                    '卡类型',
                    '卡号',
                    '预留手机',
                    '单笔限额',
                    '日累计限额'
                ],
                rows
            )
        );
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
            withFooter: false,
            tabIds: [
                'base',
                'onboard',
                'cust',
                'commission',
                'comm',
                'ledger',
                'bankCards',
                'prod',
                'perf',
                'orderCfg'
            ],
            tabLabels: [
                '基础信息',
                '进件信息',
                '绑定客户',
                '佣金明细',
                '账户信息',
                '账变记录',
                '银行卡',
                '商品统计',
                '业绩报表',
                '订单配置'
            ],
            bodies: {
                base: panelStoreBase(store),
                onboard: panelStoreOnboarding(store),
                cust: panelStoreCustomers(),
                commission: panelStoreCommission(store),
                comm: panelStoreAccount(store),
                ledger: panelStoreLedger(),
                bankCards: panelStoreBankCards(),
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
        grid.appendChild(detailCell('进件状态', archiveOnboardEnum({}, r.onboard)));
        grid.appendChild(detailCell('余额支付', r.balancePay));
        grid.appendChild(detailCellTagged('供应商状态', r.status, true));
        appendArchiveVenuePhotoCells(grid, 'supplier', r.id, r.name);
        p.appendChild(grid);
        appendSupplierReceiveSection(p, r);
        return p;
    }

    function supplierHuifuAccountMeta(r) {
        var bind = getHuifuMerchantBind('supplier', r && r.id);
        if (bind && bind.merchantNo) {
            return {
                merchantNo: bind.merchantNo,
                payStatus: bind.status === '进件成功' ? '已开通' : r && r.balancePay ? r.balancePay : '—',
                bound: true
            };
        }
        var id = r && r.id ? String(r.id).replace(/\s+/g, '') : '';
        var pay = r && r.balancePay != null ? String(r.balancePay).trim() : '';
        if (!pay || pay === '—' || pay === '-') pay = '未开通';
        return {
            merchantNo: id ? 'HF-' + id : '—',
            payStatus: pay,
            bound: false
        };
    }

    /**
     * 供应商进件信息展示补全：已有进件记录优先；进件中/成功且本地无完整字段时补演示值，保证板块字段与照片齐全
     */
    function ensureSupplierOnboardingFieldsForDisplay(fields, r) {
        var f = cloneObj(fields || {}) || {};
        var st = String((r && r.onboard) || '').trim();
        var needDemo = st === '进件成功' || st === '进件中' || st === '已进件' || st === '审核成功';
        if (!needDemo) return f;

        function fillEmpty(obj, key, val) {
            if (obj[key] == null || obj[key] === '') obj[key] = val;
        }

        if (!f.short_name) f.short_name = (r && (r.shortName || r.name)) || '';
        if (!f.receipt_name) f.receipt_name = f.short_name || (r && r.name) || '';
        if (!f.detail_addr) f.detail_addr = (r && r.detailAddress) || '';
        if (!f.legal_mobile_no) f.legal_mobile_no = (r && r.phone) || '13800001234';
        if (!f.contact_mobile_no) f.contact_mobile_no = (r && r.phone) || '13800001234';
        if (!f.contact_email) f.contact_email = 'supplier@lengfeng.demo';

        f.license_info = f.license_info || {};
        fillEmpty(f.license_info, 'name', (r && r.name) || '演示供应商');
        fillEmpty(f.license_info, 'code', '91310000MA1FLSUP01');
        fillEmpty(f.license_info, 'start_date', '2024-01-01');
        fillEmpty(f.license_info, 'valid_date', '长期有效');
        fillEmpty(f.license_info, 'address', (r && r.detailAddress) || '上海市浦东新区张江路');

        f.legal_info = f.legal_info || {};
        fillEmpty(f.legal_info, 'legal_name', (r && r.contactName) || '演示法人');
        fillEmpty(f.legal_info, 'id_no', '310101199001011234');
        fillEmpty(f.legal_info, 'id_start_date', '2020-01-01');
        fillEmpty(f.legal_info, 'id_valid_date', '2040-01-01');

        f.card_info = f.card_info || {};
        fillEmpty(f.card_info, 'account_name', f.license_info.name || (r && r.name) || '');
        fillEmpty(f.card_info, 'card_no', '6222021001123456789');
        fillEmpty(f.card_info, 'bank_name', '中国工商银行');
        fillEmpty(f.card_info, 'bank_branch', '中国工商银行上海张江支行');

        if (!f.license_pic) f.license_pic = true;
        if (!f.legal_cert_front_pic) f.legal_cert_front_pic = true;
        if (!f.legal_cert_back_pic) f.legal_cert_back_pic = true;
        if (!f.open_license_pic) f.open_license_pic = true;
        if (!f.store_header_pic) f.store_header_pic = true;
        if (!f.store_indoor_pic) f.store_indoor_pic = true;
        if (!f.store_cashier_desk_pic) f.store_cashier_desk_pic = true;

        if (st === '进件成功' || st === '已进件' || st === '审核成功') {
            f.payment_agreement_signed = true;
            f.payment_agreement = f.payment_agreement || {};
            fillEmpty(f.payment_agreement, 'type', SUPPLIER_PAYMENT_AGREEMENT.type);
            fillEmpty(f.payment_agreement, 'name', SUPPLIER_PAYMENT_AGREEMENT.name);
            fillEmpty(f.payment_agreement, 'url', SUPPLIER_PAYMENT_AGREEMENT.url);
            f.payment_agreement.signed = true;
        } else {
            f.payment_agreement = f.payment_agreement || {
                type: SUPPLIER_PAYMENT_AGREEMENT.type,
                name: SUPPLIER_PAYMENT_AGREEMENT.name,
                url: SUPPLIER_PAYMENT_AGREEMENT.url,
                signed: !!f.payment_agreement_signed
            };
            fillEmpty(f.payment_agreement, 'type', SUPPLIER_PAYMENT_AGREEMENT.type);
            fillEmpty(f.payment_agreement, 'name', SUPPLIER_PAYMENT_AGREEMENT.name);
            fillEmpty(f.payment_agreement, 'url', SUPPLIER_PAYMENT_AGREEMENT.url);
        }
        return f;
    }

    function panelSupplierOnboarding(r) {
        var recordKey = onboardRecordKey('supplier', r.id);
        function freshSupplierDefaults() {
            return resourceOnboardingDefaults(
                r.shortName || r.name,
                r.detailAddress,
                r.phone,
                r.id,
                'supplier'
            );
        }
        var onboardingDefaults = freshSupplierDefaults();
        var p = el('div', 'supplier-detail-tab');

        p.appendChild(sectionTitle('进件信息'));
        var onboardingGrid = el('div', 'supplier-detail-grid');
        function renderOnboardingInfo() {
            var huifuMeta = supplierHuifuAccountMeta(r);
            onboardingGrid.innerHTML = '';
            var onboardingSummary = getOnboardingSummary(recordKey, onboardingDefaults);
            onboardingSummary.recordKey = recordKey;
            var view = buildOnboardViewFields({
                recordKey: recordKey,
                defaults: onboardingDefaults,
                huifuMerchantNo: huifuMeta.merchantNo,
                bindKind: 'supplier',
                bindEntityId: r.id,
                shortName: r.shortName || r.name,
                merchantName: r.name,
                contactMobile: r.phone,
                onboardStatus: r.onboard,
                title: '供应商进件',
                subjectType: '供应商'
            });
            var displayFields = ensureSupplierOnboardingFieldsForDisplay(view.fields, r);
            onboardingDetailCells(displayFields, 'supplier', {
                shortName: view.shortName || r.shortName || r.name,
                merchantNo: view.merchantNo || huifuMeta.merchantNo,
                payStatus:
                    huifuMeta.payStatus && huifuMeta.payStatus !== '—'
                        ? huifuMeta.payStatus
                        : view.payStatus,
                onboardStatus: archiveOnboardEnum(onboardingSummary, r.onboard),
                /* 供应商进件信息始终展示场地照，与进件表单一致 */
                hideVenuePhotos: false
            }).forEach(function (cell) {
                onboardingGrid.appendChild(cell);
            });
        }
        renderOnboardingInfo();
        p.appendChild(onboardingGrid);

        p.appendChild(sectionTitle('供应商进件'));
        var onboard = el('div', 'store-onboard-section store-onboard-section--white');
        var bar = el('div', 'erp-actions-row supplier-detail-onboard-actions');
        var bindActions = null;
        function refreshList() {
            renderOnboardingInfo();
            renderOnboardingTable();
            if (bindActions && typeof bindActions.refresh === 'function') bindActions.refresh();
        }
        var go = mkBtn('去进件', true);
        go.addEventListener('click', function () {
            openOnboardResource(
                '供应商进件',
                r.shortName || r.name,
                freshSupplierDefaults(),
                recordKey,
                {
                    supplierId: r.id,
                    onChange: refreshList
                }
            );
        });
        bar.appendChild(go);
        bindActions = mountHuifuBindActions(bar, {
            kind: 'supplier',
            entityId: r.id,
            entityName: r.shortName || r.name,
            onChange: refreshList
        });
        onboard.appendChild(bar);
        var tableWrap = el('div');
        function renderOnboardingTable() {
            var huifuMeta = supplierHuifuAccountMeta(r);
            var onboardingSummary = getOnboardingSummary(recordKey, onboardingDefaults);
            tableWrap.innerHTML = '';
            tableWrap.appendChild(
                dataTable(
                    ONBOARD_LIST_HEADERS,
                    buildEntityOnboardListRows(
                        {
                            kind: 'supplier',
                            entityId: r.id,
                            merchantName: r.name,
                            subjectType: '供应商',
                            groupName: r.subjectName,
                            onboardStatus: onboardingSummary.auditStatus || onboardingSummary.status,
                            fallbackMerchantNo: huifuMeta.merchantNo,
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
                                    freshSupplierDefaults(),
                                    recordKey,
                                    {
                                        forceView: !!forceView,
                                        supplierId: r.id,
                                        onChange: refreshList
                                    }
                                );
                            }
                        },
                        refreshList
                    )
                )
            );
        }
        renderOnboardingTable();
        onboard.appendChild(tableWrap);
        onboard.appendChild(
            el(
                'p',
                'erp-page__note mdm-detail-note',
                '无论是否已有汇付商户号，均可再次「去进件」或「绑定商户号」。进件审核流程：门店 → BD → 财务 → 汇付（审核操作在审核中心，MDM仅发起与保存）。'
            )
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
