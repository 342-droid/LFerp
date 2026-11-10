/* 贸易商端登录后主界面：需求大厅、资产台账、我的。 */
(function () {
    var account = null;
    var tab = 'hall';
    var screen = 'list';

    function esc(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function setHead(text) {
        var head = document.getElementById('rbtH5HeadText');
        if (head) head.textContent = text;
    }

    function render() {
        var scroll = document.getElementById('rbtH5Scroll');
        var buttons = document.querySelectorAll('#rbtH5Tabbar button');
        if (!scroll || !account) return;
        buttons.forEach(function (button) {
            button.classList.toggle('is-on', button.getAttribute('data-tab') === tab);
        });
        if (tab === 'mine') {
            setHead(screen === 'password' ? '修改密码' : '我的');
            if (screen === 'password') {
                scroll.innerHTML =
                    '<div class="rbt-h5-bar"><button type="button" class="rbt-h5-back" data-back="mine">返回</button></div>' +
                    '<section class="rbt-h5-card rbt-h5-mine">' +
                    '<div class="rbt-h5-field"><label for="rbtH5OldPwd">原密码</label><input id="rbtH5OldPwd" type="password" maxlength="32" placeholder="请输入原密码"></div>' +
                    '<div class="rbt-h5-field"><label for="rbtH5NewPwd">新密码</label><input id="rbtH5NewPwd" type="password" maxlength="32" placeholder="请输入新密码"></div>' +
                    '<div class="rbt-h5-field"><label for="rbtH5ConfirmPwd">确认新密码</label><input id="rbtH5ConfirmPwd" type="password" maxlength="32" placeholder="请再次输入新密码"></div>' +
                    '<p class="rbt-h5-tip">新密码至少 6 位。演示默认密码 123456。</p>' +
                    '<button type="button" class="rbt-h5-primary rbt-h5-publish" data-save-password>保存</button>' +
                    '</section>';
                return;
            }
            var license = account.license || {};
            var permit = account.permit || {};
            scroll.innerHTML =
                '<section class="rbt-h5-card rbt-h5-mine"><h2>' + esc(license.name || '贸易商') + '</h2>' +
                '<p>统一社会信用代码：' + esc(license.creditCode || '—') + '\n' +
                '法定代表人：' + esc(license.legal || '—') + '\n' +
                '许可证编号：' + esc(permit.no || '—') + '\n' +
                '牌照类型：' + esc(account.licenseType || '—') + '\n' +
                '业务范围：' + esc(account.bizScope || '—') + '\n' +
                '手机号：' + esc(account.phone || '') + '</p>' +
                '<button type="button" class="rbt-h5-action" data-change-password>修改密码</button>' +
                '<button type="button" class="rbt-h5-logout" data-logout>退出登录</button></section>';
            return;
        }
        if (tab === 'assets') {
            setHead('资产台账');
            scroll.innerHTML = '<div class="rbt-h5-empty">暂无资产台账</div>';
            return;
        }
        setHead('需求大厅');
        scroll.innerHTML = '<div class="rbt-h5-empty">暂无资金需求</div>';
    }

    function open(next) {
        account = next;
        tab = 'hall';
        screen = 'list';
        render();
    }

    function close() {
        account = null;
        tab = 'hall';
        screen = 'list';
        var scroll = document.getElementById('rbtH5Scroll');
        if (scroll) scroll.innerHTML = '';
    }

    document.getElementById('rbtH5Tabbar').addEventListener('click', function (event) {
        var button = event.target.closest('[data-tab]');
        if (!button || !account) return;
        tab = button.getAttribute('data-tab');
        if (tab === 'hall' || tab === 'assets') screen = 'list';
        else if (screen !== 'password') screen = 'mine';
        render();
    });

    document.getElementById('rbtH5App').addEventListener('click', function (event) {
        var changePassword = event.target.closest('[data-change-password]');
        var savePassword = event.target.closest('[data-save-password]');
        var back = event.target.closest('[data-back]');
        var logout = event.target.closest('[data-logout]');
        if (changePassword) {
            screen = 'password';
            render();
            return;
        }
        if (savePassword) {
            var oldPassword = String((document.getElementById('rbtH5OldPwd') || {}).value || '');
            var nextPassword = String((document.getElementById('rbtH5NewPwd') || {}).value || '');
            var confirmPassword = String((document.getElementById('rbtH5ConfirmPwd') || {}).value || '');
            if (window.RbtH5TraderLogin && window.RbtH5TraderLogin.changePassword(account.phone, oldPassword, nextPassword, confirmPassword)) {
                account = window.RbtH5TraderLogin.currentAccount() || account;
                screen = 'mine';
                render();
            }
            return;
        }
        if (back) {
            screen = back.getAttribute('data-back') || 'mine';
            tab = 'mine';
            render();
            return;
        }
        if (logout && window.RbtH5TraderLogin) window.RbtH5TraderLogin.logout();
    });

    window.RbtH5TraderApp = { open: open, close: close };
})();
