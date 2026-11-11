/* 合同签署：担保协议、销售合同、采购合同由各自双方确认。 */
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
        if (item.repayMethod === '比例付') return '结算比例：' + show(item.repayPeriod);
        if (!item.repayPeriod) return '';
        var text = String(item.repayPeriod).indexOf('期') >= 0 ? String(item.repayPeriod) : String(item.repayPeriod) + '期';
        return '结算期数：' + text;
    }

    function partyMatches(party, actor) {
        if (!party || !actor) return false;
        if (party.role === 'trader') return actor.role === 'trader' && !!party.name && party.name === (actor.name || '');
        if (party.role === 'supply') return actor.role === 'supply';
        if (actor.role === 'trader' || actor.role === 'supply') return false;
        return !!actor.code && party.code === actor.code && (party.role === 'store' || party.role === 'guarantor');
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

    function render(item, actor) {
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
                '<p>' + (contract.type === 'guarantee' ? '协议编号' : '合同编号') + '：' + esc(contract.code) + '</p>' +
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
            tip = '<p class="rbt-sign-tip">担保协议由担保门店与需求门店签署，销售合同由需求门店与贸易商签署，采购合同由贸易商与冷丰供应链签署。</p>';
        }
        var daily = item.repayMethod === '比例付' || !item.dailyAmount ? '' : '<p>预估每日结算货款：' + money(item.dailyAmount) + '</p>';
        return '<section class="rbt-sign-card">' +
            '<h2>需求单 ' + esc(item.code) + '</h2>' +
            '<p>需求门店：' + esc(show(item.storeName)) + '（' + esc(show(item.storeCode)) + '）</p>' +
            '<p>货款总金额：' + money(item.amount) + '</p>' +
            '<p>结算周期：' + esc(show(item.repayCycle)) + '</p>' +
            '<p>结算方式：' + esc(show(item.repayMethod)) + '</p>' +
            (periodLine(item) ? '<p>' + esc(periodLine(item)) + '</p>' : '') +
            daily +
            '</section>' +
            cards +
            (tip ? '<section class="rbt-sign-card">' + tip + '</section>' : '');
    }

    window.RbtContractSign = { render: render };
})();
