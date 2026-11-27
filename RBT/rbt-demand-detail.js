/* RBT 需求单详情：在当前页弹出，展示需求基础信息、门店额度、商品明细与关联合同。 */
(function () {
    function esc(value) {
        return String(value == null || value === '' ? '—' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function blank(value) {
        return value == null || String(value).trim() === '';
    }

    function show(value) {
        return blank(value) ? '—' : String(value);
    }

    function receivableOf(item, key) {
        var api = window.RbtDemandData;
        var pack = api && typeof api.deductSettlement === 'function' ? api.deductSettlement(item) : null;
        return pack && pack[key];
    }

    function money(value) {
        if (blank(value) && value !== 0) return '—';
        var num = Number(String(value).replace(/^¥/, ''));
        if (!isFinite(num)) return '—';
        return '¥' + num.toLocaleString('zh-CN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function statusKind(status) {
        if (status === '已完成' || status === '已签署') return 'success';
        if (status === '已作废' || status === '已取消' || status === '已驳回') return 'neutral';
        if (status === '待确认签约' || status === '待重新确认' || status === '待签署' || status === '待付款' || status === '发货中') return 'warning';
        if (status === '门店付款中') return 'danger';
        return 'neutral';
    }

    function storeByCode(code) {
        var api = window.RbtStoreData;
        if (!api || typeof api.get !== 'function' || blank(code)) return null;
        return api.get(code) || null;
    }

    function quotaOf(store) {
        var api = window.RbtStoreData;
        if (!api || typeof api.quotaOf !== 'function' || !store) {
            return { total: null, occupied: null, available: null };
        }
        return api.quotaOf(store);
    }

    function cell(label, valueHtml) {
        return (
            '<div class="supplier-detail-cell"><div class="supplier-detail-cell__label">' +
            esc(label) +
            '</div><div class="supplier-detail-cell__body">' +
            valueHtml +
            '</div></div>'
        );
    }

    function textCell(label, value) {
        return cell(label, esc(value));
    }

    function statusCell(label, value, text) {
        return cell(
            label,
            '<span class="mdm-detail-tag mdm-detail-tag--' +
                statusKind(value) +
                '">' +
                esc(text || value || '—') +
                '</span>'
        );
    }

    function periodLabel(item) {
        return item && item.repayMethod === '比例付' ? '结算比例' : '结算期数';
    }

    function periodValue(item) {
        if (!item) return '—';
        var ratioApi = window.RbtSettleRatio;
        if (item.repayMethod === '比例付') {
            var lines = ratioApi && typeof ratioApi.textLines === 'function' ? ratioApi.textLines(item) : '';
            return lines || '—';
        }
        if (blank(item.repayPeriod)) return '—';
        return String(item.repayPeriod).indexOf('期') >= 0
            ? String(item.repayPeriod)
            : String(item.repayPeriod) + '期';
    }

    function settleRatioSection(item) {
        var ratioApi = window.RbtSettleRatio;
        if (ratioApi && typeof ratioApi.ensureDialogChrome === 'function') ratioApi.ensureDialogChrome();
        var html = ratioApi && typeof ratioApi.tableHtml === 'function' ? ratioApi.tableHtml(item) : '';
        if (!html) return '';
        var edit = ratioApi && typeof ratioApi.canEdit === 'function' && ratioApi.canEdit(item)
            ? '<button type="button" class="rbt-demand-contract-link" data-rbt-ratio-edit>修改结算比例</button>'
            : '';
        return '<div class="supplier-detail-section-title">结算比例' + edit + '</div>' + html;
    }

    function storeQuotaSection(item) {
        var store = storeByCode(item && item.storeCode);
        var quota = quotaOf(store);
        return (
            '<div class="supplier-detail-section-title">门店额度</div><div class="supplier-detail-grid">' +
            textCell('门店总额度', money(quota.total)) +
            textCell('已占用', money(quota.occupied)) +
            textCell('可用额度', money(quota.available)) +
            '</div>'
        );
    }

    function skuTable(items) {
        var head = '<tr><th>商品编码</th><th>商品名称</th><th class="is-money">售卖单价</th><th>商品数量</th><th class="is-money">售卖金额</th></tr>';
        var body = !items || !items.length
            ? '<tr><td class="is-empty" colspan="5">暂无商品</td></tr>'
            : items.map(function (item) {
                var qty = Number(item && item.qty);
                if (!isFinite(qty) || qty < 1) qty = 1;
                var price = Number(String(item && item.salePrice || '').replace(/^¥/, ''));
                var amount = isFinite(price) ? price * qty : NaN;
                return '<tr><td>' + esc(item && item.code) + '</td><td>' + esc(item && item.name) +
                    '</td><td class="is-money">' + esc(money(item && item.salePrice)) +
                    '</td><td>' + esc(qty) +
                    '</td><td class="is-money">' + esc(isFinite(amount) ? money(amount) : '—') + '</td></tr>';
            }).join('');
        return '<div class="rbt-demand-table-wrap"><table class="rbt-demand-table"><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>';
    }

    /* 付款详情里同一角色的应收、已结款合成一组：上面角色名，下面左应收、右已结款。 */
    function ensureAmountGroupStyle() {
        if (document.getElementById('rbtAmountGroupStyle')) return;
        var node = document.createElement('style');
        node.id = 'rbtAmountGroupStyle';
        node.textContent = '.rbt-demand-table th.rbt-amount-group{text-align:center;}' +
            '.rbt-demand-table thead th[rowspan]{vertical-align:middle;}';
        document.head.appendChild(node);
    }

    function shippedCents(item) {
        var cents = 0;
        (item && item.shipments || []).forEach(function (row) {
            cents += plainCents(row && row.amount);
        });
        return cents;
    }

    function amountTable(item, performance, manage) {
        var settled = performance ? settledOf(item) : null;
        var roles = [
            ['贸易商', 'trader'],
            ['冷丰', 'lengfeng'],
            ['服务商', 'provider']
        ];
        var cells = [
            money(item && item.goodsAmount),
            money(plainYuan(shippedCents(item))),
            money(item && item.serviceFee),
            money(item && item.amount)
        ];
        /* 需求单管理进入的详情不展示实付和三方应收。其他入口仍保留。 */
        if (manage && !settled) {
            var briefHead = '<tr><th class="is-money">商品金额</th><th class="is-money">已发货金额</th><th class="is-money">服务费</th><th class="is-money">总金额</th></tr>';
            var briefBody = '<tr>' + cells.map(function (value) {
                return '<td class="is-money">' + esc(value) + '</td>';
            }).join('') + '</tr>';
            return '<div class="rbt-demand-table-wrap"><table class="rbt-demand-table"><thead>' + briefHead + '</thead><tbody>' + briefBody + '</tbody></table></div>';
        }
        cells.push(money(receivableOf(item, 'traderPaid')));
        var head;
        if (settled) {
            ensureAmountGroupStyle();
            head = '<tr>' +
                '<th class="is-money" rowspan="2">商品金额</th>' +
                '<th class="is-money" rowspan="2">已发货金额</th>' +
                '<th class="is-money" rowspan="2">服务费</th>' +
                '<th class="is-money" rowspan="2">总金额</th>' +
                '<th class="is-money" rowspan="2">贸易商实付</th>' +
                roles.map(function (role) {
                    return '<th class="rbt-amount-group" colspan="2">' + role[0] + '</th>';
                }).join('') +
                '</tr><tr>' +
                roles.map(function () {
                    return '<th class="is-money">应收</th><th class="is-money">已结款</th>';
                }).join('') +
                '</tr>';
            roles.forEach(function (role) {
                cells.push(money(receivableOf(item, role[1])));
                cells.push(money(settled[role[1]]));
            });
        } else {
            head = '<tr><th class="is-money">商品金额</th><th class="is-money">已发货金额</th><th class="is-money">服务费</th><th class="is-money">总金额</th>' +
                '<th class="is-money">贸易商实付</th><th class="is-money">贸易商应收</th><th class="is-money">冷丰应收</th><th class="is-money">服务商应收</th></tr>';
            roles.forEach(function (role) {
                cells.push(money(receivableOf(item, role[1])));
            });
        }
        var body = '<tr>' + cells.map(function (value) {
            return '<td class="is-money">' + esc(value) + '</td>';
        }).join('') + '</tr>';
        return '<div class="rbt-demand-table-wrap"><table class="rbt-demand-table"><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>';
    }

    /* 收款方是主体。收款账户名称、收款账户用已有进件户，没有指定服务商时这三列留空。 */
    var PAYEE_ACCOUNTS = {
        '杭州鲜达贸易有限公司': { party: '杭州鲜达贸易有限公司', accountName: '杭州鲜达贸易有限公司', accountNo: '6230610210001001007' },
        '上海冷链融资租赁有限公司': { party: '上海冷链融资租赁有限公司', accountName: '上海冷链融资租赁有限公司', accountNo: '6217920210001002008' }
    };
    var LENGFENG_ACCOUNT = { party: '上海冷丰科技有限公司', accountName: '上海冷丰科技有限公司', accountNo: '6666000202016395' };

    function payeeAccount(name, fallback) {
        var key = String(name || '').trim();
        if (key && PAYEE_ACCOUNTS[key]) return PAYEE_ACCOUNTS[key];
        return fallback || { party: '', accountName: '', accountNo: '' };
    }

    function settledOf(item) {
        /* 门店回款整笔记给贸易商。冷丰和服务商在贸易商支付时结清，不从日后回款里再拆。 */
        var pack = {
            trader: Number(receivableOf(item, 'trader')) || 0,
            lengfeng: 0,
            provider: 0
        };
        var days = window.RbtDailyFulfill && typeof window.RbtDailyFulfill.daysOf === 'function'
            ? window.RbtDailyFulfill.daysOf(item)
            : [];
        var pool = (days || []).reduce(function (total, row) {
            return total + (Number(row.actual) || 0);
        }, 0);
        var keys = ['trader', 'lengfeng', 'provider'];
        var cents = {};
        var totalCents = 0;
        keys.forEach(function (key) {
            cents[key] = Math.max(0, Math.round(pack[key] * 100));
            totalCents += cents[key];
        });
        var poolCents = Math.max(0, Math.round(pool * 100));
        var out = { trader: '0.00', lengfeng: '0.00', provider: '0.00' };
        if (!totalCents || !poolCents) return out;
        var largest = 'trader';
        keys.forEach(function (key) {
            if (cents[key] >= cents[largest]) largest = key;
        });
        var used = 0;
        keys.forEach(function (key) {
            if (key === largest) return;
            var part = Math.floor(poolCents * cents[key] / totalCents);
            used += part;
            out[key] = (part / 100).toFixed(2);
        });
        out[largest] = ((poolCents - used) / 100).toFixed(2);
        return out;
    }

    function payeesOf(item) {
        return [
            payeeAccount(item && item.traderName),
            LENGFENG_ACCOUNT,
            payeeAccount(item && item.providerName)
        ];
    }
    function payeeSection(item) {
        var body = payeesOf(item).map(function (account, index) {
            var role = ['贸易商', '冷丰', '服务商'][index];
            return '<tr><td>' + esc(role) + '</td><td>' + esc(account.party) + '</td><td>' + esc(account.accountName) +
                '</td><td>' + esc(account.accountNo) + '</td></tr>';
        }).join('');
        return '<div class="supplier-detail-section-title">收款账户</div>' +
            '<div class="rbt-demand-table-wrap"><table class="rbt-demand-table"><thead><tr>' +
            '<th>角色</th><th>收款方名称</th><th>收款账户名称</th><th>收款账户</th>' +
            '</tr></thead><tbody>' + body + '</tbody></table></div>';
    }

    function canShowContract(item) {
        if (item && item.contractsVoided) return true;
        var api = window.RbtDemandData;
        if (api && typeof api.hasContractStatus === 'function') {
            return api.hasContractStatus(item && item.status);
        }
        return ['待签署', '待付款', '门店付款中', '已完成'].indexOf(item && item.status) >= 0;
    }

    function resolveSignStatus(item, contract) {
        if (contract && contract.signStatus) return contract.signStatus;
        var api = window.RbtDemandData;
        if (api && typeof api.contractSignStatus === 'function') {
            return api.contractSignStatus(item && item.status) || '—';
        }
        return item && item.status === '待签署' ? '待签署' : '已签署';
    }

    function agreementPartyLine(party, contract) {
        var name = party && party.name ? party.name : (party && party.role === 'trader' ? '待接单' : '—');
        var extra = party && party.code && party.role !== 'trader' && party.role !== 'supply' ? '（' + party.code + '）' : '';
        var state = party && party.signedAt ? '已签署 ' + party.signedAt : (party && party.role === 'trader' && !party.name ? '待接单' : '待签署');
        if (contract && contract.signStatus === '已作废') state = '已作废';
        return (party && party.roleLabel ? party.roleLabel : '签署方') + '：' + name + extra + '，' + state;
    }

    function contractBody(item, contract) {
        var skuLines = (item.skus || []).map(function (row, index) {
            var qty = Number(row && row.qty);
            if (!isFinite(qty) || qty < 1) qty = 1;
            var price = Number(String(row && row.salePrice || '').replace(/^¥/, ''));
            var amount = isFinite(price) ? money(price * qty) : '—';
            return (index + 1) + '. ' + show(row && row.name) + '（' + show(row && row.code) + '）×' + qty +
                '，售卖单价 ' + money(row && row.salePrice) + '，售卖金额 ' + amount;
        }).join('\n') || '无';
        var parties = (contract && contract.parties || []).map(function (party) {
            return agreementPartyLine(party, contract);
        });
        var signed = resolveSignStatus(item, contract) === '已签署';
        return [
            contract.name || '协议',
            '',
            '合同编号：' + show(contract.code),
            '关联需求单：' + show(item.code),
            '签署状态：' + resolveSignStatus(item, contract),
            '',
            '签署方：'
        ].concat(parties.length ? parties : ['无']).concat([
            '',
            '商品包：' + show(item.packageName) + '（' + show(item.packageCode) + '）',
            '商品金额：' + money(item.goodsAmount),
            '服务费：' + money(item.serviceFee),
            '总金额：' + money(item.amount),
            '结算周期：' + show(item.repayCycle),
            '结算方式：' + show(item.repayMethod),
            periodLabel(item) + '：' + (String(periodValue(item)).indexOf('\n') >= 0 ? '\n' + periodValue(item) : periodValue(item)),
            '',
            '商品明细：',
            skuLines,
            '',
            resolveSignStatus(item, contract) === '已作废'
                ? '本合同已作废。'
                : (signed ? '本合同已完成签署。' : '本合同待双方签署后生效。'),
            '',
            '创建人：' + show(item.creator),
            '创建时间：' + show(item.createdAt)
        ]).filter(function (line, index, arr) {
            return !(line === '' && arr[index - 1] === '');
        }).join('\n');
    }

    function closePreview() {
        document.querySelectorAll('[data-rbt-demand-contract-preview]').forEach(function (node) {
            node.remove();
        });
        document.removeEventListener('keydown', onPreviewKey);
    }

    function cnDate(raw) {
        var matched = String(raw || '').match(/(\d{4})-(\d{2})-(\d{2})/);
        return matched ? (matched[1] + '年' + matched[2] + '月' + matched[3] + '日') : '';
    }

    function sealMark(name, index) {
        var uid = 'rbtSealArc' + index + String(Math.random()).slice(2, 8);
        return '<span class="ct-seal' + (index > 1 ? ' ct-seal--next' : '') + '" aria-label="已盖章">' +
            '<svg viewBox="0 0 120 120" width="112" height="112">' +
            '<circle cx="60" cy="60" r="56" fill="rgba(255,255,255,0.55)" stroke="#c41e1e" stroke-width="3"/>' +
            '<circle cx="60" cy="60" r="51" fill="none" stroke="#c41e1e" stroke-width="1"/>' +
            '<defs><path id="' + uid + '" d="M14,66 A46,46 0 0,1 106,66"/></defs>' +
            '<text fill="#c41e1e" font-size="10" font-weight="700">' +
            '<textPath href="#' + uid + '" startOffset="50%" text-anchor="middle">' + esc(name) + '</textPath></text>' +
            '<text x="60" y="66" text-anchor="middle" fill="#c41e1e" font-size="18">★</text>' +
            '<text x="60" y="86" text-anchor="middle" fill="#c41e1e" font-size="13" font-weight="700">合同专用章</text>' +
            '</svg></span>';
    }

    function sealPaper(text, seal) {
        var lines = String(text || '').split('\n');
        var inPage = false;
        var dateSlot = 0;
        var sealIndex = 0;
        return lines.map(function (raw) {
            var trimmed = raw.trim();
            if (trimmed.indexOf('以下无正文') >= 0) inPage = true;
            if (inPage && trimmed.indexOf('附件') === 0) inPage = false;
            if (!inPage || trimmed.indexOf('以下无正文') >= 0) return esc(raw);
            if (/甲方/.test(trimmed) && /盖章/.test(trimmed)) {
                sealIndex += 1;
                return '<span class="ct-signline">' + esc(raw) + (seal.partyA ? sealMark(seal.partyA, sealIndex) : '') + '</span>';
            }
            if (/乙方/.test(trimmed) && /盖章|签字/.test(trimmed)) {
                var shown = raw;
                if (seal.partyB && /：\s*[_＿\s　]*$/.test(trimmed)) {
                    shown = raw.replace(/：\s*[_＿\s　]*$/, '：' + seal.partyB);
                }
                sealIndex += 1;
                return '<span class="ct-signline">' + esc(shown) + (seal.partyB ? sealMark(seal.partyB, sealIndex) : '') + '</span>';
            }
            if (/^日期/.test(trimmed)) {
                dateSlot += 1;
                var date = dateSlot === 1 ? seal.dateA : seal.dateB;
                var filled = date && /年/.test(trimmed) ? raw.replace(/：.*/, '：' + date) : raw;
                return esc(filled);
            }
            return esc(raw);
        }).join('\n');
    }

    function contractReadBody(item, contract) {
        var api = window.LfContract;
        var tplId = contract && contract.key === 'purchase' ? 'TPL004' : 'TPL001';
        var tplName = contract && contract.key === 'purchase' ? '冷丰平台供应商资金清分结算合同' : '冷丰品牌合作合同';
        var party = null;
        (contract && contract.parties || []).some(function (row) {
            if (row && row.role !== 'supply' && row.role !== 'trader' && row.name) {
                party = row;
                return true;
            }
            return false;
        });
        if (!party) {
            (contract && contract.parties || []).some(function (row) {
                if (row && row.role !== 'supply' && row.name) {
                    party = row;
                    return true;
                }
                return false;
            });
        }
        var body = api && typeof api.contractBodyOf === 'function'
            ? api.contractBodyOf({ id: tplId, name: tplName })
            : '';
        if (body && api && typeof api.fillContractParty === 'function' && party) {
            body = api.fillContractParty(body, { name: party.name, contact: '', identNo: '', address: item.storeName || '' });
        }
        if (!body) body = contractBody(item, contract);
        var signed = resolveSignStatus(item, contract) === '已签署';
        var partyA = (String(body || '').match(/甲方(?:（[^）]*）)?：\s*([^\n_＿]+)/) || [])[1];
        partyA = partyA ? partyA.trim() : (contract && contract.key === 'purchase' ? '上海冷丰德本信息科技有限公司' : '上海冷丰道善信息科技有限公司');
        var partyB = party && party.name ? party.name : '';
        var signedAt = '';
        (contract && contract.parties || []).some(function (row) {
            if (row && row.signedAt) {
                signedAt = row.signedAt;
                return true;
            }
            return false;
        });
        return {
            body: body,
            seal: signed ? {
                partyA: partyA,
                partyB: partyB,
                dateA: cnDate(item.createdAt),
                dateB: cnDate(signedAt || item.updatedAt)
            } : null
        };
    }

    function sideLine(label, value, extra) {
        return '<div class="ct-side-line"><span>' + esc(label) + '</span><b>' + esc(value || '—') + (extra || '') + '</b></div>';
    }

    function signerCard(name, stateLabel, doneAt) {
        var done = stateLabel === '已签署';
        return '<section class="ct-side-sign">' +
            '<div class="ct-side-sign__top"><span>签署</span><span>顺序签署</span></div>' +
            '<div class="ct-side-sign__who"><span>' + esc(name || '—') + '</span>' +
            '<em class="' + (done ? 'is-done' : '') + '">' + esc(stateLabel) + '</em></div>' +
            sideLine('完成时间', doneAt || '—') +
            sideLine('IP属地', '上海') +
            '</section>';
    }

    function contractSide(item, contract) {
        var status = resolveSignStatus(item, contract);
        var dot = status === '已签署' ? 'is-ok' : (status === '已作废' ? 'is-bad' : 'is-warn');
        var parties = contract.parties || [];
        var cards = parties.map(function (party) {
            var state = party.signedAt ? '已签署' : (status === '已作废' ? '已作废' : '待签署');
            return signerCard(party.name || party.roleLabel, state, party.signedAt || '');
        }).join('');
        return sideLine('主题', contract.name) +
            '<div class="ct-side-line"><span>状态</span><b><i class="ct-side-dot ' + dot + '"></i>' + esc(status) + '</b></div>' +
            sideLine('合同编号', contract.code, '<button type="button" class="ct-side-copy" data-rbt-copy="' + esc(contract.code) + '">复制</button>') +
            sideLine('发件人', '上海冷丰道善信息科技有限公司') +
            sideLine('创建者', item.creator) +
            sideLine('发起时间', item.createdAt) +
            sideLine('关联需求', item.code) +
            sideLine('定稿方式', '自动定稿') +
            cards;
    }

    function closeContractRead() {
        document.querySelectorAll('[data-rbt-contract-read]').forEach(function (node) {
            node.remove();
        });
        document.removeEventListener('keydown', onContractReadKey);
    }

    function onContractReadKey(event) {
        if (event.key !== 'Escape') return;
        event.stopPropagation();
        closeContractRead();
    }

    function openContractRead(item, contract, contracts) {
        if (!item || !contract) return;
        closeContractRead();
        var docs = (contracts && contracts.length ? contracts : [contract]);
        var mask = document.createElement('div');
        mask.className = 'ct-doc-mask';
        mask.setAttribute('data-rbt-contract-read', '1');
        mask.innerHTML =
            '<div class="ct-doc ct-doc--with-side" role="dialog" aria-modal="true" aria-label="查看合同">' +
            '<div class="ct-doc__head"><div><div class="ct-doc__eyebrow" data-rbt-read-eyebrow></div>' +
            '<div class="ct-doc__title" data-rbt-read-title></div><div class="ct-doc__meta" data-rbt-read-meta></div></div>' +
            '<button type="button" class="ct-doc__close" data-rbt-read-close>关闭</button></div>' +
            '<div class="ct-doc__tabs" data-rbt-read-tabs></div>' +
            '<div class="ct-doc__layout"><div class="ct-doc__paper" data-rbt-read-paper></div>' +
            '<aside class="ct-doc__side"><div class="ct-doc__side-title">详情</div><div data-rbt-read-side></div></aside></div></div>';
        document.body.appendChild(mask);
        var index = 0;
        docs.some(function (row, i) {
            if (row.key === contract.key) {
                index = i;
                return true;
            }
            return false;
        });
        function show(i) {
            index = i;
            var current = docs[i] || contract;
            var paper = contractReadBody(item, current);
            mask.querySelector('[data-rbt-read-eyebrow]').textContent = '签署任务 · ' + current.code;
            mask.querySelector('[data-rbt-read-title]').textContent = current.name || '合同';
            mask.querySelector('[data-rbt-read-meta]').textContent = [item.storeName, resolveSignStatus(item, current)].filter(Boolean).join(' · ');
            var tabs = mask.querySelector('[data-rbt-read-tabs]');
            tabs.innerHTML = docs.length > 1 ? docs.map(function (row, n) {
                return '<button type="button" class="ct-doc__tab' + (n === i ? ' is-active' : '') + '" data-rbt-read-tab="' + n + '">' + esc(row.name) + '</button>';
            }).join('') : '';
            var sheet = mask.querySelector('[data-rbt-read-paper]');
            sheet.innerHTML = paper.seal ? sealPaper(paper.body, paper.seal) : esc(paper.body);
            sheet.scrollTop = 0;
            mask.querySelector('[data-rbt-read-side]').innerHTML = contractSide(item, current);
        }
        mask.addEventListener('click', function (event) {
            if (event.target === mask || event.target.closest('[data-rbt-read-close]')) closeContractRead();
            var tab = event.target.closest('[data-rbt-read-tab]');
            if (tab) show(Number(tab.getAttribute('data-rbt-read-tab')) || 0);
            var copy = event.target.closest('[data-rbt-copy]');
            if (copy && navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(copy.getAttribute('data-rbt-copy') || '').then(function () {
                    if (typeof window.showToast === 'function') window.showToast('合同编号已复制', 'success');
                });
            }
        });
        document.addEventListener('keydown', onContractReadKey);
        show(index);
    }

    function onPreviewKey(event) {
        if (event.key === 'Escape') {
            event.stopPropagation();
            closePreview();
        }
    }

    function openPreview(item, contract) {
        if (!item || !contract) return;
        closePreview();
        var mask = document.createElement('div');
        mask.className = 'rbt-demand-contract-mask';
        mask.setAttribute('data-rbt-demand-contract-preview', '1');
        mask.innerHTML =
            '<div class="rbt-demand-contract" role="dialog" aria-modal="true" aria-label="合同预览">' +
            '<div class="rbt-demand-contract__head">' +
            '<div><div class="rbt-demand-contract__eyebrow">合同预览</div>' +
            '<div class="rbt-demand-contract__title">' + esc(contract.name) + '</div>' +
            '<div class="rbt-demand-contract__meta">' + esc(contract.code) + ' · ' + esc(resolveSignStatus(item, contract)) + '</div></div>' +
            '<button type="button" class="rbt-demand-contract__close" data-rbt-demand-contract-close aria-label="关闭">&times;</button></div>' +
            '<pre class="rbt-demand-contract__paper">' + esc(contractBody(item, contract)) + '</pre></div>';
        document.body.appendChild(mask);
        mask.addEventListener('click', function (event) {
            if (event.target === mask) closePreview();
        });
        mask.querySelector('[data-rbt-demand-contract-close]').addEventListener('click', closePreview);
        document.addEventListener('keydown', onPreviewKey);
    }

    function agreementContracts(item) {
        var api = window.RbtDemandData;
        if (!canShowContract(item) || !api || typeof api.signContracts !== 'function') return [];
        return api.signContracts(item);
    }

    function contractSection(item, performance) {
        var contracts = agreementContracts(item);
        var head = '<tr><th>协议</th><th>编号</th><th>签署方</th><th>签署状态</th></tr>';
        var body = contracts.map(function (contract) {
            var parties = (contract.parties || []).map(function (party) {
                var name = party.name || (party.role === 'trader' ? '待接单' : '—');
                return esc(party.roleLabel) + ' ' + esc(name);
            }).join('、');
            var nameCell = performance
                ? esc(contract.name)
                : '<button type="button" class="rbt-demand-contract-link" data-rbt-demand-contract-open="' + esc(contract.key) + '">' + esc(contract.name) + '</button>';
            var codeCell = performance
                ? '<button type="button" class="rbt-demand-contract-link" data-rbt-demand-contract-read="' + esc(contract.key) + '">' + esc(contract.code) + '</button>'
                : esc(contract.code);
            return '<tr><td>' + nameCell + '</td><td>' + codeCell + '</td><td>' + parties +
                '</td><td>' + esc(contract.signStatus || '待签署') + '</td></tr>';
        }).join('');
        var inner = contracts.length
            ? '<div class="rbt-demand-table-wrap"><table class="rbt-demand-table"><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>'
            : '<div class="rbt-demand-empty">暂无关联合同</div>';
        return '<div class="supplier-detail-section-title">关联合同</div>' + inner;
    }

    function depositView(item) {
        var storeApi = window.RbtStoreData;
        var store = storeApi && item && typeof storeApi.get === 'function' ? storeApi.get(item.storeCode) : null;
        if (store && (store.depositPaid === true || store.depositPaid === false)) {
            if (store.depositPaid !== true) return { paid: false };
            var file = store.depositVoucher || {};
            return {
                paid: true,
                voucherName: file.name || '缴纳凭证',
                voucherType: file.type || '',
                voucherData: file.data || '',
                uploadedBy: file.uploadedBy || '',
                uploadedAt: file.uploadedAt || ''
            };
        }
        return item && item.guaranteeDeposit;
    }

    function voucherSection(item) {
        var voucher = depositView(item);
        var title = '<div class="supplier-detail-section-title">保证金缴纳凭证</div>';
        if (voucher && voucher.paid === false) {
            return title + '<div class="supplier-detail-grid">' + textCell('缴纳状态', '未缴纳') + '</div>';
        }
        if (!voucher || (!voucher.voucherData && !voucher.auto)) {
            return title + '<div class="rbt-demand-empty">暂无保证金缴纳凭证</div>';
        }
        if (voucher.auto && !voucher.voucherData) {
            return title +
                '<div class="supplier-detail-grid">' +
                textCell('缴纳状态', '已缴纳') +
                textCell('凭证文件', voucher.voucherName || '系统自动审核') +
                textCell('上传人', voucher.uploadedBy || '系统') +
                textCell('上传时间', voucher.uploadedAt) +
                '</div>';
        }
        var isImage = String(voucher.voucherType || '').indexOf('image/') === 0 || /^data:image\//.test(String(voucher.voucherData || ''));
        var preview = isImage
            ? '<img src="' + esc(voucher.voucherData) + '" alt="保证金缴纳凭证" style="display:block;max-width:280px;margin-top:8px;border:1px solid #eee;border-radius:6px;">'
            : '<div style="margin-top:8px;"><a href="' + esc(voucher.voucherData) + '" target="_blank" rel="noopener">查看凭证</a></div>';
        return title +
            '<div class="supplier-detail-grid">' +
            textCell('缴纳状态', voucher.paid ? '已缴纳' : '未缴纳') +
            textCell('凭证文件', voucher.voucherName) +
            textCell('上传人', voucher.uploadedBy) +
            textCell('上传时间', voucher.uploadedAt) +
            '</div>' + preview;
    }

    function relatedDocsSection(item) {
        var api = window.RbtTradeDocs;
        var docs = api && typeof api.docsOfDemand === 'function' ? api.docsOfDemand(item && item.code) : [];
        if ((!docs || !docs.length) && item && item.status !== '门店付款中' && item.status !== '已完成') return '';
        var title = '<div class="supplier-detail-section-title">关联交易单</div>';
        if (!docs || !docs.length) {
            return title + '<div class="rbt-demand-empty">暂无关联交易单</div>';
        }
        var head = '<tr><th>单号</th><th>付款方</th><th>收款方</th><th>收货方</th><th class="is-money">总金额</th><th>状态</th></tr>';
        var body = docs.map(function (row) {
            return '<tr><td><button type="button" class="rbt-demand-contract-link" data-rbt-trade-open="' +
                esc(row.code) + '">' + esc(row.code) + '</button></td><td>' +
                esc(row.buyerName || '—') + '</td><td>' +
                esc(row.sellerName || '—') + '</td><td>' +
                esc(row.receiveName || '—') + '</td><td class="is-money">' +
                money(row.amount) + '</td><td>' + esc(row.status) + '</td></tr>';
        }).join('');
        return title + '<div class="rbt-demand-table-wrap"><table class="rbt-demand-table"><thead>' + head +
            '</thead><tbody>' + body + '</tbody></table></div>';
    }

    function logPanel(item) {
        var latest = window.RbtDemandData && typeof window.RbtDemandData.get === 'function'
            ? window.RbtDemandData.get(item.code) || item
            : item;
        var logs = latest.logs || [];
        var rows = logs.length
            ? logs.map(function (row) {
                return (
                    '<tr><td>' + esc(row.content) + '</td><td class="rbt-store-log__who">' +
                    esc(row.operator) + '</td><td class="rbt-store-log__time">' +
                    esc(row.time) + '</td></tr>'
                );
            }).join('')
            : '<tr><td colspan="3" class="rbt-store-log__empty">暂无操作记录</td></tr>';
        return (
            '<div class="supplier-detail-tab"><table class="rbt-store-log"><thead><tr>' +
            '<th>变更内容</th><th class="rbt-store-log__who">变更人</th><th class="rbt-store-log__time">变更时间</th>' +
            '</tr></thead><tbody>' + rows + '</tbody></table></div>'
        );
    }

    function displayStatus(item, performance) {
        var status = item && item.status;
        var daily = window.RbtDailyFulfill;
        if (performance && daily && typeof daily.phaseOf === 'function') {
            var remain = null;
            if (typeof daily.performanceFact === 'function' && window.RbtRisk && typeof window.RbtRisk.assessDays === 'function') {
                var fact = daily.performanceFact(item, window.RbtRisk.assessDays(
                    typeof daily.daysOf === 'function' ? daily.daysOf(item) : [],
                    typeof window.RbtRisk.receivableOf === 'function' ? window.RbtRisk.receivableOf(item) : 0,
                    item && item.amount
                ));
                remain = fact && fact.gap;
            }
            return daily.phaseOf(item, remain);
        }
        return status || '—';
    }

    function dailyPanel(item) {
        var api = window.RbtDailyFulfill;
        var rows = api && typeof api.daysOf === 'function' ? api.daysOf(item).slice() : [];
        rows.sort(function (a, b) {
            if (a.date !== b.date) return a.date < b.date ? 1 : -1;
            return String(a.channel) < String(b.channel) ? -1 : 1;
        });
        var shares = api && typeof api.payeeSplit === 'function' ? api.payeeSplit(item) : [];
        var shareByKey = {};
        shares.forEach(function (share) {
            shareByKey[share.id || (share.date + ':' + share.channel)] = share;
        });
        var partyCents = { trader: 0, lengfeng: 0, provider: 0 };
        var body = rows.length
            ? rows.map(function (row) {
                var share = shareByKey[row.id] || shareByKey[row.date + ':' + row.channel] || { trader: '0.00', lengfeng: '0.00', provider: '0.00' };
                partyCents.trader += Math.round((Number(share.trader) || 0) * 100);
                partyCents.lengfeng += Math.round((Number(share.lengfeng) || 0) * 100);
                partyCents.provider += Math.round((Number(share.provider) || 0) * 100);
                return (
                    '<tr><td>' + esc(row.date) + '</td><td>' + esc(row.channel) +
                    '</td><td class="is-money">' + esc(row.turnover ? ('¥' + row.turnover) : '—') +
                    '</td><td class="is-money">' + esc(row.commission ? ('¥' + row.commission) : '—') +
                    '</td><td>' + esc(row.ratio) +
                    '</td><td class="is-money">¥' + esc(row.due) +
                    '</td><td class="is-money">¥' + esc(row.actual) +
                    '</td><td>' + esc(row.payMethod || (api && api.autoPayMethod) || '营业收入自动扣款') +
                    '</td><td class="is-money">¥' + esc(share.trader) +
                    '</td><td class="is-money">¥' + esc(share.lengfeng) +
                    '</td><td class="is-money">¥' + esc(share.provider) + '</td></tr>'
                );
            }).join('')
            : '<tr><td class="is-empty" colspan="11">暂无已发生的每日付款。</td></tr>';
        return (
            '<div class="supplier-detail-tab">' +
            '<p class="rbt-daily-note">本单已经发生的每日付款。一行是一天、一个渠道。应付款 = 所得佣金 × 该渠道结算比例。当日实际付款按贸易商、冷丰、服务商应收占比拆成三方收款，三笔之和等于当日实际付款。没有服务商时，服务商收款为 0。未发生的日期不出现。' +
            '<a class="rbt-daily-note__more" href="rbt_daily_fulfill.html">全部门店每日付款</a></p>' +
            dailySummary(item, rows, partyCents) +
            '<div class="supplier-detail-section-title">每日明细</div>' +
            '<div class="rbt-demand-table-wrap"><table class="rbt-demand-table"><thead><tr>' +
            '<th>日期</th><th>渠道</th><th class="is-money">营业流水</th><th class="is-money">所得佣金</th><th>结算比例</th>' +
            '<th class="is-money">应付款</th><th class="is-money">实际付款</th><th>支付方式</th>' +
            '<th class="is-money">贸易商收款</th><th class="is-money">冷丰收款</th><th class="is-money">服务商收款</th>' +
            '</tr></thead><tbody>' + body + '</tbody></table></div></div>'
        );
    }

    /* 付款汇总与付款列表、首页同一口径：剩余付款额 = 总金额 − 已付款金额。日均付款额 = 累计付款额 ÷ 已付款天数。 */
    function dailySummary(item, rows, partyCents) {
        var risk = window.RbtRisk;
        var base = risk && typeof risk.receivableOf === 'function' ? risk.receivableOf(item) : 0;
        var fact = risk && typeof risk.assessDays === 'function'
            ? risk.assessDays(rows, base, item && item.amount, item)
            : { due: '0.00', actual: '0.00', gap: '0.00', progress: '—', baseline: '—', grade: '—' };
        if (window.RbtDailyFulfill && typeof window.RbtDailyFulfill.performanceFact === 'function') {
            fact = window.RbtDailyFulfill.performanceFact(item, fact);
        }
        var grades = { '正常': 1, '关注': 1, '预警': 1, '异常': 1 };
        var grade = fact.grade && grades[fact.grade]
            ? '<span class="rbt-risk-tag is-' + fact.grade + '">' + esc(fact.grade) + '</span>'
            : esc(fact.grade || '—');
        var cells = [
            money(item && item.amount),
            money(fact.due),
            money(fact.actual),
            money(fact.gap),
            fact.progress || '—',
            fact.baseline || '—',
            null,
            money(partyCents.trader / 100),
            money(partyCents.lengfeng / 100),
            money(partyCents.provider / 100)
        ];
        var titles = ['总金额', '应付款', '已付款金额', '剩余付款额', '日均付款额', '生效基准', '付款风险等级', '贸易商收款', '冷丰收款', '服务商收款'];
        var head = '<tr>' + titles.map(function (title, index) {
            return '<th' + (index === 4 || index === 5 || index === 6 ? '' : ' class="is-money"') + '>' + title + '</th>';
        }).join('') + '</tr>';
        var body = '<tr>' + cells.map(function (value, index) {
            if (index === 6) return '<td>' + grade + '</td>';
            var moneyCell = index !== 4 && index !== 5;
            return '<td' + (moneyCell ? ' class="is-money"' : '') + '>' + esc(value) + '</td>';
        }).join('') + '</tr>';
        return '<div class="supplier-detail-section-title">付款汇总</div>' +
            '<div class="rbt-demand-table-wrap"><table class="rbt-demand-table"><thead>' + head +
            '</thead><tbody>' + body + '</tbody></table></div>';
    }

    function plainCents(value) {
        var num = Number(String(value == null ? '' : value).replace(/[¥,\s]/g, ''));
        if (!isFinite(num)) return 0;
        return Math.round(num * 100);
    }

    function plainYuan(cents) {
        var abs = Math.abs(Math.round(cents));
        return (cents < 0 ? '-' : '') + Math.floor(abs / 100) + '.' + String(abs % 100).padStart(2, '0');
    }

    function shippedBySku(item) {
        var map = {};
        (item.shipments || []).forEach(function (row) {
            if (!row || !row.skuCode) return;
            if (!map[row.skuCode]) map[row.skuCode] = { qty: 0, amount: 0 };
            map[row.skuCode].qty += Number(row.qty) || 0;
            map[row.skuCode].amount += plainCents(row.amount);
        });
        return map;
    }

    function skuActions(item) {
        if (!item || item.status !== '发货中') return '';
        return '<div class="rbt-sku-actions">' +
            '<button type="button" class="btn" data-rbt-add-open>新增商品</button>' +
            '<button type="button" class="btn btn-primary" data-rbt-ship-open>发货</button>' +
            '<button type="button" class="btn btn-primary" data-rbt-ship-finish>发货完成</button>' +
            '</div>';
    }

    function shipSection(item) {
        if (!item || (item.status !== '发货中' && !(item.shipments && item.shipments.length))) return '';
        var shipping = item.status === '发货中';
        var records = (item.shipments || []).map(function (row) {
            var confirmQty = row.confirmed ? (row.confirmQty || row.qty) : '—';
            var remove = shipping && !row.confirmed
                ? '<button type="button" class="rbt-demand-contract-link" data-rbt-ship-del="' + esc(row.id) + '">删除</button>'
                : '';
            return '<tr><td>' + esc(row.name) + '</td><td>' + esc(row.skuCode) + '</td><td>' + esc(row.qty) + '</td>' +
                '<td class="is-money">¥' + esc(row.amount) + '</td><td>' + esc(row.logisticsNo || '—') + '</td>' +
                '<td>' + esc(confirmQty) + '</td><td>' + (remove || '—') + '</td></tr>';
        }).join('');
        var table = records
            ? '<div class="rbt-demand-table-wrap"><table class="rbt-demand-table"><thead><tr><th>商品</th><th>商品编码</th><th>发货数量</th><th class="is-money">发货金额</th><th>物流单号</th><th>确认数量</th><th>操作</th></tr></thead><tbody>' +
                records + '</tbody></table></div>'
            : '<div class="rbt-demand-empty">还没有发货记录</div>';
        return '<div class="supplier-detail-section-title">发货信息</div>' + skuActions(item) + table;
    }

    function supplementSection(item) {
        if (!item || (item.status !== '门店付款中' && item.status !== '已完成')) return '';
        var shipped = shippedCents(item);
        var goods = plainCents(item.goodsAmount);
        if (!item.shipments || !item.shipments.length || shipped <= goods) return '';
        var voucher = item.supplementVoucher;
        var uploaded = !!(voucher && voucher.name);
        var isImage = uploaded && (String(voucher.type || '').indexOf('image/') === 0 || /^data:image\//.test(String(voucher.data || '')));
        var preview = isImage
            ? '<img class="rbt-supplement__preview" src="' + esc(voucher.data) + '" alt="补缴凭证">'
            : '';
        var meta = uploaded
            ? '<p class="rbt-supplement__file">' + esc(voucher.name) + '</p>' +
                '<p class="rbt-supplement__meta">' + esc(voucher.uploadedBy || '—') + ' · ' + esc(voucher.uploadedAt || '—') + '</p>'
            : '<p class="rbt-supplement__meta">还没有凭证，可上传图片或 PDF。</p>';
        return '<div class="rbt-supplement">' +
            preview +
            '<div class="rbt-supplement__main">' +
            '<div class="rbt-supplement__head"><span>补缴凭证</span>' +
            '<em class="rbt-supplement__tag' + (uploaded ? ' is-done' : '') + '">' + (uploaded ? '已上传' : '待补缴') + '</em></div>' +
            '<p class="rbt-supplement__gap">发货金额 ' + esc(money(plainYuan(shipped))) + '，超出商品金额 ' + esc(money(plainYuan(shipped - goods))) + '</p>' +
            meta +
            '</div>' +
            '<label class="rbt-supplement__upload">' + (uploaded ? '重新上传' : '上传凭证') +
            '<input type="file" accept="image/*,.pdf" data-rbt-supplement hidden></label></div>';
    }

    var manageView = false;

    function reopenDemand(code) {
        var api = window.RbtDemandData;
        var fresh = api && typeof api.get === 'function' ? api.get(code) : null;
        if (fresh) open(fresh, { manage: manageView });
    }

    function closeFloat(flag) {
        document.querySelectorAll('[' + flag + ']').forEach(function (node) {
            node.remove();
        });
    }

    function skuThumb(code) {
        var src = typeof getWmsSkuImage === 'function' ? getWmsSkuImage(code) : '';
        if (!src) return '<span class="rbt-sku-thumb rbt-sku-thumb--empty">无图</span>';
        return '<img class="rbt-sku-thumb" src="' + esc(src) + '" alt="">';
    }

    function mountFloat(flag, label, title, body, onConfirm, okText) {
        closeFloat(flag);
        var mask = document.createElement('div');
        mask.className = 'rbt-demand-contract-mask';
        mask.setAttribute(flag, '1');
        mask.innerHTML =
            '<div class="rbt-ship-dialog" role="dialog" aria-modal="true" aria-label="' + esc(label) + '">' +
            '<div class="rbt-ship-dialog__head"><h3>' + esc(title) + '</h3>' +
            '<button type="button" class="rbt-demand-contract__close" data-rbt-float-close aria-label="关闭">&times;</button></div>' +
            '<div class="rbt-ship-dialog__body">' + body + '</div>' +
            '<div class="rbt-ship-dialog__foot">' +
            '<button type="button" class="btn" data-rbt-float-close>取消</button>' +
            '<button type="button" class="btn btn-primary" data-rbt-float-ok>' + esc(okText || '确认') + '</button></div></div>';
        document.body.appendChild(mask);
        mask.addEventListener('click', function (event) {
            if (event.target === mask || event.target.closest('[data-rbt-float-close]')) closeFloat(flag);
        });
        mask.querySelector('[data-rbt-float-ok]').addEventListener('click', function () {
            onConfirm(mask);
        });
        return mask;
    }

    function thisShipAmount(price, qty) {
        var count = Number(qty);
        if (!isFinite(count) || count <= 0) return { text: '—', plain: '' };
        var plain = plainYuan(plainCents(price) * count);
        return { text: money(plain), plain: plain };
    }

    function openShipDialog(item) {
        var shipped = shippedBySku(item);
        var rows = (item.skus || []).map(function (sku) {
            var done = shipped[sku.code] || { qty: 0, amount: 0 };
            var left = (Number(sku.qty) || 0) - done.qty;
            var qty = left > 0 ? left : 1;
            var sale = plainCents(sku.salePrice) * (Number(sku.qty) || 0);
            var current = thisShipAmount(sku.salePrice, qty);
            return '<tr data-ship-row="' + esc(sku.code) + '" data-sale-price="' + esc(sku.salePrice) + '">' +
                '<td><input type="checkbox" data-ship-check aria-label="选择' + esc(sku.name) + '"></td>' +
                '<td>' + esc(sku.code) + '</td><td>' + esc(sku.name) + '</td>' +
                '<td>' + esc(sku.qty) + '</td><td class="is-money">' + esc(money(sku.salePrice)) + '</td>' +
                '<td class="is-money">' + esc(money(plainYuan(sale))) + '</td>' +
                '<td>' + esc(done.qty) + '</td><td class="is-money">' + esc(money(plainYuan(done.amount))) + '</td>' +
                '<td><input type="number" min="1" max="999" value="' + qty + '" data-ship-qty aria-label="本次发货数量"></td>' +
                '<td class="is-money"><span class="rbt-ship-auto" data-ship-amount data-amount="' + esc(current.plain) + '">' + esc(current.text) + '</span></td>' +
                '<td><input type="text" data-ship-no placeholder="可不填" aria-label="物流单号"></td></tr>';
        }).join('');
        var body = '<p class="rbt-ship-note">勾选本次要发的商品，填写本次发货数量和物流单号。本次发货金额按本次发货数量 × 售卖单价自动计算。确认后按勾选行各生成一条发货记录。</p>' +
            (rows
                ? '<div class="rbt-sku-actions"><button type="button" class="btn" data-ship-check-all>全选</button>' +
                    '<button type="button" class="btn" data-ship-check-none>反全选</button></div>'
                : '') +
            '<div class="rbt-demand-table-wrap"><table class="rbt-demand-table"><thead><tr>' +
            '<th></th><th>商品编码</th><th>商品名称</th><th>需求数量</th><th class="is-money">售卖单价</th><th class="is-money">售卖金额</th>' +
            '<th>已发货数量</th><th class="is-money">已发货金额</th><th>本次发货数量</th><th class="is-money">本次发货金额</th><th>物流单号</th></tr></thead><tbody>' +
            (rows || '<tr><td class="is-empty" colspan="11">暂无商品</td></tr>') +
            '</tbody></table></div>';
        var mask = mountFloat('data-rbt-ship-dialog', '发货确认', '发货确认', body, function (dialog) {
            var picked = Array.prototype.slice.call(dialog.querySelectorAll('[data-ship-row]')).filter(function (row) {
                var box = row.querySelector('[data-ship-check]');
                return box && box.checked;
            });
            if (!picked.length) {
                window.alert('请勾选要发货的商品');
                return;
            }
            var api = window.RbtDemandData;
            var warns = [];
            var failed = '';
            var saved = 0;
            picked.some(function (row) {
                var amountNode = row.querySelector('[data-ship-amount]');
                var result = api && api.shipLine(item.code, {
                    skuCode: row.getAttribute('data-ship-row'),
                    qty: row.querySelector('[data-ship-qty]').value,
                    amount: amountNode ? amountNode.getAttribute('data-amount') : '',
                    logisticsNo: row.querySelector('[data-ship-no]').value
                }, '王丽');
                if (!result || !result.ok) {
                    failed = (result && result.reason) || '发货失败';
                    return true;
                }
                saved += 1;
                if (result.warn) warns.push(result.warn);
                return false;
            });
            if (!saved) {
                window.alert(failed || '发货失败');
                return;
            }
            if (failed) window.alert(failed);
            else if (warns.length) window.alert(warns.join('；') + '。本次发货已保存。');
            closeFloat('data-rbt-ship-dialog');
            reopenDemand(item.code);
        });
        function shipChecks() {
            return Array.prototype.slice.call(mask.querySelectorAll('[data-ship-check]'));
        }
        var checkAll = mask.querySelector('[data-ship-check-all]');
        var checkNone = mask.querySelector('[data-ship-check-none]');
        if (checkAll) checkAll.addEventListener('click', function () {
            shipChecks().forEach(function (box) { box.checked = true; });
        });
        if (checkNone) checkNone.addEventListener('click', function () {
            shipChecks().forEach(function (box) { box.checked = false; });
        });
        mask.querySelectorAll('[data-ship-row]').forEach(function (row) {
            var qtyInput = row.querySelector('[data-ship-qty]');
            qtyInput.addEventListener('input', function () {
                var next = thisShipAmount(row.getAttribute('data-sale-price'), qtyInput.value);
                var amountNode = row.querySelector('[data-ship-amount]');
                if (!amountNode) return;
                amountNode.textContent = next.text;
                amountNode.setAttribute('data-amount', next.plain);
            });
        });
    }

    function addSkuRows(list) {
        return list.map(function (sku) {
            var amount = money(Number(sku.salePrice) || 0);
            return '<tr data-add-row="' + esc(sku.code) + '" data-code="' + esc(sku.code) + '" data-name="' + esc(sku.name) + '" data-category="' + esc(sku.category) + '">' +
                '<td><input type="checkbox" data-add-check aria-label="选择' + esc(sku.name) + '"></td>' +
                '<td>' + skuThumb(sku.code) + '</td>' +
                '<td>' + esc(sku.code) + '</td><td>' + esc(sku.name) + '</td>' +
                '<td>' + esc(sku.barcode) + '</td><td>' + esc(sku.unit) + '</td><td>' + esc(sku.spec) + '</td>' +
                '<td class="is-money">' + esc(money(sku.purchasePrice)) + '</td>' +
                '<td><input type="number" min="1" max="999" value="1" data-add-qty aria-label="商品数量"></td>' +
                '<td><input type="number" min="0" step="0.01" value="' + esc(sku.salePrice) + '" data-add-price aria-label="售卖单价"></td>' +
                '<td class="is-money" data-add-amount>' + esc(amount) + '</td>' +
                '<td><input type="text" data-add-no placeholder="可不填" aria-label="物流单号"></td></tr>';
        }).join('');
    }

    function openAddSkuDialog(item) {
        var api = window.RbtDemandData;
        var catalog = api && typeof api.shipCatalog === 'function' ? api.shipCatalog() : [];
        var used = {};
        (item.skus || []).forEach(function (sku) { if (sku && sku.code) used[sku.code] = true; });
        var available = catalog.filter(function (sku) { return !used[sku.code]; });
        var categories = [];
        available.forEach(function (sku) {
            if (sku.category && categories.indexOf(sku.category) < 0) categories.push(sku.category);
        });
        var options = '<option value="">请选择</option>' + categories.map(function (name) {
            return '<option value="' + esc(name) + '">' + esc(name) + '</option>';
        }).join('');
        var body = '<p class="rbt-ship-note">只列出不在需求商品明细里的商品。确认后直接生成发货记录，不加入商品明细。可填写物流单号。</p>' +
            '<div class="rbt-sku-query">' +
            '<label>商品编码 <input type="text" data-add-q-code placeholder="请输入"></label>' +
            '<label>商品名称 <input type="text" data-add-q-name placeholder="请输入"></label>' +
            '<label>商品类目 <select data-add-q-category>' + options + '</select></label>' +
            '<button type="button" class="btn btn-primary" data-add-search>查询</button>' +
            '<button type="button" class="btn" data-add-reset>重置</button></div>' +
            '<div class="rbt-demand-table-wrap"><table class="rbt-demand-table"><thead><tr>' +
            '<th></th><th>商品图片</th><th>商品编码</th><th>商品名称</th><th>商品条码</th><th>商品单位</th><th>商品规格</th>' +
            '<th class="is-money">采购价</th><th>商品数量</th><th>售卖单价</th><th class="is-money">售卖金额</th><th>物流单号</th>' +
            '</tr></thead><tbody data-add-body>' +
            (addSkuRows(available) || '<tr data-add-empty><td class="is-empty" colspan="12">暂无数据</td></tr>') +
            '</tbody></table></div>';
        var mask = mountFloat('data-rbt-add-sku-dialog', '新增商品', '新增商品', body, function (dialog) {
            var picked = Array.prototype.slice.call(dialog.querySelectorAll('[data-add-row]')).filter(function (row) {
                var box = row.querySelector('[data-add-check]');
                return box && box.checked && !row.hidden;
            });
            if (!picked.length) {
                window.alert('请勾选要新增的商品');
                return;
            }
            var saved = 0;
            var failed = '';
            picked.some(function (row) {
                var result = api && api.addShipSku(item.code, {
                    skuCode: row.getAttribute('data-add-row'),
                    qty: row.querySelector('[data-add-qty]').value,
                    salePrice: row.querySelector('[data-add-price]').value,
                    logisticsNo: row.querySelector('[data-add-no]').value
                }, '王丽');
                if (!result || !result.ok) {
                    failed = (result && result.reason) || '不能新增';
                    return true;
                }
                saved += 1;
                return false;
            });
            if (!saved) {
                window.alert(failed || '不能新增');
                return;
            }
            if (failed) window.alert(failed);
            closeFloat('data-rbt-add-sku-dialog');
            reopenDemand(item.code);
        }, '添加');
        function syncAmount(row) {
            var qty = Number(row.querySelector('[data-add-qty]').value);
            var price = Number(row.querySelector('[data-add-price]').value);
            var cell = row.querySelector('[data-add-amount]');
            if (cell) cell.textContent = isFinite(qty) && isFinite(price) ? money(qty * price) : '—';
        }
        mask.querySelectorAll('[data-add-row]').forEach(function (row) {
            row.querySelector('[data-add-qty]').addEventListener('input', function () { syncAmount(row); });
            row.querySelector('[data-add-price]').addEventListener('input', function () { syncAmount(row); });
        });
        function applyFilter() {
            var code = mask.querySelector('[data-add-q-code]').value.trim().toLowerCase();
            var name = mask.querySelector('[data-add-q-name]').value.trim().toLowerCase();
            var category = mask.querySelector('[data-add-q-category]').value;
            var visible = 0;
            mask.querySelectorAll('[data-add-row]').forEach(function (row) {
                var hit = (!code || String(row.getAttribute('data-code') || '').toLowerCase().indexOf(code) >= 0) &&
                    (!name || String(row.getAttribute('data-name') || '').toLowerCase().indexOf(name) >= 0) &&
                    (!category || row.getAttribute('data-category') === category);
                row.hidden = !hit;
                if (hit) visible += 1;
            });
            var empty = mask.querySelector('[data-add-empty]');
            if (!visible && !empty) {
                var tbody = mask.querySelector('[data-add-body]');
                tbody.insertAdjacentHTML('beforeend', '<tr data-add-empty><td class="is-empty" colspan="12">暂无数据</td></tr>');
            } else if (visible && empty) {
                empty.remove();
            }
        }
        mask.querySelector('[data-add-search]').addEventListener('click', applyFilter);
        mask.querySelector('[data-add-reset]').addEventListener('click', function () {
            mask.querySelector('[data-add-q-code]').value = '';
            mask.querySelector('[data-add-q-name]').value = '';
            mask.querySelector('[data-add-q-category]').value = '';
            applyFilter();
        });
    }

    function openFinishDialog(item) {
        var api = window.RbtDemandData;
        var check = api && typeof api.finishShip === 'function' ? api.finishShip(item.code, false, '王丽') : null;
        var blocked = !check || (!check.ok && !check.needAck);
        var lines = check && check.reason ? check.reason.split('；').filter(Boolean) : [];
        var body = blocked
            ? '<p class="rbt-ship-note">还有这些条件没满足，不能发货完成。</p><ul class="rbt-ship-blocks">' +
                lines.map(function (line) { return '<li>' + esc(line) + '</li>'; }).join('') + '</ul>'
            : (lines.length
                ? '<p class="rbt-ship-note">以下只是提示，确定后仍进入门店付款中，并按发货记录生成交易单。</p><ul class="rbt-ship-blocks">' +
                    lines.map(function (line) { return '<li>' + esc(line) + '</li>'; }).join('') + '</ul>'
                : '<p class="rbt-ship-note">商品已发完，门店已确认。确认后进入门店付款中，并按发货记录生成交易单。</p>');
        var mask = mountFloat('data-rbt-finish-dialog', '发货完成', '发货完成', body, function () {
            if (blocked) {
                closeFloat('data-rbt-finish-dialog');
                return;
            }
            var done = api.finishShip(item.code, true, '王丽');
            if (!done || !done.ok) return;
            closeFloat('data-rbt-finish-dialog');
            reopenDemand(item.code);
            window.dispatchEvent(new Event('focus'));
        }, blocked ? '关闭' : '确认');
        if (blocked && mask) {
            var cancel = mask.querySelector('.rbt-ship-dialog__foot .btn:not(.btn-primary)');
            if (cancel) cancel.hidden = true;
        }
    }

    function basePanel(item, performance, manage) {
        var statusText = displayStatus(item, performance);
        return (
            '<div class="supplier-detail-tab">' +
            storeQuotaSection(item) +
            '<div class="supplier-detail-section-title">基础信息</div><div class="supplier-detail-grid">' +
            textCell('需求单号', item.code) +
            statusCell('状态', item.status, statusText) +
            textCell('门店', show(item.storeName) + '（' + show(item.storeCode) + '）') +
            textCell('产品', show(item.installmentName) + '（' + show(item.installmentCode) + '）') +
            textCell('商品包', show(item.packageName) + '（' + show(item.packageCode) + '）') +
            textCell('结算周期', item.repayCycle) +
            textCell('结算方式', item.repayMethod) +
            (item.repayMethod === '比例付' && item.settleRatios && item.settleRatios.length ? '' : textCell(periodLabel(item), periodValue(item))) +
            textCell('接单贸易商', item.traderName || '—') +
            textCell('服务商', item.providerName || '—') +
            textCell('接单时间', item.acceptedAt) +
            textCell('撤回原因', item.withdrawReason || '—') +
            textCell('备注', item.remark || '—') +
            textCell('创建人', item.creator) +
            textCell('创建时间', item.createdAt) +
            textCell('更新人', item.updater) +
            textCell('更新时间', item.updatedAt) +
            '</div>' +
            '<div class="supplier-detail-section-title">金额信息</div>' +
            amountTable(item, performance, manage) +
            (performance ? payeeSection(item) : '') +
            '<div class="supplier-detail-section-title">商品明细</div>' +
            skuTable(item.skus) +
            shipSection(item) +
            supplementSection(item) +
            settleRatioSection(item) +
            contractSection(item, performance) +
            voucherSection(item) +
            relatedDocsSection(item) +
            '</div>'
        );
    }

    function bindBaseEvents(drawer, item, options) {
        var editRatio = drawer.querySelector('[data-rbt-ratio-edit]');
        if (editRatio) {
            editRatio.addEventListener('click', function () {
                var ratioApi = window.RbtSettleRatio;
                if (!ratioApi || typeof ratioApi.openEditor !== 'function') return;
                ratioApi.openEditor(item, {
                    onSaved: function (saved) {
                        open(saved, {
                            keepAudit: true,
                            performance: !!(options && options.performance),
                            manage: !!(options && options.manage)
                        });
                    }
                });
            });
        }
        var agreements = agreementContracts(item);
        drawer.querySelectorAll('[data-rbt-demand-contract-open]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var key = btn.getAttribute('data-rbt-demand-contract-open');
                var found = null;
                agreements.some(function (row) {
                    if (row.key === key) {
                        found = row;
                        return true;
                    }
                    return false;
                });
                if (found) openPreview(item, found);
            });
        });
        drawer.querySelectorAll('[data-rbt-demand-contract-read]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var key = btn.getAttribute('data-rbt-demand-contract-read');
                var found = null;
                agreements.some(function (row) {
                    if (row.key === key) {
                        found = row;
                        return true;
                    }
                    return false;
                });
                if (found) openContractRead(item, found, agreements);
            });
        });
        var api = window.RbtDemandData;
        var shipOpen = drawer.querySelector('[data-rbt-ship-open]');
        if (shipOpen) shipOpen.addEventListener('click', function () { openShipDialog(item); });
        var addOpen = drawer.querySelector('[data-rbt-add-open]');
        if (addOpen) addOpen.addEventListener('click', function () { openAddSkuDialog(item); });
        drawer.querySelectorAll('[data-rbt-ship-del]').forEach(function (button) {
            button.addEventListener('click', function () {
                if (!window.confirm('删除这条发货记录？')) return;
                var result = api && api.deleteShipment(item.code, button.getAttribute('data-rbt-ship-del'), '王丽');
                if (!result || !result.ok) {
                    window.alert((result && result.reason) || '不能删除');
                    return;
                }
                reopenDemand(item.code);
            });
        });
        var finish = drawer.querySelector('[data-rbt-ship-finish]');
        if (finish) finish.addEventListener('click', function () { openFinishDialog(item); });
        var supplement = drawer.querySelector('[data-rbt-supplement]');
        if (supplement) {
            supplement.addEventListener('change', function () {
                var file = supplement.files && supplement.files[0];
                if (!file) return;
                var reader = new FileReader();
                reader.onload = function () {
                    var result = api && api.saveSupplement(item.code, {
                        name: file.name,
                        type: file.type,
                        data: reader.result
                    }, '王丽');
                    if (!result || !result.ok) {
                        window.alert((result && result.reason) || '上传失败');
                        return;
                    }
                    reopenDemand(item.code);
                };
                reader.readAsDataURL(file);
            });
        }
        drawer.querySelectorAll('[data-rbt-trade-open]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var code = btn.getAttribute('data-rbt-trade-open');
                var tradeApi = window.RbtTradeDetail;
                if (!tradeApi || typeof tradeApi.openByCode !== 'function') return;
                closeDrawer();
                tradeApi.openByCode(code);
            });
        });
    }

    function closeDrawer() {
        closeContractRead();
        closePreview();
        closeFloat('data-rbt-ship-dialog');
        closeFloat('data-rbt-add-sku-dialog');
        closeFloat('data-rbt-finish-dialog');
        document.querySelectorAll('[data-rbt-demand-drawer]').forEach(function (node) {
            node.remove();
        });
        document.removeEventListener('keydown', onDrawerKey);
    }

    function onDrawerKey(event) {
        if (event.key !== 'Escape') return;
        if (document.querySelector('[data-rbt-contract-read]')) {
            closeContractRead();
            return;
        }
        if (document.querySelector('[data-rbt-demand-contract-preview]')) {
            closePreview();
            return;
        }
        if (document.querySelector('[data-rbt-ship-dialog]')) {
            closeFloat('data-rbt-ship-dialog');
            return;
        }
        if (document.querySelector('[data-rbt-add-sku-dialog]')) {
            closeFloat('data-rbt-add-sku-dialog');
            return;
        }
        if (document.querySelector('[data-rbt-finish-dialog]')) {
            closeFloat('data-rbt-finish-dialog');
            return;
        }
        closeDrawer();
    }

    var auditSession = null;

    function auditFooter() {
        return (
            '<div class="store-drawer__footer rbt-audit-foot">' +
            '<label class="rbt-audit-foot__reason">驳回原因<textarea data-rbt-audit-opinion placeholder="驳回时必填"></textarea></label>' +
            '<div class="rbt-audit-foot__actions">' +
            '<button type="button" class="btn is-danger" data-rbt-audit-reject>审核驳回</button>' +
            '<button type="button" class="btn btn-primary" data-rbt-audit-pass>审核通过</button>' +
            '</div></div>'
        );
    }

    function bindAuditFooter(drawer) {
        if (!auditSession) return;
        var passBtn = drawer.querySelector('[data-rbt-audit-pass]');
        var rejectBtn = drawer.querySelector('[data-rbt-audit-reject]');
        if (passBtn) {
            passBtn.addEventListener('click', function () {
                var done = auditSession.onPass && auditSession.onPass();
                if (done !== false) closeDrawer();
            });
        }
        if (rejectBtn) {
            rejectBtn.addEventListener('click', function () {
                var opinionNode = drawer.querySelector('[data-rbt-audit-opinion]');
                var opinion = opinionNode ? String(opinionNode.value || '').trim() : '';
                if (!opinion) {
                    if (typeof window.showToast === 'function') window.showToast('驳回原因必填', 'error');
                    else window.alert('驳回原因必填');
                    return;
                }
                var done = auditSession.onReject && auditSession.onReject(opinion);
                if (done !== false) closeDrawer();
            });
        }
    }

    function open(item, options) {
        if (!item) return;
        if (!(options && options.keepAudit)) {
            auditSession = options && options.audit ? options.audit : null;
        }
        var performance = !!(options && options.performance);
        var manage = !!(options && options.manage);
        manageView = manage;
        var title = performance ? '付款详情' : '需求单详情';
        var statusText = displayStatus(item, performance);
        closeDrawer();
        var backdrop = document.createElement('div');
        backdrop.className = 'store-drawer-backdrop';
        backdrop.setAttribute('data-rbt-demand-drawer', '1');
        var drawer = document.createElement('aside');
        drawer.className = 'store-drawer store-drawer--interactive store-drawer--store-wide';
        drawer.setAttribute('data-rbt-demand-drawer', '1');
        drawer.setAttribute('role', 'dialog');
        drawer.setAttribute('aria-modal', 'true');
        drawer.setAttribute('aria-label', title);
        drawer.innerHTML =
            '<div class="store-drawer__header"><h2 class="store-drawer__title">' + esc(title) + '</h2>' +
            '<button type="button" class="store-drawer__close" data-rbt-demand-close aria-label="关闭">&times;</button></div>' +
            '<div class="store-drawer__hero store-drawer__hero--elevated">' +
            '<div class="store-drawer__name-row"><span class="store-drawer__name">' + esc(item.code) + '</span>' +
            '<span class="mdm-detail-tag mdm-detail-tag--' + statusKind(item.status) + '">' + esc(statusText) + '</span></div>' +
            '<div class="store-drawer__meta">门店：' + esc(item.storeName) + '（' + esc(item.storeCode) + '）</div>' +
            '<div class="store-drawer__meta">商品包：' + esc(item.packageName) + '（' + esc(item.packageCode) + '）</div></div>' +
            '<div class="store-drawer__tabs store-drawer__tabs--sticky" id="rbtDemandTabs">' +
            '<button type="button" class="store-drawer__tab is-active" data-tab="base">基础信息</button>' +
            (performance ? '<button type="button" class="store-drawer__tab" data-tab="daily">每日付款</button>' : '') +
            (performance ? '' : '<button type="button" class="store-drawer__tab" data-tab="logs">操作记录</button>') +
            '</div>' +
            '<div class="store-drawer__body" id="rbtDemandBody"></div>' +
            (auditSession ? auditFooter() : '');
        document.body.appendChild(backdrop);
        document.body.appendChild(drawer);
        backdrop.addEventListener('click', closeDrawer);
        drawer.querySelector('[data-rbt-demand-close]').addEventListener('click', closeDrawer);
        document.addEventListener('keydown', onDrawerKey);
        var tabs = document.getElementById('rbtDemandTabs');
        var body = document.getElementById('rbtDemandBody');
        function show(id) {
            tabs.querySelectorAll('.store-drawer__tab').forEach(function (button) {
                button.classList.toggle('is-active', button.getAttribute('data-tab') === id);
            });
            if (id === 'logs') body.innerHTML = logPanel(item);
            else if (id === 'daily') body.innerHTML = dailyPanel(item);
            else {
                body.innerHTML = basePanel(item, performance, manage);
                bindBaseEvents(drawer, item, options);
            }
        }
        tabs.addEventListener('click', function (event) {
            var button = event.target.closest('[data-tab]');
            if (!button) return;
            show(button.getAttribute('data-tab'));
        });
        show('base');
        if (auditSession) bindAuditFooter(drawer);
    }

    window.RbtDemandDetail = { open: open, close: closeDrawer, payeesOf: payeesOf };
})();
