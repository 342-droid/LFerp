/* 贸易商端登录后主界面：需求大厅、资产台账、我的。 */
(function () {
    var account = null;
    var tab = 'hall';
    var screen = 'home';
    var hallFilter = 'pending';
    var signCode = '';

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

    function svgIcon(paths) {
        return '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">' + paths + '</svg>';
    }

    function traderName() {
        var license = account && account.license;
        return (license && license.name) || '贸易商';
    }

    function toast(message) {
        if (window.RbtH5TraderLogin && window.RbtH5TraderLogin.toast) {
            window.RbtH5TraderLogin.toast(message);
        }
    }

    function demandRows() {
        var api = window.RbtDemandData;
        if (!api || typeof api.list !== 'function') return [];
        return api.list();
    }

    function pendingDemands() {
        return demandRows().filter(function (item) {
            return item && item.status === '待接单' && !item.traderName;
        }).sort(function (a, b) {
            return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
        });
    }

    function acceptedDemands() {
        var name = traderName();
        return demandRows().filter(function (item) {
            return item && item.traderName && item.traderName === name;
        }).sort(function (a, b) {
            return String(b.acceptedAt || b.updatedAt || '').localeCompare(String(a.acceptedAt || a.updatedAt || ''));
        });
    }

    function skuText(item) {
        return (item.skus || []).map(function (sku) {
            var name = sku.name || sku.code || '';
            return sku.qty != null && sku.qty !== '' ? name + '×' + sku.qty : name;
        }).filter(Boolean).join('、') || '—';
    }

    function centsOf(value) {
        var text = String(value == null ? '' : value).replace(/^¥/, '').replace(/,/g, '');
        if (!text || text === '—') return null;
        var num = Number(text);
        if (!isFinite(num)) return null;
        return Math.round(num * 100);
    }

    function fromCents(cents) {
        var sign = cents < 0 ? '-' : '';
        var abs = Math.abs(Math.round(cents));
        return sign + Math.floor(abs / 100) + '.' + String(abs % 100).padStart(2, '0');
    }

    /* 大厅总金额用需求单的贸易商应收，服务费按这个总金额减商品金额。 */
    function hallAmounts(item) {
        var goods = item && item.goodsAmount ? String(item.goodsAmount) : '';
        var api = window.RbtDemandData;
        var pack = api && typeof api.receivables === 'function' ? api.receivables(item) : null;
        var total = pack && pack.trader ? String(pack.trader) : '';
        var goodsCents = centsOf(goods);
        var totalCents = centsOf(total);
        var fee = goodsCents == null || totalCents == null ? '' : fromCents(totalCents - goodsCents);
        return {
            goods: goods || '—',
            fee: fee || '—',
            total: total || '—'
        };
    }

    function renderHallCard(item, accepted) {
        var status = accepted ? (item.status || '已接单') : '待接单';
        var statusClass = status === '已完成' ? ' is-done' : (status === '已作废' || status === '已驳回' ? ' is-off' : '');
        var amounts = hallAmounts(item);
        return '<article class="rbt-h5-card">' +
            '<div class="rbt-h5-card__top"><h2>' + esc(item.code) + '</h2>' +
            '<span class="rbt-h5-status' + statusClass + '">' + esc(status) + '</span></div>' +
            '<p>门店：' + esc(item.storeName || '—') + '</p>' +
            '<p>商品包：' + esc(item.packageName || '—') + '（' + esc(item.packageCode || '—') + '）</p>' +
            '<p>商品：' + esc(skuText(item)) + '</p>' +
            '<p>商品金额：¥' + esc(amounts.goods) + '</p>' +
            '<p>服务费：¥' + esc(amounts.fee) + '</p>' +
            '<p>总金额：¥' + esc(amounts.total) + '</p>' +
            (item.repayCycle
                ? '<p>结算周期：' + esc(item.repayCycle) + '</p>' +
                  '<p>结算方式：' + esc(item.repayMethod || '—') + '</p>' +
                  (item.repayMethod === '比例付'
                      ? ((window.RbtSettleRatio && RbtSettleRatio.textOf(item)) ? '<p>结算比例：' + esc(RbtSettleRatio.textOf(item)) + '</p>' : '')
                      : '<p>结算期数：' + esc(item.repayPeriod || '—') + '期</p>')
                : '') +
            '<p>创建时间：' + esc(item.createdAt || '—') + '</p>' +
            (accepted ? '<p>接单时间：' + esc(item.acceptedAt || '—') + '</p>' : '') +
            (accepted && item.status === '待确认签约'
                ? '<button type="button" class="rbt-h5-accept" data-confirm-deal="' + esc(item.code) + '">确认签约</button>' +
                  '<button type="button" class="rbt-h5-withdraw" data-withdraw="' + esc(item.code) + '">撤回接单</button>'
                : '') +
            (accepted && item.status === '待签署'
                ? '<button type="button" class="rbt-h5-accept" data-sign="' + esc(item.code) + '">去签署</button>'
                : '') +
            (accepted ? '' : '<button type="button" class="rbt-h5-accept" data-accept="' + esc(item.code) + '">接单</button>') +
            '</article>';
    }

    function syncHomeChrome() {
        var phone = document.getElementById('rbtH5Phone');
        var scroll = document.getElementById('rbtH5Scroll');
        var on = tab === 'hall' && screen === 'home';
        if (phone) phone.classList.toggle('is-home', on);
        if (scroll) scroll.classList.toggle('is-home', on);
    }

    /* 首页对齐门店端，不放扫码核销、售后。当前基础工具只放需求大厅。 */
    function renderHome() {
        var name = traderName();
        var orange = 'linear-gradient(180deg,#ff9a45,#ff7019)';
        var hall = svgIcon('<rect x="5" y="3.5" width="14" height="17" rx="2" stroke="#fff" stroke-width="1.6"/><path d="M9 8h6M9 12h6M9 16h4" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>');
        var bell = svgIcon('<path d="M6 16.5h12l-1.2-1.6V10a4.8 4.8 0 1 0-9.6 0v4.9L6 16.5z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M10 16.5a2 2 0 0 0 4 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>');
        var gear = svgIcon('<path fill="currentColor" d="M19.4 13.1c.1-.4.1-.7.1-1.1s0-.7-.1-1.1l1.7-1.3a.5.5 0 0 0 .1-.6l-1.6-2.8a.5.5 0 0 0-.6-.2l-2 .8a6.2 6.2 0 0 0-1.9-1.1l-.3-2.1a.5.5 0 0 0-.5-.4h-3.2a.5.5 0 0 0-.5.4l-.3 2.1c-.7.3-1.3.7-1.9 1.1l-2-.8a.5.5 0 0 0-.6.2L2.8 9a.5.5 0 0 0 .1.6l1.7 1.3c-.1.4-.1.7-.1 1.1s0 .7.1 1.1L2.9 14.4a.5.5 0 0 0-.1.6l1.6 2.8c.1.2.4.3.6.2l2-.8c.6.4 1.2.8 1.9 1.1l.3 2.1c0 .2.2.4.5.4h3.2c.3 0 .5-.2.5-.4l.3-2.1c.7-.3 1.3-.7 1.9-1.1l2 .8c.2.1.5 0 .6-.2l1.6-2.8a.5.5 0 0 0-.1-.6l-1.7-1.3zM12 15.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4z"/>');
        return '<div class="rbt-h5-home">' +
            '<header class="rbt-h5-home__bar">' +
            '<span class="rbt-h5-home__avatar">' + esc(name.slice(0, 1)) + '</span>' +
            '<strong class="rbt-h5-home__name">' + esc(name) + '</strong>' +
            '<span class="rbt-h5-home__tools">' + bell + gear + '</span>' +
            '</header>' +
            '<section class="rbt-h5-home__card">' +
            '<h2>基础工具</h2>' +
            '<div class="rbt-h5-home__grid">' +
            '<button type="button" class="rbt-h5-tool" data-entry="hall">' +
            '<span class="rbt-h5-tool__icon" style="background:' + orange + '">' + hall + '</span>' +
            '<span>需求大厅</span></button>' +
            '</div></section></div>';
    }

    function render() {
        var scroll = document.getElementById('rbtH5Scroll');
        if (!scroll || !account) return;
        syncHomeChrome();
        if (tab === 'hall' && screen === 'sign') {
            setHead('合同签署');
            var signing = window.RbtDemandData && window.RbtDemandData.get(signCode);
            scroll.innerHTML = '<div class="rbt-h5-bar"><button type="button" class="rbt-h5-back" data-back="hall">返回</button></div>' +
                (window.RbtContractSign
                    ? window.RbtContractSign.render(signing, { role: 'trader', name: traderName(), phone: account.phone })
                    : '<div class="rbt-h5-empty">合同签署页不可用</div>');
            return;
        }
        if (tab === 'hall' && screen === 'home') {
            setHead('首页');
            scroll.innerHTML = renderHome();
            return;
        }
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
        var acceptedView = hallFilter === 'accepted';
        var pending = pendingDemands();
        var accepted = acceptedDemands();
        var hall = acceptedView ? accepted : pending;
        scroll.innerHTML = '<div class="rbt-h5-bar"><button type="button" class="rbt-h5-back" data-back="home">返回</button></div>' +
            '<div class="rbt-h5-hall-tabs" role="tablist">' +
            '<button type="button" data-hall-tab="pending"' + (acceptedView ? '' : ' class="is-on"') + '>待接单<em>' + pending.length + '</em></button>' +
            '<button type="button" data-hall-tab="accepted"' + (acceptedView ? ' class="is-on"' : '') + '>已接单<em>' + accepted.length + '</em></button>' +
            '</div>' +
            (hall.length
                ? hall.map(function (item) { return renderHallCard(item, acceptedView); }).join('')
                : '<div class="rbt-h5-empty">' + (acceptedView ? '暂无已接单需求' : '暂无待接单需求') + '</div>');
    }

    function open(next) {
        account = next;
        tab = 'hall';
        screen = 'home';
        render();
    }

    function close() {
        account = null;
        tab = 'hall';
        screen = 'home';
        var phone = document.getElementById('rbtH5Phone');
        var scroll = document.getElementById('rbtH5Scroll');
        if (phone) phone.classList.remove('is-home');
        if (scroll) {
            scroll.classList.remove('is-home');
            scroll.innerHTML = '';
        }
    }

    document.getElementById('rbtH5App').addEventListener('click', function (event) {
        var entry = event.target.closest('[data-entry]');
        var hallTab = event.target.closest('[data-hall-tab]');
        var accept = event.target.closest('[data-accept]');
        var confirmDeal = event.target.closest('[data-confirm-deal]');
        var withdraw = event.target.closest('[data-withdraw]');
        var sign = event.target.closest('[data-sign]');
        var confirmSign = event.target.closest('[data-confirm-sign]');
        var changePassword = event.target.closest('[data-change-password]');
        var savePassword = event.target.closest('[data-save-password]');
        var back = event.target.closest('[data-back]');
        var logout = event.target.closest('[data-logout]');
        if (confirmSign) {
            var signedCode = confirmSign.getAttribute('data-confirm-sign');
            var signApi = window.RbtDemandData;
            var signResult = signApi && typeof signApi.signDemand === 'function'
                ? signApi.signDemand(signedCode, { role: 'trader', name: traderName(), phone: account && account.phone }, confirmSign.getAttribute('data-contract-key'))
                : { ok: false };
            if (signResult && signResult.ok && signResult.done) toast('各方已完成签署，需求进入待复核');
            else if (signResult && signResult.ok) toast('签署成功');
            else if (signResult && signResult.reason === 'signed') toast('你已签署');
            else toast('当前不能签署');
            render();
            return;
        }
        if (sign) {
            signCode = sign.getAttribute('data-sign') || '';
            tab = 'hall';
            screen = 'sign';
            hallFilter = 'accepted';
            render();
            return;
        }
        if (hallTab) {
            hallFilter = hallTab.getAttribute('data-hall-tab') === 'accepted' ? 'accepted' : 'pending';
            render();
            return;
        }
        if (entry && entry.getAttribute('data-entry') === 'hall') {
            tab = 'hall';
            screen = 'hall';
            hallFilter = 'pending';
            render();
            return;
        }
        if (confirmDeal) {
            var dealCode = confirmDeal.getAttribute('data-confirm-deal');
            if (!window.confirm('确认签约「' + dealCode + '」？确认后生成销售合同和采购合同，进入签署。')) return;
            var dealApi = window.RbtDemandData;
            var dealResult = dealApi && typeof dealApi.confirmSigning === 'function'
                ? dealApi.confirmSigning(dealCode, { name: traderName(), phone: account && account.phone })
                : { ok: false };
            if (dealResult && dealResult.ok) toast('已确认签约，可以去签署');
            else toast('当前不能确认签约');
            render();
            return;
        }
        if (withdraw) {
            var withdrawCode = withdraw.getAttribute('data-withdraw');
            if (!window.confirm('确认撤回接单「' + withdrawCode + '」？撤回后需求回到待接单。')) return;
            var withdrawApi = window.RbtDemandData;
            var withdrawResult = withdrawApi && typeof withdrawApi.withdrawAccept === 'function'
                ? withdrawApi.withdrawAccept(withdrawCode, { name: traderName(), phone: account && account.phone })
                : { ok: false };
            if (withdrawResult && withdrawResult.ok) toast('已撤回接单');
            else toast('当前不能撤回');
            render();
            return;
        }
        if (accept) {
            var code = accept.getAttribute('data-accept');
            if (!window.confirm('确认接单「' + code + '」？一笔需求单只能由一个贸易商接单。')) return;
            var api = window.RbtDemandData;
            var result = api && typeof api.acceptDemand === 'function'
                ? api.acceptDemand(code, { name: traderName(), phone: account && account.phone })
                : { ok: false, reason: 'missing' };
            if (result && result.ok) toast('接单成功');
            else if (result && result.reason === 'missing') toast('需求单不存在');
            else toast('该需求单已被接单');
            render();
            return;
        }
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
            if (screen === 'hall') hallFilter = 'accepted';
            tab = screen === 'home' || screen === 'hall' ? 'hall' : 'mine';
            render();
            return;
        }
        if (logout && window.RbtH5TraderLogin) window.RbtH5TraderLogin.logout();
    });

    window.RbtH5TraderApp = { open: open, close: close };
})();
