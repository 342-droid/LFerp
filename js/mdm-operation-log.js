/* 共用操作日志查询及主数据原型记录 */
(function (global) {
    'use strict';

    var storageKey = 'lf_mdm_master_operation_logs_v1';
    var activeDialog;
    var marketingPageSizes = [20, 50, 100, 200];

    function html(value) {
        return String(value == null || value === '' ? '—' : value)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function result(row) {
        if (row.result) return row.result;
        if (typeof row.success === 'boolean') return row.success ? '成功' : '失败';
        return '—';
    }

    function requestSnapshot(value) {
        if (!value) return '';
        try {
            var payload = typeof value === 'string' ? JSON.parse(value) : value;
            if (!payload || typeof payload !== 'object') return '';
            return JSON.stringify(payload, function (key, item) {
                return /password|passwd|pwd|secret|credential|authorization|cookie|token|captcha|otp|verifyCode|smsCode|verificationCode|phone|mobile|idCard|identityNumber|bankAccount|cardNo|密码|验证码|手机号|身份证|银行卡/i.test(key)
                    && item != null && item !== '' ? '•••' : item;
            }, 2);
        } catch (error) {
            return '';
        }
    }

    function normalize(row, options) {
        var labels = options.FIELD_LABEL || {};
        var values = options.VALUE_MAP || {};
        function format(field, value) {
            var mapping = values[field];
            if (mapping && Object.hasOwn(mapping, value)) return mapping[value];
            return value && typeof value === 'object' ? JSON.stringify(value) : value;
        }
        return {
            demo: !!row.demo,
            time: row.timestamp || row.time || row.at || '',
            action: (options.ACTION_LABEL || {})[row.action] || row.content || row.action || row.title || '—',
            operator: row.operator || (row.pickup && row.pickup.operator),
            business: row.resourceId || row.business || options.business,
            object: [row.resource, row.resourceId || options.business].filter(Boolean).join('-'),
            method: [row.httpMethod || row.requestMethod, row.requestUri || row.requestPath].filter(Boolean).join(' '),
            clientIp: row.clientIp,
            service: row.service || row.serviceName,
            elapsed: row.elapsedMs == null ? null : row.elapsedMs + ' ms',
            result: result(row),
            detail: row.detail || row.change || row.desc,
            failureReason: row.failureReason || row.errorMessage || row.errorMsg || row.reason,
            technical: [
                ['后台动作标识', row.actionKey || row.actionCode || (options.ACTION_LABEL && row.action)],
                ['来源服务', row.service || row.serviceName],
                ['请求方式', row.httpMethod || row.requestMethod],
                ['接口路径', row.requestUri || row.requestPath],
                ['客户端 IP', row.clientIp],
                ['处理耗时', row.elapsedMs == null ? null : row.elapsedMs + ' 毫秒']
            ],
            traceId: row.traceId || row.traceID,
            request: requestSnapshot(row.requestParams),
            changes: Array.isArray(row.changes) ? row.changes.map(function (change) {
                return {
                    field: labels[change.field] || change.field,
                    before: format(change.field, change.oldValue),
                    after: format(change.field, change.newValue)
                };
            }) : []
        };
    }

    var demoChanges = {
        '新增商家主体': ['主体名称', null, '演示供应商'],
        '编辑门店': ['门店简称', '冷丰杭州总店', '杭州总店'],
        '新增门店': ['门店名称', null, '演示门店'],
        '设置系统默认门店': ['默认门店', '演示一店', '演示二店'],
        '调整营业时间': ['营业时间', '跟随平台', '09:00–21:00'],
        '编辑供应商': ['供应商简称', '华东供应链', '华东供应'],
        '修改仓库': ['仓库名称', '华东一号仓', '华东中心仓'],
        '编辑仓库': ['仓库名称', '华东一号仓', '华东中心仓'],
        '新增仓库': ['仓库名称', null, '华东中心仓'],
        '新增商品': ['商品名称', null, '时令水果'],
        '修改商品': ['商品采购价', '10 元', '12 元'],
        '商品上架': ['商品状态', '待售卖', '售卖中'],
        '商品下架': ['商品状态', '售卖中', '已停售'],
        '删除商品': ['商品名称', '时令水果', null],
        '新增分类': ['分类名称', null, '时令水果'],
        '修改分类': ['分类名称', '生鲜', '生鲜水果'],
        '删除分类': ['分类名称', '时令水果', null],
        '创建模板': ['模板名称', null, '自动领取福袋'],
        '启用模板': ['状态', '草稿', '启用'],
        '禁用模板': ['状态', '启用', '禁用'],
        '保存结算通用配置': ['结算参数', '每周结算', '每月结算'],
        '创建策略': ['策略名称', null, '演示结算策略'],
        '门店绑定变更': ['绑定门店', '演示一店', '演示一店、演示二店'],
        '订单已创建': ['订单状态', null, '待支付'],
        '订单已支付': ['订单状态', '待支付', '待发货'],
        '订单已发货': ['订单状态', '待发货', '待收货'],
        '商品提货': ['累计已提货', '0 件', '2 件'],
        '售后·已申请': ['售后状态', null, '已申请'],
        '售后·已通过': ['售后状态', '已申请', '已通过'],
        '售后·已拒绝': ['售后状态', '已申请', '已拒绝'],
        '退款·已创建': ['退款单状态', null, '待退款'],
        '售后·已发起退款': ['售后状态', '已通过', '退款中']
    };

    function demoChange(action) {
        if (Object.hasOwn(demoChanges, action)) return demoChanges[action];
        if (/重新提交|提交审核/.test(action)) return ['审核状态', '草稿', '待审核'];
        if (/审核失败|审核不通过|驳回/.test(action)) return ['审核状态', '待审核', '审核未通过'];
        if (/审核通过|审核成功/.test(action)) return ['审核状态', '待审核', '审核通过'];
        if (/启用|开启/.test(action)) return ['状态', '禁用', '启用'];
        if (/停用|禁用|关闭/.test(action)) return ['状态', '启用', '禁用'];
        if (/上架/.test(action)) return ['状态', '已下架', '已上架'];
        if (/下架/.test(action)) return ['状态', '已上架', '已下架'];
        if (/创建|新增/.test(action)) return ['名称', null, '演示记录'];
        if (/删除/.test(action)) return ['名称', '演示记录', null];
        if (/编辑|修改|保存|更新/.test(action)) return ['配置名称', '演示配置 A', '演示配置 B'];
        return null;
    }

    function withDemoRows(rows, options) {
        var types = new Set((options.types || []).concat(Object.values(options.ACTION_LABEL || {}),
            rows.map(function (row) { return row.action; })));
        var results = options.auditSummary ? ['通过', '驳回'] : ['成功', '失败'];
        var existing = new Set(rows.map(function (row) { return JSON.stringify([row.action, row.result]); }));
        var demos = [];
        types.forEach(function (action) {
            if (!action || action === '—') return;
            results.forEach(function (status) {
                if (existing.has(JSON.stringify([action, status]))) return;
                var succeeded = status === '成功' || status === '通过';
                var sample = demoChange(action);
                var changes = succeeded && sample && !options.auditSummary
                    ? [{ field: sample[0], oldValue: sample[1], newValue: sample[2] }] : [];
                var detail = options.auditSummary
                    ? (succeeded ? '演示：审核资料符合要求' : '演示：审核资料不完整，退回补充')
                    : (succeeded ? '演示：' + action + '已完成' : '演示：' + action + '未完成，请核对业务条件后重试');
                var productAction = options.productScope && { '新增商品': 'create', '修改商品': 'update' }[action];
                demos.push(normalize({
                    action: action,
                    result: status,
                    time: '2026-11-05 10:00:00',
                    business: 'DEMO-' + String(demos.length + 1).padStart(3, '0'),
                    operator: '演示用户',
                    detail: detail,
                    changes: changes,
                    actionKey: productAction ? 'spu.' + productAction : undefined,
                    service: productAction ? 'system-core' : undefined,
                    httpMethod: productAction ? 'POST' : undefined,
                    requestUri: productAction ? '/system-core/v1/mdm-product/spu/' + productAction : undefined,
                    requestParams: productAction ? [{
                        title: '演示时令水果',
                        productType: 'PHYSICAL',
                        saleChannels: ['LIVE', 'PROCUREMENT'],
                        skus: [{ skuName: '500g', pricingMode: 'FIXED', purchasePrice: 12 }]
                    }] : undefined,
                    demo: true
                }, options));
            });
        });
        return rows.concat(demos);
    }

    function actionHtml(row) {
        return html(row.action) + (row.demo ? ' <span class="lf-oplog-demo">演示</span>' : '');
    }

    function detailTable(rows, traceId) {
        var cells = rows.map(function (item) {
            return '<th scope="row">' + html(item[0]) + '</th><td>' + html(item[1]) + '</td>';
        });
        var pairs = [];
        for (var i = 0; i < cells.length; i += 2) {
            pairs.push('<tr>' + cells[i] + (cells[i + 1] || '<td colspan="2"></td>') + '</tr>');
        }
        if (traceId) pairs.push('<tr><th scope="row">TraceID</th><td colspan="3">' + html(traceId) + '</td></tr>');
        return '<table class="lf-oplog-meta"><tbody>' + pairs.join('') + '</tbody></table>';
    }

    function openDetail(row, trigger, options) {
        var marketing = options.marketing;
        var dialog = document.createElement('dialog');
        dialog.className = 'lf-operation-log lf-operation-log-detail' + (options.productScope ? ' lf-operation-log-detail--product' : '');
        dialog.setAttribute('aria-label', '操作日志详情');
        var isCreate = /^(新增|创建|添加)/.test(row.action);
        var isStatus = /^(启用|停用|禁用|开启|关闭|上架|下架|冻结|解冻)/.test(row.action);
        var failed = row.result === '失败';
        var heading = marketing || options.productScope || failed ? '变更明细' : isCreate ? '新增明细' : isStatus ? '状态变更' : '变更明细';
        var changeRows = row.changes.map(function (change) {
            return '<tr><td>' + html(change.field) + '</td><td class="lf-oplog-before">' +
                html(change.before) + '</td><td class="lf-oplog-after">' + html(change.after) + '</td></tr>';
        }).join('');
        var hasTechnical = row.technical.some(function (item) { return item[1]; }) || row.traceId || row.request;
        dialog.innerHTML =
            '<header><strong>操作日志详情</strong><button type="button" data-close aria-label="关闭详情">×</button></header>' +
            '<section class="lf-oplog-detail-body">' +
            '<p class="lf-oplog-detail-action"><span class="lf-oplog-result" data-result="' + html(row.result) + '">' +
            html(row.result) + '</span><strong>' + actionHtml(row) + '</strong>' +
            (marketing && row.traceId ? '<small>TraceID ' + html(row.traceId) + '</small>' : '') + '</p>' +
            detailTable(marketing
                ? [['操作时间', row.time], ['操作人', row.operator], ['查询对象', row.object],
                    ['客户端 IP', row.clientIp], ['来源服务', row.service], ['耗时', row.elapsed]]
                : [['操作时间', row.time], ['操作人', row.operator], ['业务编号', row.business], ['操作结果', row.result]]) +
            (failed ? '<p class="lf-oplog-failure"><strong>失败原因</strong> ' + html(row.failureReason || row.detail || '未记录') + '</p>' : '') +
            (row.detail && !failed && !(options.productScope && row.demo) ? '<p class="lf-oplog-summary">' + html(row.detail) + '</p>' : '') +
            '<h4>' + heading + ' <span>（共 ' + row.changes.length + (marketing ? ' 个字段' : ' 项') + '）</span></h4>' +
            (changeRows ? '<table class="lf-oplog-changes"><thead><tr><th>' + (marketing ? '字段' : '变更项') + '</th><th>变更前</th><th>变更后</th></tr></thead><tbody>' +
                changeRows + '</tbody></table>' : '<p class="lf-oplog-empty">' + (options.productScope ? '<span class="lf-oplog-empty-art" aria-hidden="true"></span>无字段级变更' : '暂无字段级变更明细') + '</p>') +
            (marketing
                ? '<h4>请求参数</h4><p class="lf-oplog-method">' + html(row.method) + '</p>' +
                    (row.request ? '<pre class="lf-oplog-request" aria-label="请求参数">' + html(row.request) + '</pre>' : '<p class="lf-oplog-empty">暂无请求参数</p>')
                : '<details class="lf-oplog-technical"><summary>技术信息</summary>' +
            (hasTechnical ? detailTable(row.technical, row.traceId) : '<p class="lf-oplog-empty">暂无技术信息</p>') +
            (row.request ? '<pre aria-label="请求参数">' + html(row.request) + '</pre>' : '') +
            '</details>') + '</section><footer><button type="button" data-close>关闭</button></footer>';
        dialog.addEventListener('click', function (event) {
            if (event.target.closest('[data-close]')) dialog.close();
        });
        dialog.addEventListener('close', function () {
            dialog.remove();
            trigger.focus();
        });
        document.body.appendChild(dialog);
        dialog.showModal();
    }

    function openAuditSummary(title, rows) {
        if (activeDialog) activeDialog.close();
        var dialog = document.createElement('dialog');
        dialog.className = 'lf-operation-log';
        dialog.setAttribute('aria-label', '操作日志 - ' + title);
        dialog.innerHTML =
            '<header><strong>操作日志 - ' + html(title) + '</strong><button type="button" aria-label="关闭">×</button></header>' +
            '<section><table><thead><tr><th>操作时间</th><th>操作内容</th><th>操作人</th><th>说明</th><th>结果</th></tr></thead><tbody>' +
            (rows.map(function (row) {
                return '<tr><td>' + html(row.time) + '</td><td>' + actionHtml(row) + '</td>' +
                    [row.operator, row.detail, row.result].map(function (value) {
                        return '<td>' + html(value) + '</td>';
                    }).join('') + '</tr>';
            }).join('') || '<tr><td colspan="5">暂无数据</td></tr>') +
            '</tbody></table></section>';
        dialog.querySelector('button').addEventListener('click', function () { dialog.close(); });
        dialog.addEventListener('close', function () {
            dialog.remove();
            if (activeDialog === dialog) activeDialog = null;
        });
        document.body.appendChild(dialog);
        activeDialog = dialog;
        dialog.showModal();
    }

    function open(title, records, options) {
        options = options || {};
        var marketing = !!options.marketing;
        var rows = (records || []).map(function (row) { return normalize(row, options); });
        rows.sort(function (a, b) { return b.time.localeCompare(a.time); });
        rows = withDemoRows(rows, options);
        if (options.auditSummary) return openAuditSummary(title, rows);
        if (activeDialog) activeDialog.close();
        var dialog = document.createElement('dialog');
        dialog.className = 'lf-operation-log';
        dialog.setAttribute('aria-label', title + ' · 操作日志');
        dialog.innerHTML =
            '<header><strong>' + (marketing ? '操作日志 · ' + html(title) : html(title) + ' · 操作日志') + '</strong><button type="button" data-close aria-label="关闭">×</button></header>' +
            '<section data-list><form' + (marketing ? ' hidden' : '') + '><label>操作类型<select name="type"><option value="">全部</option></select></label>' +
            '<label>操作结果<select name="result"><option value="">全部</option><option>成功</option><option>失败</option></select></label>' +
            '<div><button type="submit" class="lf-oplog-primary">查询</button><button type="reset">重置</button></div></form>' +
            '<table><thead><tr><th>操作时间</th><th>操作内容</th><th>操作人</th><th>' + (marketing ? '方法' : '业务编号') + '</th><th>结果</th><th>操作</th></tr></thead><tbody></tbody></table>' +
            '<nav aria-label="日志分页"></nav></section>';
        var form = dialog.querySelector('form');
        var tbody = dialog.querySelector('tbody');
        var pager = dialog.querySelector('nav');
        var page = 1;
        var pageSize = 20;
        var filtered = rows;

        Array.from(new Set(rows.map(function (row) { return row.action; }).concat(options.types || [])))
            .filter(function (type) { return type && type !== '—'; })
            .forEach(function (type) { form.elements.type.add(new Option(type, type)); });

        function render() {
            tbody.innerHTML = filtered.slice((page - 1) * pageSize, page * pageSize).map(function (row, index) {
                return '<tr><td>' + html(row.time) + '</td><td>' + actionHtml(row) + '</td><td>' +
                    html(row.operator) + '</td><td>' + (marketing ? '<code>' + html(row.method) + '</code>' : html(row.business)) + '</td><td><span class="lf-oplog-result" data-result="' +
                    html(row.result) + '">' + html(row.result) + '</span></td><td>' +
                    '<button type="button" class="lf-oplog-link" data-row="' + index + '">查看详情</button></td></tr>';
            }).join('') || '<tr><td colspan="6">' + (marketing ? '暂无数据' : '暂无操作日志') + '</td></tr>';
            var pages = Math.max(1, Math.ceil(filtered.length / pageSize));
            var previous = '<button type="button" aria-label="上一页" data-step="-1"' + (page === 1 ? ' disabled' : '') + '>‹</button>';
            var next = '<button type="button" aria-label="下一页" data-step="1"' + (page === pages ? ' disabled' : '') + '>›</button>';
            if (!marketing) {
                pager.innerHTML = '共 ' + filtered.length + ' 条 · 每页 20 条 ' + previous + ' ' + page + ' / ' + pages + ' ' + next;
                return;
            }
            var first = Math.max(1, Math.min(page - 2, pages - 4));
            var last = Math.min(pages, first + 4);
            var numbers = '';
            for (var n = first; n <= last; n += 1) {
                numbers += '<button type="button" data-page="' + n + '"' + (n === page ? ' aria-current="page"' : '') + '>' + n + '</button>';
            }
            pager.innerHTML = '<span>共 ' + filtered.length + ' 条</span><select data-page-size aria-label="每页条数">' +
                marketingPageSizes.map(function (size) {
                    return '<option value="' + size + '"' + (size === pageSize ? ' selected' : '') + '>' + size + '条/页</option>';
                }).join('') + '</select>' + previous + numbers + next +
                '<label>前往 <input type="number" min="1" max="' + pages + '" value="' + page +
                '" data-page-jump aria-label="前往页码"> 页</label>';
        }

        form.addEventListener('submit', function (event) {
            event.preventDefault();
            filtered = rows.filter(function (row) {
                return (!form.elements.type.value || row.action === form.elements.type.value) &&
                    (!form.elements.result.value || row.result === form.elements.result.value);
            });
            page = 1;
            render();
        });
        form.addEventListener('reset', function () {
            filtered = rows;
            page = 1;
            render();
        });
        if (marketing) {
            pager.classList.add('lf-oplog-marketing-pager');
            pager.addEventListener('change', function (event) {
                if (event.target.hasAttribute('data-page-size')) {
                    pageSize = Number(event.target.value);
                    page = 1;
                } else if (event.target.hasAttribute('data-page-jump')) {
                    page = Math.max(1, Math.min(Math.ceil(filtered.length / pageSize), Math.trunc(Number(event.target.value)) || 1));
                } else return;
                render();
            });
            pager.addEventListener('keydown', function (event) {
                if (event.key === 'Enter' && event.target.hasAttribute('data-page-jump')) {
                    event.preventDefault();
                    event.target.blur();
                }
            });
        }
        dialog.addEventListener('click', function (event) {
            var button = event.target.closest('button');
            if (!button) return;
            if (button.hasAttribute('data-close')) dialog.close();
            if (button.hasAttribute('data-step')) {
                page += Number(button.dataset.step);
                render();
            }
            if (button.hasAttribute('data-page')) {
                page = Number(button.dataset.page);
                render();
            }
            if (button.hasAttribute('data-row')) {
                openDetail(filtered[(page - 1) * pageSize + Number(button.dataset.row)], button, options);
            }
        });
        dialog.addEventListener('close', function () {
            dialog.remove();
            if (activeDialog === dialog) activeDialog = null;
        });
        document.body.appendChild(dialog);
        activeDialog = dialog;
        render();
        dialog.showModal();
    }

    function fromStore(title, store, id, fieldLabels, valueMap, marketing) {
        var size = 100;
        var first = store.listLogs(id, 1, size);
        var rows = first.list.slice();
        for (var page = 2; rows.length < first.total; page += 1) {
            var next = store.listLogs(id, page, size).list;
            if (!next.length) break;
            rows = rows.concat(next);
        }
        open(title, rows, {
            business: id,
            marketing: marketing,
            ACTION_LABEL: store.ACTION_LABEL,
            FIELD_LABEL: fieldLabels || store.FIELD_LABEL,
            VALUE_MAP: valueMap || store.VALUE_MAP
        });
    }

    function readRecords() {
        try {
            var rows = JSON.parse(localStorage.getItem(storageKey) || '[]');
            return Array.isArray(rows) ? rows : [];
        } catch (error) {
            return [];
        }
    }

    function record(scope, business, action, before, after) {
        var changes = Object.keys(after || {}).filter(function (key) {
            return (before || {})[key] !== after[key];
        }).map(function (key) {
            return { field: key, oldValue: (before || {})[key], newValue: after[key] };
        });
        if (before && after && !changes.length) return;
        var rows = readRecords();
        rows.unshift({
            scope: scope,
            business: business,
            time: new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' }),
            action: action,
            operator: document.querySelector('#userMenuTrigger .user-name')?.textContent.trim() || '当前用户',
            result: '成功',
            changes: changes
        });
        try {
            localStorage.setItem(storageKey, JSON.stringify(rows));
        } catch (error) {
            if (typeof global.showToast === 'function') global.showToast('操作已完成，日志写入失败', 'warning');
        }
    }

    function bindList(button, scope, title, types) {
        if (!button) return;
        button.addEventListener('click', function () {
            var productScope = scope === 'product-selection' || scope === 'product-category';
            var aliases = scope === 'product-selection'
                ? { '编辑商品': '修改商品', '启用商品': '商品上架', '停用商品': '商品下架' }
                : scope === 'product-category'
                    ? { '新增类目': '新增分类', '编辑类目': '修改分类', '上架类目': '修改分类', '下架类目': '修改分类', '删除类目': '删除分类' }
                    : {};
            var rows = readRecords().filter(function (row) {
                return row.scope === scope || (scope === 'product-category' && row.scope === 'mall-category');
            });
            open(title, rows, { types: types, productScope: productScope, ACTION_LABEL: aliases });
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('[data-master-log]').forEach(function (button) {
            bindList(button, button.dataset.masterLog, button.dataset.logTitle, button.dataset.logTypes.split(','));
        });
    });

    global.MdmOperationLog = { open: open, fromStore: fromStore, record: record, bindList: bindList };
})(window);
