/* 合同签署：销售合同、采购合同由各自双方确认。 */
(function () {
    function esc(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function show(value) {
        return value == null || String(value).trim() === '' ? '—' : String(value);
    }

    function money(value) {
        return value == null || String(value).trim() === '' ? '—' : '¥' + value;
    }

    function periodLine(item) {
        if (!item) return '';
        if (item.repayMethod === '比例付') {
            var ratioApi = window.RbtSettleRatio;
            var ratioText = ratioApi && typeof ratioApi.textLines === 'function' ? ratioApi.textLines(item) : '';
            return ratioText ? '结算比例：\n' + ratioText : '';
        }
        if (!item.repayPeriod) return '';
        var text = String(item.repayPeriod).indexOf('期') >= 0 ? String(item.repayPeriod) : String(item.repayPeriod) + '期';
        return '结算期数：' + text;
    }

    function partyMatches(party, actor) {
        if (!party || !actor) return false;
        if (party.role === 'trader') return actor.role === 'trader' && !!party.name && party.name === (actor.name || '');
        if (party.role === 'supply') return actor.role === 'supply';
        if (actor.role === 'trader' || actor.role === 'supply') return false;
        return !!actor.code && party.code === actor.code && party.role === 'store';
    }

    function partyName(party) {
        if (party && party.name) return party.name;
        if (party && party.role === 'trader') return '待接单';
        return '—';
    }

    function partyState(party) {
        if (party && party.signedAt) return { text: '已签署 ' + party.signedAt, done: true };
        if (party && party.role === 'trader' && !party.name) return { text: '未接单', done: false };
        return { text: '待签署', done: false };
    }

    function render(item, actor, options) {
        if (options && options.layout === 'trader') return renderTrader(item, actor, options);
        if (!item) return '<div class="rbt-sign-empty">需求单不存在</div>';
        var api = window.RbtDemandData;
        var contracts = api && typeof api.signContracts === 'function' ? api.signContracts(item) : [];
        var actorParties = [];
        var cards = contracts.map(function (contract) {
            var canSign = false;
            var rows = (contract.parties || []).map(function (party) {
                var state = partyState(party);
                var extra = party.code && party.role !== 'trader' && party.role !== 'supply'
                    ? '（' + esc(party.code) + '）' : '';
                if (item.status === '待签署' && partyMatches(party, actor) && !party.signedAt) canSign = true;
                if (partyMatches(party, actor)) actorParties.push(party);
                return '<div class="rbt-sign-party">' +
                    '<div><b>' + esc(party.roleLabel) + '</b><span>' + esc(partyName(party)) + extra + '</span></div>' +
                    '<em class="' + (state.done ? 'is-done' : '') + '">' + esc(state.text) + '</em>' +
                    '</div>';
            }).join('');
            var action = canSign
                ? '<button type="button" class="rbt-sign-submit" data-confirm-sign="' + esc(item.code) + '" data-contract-key="' + esc(contract.key) + '">确认签署</button>'
                : '';
            return '<section class="rbt-sign-card">' +
                '<h2>' + esc(contract.name) + '</h2>' +
                '<p>合同编号：' + esc(contract.code) + '</p>' +
                rows + action +
                '</section>';
        }).join('');
        var pending = actorParties.some(function (party) { return !party.signedAt; });
        var allDone = contracts.length && contracts.every(function (contract) { return contract.signStatus === '已签署'; });
        var tip = '';
        if (allDone || item.status !== '待签署') {
            tip = '<p class="rbt-sign-tip">各方已完成签署，需求状态为' + esc(item.status || '—') + '。</p>';
        } else if (actor && actorParties.length && !pending) {
            tip = '<p class="rbt-sign-tip">你已签署，待其他方完成签署。</p>';
        } else if (!actor) {
            tip = '<p class="rbt-sign-tip">销售合同由需求门店与贸易商签署，采购合同由贸易商与冷丰供应链签署。</p>';
        }
        return '<section class="rbt-sign-card">' +
            '<h2>需求单 ' + esc(item.code) + '</h2>' +
            '<p>需求门店：' + esc(show(item.storeName)) + '（' + esc(show(item.storeCode)) + '）</p>' +
            '<p>商品金额：' + money(item.goodsAmount) + '</p>' +
            '<p>服务费：' + money(item.serviceFee) + '</p>' +
            '<p>总金额：' + money(item.amount) + '</p>' +
            '<p>结算周期：' + esc(show(item.repayCycle)) + '</p>' +
            '<p>结算方式：' + esc(show(item.repayMethod)) + '</p>' +
            (periodLine(item) ? '<p>' + esc(periodLine(item)) + '</p>' : '') +
            '</section>' +
            cards +
            (tip ? '<section class="rbt-sign-card">' + tip + '</section>' : '');
    }

    function yuan(value) {
        var text = String(value == null ? '' : value).trim();
        if (!text || text === '—') return '—';
        return text.charAt(0) === '¥' ? text : '¥' + text;
    }

    function partyLabel(party) {
        if (party && party.role === 'trader') return '我方';
        return (party && party.roleLabel) || '—';
    }

    function partyView(party) {
        if (party && party.signedAt) return { text: '已签署', time: party.signedAt, done: true };
        if (party && party.role === 'trader' && !party.name) return { text: '未接单', time: '', done: false };
        return { text: '待签署', time: '', done: false };
    }

    /* 贸易商端签署页：摘要可收起，合同里己方显示为「我方」。不展示结算比例。 */
    function renderTrader(item, actor, options) {
        if (!item) return '<div class="rbt-sign-empty">需求单不存在</div>';
        var api = window.RbtDemandData;
        var contracts = api && typeof api.signContracts === 'function' ? api.signContracts(item) : [];
        var amounts = options.amounts || {};
        var open = !!options.summaryOpen;
        var actorParties = [];
        var cards = contracts.map(function (contract) {
            var canSign = false;
            var rows = (contract.parties || []).map(function (party) {
                var state = partyView(party);
                if (item.status === '待签署' && partyMatches(party, actor) && !party.signedAt) canSign = true;
                if (partyMatches(party, actor)) actorParties.push(party);
                return '<div class="rbt-sign-party">' +
                    '<div><b>' + esc(partyLabel(party)) + '</b><span>' + esc(partyName(party)) + '</span></div>' +
                    '<div class="rbt-sign-party__state' + (state.done ? ' is-done' : '') + '">' +
                    '<em>' + esc(state.text) + '</em>' +
                    (state.time ? '<i>' + esc(state.time) + '</i>' : '') +
                    '</div></div>';
            }).join('');
            var action = canSign
                ? '<button type="button" class="rbt-sign-submit" data-confirm-sign="' + esc(item.code) + '" data-contract-key="' + esc(contract.key) + '">确认签署（我方）</button>'
                : '';
            return '<section class="rbt-sign-card">' +
                '<h2>' + esc(contract.name) + ' <span>' + esc(contract.code) + '</span></h2>' +
                rows + action +
                '</section>';
        }).join('');
        var selfPending = actorParties.some(function (party) { return !party.signedAt; });
        var allDone = contracts.length && contracts.every(function (contract) { return contract.signStatus === '已签署'; });
        var banner = item.status === '待签署' && actorParties.length && !selfPending && !allDone
            ? '<div class="rbt-sign-banner" role="status"><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M8 7.2V11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="8" cy="5" r="0.8" fill="currentColor"/></svg><span>您已完成签署，待其他方完成签署</span></div>'
            : '';
        var extra = item.repayMethod && item.repayMethod !== '比例付'
            ? '<div class="rbt-sign-block"><span>结算期数</span><p>' + esc(item.repayPeriod || '—') + '期</p></div>'
            : '';
        var detail = open
            ? '<div class="rbt-sign-grid">' +
              '<div><span>需求门店</span><b>' + esc(show(item.storeName)) + '</b></div>' +
              '<div><span>总金额</span><b class="is-amt">' + esc(yuan(amounts.total)) + '</b></div>' +
              '<div><span>商品金额</span><b>' + esc(yuan(amounts.goods)) + '</b></div>' +
              '<div><span>服务费</span><b>' + esc(yuan(amounts.fee)) + '</b></div>' +
              '<div><span>结算周期</span><b>' + esc(show(item.repayCycle)) + '</b></div>' +
              '<div><span>结算方式</span><b>' + esc(show(item.repayMethod)) + '</b></div>' +
              '</div>' +
              extra
            : '';
        var chevron = open
            ? '<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M2 4.5 6 8l4-3.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
            : '<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M4.5 2 8 6 4.5 10" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        return banner +
            '<section class="rbt-sign-card rbt-sign-brief">' +
            '<div class="rbt-sign-brief__top"><h2>需求单 ' + esc(item.code || '—') + '</h2>' +
            '<button type="button" class="rbt-sign-brief__toggle" data-sign-summary>' + (open ? '收起' : '展开') + chevron + '</button></div>' +
            '<p class="rbt-sign-brief__sub">' + esc(show(item.storeName)) + ' · ' + esc(show(item.packageName)) + ' · ' + esc(yuan(amounts.total)) + '</p>' +
            detail +
            '</section>' +
            cards;
    }

    window.RbtContractSign = { render: render };
})();
