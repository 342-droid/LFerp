/* 贸易商端登录后主界面：需求大厅、资产台账、我的。 */
(function () {
    var account = null;
    var tab = 'hall';
    var screen = 'home';
    var hallFilter = 'pending';
    var signCode = '';
    var collectFilter = 'open';
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
        var phone = document.getElementById('rbtH5Phone');
        if (phone && phone.classList.contains('is-app')) {
            if (title) title.textContent = text || '收款';
        }
        if (head) head.textContent = text || '';
    }

    /* 二级回到基础工具，三级回到上一级。首页和我的没有上一级。 */
    function backTarget() {
        if (!account) return '';
        if (screen === 'collect-bill') return 'collect';
        if (screen === 'sign') return 'hall';
        if (screen === 'password') return 'mine';
        if (screen === 'collect' || screen === 'hall') return 'home';
        return '';
    }

    function syncHeadBack() {
        var btn = document.getElementById('rbtH5HeadBack');
        if (!btn) return;
        btn.classList.toggle('is-on', !!backTarget());
    }

    function goBack(target) {
        screen = target || 'home';
        if (screen === 'hall') hallFilter = 'accepted';
        if (screen === 'collect') collectFilter = collectFilter === 'closed' ? 'closed' : 'open';
        tab = screen === 'mine' || screen === 'password' ? 'mine' : 'hall';
        render();
    }

    function svgIcon(paths) {
        return '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">' + paths + '</svg>';
    }

    function traderName() {
        var license = account && account.license;
        return (license && license.name) || '贸易商';
    }

    /* 主体类型以贸易商档案为准。服务商不能看需求大厅，也不能接单。 */
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
            (accepted && item.status === '待付款'
                ? '<button type="button" class="rbt-h5-accept" data-pay-online="' + esc(item.code) + '">在线支付</button>' +
                  '<button type="button" class="rbt-h5-withdraw" data-pay-offline="' + esc(item.code) + '">线下支付</button>'
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

    function phaseLabel(status) {
        if (status === '还款中') return '履约中';
        return status || '—';
    }

    function yuan(value) {
        if (value == null || value === '' || value === '—') return '—';
        return '¥' + value;
    }

    /* 已结款与履约详情同一套拆分：已发生日期的实际履行，按三方应收占比拆给贸易商。 */
    function traderSettled(item) {
        var daily = window.RbtDailyFulfill;
        var api = window.RbtDemandData;
        var days = daily && typeof daily.daysOf === 'function' ? daily.daysOf(item) : [];
        var pack = api && typeof api.receivables === 'function' ? api.receivables(item) : null;
        var empty = { total: '', shares: [] };
        if (!pack || !days.length) return empty;
        var keys = ['trader', 'lengfeng', 'provider'];
        var cents = {};
        var totalCents = 0;
        keys.forEach(function (key) {
            cents[key] = Math.max(0, centsOf(pack[key]) || 0);
            totalCents += cents[key];
        });
        if (!totalCents) return empty;
        var pool = 0;
        days.forEach(function (row) { pool += Math.round((Number(row.actual) || 0) * 100); });
        if (!pool) return { total: '0.00', shares: [] };
        var largest = 'trader';
        keys.forEach(function (key) {
            if (cents[key] >= cents[largest]) largest = key;
        });
        var traderTotal;
        if (largest === 'trader') {
            var used = 0;
            keys.forEach(function (key) {
                if (key === 'trader') return;
                used += Math.floor(pool * cents[key] / totalCents);
            });
            traderTotal = pool - used;
        } else {
            traderTotal = Math.floor(pool * cents.trader / totalCents);
        }
        var shares = [];
        var usedDay = 0;
        days.forEach(function (row, index) {
            var part;
            if (index === days.length - 1) part = traderTotal - usedDay;
            else {
                var dayPool = Math.round((Number(row.actual) || 0) * 100);
                part = pool ? Math.floor(dayPool * traderTotal / pool) : 0;
                usedDay += part;
            }
            shares.push({ date: row.date, channel: row.channel, amount: (part / 100).toFixed(2) });
        });
        return { total: (traderTotal / 100).toFixed(2), shares: shares };
    }

    var TRADER_ACCOUNTS = {
        '杭州鲜达贸易有限公司': { accountName: '杭州鲜达贸易有限公司', accountNo: '6230610210001001007' },
        '上海冷链融资租赁有限公司': { accountName: '上海冷链融资租赁有限公司', accountNo: '6217920210001002008' }
    };

    function fundOf(item) {
        var amounts = hallAmounts(item);
        var settled = traderSettled(item);
        return {
            receivable: amounts.total,
            goods: amounts.goods,
            fee: amounts.fee,
            settled: settled.total,
            shares: settled.shares,
            account: TRADER_ACCOUNTS[item && item.traderName] || TRADER_ACCOUNTS[traderName()] || null
        };
    }

    function closedBid(item) {
        return item && (item.status === '已完成' || item.status === '已作废' || item.status === '已驳回');
    }

    function collectDemands(closed) {
        return acceptedDemands().filter(function (item) {
            return closed ? closedBid(item) : !closedBid(item);
        });
    }

    function sumMoney(rows, field) {
        var total = 0;
        var any = false;
        rows.forEach(function (row) {
            var cents = centsOf(row[field]);
            if (cents == null) return;
            any = true;
            total += cents;
        });
        return any ? fromCents(total) : '';
    }

    function renderCollect() {
        var closed = collectFilter === 'closed';
        var rows = collectDemands(closed);
        var funds = rows.map(function (item) { return fundOf(item); });
        var receivable = sumMoney(funds, 'receivable');
        var settled = sumMoney(funds, 'settled');
        setHead('收款');
        return '<div class="rbt-fund">' +
            '<div class="rbt-fund__tabs" role="tablist">' +
            '<button type="button" data-collect-view="open"' + (closed ? '' : ' class="is-on"') + '>跟进中</button>' +
            '<button type="button" data-collect-view="closed"' + (closed ? ' class="is-on"' : '') + '>已结束</button>' +
            '</div>' +
            '<div class="rbt-fund__summary">' +
            '<div><span>笔数</span><b>' + rows.length + '</b></div>' +
            '<div><span>应收</span><b>' + esc(receivable ? yuan(receivable) : '—') + '</b></div>' +
            '<div><span>已结款</span><b>' + esc(settled ? yuan(settled) : '未产生') + '</b></div>' +
            '</div>' +
            '<p class="rbt-fund__note">一笔已接单一张。应收在商品金额和结算系数确定后就有。已结款要等当天营业流水发生，按实际履行拆给贸易商。未发生的日期不算。</p>' +
            (rows.length ? rows.map(function (item) {
                var fund = fundOf(item);
                var tagClass = item.status === '已完成' ? ' is-done' : (item.status === '已作废' || item.status === '已驳回' ? ' is-off' : '');
                return '<button type="button" class="rbt-fund-card" data-collect="' + esc(item.code) + '">' +
                    '<div class="rbt-fund-card__top"><strong>' + esc(item.code) + '</strong>' +
                    '<span class="rbt-fund-card__tag' + tagClass + '">' + esc(phaseLabel(item.status)) + '</span></div>' +
                    '<p class="rbt-fund-card__store">' + esc(item.storeName || '—') + '</p>' +
                    '<div class="rbt-fund-card__metrics">' +
                    '<div><span>应收</span><b>' + esc(yuan(fund.receivable)) + '</b></div>' +
                    '<div><span>已结款</span><b>' + esc(fund.settled ? yuan(fund.settled) : '未产生') + '</b></div>' +
                    '</div></button>';
            }).join('') : '<div class="rbt-h5-empty">' + (closed ? '暂无已结束的接单' : '暂无跟进中的接单') + '</div>') +
            '</div>';
    }

    function renderCollectBill(item) {
        var fund = fundOf(item);
        var account = fund.account || { accountName: '—', accountNo: '—' };
        setHead('资金明细');
        var lines = [
            ['门店', (item.storeName || '—') + '（' + (item.storeCode || '—') + '）'],
            ['商品金额', yuan(fund.goods)],
            ['服务费', yuan(fund.fee)],
            ['结算周期', item.repayCycle || '—'],
            ['结算方式', item.repayMethod || '—'],
            ['结算比例', ratioText(item)],
            ['收款账户名称', account.accountName || '—'],
            ['收款账户', account.accountNo || '—']
        ];
        var tagClass = item.status === '已完成' ? ' is-done' : (item.status === '已作废' || item.status === '已驳回' ? ' is-off' : '');
        var shares = fund.shares.slice().reverse();
        return '<section class="rbt-fund-detail">' +
            '<div class="rbt-fund-detail__head">' +
            '<div class="rbt-fund-card__top"><strong>' + esc(item.code) + '</strong>' +
            '<span class="rbt-fund-card__tag' + tagClass + '">' + esc(phaseLabel(item.status)) + '</span></div>' +
            '<div class="rbt-fund-detail__metrics">' +
            '<div><span>应收</span><b>' + esc(yuan(fund.receivable)) + '</b></div>' +
            '<div><span>已结款</span><b>' + esc(fund.settled ? yuan(fund.settled) : '未产生') + '</b></div>' +
            '</div></div>' +
            '<p class="rbt-fund__note">已结款是这笔接单里，已发生日期的实际履行拆给贸易商的金额。没有营业流水时不预造。</p>' +
            '<section class="rbt-bill__sheet">' +
            lines.map(function (line) {
                return '<div class="rbt-bill__line"><span>' + esc(line[0]) + '</span><b>' + esc(line[1]) + '</b></div>';
            }).join('') +
            '</section>' +
            '<h3>结款明细</h3>' +
            (shares.length
                ? shares.map(function (row) {
                    return '<div class="rbt-fund-day"><div><b>' + esc(String(row.date).slice(5)) + ' · ' + esc(row.channel) + '</b>' +
                        '<span>已结款 ' + esc(yuan(row.amount)) + '</span></div></div>';
                }).join('')
                : '<p class="rbt-fund__note">暂无结款明细。还没有已发生的营业流水。</p>') +
            '</section>';
    }

    function render() {
        var scroll = document.getElementById('rbtH5Scroll');
        if (!scroll || !account) return;
        syncHomeChrome();
        syncHeadBack();
        if (tab === 'hall' && screen === 'sign') {
            setHead('合同签署');
            var signing = window.RbtDemandData && window.RbtDemandData.get(signCode);
            var payActions = signing && signing.status === '待付款'
                ? '<section class="rbt-sign-card">' +
                  '<h2>支付</h2>' +
                  '<p>合同已签署，请选择支付方式。</p>' +
                  '<button type="button" class="rbt-h5-accept" data-pay-online="' + esc(signing.code) + '">在线支付</button>' +
                  '<button type="button" class="rbt-h5-withdraw" data-pay-offline="' + esc(signing.code) + '">线下支付</button>' +
                  '</section>'
                : '';
            scroll.innerHTML = (window.RbtContractSign
                    ? window.RbtContractSign.render(signing, { role: 'trader', name: traderName(), phone: account.phone })
                    : '<div class="rbt-h5-empty">合同签署页不可用</div>') +
                payActions;
            return;
        }
        if (tab === 'hall' && screen === 'collect-bill') {
            setHead('资金明细');
            var collectBill = acceptedDemands().filter(function (item) { return item.code === collectCode; })[0];
            scroll.innerHTML = collectBill
                ? renderCollectBill(collectBill)
                : '<div class="rbt-h5-empty">账单不存在</div>';
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
        scroll.innerHTML = '<div class="rbt-h5-hall-tabs" role="tablist">' +
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
        var title = document.querySelector('.rbt-h5-phone__head h1');
        var headBack = document.getElementById('rbtH5HeadBack');
        if (title) title.textContent = '贸易商端';
        if (headBack) headBack.classList.remove('is-on');
        if (phone) phone.classList.remove('is-home');
        if (scroll) {
            scroll.classList.remove('is-home');
            scroll.innerHTML = '';
        }
    }

    var headBackBtn = document.getElementById('rbtH5HeadBack');
    if (headBackBtn) {
        headBackBtn.addEventListener('click', function () {
            var target = backTarget();
            if (target) goBack(target);
        });
    }

    function finishPay(code, method) {
        var api = window.RbtDemandData;
        var result = api && typeof api.payDemand === 'function'
            ? api.payDemand(code, method, { name: traderName(), phone: account && account.phone })
            : { ok: false };
        if (result && result.ok) toast(method === 'offline' ? '已确认线下支付，需求进入待复核' : '支付完成，需求进入待复核');
        else toast('当前不能支付');
        render();
    }

    function closeOfflinePay() {
        document.querySelectorAll('[data-pay-dialog]').forEach(function (node) {
            node.remove();
        });
    }

    /* 线下支付先确认。取消不改状态。 */
    function openOfflinePay(code) {
        var phone = document.getElementById('rbtH5Phone');
        if (!phone) return;
        closeOfflinePay();
        var mask = document.createElement('div');
        mask.className = 'rbt-h5-pay-mask';
        mask.setAttribute('data-pay-dialog', '1');
        mask.innerHTML =
            '<div class="rbt-h5-pay-dialog" role="dialog" aria-modal="true">' +
            '<p>请进行线下打款，相关信息请联系平台处理</p>' +
            '<div class="rbt-h5-pay-dialog__actions">' +
            '<button type="button" data-pay-cancel>取消</button>' +
            '<button type="button" data-pay-ok>确认</button>' +
            '</div></div>';
        phone.appendChild(mask);
        mask.addEventListener('click', function (event) {
            if (event.target.closest('[data-pay-cancel]')) {
                closeOfflinePay();
                return;
            }
            if (event.target.closest('[data-pay-ok]')) {
                closeOfflinePay();
                finishPay(code, 'offline');
            }
        });
    }

    document.getElementById('rbtH5App').addEventListener('click', function (event) {
        var entry = event.target.closest('[data-entry]');
        var hallTab = event.target.closest('[data-hall-tab]');
        var accept = event.target.closest('[data-accept]');
        var confirmDeal = event.target.closest('[data-confirm-deal]');
        var withdraw = event.target.closest('[data-withdraw]');
        var sign = event.target.closest('[data-sign]');
        var confirmSign = event.target.closest('[data-confirm-sign]');
        var payOnline = event.target.closest('[data-pay-online]');
        var payOffline = event.target.closest('[data-pay-offline]');
        var changePassword = event.target.closest('[data-change-password]');
        var savePassword = event.target.closest('[data-save-password]');
        var back = event.target.closest('[data-back]');
        var logout = event.target.closest('[data-logout]');
        if (payOnline) {
            finishPay(payOnline.getAttribute('data-pay-online'), 'online');
            return;
        }
        if (payOffline) {
            openOfflinePay(payOffline.getAttribute('data-pay-offline'));
            return;
        }
        if (confirmSign) {
            var signedCode = confirmSign.getAttribute('data-confirm-sign');
            var signApi = window.RbtDemandData;
            var signResult = signApi && typeof signApi.signDemand === 'function'
                ? signApi.signDemand(signedCode, { role: 'trader', name: traderName(), phone: account && account.phone }, confirmSign.getAttribute('data-contract-key'))
                : { ok: false };
            if (signResult && signResult.ok && signResult.done) toast('各方已完成签署，请选择支付方式');
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
        if (entry && entry.getAttribute('data-entry') === 'collect') {
            tab = 'hall';
            screen = 'collect';
            collectFilter = 'open';
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
            if (!window.confirm('确认撤回接单「' + withdrawCode + '」？撤回后需平台重新确认，确认前不能再次接单。')) return;
            var withdrawApi = window.RbtDemandData;
            var withdrawResult = withdrawApi && typeof withdrawApi.withdrawAccept === 'function'
                ? withdrawApi.withdrawAccept(withdrawCode, { name: traderName(), phone: account && account.phone })
                : { ok: false };
            if (withdrawResult && withdrawResult.ok) toast('已撤回接单，待平台重新确认');
            else toast('当前不能撤回');
            render();
            return;
        }
        if (accept) {
            if (isServiceProvider()) {
                toast('服务商不能接单');
                return;
            }
            var code = accept.getAttribute('data-accept');
            if (!window.confirm('确认接单「' + code + '」？一笔需求单只能由一个贸易商接单。')) return;
            var api = window.RbtDemandData;
            var result = api && typeof api.acceptDemand === 'function'
                ? api.acceptDemand(code, { name: traderName(), phone: account && account.phone })
                : { ok: false, reason: 'missing' };
            if (result && result.ok) toast('接单成功');
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
        if (collectView) {
            collectFilter = collectView.getAttribute('data-collect-view') === 'closed' ? 'closed' : 'open';
            tab = 'hall';
            screen = 'collect';
            render();
            return;
        }
        if (collectBtn) {
            var collectId = collectBtn.getAttribute('data-collect') || '';
            if (!collectId) return;
            collectCode = collectId;
            tab = 'hall';
            screen = 'collect-bill';
            render();
            return;
        }
        if (back) {
            goBack(back.getAttribute('data-back') || 'home');
            return;
        }
        if (logout && window.RbtH5TraderLogin) window.RbtH5TraderLogin.logout();
    });

    window.RbtH5TraderApp = { open: open, close: close };
})();
