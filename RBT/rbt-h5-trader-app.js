/* 贸易商端登录后主界面：需求大厅、资产台账、我的。 */
(function () {
    var account = null;
    var tab = 'hall';
    var screen = 'home';
    var hallFilter = 'pending';
    var detailCode = '';
    var signCode = '';
    var signSummaryOpen = false;
    var collectFilter = 'pending';
    var collectCode = '';

    function esc(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function setHead(text) {
        var head = document.getElementById('rbtH5HeadText');
        var title = document.querySelector('.rbt-h5-phone__head h1');
        if (title) {
            title.textContent = screen === 'hall'
                ? '需求大厅'
                : (screen === 'detail' ? '需求详情' : (screen === 'sign' ? '合同签署' : '贸易商端'));
        }
        if (head) head.textContent = text;
    }

    function svgIcon(paths) {
        return '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">' + paths + '</svg>';
    }

    function traderName() {
        var license = account && account.license;
        return (license && license.name) || '贸易商';
    }

    /* 服务商档案中的账号不能看需求大厅，也不能接单。 */
    function archiveRow() {
        var name = traderName();
        var api = window.MdmTraderArchiveStore;
        if (!name || !api || typeof api.list !== 'function') return null;
        var found = null;
        (api.list() || []).some(function (row) {
            if (!row) return false;
            if (row.name === name || row.subjectName === name || (row.license && row.license.name === name)) {
                found = row;
                return true;
            }
            return false;
        });
        return found;
    }

    function isServiceProvider() {
        var name = traderName();
        var api = window.MdmProviderArchiveStore;
        if (name && api && typeof api.list === 'function') {
            var hit = (api.list() || []).some(function (row) {
                return !!(row && (row.name === name || row.subjectName === name || (row.license && row.license.name === name)));
            });
            if (hit) return true;
        }
        var row = archiveRow();
        return !!(row && row.subjectType === '服务商');
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
        if (isServiceProvider()) return [];
        return demandRows().filter(function (item) {
            return item && item.status === '待接单' && !item.traderName;
        }).sort(function (a, b) {
            return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
        });
    }

    function acceptedDemands() {
        if (isServiceProvider()) return [];
        var name = traderName();
        return demandRows().filter(function (item) {
            return item && item.traderName && item.traderName === name;
        }).sort(function (a, b) {
            return String(b.acceptedAt || b.updatedAt || '').localeCompare(String(a.acceptedAt || a.updatedAt || ''));
        });
    }

    function lineAmount(line) {
        var qty = Number(line && line.qty);
        var price = Number(line && line.salePrice);
        if (!isFinite(qty) || qty < 1) qty = 1;
        if (!isFinite(price)) return '—';
        return yuanText((Math.round(price * qty * 100) / 100).toFixed(2));
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

    function yuanText(value) {
        var text = String(value == null ? '' : value).trim();
        if (!text || text === '—') return '—';
        return text.charAt(0) === '¥' ? text : '¥' + text;
    }

    function hallCell(label, value) {
        return '<div class="rbt-hall-card__cell"><span>' + esc(label) + '</span><b>' + esc(value || '—') + '</b></div>';
    }

    function hallActions(item, accepted) {
        var code = esc(item.code);
        if (!accepted) return '<button type="button" class="rbt-hall-card__btn" data-accept="' + code + '">接单</button>';
        if (item.status === '待确认签约') {
            return '<button type="button" class="rbt-hall-card__btn is-ghost" data-withdraw="' + code + '">撤回接单</button>' +
                '<button type="button" class="rbt-hall-card__btn" data-confirm-deal="' + code + '">确认签约</button>';
        }
        if (item.status === '待签署') return '<button type="button" class="rbt-hall-card__btn" data-sign="' + code + '">去签署</button>';
        return '';
    }

    function hallStatus(item, accepted) {
        var status = accepted ? (item.status || '已接单') : '待接单';
        var statusClass = status === '已完成' ? ' is-done' : (status === '已作废' || status === '已驳回' ? ' is-off' : '');
        return { text: status, className: statusClass };
    }

    function hallSummary(item, accepted) {
        var status = hallStatus(item, accepted);
        var amounts = hallAmounts(item);
        return '<article class="rbt-hall-card">' +
            '<div class="rbt-hall-card__top"><h2 class="rbt-hall-card__name">' + esc(item.storeName || '—') + '</h2>' +
            '<span class="rbt-hall-card__status' + status.className + '">' + esc(status.text) + '</span></div>' +
            '<p class="rbt-hall-card__meta">' + esc(item.code || '—') + ' · ' + esc(item.packageName || '—') + ' ' + esc(item.packageCode || '—') + '</p>' +
            '<div class="rbt-hall-card__total"><span>总金额</span><b>' + esc(yuanText(amounts.total)) + '</b></div>' +
            '<div class="rbt-hall-card__grid">' +
            hallCell('商品金额', yuanText(amounts.goods)) +
            hallCell('服务费', yuanText(amounts.fee)) +
            hallCell('结算周期', item.repayCycle || '—') +
            hallCell('结算方式', item.repayMethod || '—') +
            '</div>';
    }

    function renderHallCard(item, accepted) {
        var actions = hallActions(item, accepted);
        return hallSummary(item, accepted).replace('<article class="rbt-hall-card">', '<article class="rbt-hall-card" data-demand="' + esc(item.code) + '">') +
            (actions ? '<div class="rbt-hall-card__foot">' + actions + '</div>' : '') +
            '</article>';
    }

    function renderHallSkus(item) {
        var lines = (item && item.skus) || [];
        if (!lines.length) return '<p class="rbt-hall-sheet__empty">暂无商品</p>';
        return lines.map(function (line) {
            var qty = Number(line && line.qty);
            if (!isFinite(qty) || qty < 1) qty = 1;
            var price = line && line.salePrice != null && line.salePrice !== '' ? yuanText(line.salePrice) : '—';
            var spec = [line && line.code, line && line.spec].filter(Boolean).join(' · ');
            return '<div class="rbt-hall-sku">' +
                '<div class="rbt-hall-sku__main"><strong>' + esc((line && (line.name || line.code)) || '—') + '</strong>' +
                '<p>' + esc(spec || '—') + '</p></div>' +
                '<div class="rbt-hall-sku__side"><b>' + esc(lineAmount(line)) + '</b><span>×' + qty + ' · ' + esc(price) + '</span></div>' +
                '</div>';
        }).join('');
    }

    /* 比例付不展示结算比例。其他结算方式在详情里展示期数。 */
    function renderHallSettle(item) {
        if (item && item.repayMethod && item.repayMethod !== '比例付') {
            return '<section class="rbt-hall-sheet"><h3>结算期数</h3>' +
                '<p class="rbt-hall-sheet__text">' + esc(item.repayPeriod || '—') + '期</p></section>';
        }
        return '';
    }

    function renderHallDetail(item) {
        var accepted = !!(item.traderName && item.traderName === traderName());
        return hallSummary(item, accepted) +
            '<p class="rbt-hall-card__meta">创建时间 ' + esc(item.createdAt || '—') + '</p>' +
            (accepted ? '<p class="rbt-hall-card__meta">接单时间 ' + esc(item.acceptedAt || '—') + '</p>' : '') +
            '</article>' +
            '<section class="rbt-hall-sheet"><h3>商品</h3>' + renderHallSkus(item) + '</section>' +
            renderHallSettle(item);
    }

    function syncHomeChrome() {
        var phone = document.getElementById('rbtH5Phone');
        var scroll = document.getElementById('rbtH5Scroll');
        var on = tab === 'hall' && screen === 'home';
        if (phone) {
            phone.classList.toggle('is-home', on);
            phone.classList.toggle('is-hall', screen === 'hall' || screen === 'detail');
            phone.classList.toggle('is-sign', screen === 'sign');
        }
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
            '<button type="button" class="rbt-h5-tool" data-entry="collect">' +
            '<span class="rbt-h5-tool__icon" style="background:' + orange + '">' + hall + '</span>' +
            '<span>收款</span></button>' +
            '</div></section></div>';
    }

    function ratioText(item) {
        var api = window.RbtSettleRatio;
        if (item && item.repayMethod === '比例付' && api && typeof api.textOf === 'function') {
            return api.textOf(item) || '—';
        }
        return item && item.repayPeriod ? String(item.repayPeriod) : '—';
    }

    function collectDemands(done) {
        return acceptedDemands().filter(function (item) {
            return item && item.status === (done ? '已完成' : '门店付款中');
        });
    }

    /* 贸易商收款看实际资方到账。门店付款中没有到账，已完成也不补到账。 */
    function renderCollect() {
        var done = collectFilter === 'done';
        var rows = collectDemands(done);
        setHead('收款');
        return '<div class="rbt-h5-bar"><button type="button" class="rbt-h5-back" data-back="home">返回</button></div>' +
            '<div class="rbt-repay-hero">' +
            '<div class="rbt-repay-switch" role="tablist">' +
            '<button type="button" data-collect-view="pending"' + (done ? '' : ' class="is-on"') + '>待收款</button>' +
            '<button type="button" data-collect-view="done"' + (done ? ' class="is-on"' : '') + '>已收款</button>' +
            '</div>' +
            '<p class="rbt-repay-hero__label">实际资方到账</p>' +
            '<p class="rbt-repay-hero__amt">未产生</p>' +
            '<button type="button" class="rbt-repay-go" data-collect-first ' + (rows.length ? '' : 'disabled') + '>账单明细</button>' +
            '<p class="rbt-repay-hero__note">' + (done
                ? '已完成只表示需求状态。实际资方到账未产生。'
                : '门店付款中表示贸易商已付款，门店按日还款。应履行未计算，不能记成已收款。') + '</p>' +
            '</div>' +
            (rows.length ? rows.map(function (item) {
                return '<button type="button" class="rbt-repay-row" data-collect="' + esc(item.code) + '">' +
                    '<span><span class="rbt-repay-row__title">' + esc(item.code) + '</span>' +
                    '<span class="rbt-repay-row__sub">' + esc(item.storeName || '—') + ' · 总金额 ¥' + esc(item.amount || '—') + '</span></span>' +
                    '<span class="rbt-repay-row__side' + (done ? ' is-done' : '') + '"><b>' + esc(item.status) + '</b><span>到账未产生</span></span></button>';
            }).join('') : '<div class="rbt-h5-empty">' + (done ? '暂无已完成的合作' : '暂无门店付款中的合作') + '</div>');
    }

    function renderCollectBill(item) {
        var done = item.status === '已完成';
        setHead('账单明细');
        var lines = [
            ['门店', (item.storeName || '—') + '（' + (item.storeCode || '—') + '）'],
            ['结算周期', item.repayCycle || '—'],
            ['结算方式', item.repayMethod || '—'],
            ['结算比例', ratioText(item)],
            ['应履行', done ? '完成依据待确认' : '未产生'],
            ['可结算', '未产生'],
            ['实际资方到账', '未产生'],
            ['原结算关联', '未生成']
        ];
        return '<div class="rbt-h5-bar"><button type="button" class="rbt-h5-back" data-back="collect">返回</button></div>' +
            '<section class="rbt-bill__head">' +
            '<div class="rbt-bill__top"><span class="rbt-bill__code">' + esc(item.code) + '</span><span class="rbt-bill__tag">' + esc(item.status || '—') + '</span></div>' +
            '<p class="rbt-bill__label">总金额</p>' +
            '<p class="rbt-bill__amt">' + esc(item.amount || '—') + '</p></section>' +
            '<section class="rbt-bill__sheet"><h3>账单明细</h3>' +
            lines.map(function (line) {
                return '<div class="rbt-bill__line"><span>' + esc(line[0]) + '</span><b>' + esc(line[1]) + '</b></div>';
            }).join('') +
            '</section>';
    }

    function render() {
        var scroll = document.getElementById('rbtH5Scroll');
        if (!scroll || !account) return;
        syncHomeChrome();
        if (tab === 'hall' && screen === 'sign') {
            setHead('合同签署');
            var signing = window.RbtDemandData && window.RbtDemandData.get(signCode);
            scroll.innerHTML = (window.RbtContractSign
                ? window.RbtContractSign.render(signing, { role: 'trader', name: traderName(), phone: account.phone }, {
                    layout: 'trader',
                    summaryOpen: signSummaryOpen,
                    amounts: signing ? hallAmounts(signing) : {}
                })
                : '<div class="rbt-h5-empty">合同签署页不可用</div>');
            return;
        }
        if (tab === 'hall' && screen === 'collect-bill') {
            var collectBill = acceptedDemands().filter(function (item) { return item.code === collectCode; })[0];
            scroll.innerHTML = collectBill
                ? renderCollectBill(collectBill)
                : '<div class="rbt-h5-bar"><button type="button" class="rbt-h5-back" data-back="collect">返回</button></div><div class="rbt-h5-empty">账单不存在</div>';
            return;
        }
        if (tab === 'hall' && screen === 'collect') {
            scroll.innerHTML = renderCollect();
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
        if (tab === 'hall' && screen === 'detail') {
            setHead('需求详情');
            var detailItem = null;
            demandRows().some(function (item) {
                if (item && item.code === detailCode) {
                    detailItem = item;
                    return true;
                }
                return false;
            });
            scroll.innerHTML = detailItem
                ? renderHallDetail(detailItem)
                : '<div class="rbt-h5-empty">需求单不存在</div>';
            scroll.scrollTop = 0;
            return;
        }
        setHead('需求大厅');
        var acceptedView = hallFilter === 'accepted';
        var pending = pendingDemands();
        var accepted = acceptedDemands();
        var hall = acceptedView ? accepted : pending;
        scroll.innerHTML = '<div class="rbt-h5-hall-tabs" role="tablist">' +
            '<button type="button" data-hall-tab="pending"' + (acceptedView ? '' : ' class="is-on"') + '>待接单(' + pending.length + ')</button>' +
            '<button type="button" data-hall-tab="accepted"' + (acceptedView ? ' class="is-on"' : '') + '>已接单(' + accepted.length + ')</button>' +
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
        if (phone) phone.classList.remove('is-home', 'is-hall', 'is-sign');
        if (scroll) {
            scroll.classList.remove('is-home');
            scroll.innerHTML = '';
        }
    }

    /* 接单成功后提示去已接单确认签约。稍后处理留在待接单。 */
    function closeAcceptDone() {
        document.querySelectorAll('[data-accept-done]').forEach(function (node) {
            node.remove();
        });
    }

    function openAcceptDone() {
        var phone = document.getElementById('rbtH5Phone');
        if (!phone) return;
        closeAcceptDone();
        var mask = document.createElement('div');
        mask.className = 'rbt-h5-pay-mask';
        mask.setAttribute('data-accept-done', '1');
        mask.innerHTML =
            '<div class="rbt-accept-dialog" role="dialog" aria-modal="true" aria-labelledby="rbtAcceptDoneTitle">' +
            '<h2 id="rbtAcceptDoneTitle">接单成功</h2>' +
            '<p>确定接单成功，需您在「已接单」里确认签约，一个需求单只能由一个贸易商接单</p>' +
            '<div class="rbt-accept-dialog__actions">' +
            '<button type="button" class="is-later" data-accept-later>稍后处理</button>' +
            '<button type="button" class="is-go" data-accept-go>去已接单确认</button>' +
            '</div></div>';
        mask.addEventListener('click', function (event) {
            if (event.target.closest('[data-accept-later]')) {
                closeAcceptDone();
                render();
                return;
            }
            if (event.target.closest('[data-accept-go]')) {
                closeAcceptDone();
                hallFilter = 'accepted';
                screen = 'hall';
                render();
            }
        });
        phone.appendChild(mask);
    }

    function closeWithdraw() {
        document.querySelectorAll('[data-withdraw-dialog]').forEach(function (node) {
            node.remove();
        });
    }

    /* 撤回前填写原因。点选后台配置的原因会填进输入框，也可以自己写。取消不改状态。 */
    function openWithdraw(code) {
        var phone = document.getElementById('rbtH5Phone');
        if (!phone) return;
        closeWithdraw();
        var api = window.RbtDemandData;
        var reasons = api && typeof api.withdrawReasons === 'function' ? api.withdrawReasons() : [];
        var chips = reasons.map(function (item) {
            return '<button type="button" data-withdraw-reason="' + esc(item) + '">' + esc(item) + '</button>';
        }).join('');
        var mask = document.createElement('div');
        mask.className = 'rbt-h5-pay-mask';
        mask.setAttribute('data-withdraw-dialog', '1');
        mask.innerHTML =
            '<div class="rbt-accept-dialog rbt-withdraw-dialog" role="dialog" aria-modal="true" aria-labelledby="rbtWithdrawTitle">' +
            '<h2 id="rbtWithdrawTitle">撤回接单</h2>' +
            '<p>撤回后需平台重新确认，确认前不能再次接单</p>' +
            (chips ? '<div class="rbt-withdraw-reasons">' + chips + '</div>' : '') +
            '<textarea maxlength="100" placeholder="请填写撤回原因"></textarea>' +
            '<div class="rbt-accept-dialog__actions">' +
            '<button type="button" class="is-later" data-withdraw-cancel>取消</button>' +
            '<button type="button" class="is-go" data-withdraw-ok>确认撤回</button>' +
            '</div></div>';
        mask.addEventListener('click', function (event) {
            var chip = event.target.closest('[data-withdraw-reason]');
            if (chip) {
                var picked = chip.getAttribute('data-withdraw-reason') || '';
                var input = mask.querySelector('textarea');
                if (input) input.value = picked;
                mask.querySelectorAll('[data-withdraw-reason]').forEach(function (node) {
                    node.classList.toggle('is-on', node === chip);
                });
                return;
            }
            if (event.target.closest('[data-withdraw-cancel]')) {
                closeWithdraw();
                return;
            }
            if (!event.target.closest('[data-withdraw-ok]')) return;
            var value = String((mask.querySelector('textarea') || {}).value || '').trim();
            if (!value) {
                toast('请填写撤回原因');
                return;
            }
            var withdrawResult = api && typeof api.withdrawAccept === 'function'
                ? api.withdrawAccept(code, { name: traderName(), phone: account && account.phone }, value)
                : { ok: false };
            closeWithdraw();
            if (withdrawResult && withdrawResult.ok) toast('已撤回接单，待平台重新确认');
            else if (withdrawResult && withdrawResult.reason === 'long') toast('撤回原因不超过 100 个字');
            else toast('当前不能撤回');
            render();
        });
        phone.appendChild(mask);
    }

    function closeConfirmSign() {
        document.querySelectorAll('[data-confirm-sign-dialog]').forEach(function (node) {
            node.remove();
        });
    }

    function moneyLabel(value) {
        var num = Number(value);
        if (!isFinite(num)) return '—';
        var cents = Math.round(num * 100);
        var abs = Math.abs(cents);
        return (cents < 0 ? '-' : '') + Math.floor(abs / 100) + '.' + String(abs % 100).padStart(2, '0');
    }

    function closeBalanceShort() {
        document.querySelectorAll('[data-balance-short]').forEach(function (node) {
            node.remove();
        });
    }

    /* 余额不够时拦住确认签署。我知道了不改状态。 */
    function openBalanceShort(check) {
        var phone = document.getElementById('rbtH5Phone');
        if (!phone) return;
        closeBalanceShort();
        var text = check && check.reason === 'amount'
            ? '暂时无法核对商品金额，请稍后再试'
            : '当前余额 ¥' + moneyLabel(check && check.balance) + '，本单需支付商品金额 ¥' + moneyLabel(check && check.need) + '。余额不足，请尽快充值后再确认签署。';
        var mask = document.createElement('div');
        mask.className = 'rbt-h5-pay-mask';
        mask.setAttribute('data-balance-short', '1');
        mask.innerHTML =
            '<div class="rbt-accept-dialog" role="dialog" aria-modal="true" aria-labelledby="rbtBalanceTitle">' +
            '<h2 id="rbtBalanceTitle">余额不足</h2>' +
            '<p>' + esc(text) + '</p>' +
            '<div class="rbt-accept-dialog__actions">' +
            '<button type="button" class="is-go" data-balance-ok>我知道了</button>' +
            '</div></div>';
        mask.addEventListener('click', function (event) {
            if (event.target.closest('[data-balance-ok]')) closeBalanceShort();
        });
        phone.appendChild(mask);
    }

    function traderActor() {
        return { role: 'trader', name: traderName(), phone: account && account.phone };
    }

    function blockIfBalanceShort(code) {
        var api = window.RbtDemandData;
        if (!api || typeof api.traderBalanceCheck !== 'function') return false;
        var check = api.traderBalanceCheck(code, traderActor());
        if (check && check.ok) return false;
        openBalanceShort(check || {});
        return true;
    }

    /* 确认签约前先说明会生成两份合同。稍后处理不改状态；去签署才确认并进入签署页。 */
    function openConfirmSign(code) {
        var phone = document.getElementById('rbtH5Phone');
        if (!phone) return;
        closeConfirmSign();
        var mask = document.createElement('div');
        mask.className = 'rbt-h5-pay-mask';
        mask.setAttribute('data-confirm-sign-dialog', '1');
        mask.innerHTML =
            '<div class="rbt-accept-dialog" role="dialog" aria-modal="true" aria-labelledby="rbtConfirmSignTitle">' +
            '<h2 id="rbtConfirmSignTitle">确认签约</h2>' +
            '<p>确认后将生成相关合同，进入合同签署页面</p>' +
            '<div class="rbt-accept-dialog__actions">' +
            '<button type="button" class="is-later" data-confirm-sign-later>稍后处理</button>' +
            '<button type="button" class="is-go" data-confirm-sign-go>去签署</button>' +
            '</div></div>';
        mask.addEventListener('click', function (event) {
            if (event.target.closest('[data-confirm-sign-later]')) {
                closeConfirmSign();
                return;
            }
            if (event.target.closest('[data-confirm-sign-go]')) {
                closeConfirmSign();
                if (blockIfBalanceShort(code)) return;
                var dealApi = window.RbtDemandData;
                var dealResult = dealApi && typeof dealApi.confirmSigning === 'function'
                    ? dealApi.confirmSigning(code, traderActor())
                    : { ok: false };
                if (dealResult && (dealResult.reason === 'balance' || dealResult.reason === 'amount')) {
                    openBalanceShort(dealResult);
                    return;
                }
                if (!(dealResult && dealResult.ok)) {
                    toast('当前不能确认签约');
                    render();
                    return;
                }
                signCode = code;
                tab = 'hall';
                screen = 'sign';
                hallFilter = 'accepted';
                signSummaryOpen = false;
                render();
            }
        });
        phone.appendChild(mask);
    }

    var headBack = document.getElementById('rbtH5HeadBack');
    if (headBack) {
        headBack.addEventListener('click', function () {
            if (screen === 'sign') {
                screen = 'hall';
                hallFilter = 'accepted';
                render();
                return;
            }
            if (screen === 'detail') {
                screen = 'hall';
                render();
                return;
            }
            if (screen !== 'hall') return;
            screen = 'home';
            render();
        });
    }

    document.getElementById('rbtH5App').addEventListener('click', function (event) {
        var entry = event.target.closest('[data-entry]');
        var hallTab = event.target.closest('[data-hall-tab]');
        var accept = event.target.closest('[data-accept]');
        var confirmDeal = event.target.closest('[data-confirm-deal]');
        var withdraw = event.target.closest('[data-withdraw]');
        var sign = event.target.closest('[data-sign]');
        var summaryToggle = event.target.closest('[data-sign-summary]');
        var confirmSign = event.target.closest('[data-confirm-sign]');
        var changePassword = event.target.closest('[data-change-password]');
        var savePassword = event.target.closest('[data-save-password]');
        var back = event.target.closest('[data-back]');
        var logout = event.target.closest('[data-logout]');
        if (summaryToggle) {
            signSummaryOpen = !signSummaryOpen;
            render();
            return;
        }
        if (confirmSign) {
            var signedCode = confirmSign.getAttribute('data-confirm-sign');
            if (blockIfBalanceShort(signedCode)) return;
            var signApi = window.RbtDemandData;
            var signResult = signApi && typeof signApi.signDemand === 'function'
                ? signApi.signDemand(signedCode, traderActor(), confirmSign.getAttribute('data-contract-key'))
                : { ok: false };
            if (signResult && (signResult.reason === 'balance' || signResult.reason === 'amount')) {
                openBalanceShort(signResult);
                return;
            }
            if (signResult && signResult.ok && signResult.done) toast('各方已完成签署，系统已自动划款，需求进入发货中');
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
            signSummaryOpen = false;
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
        if (entry && entry.getAttribute('data-entry') === 'collect') {
            tab = 'hall';
            screen = 'collect';
            collectFilter = 'pending';
            render();
            return;
        }
        if (confirmDeal) {
            openConfirmSign(confirmDeal.getAttribute('data-confirm-deal'));
            return;
        }
        if (withdraw) {
            openWithdraw(withdraw.getAttribute('data-withdraw'));
            return;
        }
        if (accept) {
            if (isServiceProvider()) {
                toast('服务商不能接单');
                return;
            }
            var code = accept.getAttribute('data-accept');
            var api = window.RbtDemandData;
            var result = api && typeof api.acceptDemand === 'function'
                ? api.acceptDemand(code, { name: traderName(), phone: account && account.phone })
                : { ok: false, reason: 'missing' };
            if (result && result.ok) openAcceptDone();
            else if (result && result.reason === 'provider') toast('服务商不能接单');
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
        var collectView = event.target.closest('[data-collect-view]');
        var collectBtn = event.target.closest('[data-collect]');
        var collectFirst = event.target.closest('[data-collect-first]');
        if (collectView) {
            collectFilter = collectView.getAttribute('data-collect-view') === 'done' ? 'done' : 'pending';
            tab = 'hall';
            screen = 'collect';
            render();
            return;
        }
        if (collectFirst || collectBtn) {
            var collectId = collectBtn ? collectBtn.getAttribute('data-collect') : '';
            if (!collectId) {
                var collectRow = collectDemands(collectFilter === 'done')[0];
                collectId = collectRow ? collectRow.code : '';
            }
            if (!collectId) return;
            collectCode = collectId;
            tab = 'hall';
            screen = 'collect-bill';
            render();
            return;
        }
        if (back) {
            screen = back.getAttribute('data-back') || 'mine';
            if (screen === 'hall') hallFilter = 'accepted';
            if (screen === 'collect') collectFilter = collectFilter || 'pending';
            tab = screen === 'home' || screen === 'hall' || screen === 'collect' ? 'hall' : 'mine';
            render();
            return;
        }
        var demandCard = event.target.closest('[data-demand]');
        if (demandCard && !event.target.closest('button')) {
            detailCode = demandCard.getAttribute('data-demand') || '';
            screen = 'detail';
            render();
            return;
        }
        if (logout && window.RbtH5TraderLogin) window.RbtH5TraderLogin.logout();
    });

    window.RbtH5TraderApp = { open: open, close: close };
})();
