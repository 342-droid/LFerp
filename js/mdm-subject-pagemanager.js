/**
 * MDM 主体中心 — PageManager 实现（与 LF-master 列表列一致：10 列数据 + 禁用/启用）
 * 列：主体ID、主体名称、绑定列、主体类型、联系人/负责人、手机、登录账号、创建时间、最后操作人、状态
 */
(function () {
    function ensureLfWarmConfirmModal() {
        if (document.getElementById('lfMdmWarmConfirm')) return;
        document.body.insertAdjacentHTML(
            'beforeend',
            '<div id="lfMdmWarmConfirm" class="modal" style="display:none">' +
                '<div class="modal-content" style="width:420px">' +
                '<div class="modal-header">' +
                '<h2 class="modal-title">温馨提示</h2>' +
                '<span class="close" id="lfMdmWarmCloseX">&times;</span>' +
                '</div>' +
                '<div class="modal-body" style="padding:16px 20px;line-height:1.65;color:#333">' +
                '<p id="lfMdmWarmMsg" style="margin:0;"></p>' +
                '</div>' +
                '<div class="modal-footer">' +
                '<button type="button" class="btn btn-primary" id="lfMdmWarmOk">确定</button>' +
                '<button type="button" class="btn btn-secondary" id="lfMdmWarmCancel">取消</button>' +
                '</div></div></div>'
        );
        function hide() {
            var m = document.getElementById('lfMdmWarmConfirm');
            if (m) m.style.display = 'none';
        }
        document.getElementById('lfMdmWarmCancel').addEventListener('click', hide);
        document.getElementById('lfMdmWarmCloseX').addEventListener('click', hide);
        document.getElementById('lfMdmWarmConfirm').addEventListener('click', function (e) {
            if (e.target.id === 'lfMdmWarmConfirm') hide();
        });
    }

    function showLfWarmConfirm(message, onOk) {
        ensureLfWarmConfirmModal();
        var modal = document.getElementById('lfMdmWarmConfirm');
        var okBtn = document.getElementById('lfMdmWarmOk');
        var msgEl = document.getElementById('lfMdmWarmMsg');
        if (!modal || !okBtn || !msgEl) return;
        msgEl.textContent = message;
        modal.style.display = 'block';
        okBtn.onclick = function () {
            modal.style.display = 'none';
            okBtn.onclick = null;
            if (typeof onOk === 'function') onOk();
        };
    }

    function filterSubjectRows(pm) {
        var tbody = document.getElementById(pm.config.tableBodyId);
        if (!tbody) return;
        var ni = document.getElementById('qSubjectName');
        var ss = document.getElementById('qStatus');
        var qName = ni ? ni.value.trim() : '';
        var qSt = ss ? ss.value.trim() : '';
        tbody.querySelectorAll('tr').forEach(function (tr) {
            var cells = tr.querySelectorAll('td');
            if (cells.length < 11) return;
            var nm = cells[1].textContent.trim();
            var st = cells[9].querySelector('.status');
            var stTxt = st ? st.textContent.trim() : '';
            var ok = true;
            if (qName && nm.indexOf(qName) === -1) ok = false;
            if (qSt === 'normal' && stTxt !== '正常') ok = false;
            if (qSt === 'frozen' && stTxt !== '冻结') ok = false;
            if (qSt === 'stopped' && stTxt !== '停用') ok = false;
            tr.style.display = ok ? '' : 'none';
        });
        pm.refreshPagination();
    }

    /**
     * @param {{
     *   entityName?: string,
     *   pageLabel: string,
     *   subjectTypeLabel: string,
     *   bindColumnLabel?: string,
     *   contactPersonLabel?: string,
     *   showBindBd?: boolean,
     *   compactStoreSubjectForm?: boolean,
     *   disableConfirmMessage?: string,
     *   addModalId?: string,
     *   editModalId?: string,
     *   pageSize?: number,
     *   addButtonLabel?: string,
     *   subjectTypeOptions?: string[]
     * }} spec
     */
    function nextSubjectRowId(prefix, pm) {
        var tbody = document.getElementById(pm.config.tableBodyId);
        var max = 0;
        if (!tbody) return prefix + '-SUB-001';
        var re = new RegExp(
            '^' + String(prefix).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '-SUB-(\\d+)$'
        );
        tbody.querySelectorAll('tr').forEach(function (tr) {
            var c0 = tr.querySelectorAll('td')[0];
            if (!c0) return;
            var m = String(c0.textContent || '').trim().match(re);
            if (m) max = Math.max(max, parseInt(m[1], 10));
        });
        return prefix + '-SUB-' + String(max + 1).padStart(3, '0');
    }

    function maskPhoneForTable(phoneRaw) {
        var d = String(phoneRaw || '').replace(/\D/g, '');
        if (d.length < 7) return phoneRaw || '—';
        return d.slice(0, 3) + '****' + d.slice(-4);
    }

    function init(spec) {
        var showBindBd = !!spec.showBindBd;
        var compactLogin = !!spec.compactStoreSubjectForm;
        var contactLabel = spec.contactPersonLabel || '联系人';
        var bindHdr = spec.bindColumnLabel || '绑定BD名称';
        var disableMsg = spec.disableConfirmMessage || '确定禁用该主体吗？';
        var addModalId = spec.addModalId || 'mdmSubjectAddModal';
        var editModalId = spec.editModalId || 'mdmSubjectDetailModal';
        var addBtnLabel = spec.addButtonLabel || '+ 新增' + spec.pageLabel + '主体';
        var multiSubjectType = Array.isArray(spec.subjectTypeOptions) && spec.subjectTypeOptions.length > 0;
        var typeOptions = multiSubjectType
            ? spec.subjectTypeOptions.map(function (x) {
                  return { value: x, text: x };
              })
            : [{ value: spec.subjectTypeLabel, text: spec.subjectTypeLabel }];
        var idPrefixMap = {
            门店: 'STORE',
            供应商: 'SUP',
            仓库: 'WH',
            直播间: 'LIVE',
            承运商: 'CAR'
        };
        var subjectIdPrefix = spec.subjectIdPrefix || idPrefixMap[spec.pageLabel] || 'SUB';

        var fields = [
            {
                id: 'subjectId',
                label: '主体ID',
                type: 'text',
                required: true,
                editDisabled: true,
                hiddenInAdd: true
            },
            {
                id: 'subjectName',
                label: '主体名称',
                type: 'text',
                required: true,
                editDisabled: true,
                placeholder: '请输入主体名称'
            }
        ];

        if (showBindBd) {
            fields.push({
                id: 'dockPerson',
                label: '绑定BD',
                type: 'select',
                required: true,
                editDisabled: true,
                options: [
                    { value: '', text: '请选择绑定BD' },
                    { value: '赵小九', text: '赵小九' },
                    { value: '李四', text: '李四' },
                    { value: '张三', text: '张三' },
                    { value: '王五', text: '王五' }
                ]
            });
        } else {
            fields.push({
                id: 'dockPerson',
                label: bindHdr,
                type: 'text',
                editDisabled: true,
                hiddenInAdd: true
            });
        }

        fields.push(
            {
                id: 'subjectType',
                label: '主体类型',
                type: 'select',
                required: true,
                editDisabled: true,
                disabled: !multiSubjectType,
                options: typeOptions
            },
            {
                id: 'contactPerson',
                label: contactLabel,
                type: 'text',
                required: true,
                editDisabled: true,
                placeholder: '请输入' + contactLabel
            },
            {
                type: 'raw',
                html:
                    '<div class="modal-form-group" style="width:100%">' +
                    '<label style="min-width:100px"><span style="color:red">*</span>手机号码</label>' +
                    '<div style="flex:1;display:flex;gap:8px;align-items:center">' +
                    '<div class="input-wrapper" style="flex:1">' +
                    '<input type="text" id="addPhone" placeholder="请输入手机号码">' +
                    '<span class="clear-btn">×</span></div>' +
                    '<button type="button" class="btn btn-secondary btn-sm" id="mdmSmsDummyBtn">获取验证码</button>' +
                    '</div></div>',
                editHtml:
                    '<div class="modal-form-group"><label style="min-width:100px">手机号码</label>' +
                    '<div class="input-wrapper">' +
                    '<input type="text" id="editRowPhoneDisplay" disabled>' +
                    '<span class="clear-btn">×</span></div></div>'
            },
            {
                id: 'smsCode',
                label: '验证码',
                type: 'text',
                required: true,
                editDisabled: true
            },
            ...(compactLogin
                ? []
                : [
                      {
                          id: 'loginAccount',
                          label: '登录账号',
                          type: 'text',
                          editDisabled: true,
                          placeholder: '请输入登录账号'
                      }
                  ]),
            {
                id: 'createTime',
                label: '创建时间',
                type: 'text',
                editDisabled: true,
                disabled: true,
                hiddenInAdd: true
            },
            {
                id: 'lastOperator',
                label: '最后操作人',
                type: 'text',
                editDisabled: true,
                hiddenInAdd: true
            },
            {
                id: 'rowStatus',
                label: '状态',
                type: 'select',
                required: true,
                editDisabled: true,
                hiddenInAdd: true,
                options: [
                    { value: '正常', text: '正常' },
                    { value: '冻结', text: '冻结' },
                    { value: '停用', text: '停用' }
                ]
            }
        );

        var pm = new PageManager({
            entityName: spec.entityName || spec.pageLabel + '主体',
            addModalTitle: spec.addModalTitle || '添加' + spec.pageLabel + '主体',
            editModalTitle: spec.editModalTitle || '编辑' + spec.pageLabel + '主体',
            detailModalTitle: spec.detailModalTitle || spec.pageLabel + '详情',
            statusColumnIndex: 9,
            checkboxColumn: false,
            actionColumnMode: 'disableToggle',
            pageSize: spec.pageSize != null ? spec.pageSize : 20,
            detailView: {
                enabled: true,
                columnIndex: 1,
                linkClass: 'subject-name-link'
            },
            fields: fields,
            onDisableToggle: function (row, status) {
                if (status === '停用') {
                    pm.updateTableRow(row, { 9: { value: '正常', isStatus: true } });
                    pm.refreshDisableToggleLabel(row);
                    return;
                }
                showLfWarmConfirm(disableMsg, function () {
                    pm.updateTableRow(row, { 9: { value: '停用', isStatus: true } });
                    pm.refreshDisableToggleLabel(row);
                });
            },
            addModal: {
                modalId: addModalId,
                cancelBtnId: addModalId + 'CancelBtn',
                saveBtnId: addModalId + 'SaveBtn',
                triggerBtnId: 'mdmSubjectAddBtn',
                onOpen: function () {
                    if (!multiSubjectType) {
                        var st = document.getElementById('subjectType');
                        if (st) st.value = spec.subjectTypeLabel;
                    }
                },
                validations: [
                    { id: 'subjectName', message: '请输入主体名称', required: true },
                    ...(showBindBd
                        ? [{ id: 'dockPerson', message: '请选择绑定BD', required: true }]
                        : []),
                    ...(multiSubjectType
                        ? [{ id: 'subjectType', message: '请选择主体类型', required: true }]
                        : []),
                    {
                        id: 'contactPerson',
                        message: '请输入' + contactLabel,
                        required: true
                    },
                    { id: 'addPhone', message: '请输入手机号码', required: true },
                    { id: 'smsCode', message: '请输入验证码', required: true }
                ],
                onSave: function () {
                    var pv = document.getElementById('addPhone')
                        ? document.getElementById('addPhone').value.trim()
                        : '';
                    if (!pv) {
                        showToast('请输入手机号码');
                        return false;
                    }
                    var loginVal = compactLogin
                        ? '—'
                        : document.getElementById('loginAccount')
                          ? document.getElementById('loginAccount').value.trim() || '—'
                          : '—';
                    if (!compactLogin && (!loginVal || loginVal === '—')) {
                        showToast('请输入登录账号');
                        return false;
                    }
                    var dockVal = '—';
                    if (showBindBd) {
                        var dockEl = document.getElementById('dockPerson');
                        dockVal = dockEl ? dockEl.value.trim() : '';
                        if (!dockVal) {
                            showToast('请选择绑定BD');
                            return false;
                        }
                    }
                    var typeEl = document.getElementById('subjectType');
                    var typeVal = typeEl ? typeEl.value.trim() : spec.subjectTypeLabel;
                    var cells = [
                        nextSubjectRowId(subjectIdPrefix, pm),
                        document.getElementById('subjectName').value.trim(),
                        dockVal,
                        typeVal || spec.subjectTypeLabel,
                        document.getElementById('contactPerson').value.trim(),
                        maskPhoneForTable(pv),
                        loginVal,
                        pm.getCurrentTimeStr(),
                        '当前用户',
                        { value: '正常', isStatus: true }
                    ];
                    pm.addTableRow({ cells: cells });
                    showToast(spec.pageLabel + '主体已保存', 'success');
                }
            },
            editModal: {
                modalId: editModalId,
                cancelBtnId: editModalId + 'CancelBtn',
                saveBtnId: editModalId + 'SaveBtn',
                validations: [],
                mapRowToForm: function (row) {
                    pm.currentEditRow = row;
                    var c = row.querySelectorAll('td');
                    return {
                        editSubjectId: c[0].textContent.trim(),
                        editSubjectName: c[1].textContent.trim(),
                        editDockPerson: c[2].textContent.trim(),
                        editSubjectType: c[3].textContent.trim(),
                        editContactPerson: c[4].textContent.trim(),
                        editRowPhoneDisplay: c[5].textContent.trim(),
                        editLoginAccount: c[6].textContent.trim(),
                        editCreateTime: c[7].textContent.trim(),
                        editLastOperator: c[8].textContent.trim(),
                        editRowStatus: c[9].querySelector('.status').textContent.trim(),
                        editSmsCode: '—'
                    };
                },
                onSave: function () {},
                onDetailModeChange: function (isDetail) {
                    var g = document.getElementById('editSmsCode');
                    if (g && g.closest)
                        g.closest('.modal-form-group').style.display = isDetail ? 'none' : '';
                }
            }
        });

        pm.init();

        var addBtn = document.getElementById('mdmSubjectAddBtn');
        if (addBtn) addBtn.textContent = addBtnLabel;

        document.getElementById('btnFilterReset') &&
            document.getElementById('btnFilterReset').addEventListener('click', function () {
                var ni = document.getElementById('qSubjectName');
                var ss = document.getElementById('qStatus');
                if (ni) ni.value = '';
                if (ss) ss.value = '';
                filterSubjectRows(pm);
            });
        document.getElementById('btnFilterQuery') &&
            document.getElementById('btnFilterQuery').addEventListener('click', function () {
                filterSubjectRows(pm);
            });

        document.body.addEventListener('click', function (e) {
            if (e.target && e.target.id === 'mdmSmsDummyBtn')
                showToast('验证码已发送（演示）', 'info');
        });

        setTimeout(function () {
            pm.decorateAllDetailLinkCells();
            document.querySelectorAll('#tableBody tr').forEach(function (tr) {
                pm.refreshDisableToggleLabel(tr);
            });
        }, 0);

        return pm;
    }

    window.MdmSubjectLf = {
        init: init,
        filterSubjectRows: filterSubjectRows,
        showLfWarmConfirm: showLfWarmConfirm
    };
})();
