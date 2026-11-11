/* 门店端无登录页：打开即进入门店；可切换门店。默认演示密码 123456。 */
(function () {
    var DEMO_PASSWORD = '123456';
    var SESSION_KEY = 'rbt_h5_store_session';
    var PASSWORD_KEY = 'rbt_h5_store_passwords_v1';

    function digits(value) {
        return String(value || '').replace(/\D/g, '');
    }

    function toast(message) {
        var node = document.getElementById('rbtH5Toast');
        if (!node) return;
        node.textContent = message;
        node.classList.add('is-on');
        clearTimeout(toast._t);
        toast._t = setTimeout(function () {
            node.classList.remove('is-on');
        }, 2200);
    }

    function readPasswords() {
        try {
            var raw = sessionStorage.getItem(PASSWORD_KEY);
            var map = raw ? JSON.parse(raw) : {};
            return map && typeof map === 'object' ? map : {};
        } catch (e) {
            return {};
        }
    }

    function writePasswords(map) {
        sessionStorage.setItem(PASSWORD_KEY, JSON.stringify(map));
    }

    function getPassword(phone) {
        var map = readPasswords();
        return map[phone] || DEMO_PASSWORD;
    }

    function setPassword(phone, password) {
        var map = readPasswords();
        map[phone] = password;
        writePasswords(map);
    }

    function accounts() {
        var stores = window.RbtStoreData && window.RbtStoreData.list ? window.RbtStoreData.list() : [];
        var grouped = {};
        stores.forEach(function (store) {
            if (!store || store.enabled === false) return;
            [
                { phone: digits(store.phone), role: '联系人', person: store.contact },
                { phone: digits(store.legalPhone), role: '法人', person: store.legalName }
            ].forEach(function (item) {
                if (item.phone.length !== 11) return;
                var key = item.phone + '|' + store.code;
                if (!grouped[key]) {
                    grouped[key] = { phone: item.phone, code: store.code, name: store.name, bizLine: store.bizLine || '', person: item.person || '', roles: [] };
                }
                if (grouped[key].roles.indexOf(item.role) < 0) grouped[key].roles.push(item.role);
                if (item.person && grouped[key].person.indexOf(item.person) < 0) {
                    grouped[key].person = grouped[key].person ? grouped[key].person + '、' + item.person : item.person;
                }
            });
        });
        return Object.keys(grouped).map(function (key) { return grouped[key]; });
    }

    /* 切换门店列表按门店去重，优先联系人手机号。 */
    function storeChoices() {
        var map = {};
        accounts().forEach(function (item) {
            if (!map[item.code] || item.roles.indexOf('联系人') >= 0) map[item.code] = item;
        });
        return Object.keys(map).map(function (code) { return map[code]; });
    }

    function esc(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function readSession() {
        try {
            var raw = sessionStorage.getItem(SESSION_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function showHome(account) {
        var phone = document.getElementById('rbtH5Phone');
        phone.classList.add('is-app');
        phone.classList.remove('is-pick');
        if (window.RbtH5StoreApp) window.RbtH5StoreApp.open(account);
    }

    function enter(account, withToast) {
        if (!account) return;
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(account));
        showHome(account);
        if (withToast) toast('已切换到 ' + account.name);
    }

    function resolveAccount(session) {
        var list = accounts();
        if (session && session.code) {
            var matched = null;
            list.some(function (item) {
                if (item.code === session.code && (!session.phone || item.phone === session.phone)) {
                    matched = item;
                    return true;
                }
                return false;
            });
            if (matched) return matched;
            list.some(function (item) {
                if (item.code === session.code) {
                    matched = item;
                    return true;
                }
                return false;
            });
            if (matched) return matched;
        }
        return storeChoices()[0] || list[0] || null;
    }

    function showPick() {
        var phone = document.getElementById('rbtH5Phone');
        var box = document.getElementById('rbtH5Pick');
        var title = document.querySelector('.rbt-h5-phone__head h1');
        var head = document.getElementById('rbtH5HeadText');
        var list = storeChoices();
        phone.classList.remove('is-app');
        phone.classList.add('is-pick');
        if (window.RbtH5StoreApp) window.RbtH5StoreApp.close();
        if (title) title.textContent = '门店端';
        if (head) head.textContent = '选择门店';
        box.innerHTML = list.length
            ? '<p class="rbt-h5-tip">请选择要进入的门店。</p>' + list.map(function (item, index) {
                return '<button type="button" data-pick="' + index + '"><strong>' + esc(item.name) + '</strong>' +
                    '<span>' + esc(item.code) + ' · ' + esc(item.bizLine || '—') + ' · ' + esc(item.roles.join('、')) + '</span></button>';
            }).join('')
            : '<div class="rbt-h5-empty">暂无可选门店</div>';
        showPick._list = list;
    }

    function changePassword(phone, oldPassword, nextPassword, confirmPassword) {
        if (!oldPassword) {
            toast('请输入原密码');
            return false;
        }
        if (oldPassword !== getPassword(phone)) {
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
        setPassword(phone, nextPassword);
        toast('密码已修改');
        return true;
    }

    function logout() {
        sessionStorage.removeItem(SESSION_KEY);
        showPick();
    }

    var switchStore = document.getElementById('rbtH5SwitchStore');
    if (switchStore) switchStore.addEventListener('click', logout);

    document.getElementById('rbtH5Pick').addEventListener('click', function (event) {
        var button = event.target.closest('[data-pick]');
        if (!button) return;
        var account = (showPick._list || [])[Number(button.getAttribute('data-pick'))];
        if (account) enter(account, true);
    });

    var boot = resolveAccount(readSession());
    if (boot) enter(boot, false);
    else showPick();

    window.RbtH5StoreLogin = {
        logout: logout,
        changePassword: changePassword,
        toast: toast
    };
})();
