/* 贸易商端验证码/密码登录与自助注册。证照 OCR 为原型示例，默认演示密码 123456。 */
(function () {
    var DEMO_CODE = '123456';
    var DEMO_PASSWORD = '123456';
    var ACCOUNTS_KEY = 'rbf_h5_trader_accounts_v1';
    var SESSION_KEY = 'rbf_h5_trader_session';
    var LICENSE_SAMPLE = {
        name: '杭州鲜达贸易有限公司',
        creditCode: '91330106MA2H7K8X1A',
        type: '有限责任公司（自然人投资或控股）',
        legal: '周宁',
        capital: '500万元人民币',
        founded: '2021-06-18',
        address: '浙江省杭州市西湖区文三路100号',
        scope: '预包装食品批发；食用农产品批发'
    };
    var PERMIT_SAMPLE = {
        no: 'JY13301061234567',
        name: '杭州鲜达贸易有限公司',
        legal: '周宁',
        place: '浙江省杭州市西湖区文三路100号',
        mode: '食品销售经营者',
        items: '预包装食品销售（含冷藏冷冻食品）',
        expire: '2029-06-17'
    };
    var DEMO_ACCOUNTS = [
        {
            phone: '13800001001',
            password: DEMO_PASSWORD,
            status: '已审核',
            licenseType: '商业保理公司',
            bizScope: '保理',
            license: {
                name: '杭州鲜达贸易有限公司',
                creditCode: '91330106MA2H7K8X1A',
                type: '有限责任公司（自然人投资或控股）',
                legal: '周宁',
                capital: '500万元人民币',
                founded: '2021-06-18',
                address: '浙江省杭州市西湖区文三路100号',
                scope: '预包装食品批发；食用农产品批发'
            },
            permit: {
                no: 'JY13301061234567',
                name: '杭州鲜达贸易有限公司',
                legal: '周宁',
                place: '浙江省杭州市西湖区文三路100号',
                mode: '食品销售经营者',
                items: '预包装食品销售（含冷藏冷冻食品）',
                expire: '2029-06-17'
            }
        },
        {
            phone: '13800001002',
            password: DEMO_PASSWORD,
            status: '已审核',
            licenseType: '融资租赁公司',
            bizScope: '融资租赁',
            license: {
                name: '上海冷链融资租赁有限公司',
                creditCode: '91310115MA1K3P2B9C',
                type: '有限责任公司（自然人投资或控股）',
                legal: '李航',
                capital: '1000万元人民币',
                founded: '2019-03-12',
                address: '上海市浦东新区张杨路188号',
                scope: '融资租赁业务；商业保理'
            },
            permit: {
                no: 'JY13101159876543',
                name: '上海冷链融资租赁有限公司',
                legal: '李航',
                place: '上海市浦东新区张杨路188号',
                mode: '食品销售经营者',
                items: '预包装食品销售',
                expire: '2028-03-11'
            }
        },
        {
            phone: '13800001003',
            password: DEMO_PASSWORD,
            status: '已审核',
            licenseType: '持牌金融机构',
            bizScope: '其他',
            license: {
                name: '宁波海丰商业保理有限公司',
                creditCode: '91330201MA2GN5D4XE',
                type: '有限责任公司（自然人投资或控股）',
                legal: '陈可',
                capital: '800万元人民币',
                founded: '2020-11-08',
                address: '浙江省宁波市鄞州区中山东路666号',
                scope: '以受让应收账款的方式提供贸易融资'
            },
            permit: {
                no: 'JY13302018877665',
                name: '宁波海丰商业保理有限公司',
                legal: '陈可',
                place: '浙江省宁波市鄞州区中山东路666号',
                mode: '食品销售经营者',
                items: '预包装食品销售（含冷藏冷冻食品）',
                expire: '2027-11-07'
            }
        }
    ];
    var sent = { login: '', register: '' };
    var cooldown = { login: 0, register: 0 };
    var timer = { login: 0, register: 0 };
    var uploaded = { license: false, permit: false };
    var loginMode = 'code';
    var currentAccount = null;

    function digits(value) {
        return String(value || '').replace(/\D/g, '');
    }

    function toast(message) {
        var node = document.getElementById('rbfH5Toast');
        if (!node) return;
        node.textContent = message;
        node.classList.add('is-on');
        clearTimeout(toast._t);
        toast._t = setTimeout(function () {
            node.classList.remove('is-on');
        }, 2200);
    }

    function readList() {
        try {
            var raw = sessionStorage.getItem(ACCOUNTS_KEY);
            var list = raw ? JSON.parse(raw) : [];
            return Array.isArray(list) ? list : [];
        } catch (e) {
            return [];
        }
    }

    function writeList(list) {
        sessionStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list));
    }

    function ensureDemoAccounts() {
        var list = readList();
        var phones = {};
        list.forEach(function (item) {
            if (item && item.phone) phones[item.phone] = true;
        });
        var changed = false;
        DEMO_ACCOUNTS.forEach(function (demo) {
            if (phones[demo.phone]) return;
            list.push(JSON.parse(JSON.stringify(demo)));
            phones[demo.phone] = true;
            changed = true;
        });
        if (changed || !sessionStorage.getItem(ACCOUNTS_KEY)) writeList(list);
        return list;
    }

    function findAccount(phone) {
        return readList().filter(function (item) { return item && item.phone === phone; })[0] || null;
    }

    function loginableAccounts() {
        return readList().filter(isApproved);
    }

    function renderAccounts() {
        var box = document.getElementById('rbfH5Accounts');
        if (!box) return;
        var list = loginableAccounts();
        box.innerHTML = '<h2>可登录账号</h2>' + (list.length ? list.map(function (item) {
            var name = (item.license && item.license.name) || '贸易商';
            return '<div class="rbf-h5-account"><strong>' + esc(name) + '</strong>' +
                '<button type="button" data-fill-phone="' + esc(item.phone) + '">' +
                esc(item.licenseType || '') + ' · ' + esc(item.bizScope || '') +
                ' <b>' + esc(item.phone) + '</b></button></div>';
        }).join('') : '<p class="rbf-h5-tip">暂无可登录账号</p>');
    }

    function isApproved(account) {
        return !!(account && (account.status === '已审核' || account.status === '已通过'));
    }

    function isPending(account) {
        return !!(account && account.status === '待审核');
    }

    function rejectLoginAccount(account) {
        if (!account) {
            toast('该手机号未注册');
            return true;
        }
        if (isPending(account)) {
            toast('注册申请审核中，请等待审核');
            return true;
        }
        if (!isApproved(account)) {
            toast('账号未通过审核，无法登录');
            return true;
        }
        return false;
    }

    function accountPassword(account) {
        return (account && account.password) || DEMO_PASSWORD;
    }

    function updateAccountPassword(phone, password) {
        var list = readList();
        var found = false;
        list.forEach(function (item) {
            if (item && item.phone === phone) {
                item.password = password;
                found = true;
            }
        });
        if (found) writeList(list);
        return found;
    }

    function readSession() {
        try {
            var raw = sessionStorage.getItem(SESSION_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function esc(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function setLoginMode(mode) {
        loginMode = mode === 'password' ? 'password' : 'code';
        var phone = document.getElementById('rbfH5Phone');
        phone.classList.toggle('is-pwd', loginMode === 'password');
        document.querySelectorAll('[data-login-mode]').forEach(function (button) {
            button.classList.toggle('is-on', button.getAttribute('data-login-mode') === loginMode);
        });
    }

    function setMode(mode) {
        var phone = document.getElementById('rbfH5Phone');
        var head = document.getElementById('rbfH5HeadText');
        phone.classList.remove('is-login', 'is-register', 'is-app');
        if (mode === 'register') phone.classList.add('is-register');
        else if (mode === 'app') phone.classList.add('is-app');
        else phone.classList.add('is-login');
        if (mode === 'register') head.textContent = '注册账号';
        else if (mode === 'app') head.textContent = '需求大厅';
        else head.textContent = loginMode === 'password' ? '密码登录' : '验证码登录';
        if (mode === 'login') setLoginMode(loginMode);
    }

    function showHome(account) {
        currentAccount = account;
        setMode('app');
        if (window.RbfH5TraderApp) window.RbfH5TraderApp.open(account);
    }

    function changePassword(phone, oldPassword, nextPassword, confirmPassword) {
        var target = findAccount(phone) || currentAccount;
        if (!target) {
            toast('请先登录');
            return false;
        }
        if (!oldPassword) {
            toast('请输入原密码');
            return false;
        }
        if (oldPassword !== accountPassword(target)) {
            toast('原密码错误');
            return false;
        }
        if (!nextPassword) {
            toast('请输入新密码');
            return false;
        }
        if (nextPassword.length < 6) {
            toast('新密码至少6位');
            return false;
        }
        if (nextPassword !== confirmPassword) {
            toast('两次输入的新密码不一致');
            return false;
        }
        if (nextPassword === oldPassword) {
            toast('新密码不能与原密码相同');
            return false;
        }
        updateAccountPassword(phone, nextPassword);
        target.password = nextPassword;
        if (currentAccount && currentAccount.phone === phone) currentAccount.password = nextPassword;
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(currentAccount || target));
        toast('密码已修改');
        return true;
    }

    function logout() {
        sessionStorage.removeItem(SESSION_KEY);
        currentAccount = null;
        if (window.RbfH5TraderApp) window.RbfH5TraderApp.close();
        resetSms('login');
        var code = document.querySelector('[data-code="login"]');
        var password = document.querySelector('[data-password="login"]');
        if (code) code.value = '';
        if (password) password.value = '';
        setMode('login');
    }

    function startCooldown(kind, button) {
        cooldown[kind] = 60;
        button.disabled = true;
        button.textContent = cooldown[kind] + 's';
        clearInterval(timer[kind]);
        timer[kind] = setInterval(function () {
            cooldown[kind] -= 1;
            if (cooldown[kind] <= 0) {
                clearInterval(timer[kind]);
                button.disabled = false;
                button.textContent = '获取验证码';
                return;
            }
            button.textContent = cooldown[kind] + 's';
        }, 1000);
    }

    function resetSms(kind) {
        sent[kind] = '';
        cooldown[kind] = 0;
        clearInterval(timer[kind]);
        var button = document.querySelector('[data-sms="' + kind + '"]');
        if (!button) return;
        button.disabled = false;
        button.textContent = '获取验证码';
    }

    function sendSms(kind) {
        var input = document.querySelector('[data-phone="' + kind + '"]');
        var phone = digits(input && input.value);
        if (phone.length !== 11) {
            toast('请输入11位手机号');
            return;
        }
        var exists = findAccount(phone);
        if (kind === 'login') {
            if (rejectLoginAccount(exists)) return;
        }
        if (kind === 'register' && exists) {
            toast(isPending(exists) ? '该手机号已提交注册' : '该手机号已注册');
            return;
        }
        sent[kind] = phone;
        startCooldown(kind, document.querySelector('[data-sms="' + kind + '"]'));
        toast('验证码已发送，演示验证码 ' + DEMO_CODE);
    }

    function checkCode(kind, phone, code) {
        if (sent[kind] !== phone) {
            toast('请先获取验证码');
            return false;
        }
        if (!code) {
            toast('请输入验证码');
            return false;
        }
        if (code !== DEMO_CODE) {
            toast('验证码错误');
            return false;
        }
        return true;
    }

    function ocrRoot(kind) {
        return document.querySelector('[data-ocr-result="' + kind + '"]');
    }

    function fillSample(kind, sample) {
        var root = ocrRoot(kind);
        if (!root) return;
        Object.keys(sample).forEach(function (key) {
            var input = root.querySelector('[data-ocr="' + key + '"]');
            if (input) input.value = sample[key];
        });
    }

    function applyOcr(kind, label) {
        var box = document.querySelector('[data-upload="' + kind + '"]');
        var result = document.querySelector('[data-ocr-result="' + kind + '"]');
        var text = box && box.querySelector('[data-upload-text]');
        if (text) text.textContent = '识别中…';
        window.setTimeout(function () {
            uploaded[kind] = true;
            fillSample(kind, kind === 'license' ? LICENSE_SAMPLE : PERMIT_SAMPLE);
            if (text) text.textContent = label || '已上传';
            if (box) box.classList.add('is-done');
            if (result) result.hidden = false;
            toast(kind === 'license' ? '已识别营业执照' : '已识别经营许可证');
            if (result && result.scrollIntoView) result.scrollIntoView({ block: 'nearest' });
        }, 400);
    }

    function collect(kind, sample) {
        var root = ocrRoot(kind);
        var data = {};
        Object.keys(sample).forEach(function (key) {
            var input = root ? root.querySelector('[data-ocr="' + key + '"]') : null;
            data[key] = input ? String(input.value || '').trim() : '';
        });
        return data;
    }

    document.getElementById('rbfH5Phone').addEventListener('click', function (event) {
        var modeBtn = event.target.closest('[data-login-mode]');
        if (modeBtn) {
            setLoginMode(modeBtn.getAttribute('data-login-mode'));
            var head = document.getElementById('rbfH5HeadText');
            if (document.getElementById('rbfH5Phone').classList.contains('is-login')) {
                head.textContent = loginMode === 'password' ? '密码登录' : '验证码登录';
            }
            return;
        }
        var sms = event.target.closest('[data-sms]');
        if (sms) {
            sendSms(sms.getAttribute('data-sms'));
            return;
        }
        var demo = event.target.closest('[data-demo]');
        if (demo) {
            var kind = demo.getAttribute('data-demo');
            applyOcr(kind, kind === 'license' ? '已使用示例营业执照' : '已使用示例经营许可证');
            return;
        }
        var fill = event.target.closest('[data-fill-phone]');
        if (fill) {
            var loginPhone = document.querySelector('[data-phone="login"]');
            if (loginPhone) loginPhone.value = fill.getAttribute('data-fill-phone');
            return;
        }
        if (event.target.closest('[data-go-register]')) {
            setMode('register');
            return;
        }
        if (event.target.closest('[data-go-login]')) {
            setMode('login');
        }
    });

    document.getElementById('rbfH5Phone').addEventListener('input', function (event) {
        var input = event.target;
        if (input.hasAttribute('data-phone') || input.hasAttribute('data-code')) {
            input.value = digits(input.value);
        }
    });

    document.getElementById('rbfH5Phone').addEventListener('change', function (event) {
        var select = event.target;
        if (select.hasAttribute('data-license-type') || select.hasAttribute('data-biz-scope')) {
            select.classList.toggle('is-empty', !select.value);
        }
        var input = event.target.closest('[data-file]');
        if (!input) return;
        var file = input.files && input.files[0];
        if (!file) return;
        applyOcr(input.getAttribute('data-file'), file.name);
    });

    document.getElementById('rbfH5LoginForm').addEventListener('submit', function (event) {
        event.preventDefault();
        var phone = digits(document.querySelector('[data-phone="login"]').value);
        if (phone.length !== 11) {
            toast('请输入11位手机号');
            return;
        }
        var account = findAccount(phone);
        if (rejectLoginAccount(account)) return;
        if (loginMode === 'password') {
            var password = String(document.querySelector('[data-password="login"]').value || '');
            if (!password) {
                toast('请输入密码');
                return;
            }
            if (password !== accountPassword(account)) {
                toast('密码错误');
                return;
            }
        } else {
            var code = digits(document.querySelector('[data-code="login"]').value);
            if (!checkCode('login', phone, code)) return;
        }
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(account));
        showHome(account);
        toast('登录成功');
    });

    document.getElementById('rbfH5RegisterForm').addEventListener('submit', function (event) {
        event.preventDefault();
        var phone = digits(document.querySelector('[data-phone="register"]').value);
        var code = digits(document.querySelector('[data-code="register"]').value);
        if (phone.length !== 11) {
            toast('请输入11位手机号');
            return;
        }
        var exists = findAccount(phone);
        if (exists) {
            toast(isPending(exists) ? '该手机号已提交注册' : '该手机号已注册');
            return;
        }
        if (!checkCode('register', phone, code)) return;
        var licenseType = document.querySelector('[data-license-type]').value;
        var bizScope = document.querySelector('[data-biz-scope]').value;
        if (!licenseType) {
            toast('请选择牌照类型');
            return;
        }
        if (!bizScope) {
            toast('请选择业务范围');
            return;
        }
        if (!uploaded.license) {
            toast('请上传营业执照');
            return;
        }
        if (!uploaded.permit) {
            toast('请上传经营许可证');
            return;
        }
        var account = {
            phone: phone,
            password: DEMO_PASSWORD,
            status: '待审核',
            licenseType: licenseType,
            bizScope: bizScope,
            license: collect('license', LICENSE_SAMPLE),
            permit: collect('permit', PERMIT_SAMPLE)
        };
        var list = readList();
        list.push(account);
        writeList(list);
        document.querySelector('[data-phone="login"]').value = phone;
        document.querySelector('[data-code="login"]').value = '';
        document.querySelector('[data-password="login"]').value = '';
        resetSms('login');
        setMode('login');
        toast('注册申请已提交，请等待审核');
    });

    ensureDemoAccounts();
    renderAccounts();

    window.RbfH5TraderLogin = {
        logout: logout,
        changePassword: changePassword,
        currentAccount: function () { return currentAccount; },
        toast: toast
    };

    var current = readSession();
    var currentSaved = current && current.phone ? findAccount(current.phone) : null;
    if (currentSaved && isApproved(currentSaved)) showHome(currentSaved);
    else {
        if (current) sessionStorage.removeItem(SESSION_KEY);
        setMode('login');
    }
})();
