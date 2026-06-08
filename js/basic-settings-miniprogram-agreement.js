(function () {
    const tabs = document.querySelectorAll('.bs-agreement-tabs button');
    const titleInput = document.getElementById('agreementTitle');
    const editorBody = document.getElementById('agreementEditorBody');
    const saveBtn = document.getElementById('bsSaveBtn');

    const tabContents = {
        user: {
            title: '冷丰商城用户服务协议',
            html:
                '<h3>1. 服务内容</h3>' +
                '<p>冷丰商城向用户提供商品展示、在线交易、订单查询、物流配送及相关售后服务。具体服务内容以平台实际提供为准。</p>' +
                '<h3>2. 用户权利与义务</h3>' +
                '<p>用户有权在平台浏览商品信息、下单购买并享受相应售后服务。用户应保证注册信息真实、准确，并妥善保管账号及密码，对账号下的行为负责。</p>' +
                '<h3>3. 交易规则</h3>' +
                '<p>用户下单后，应在规定时间内完成支付。平台有权根据库存、活动规则等情况调整订单，并将通过站内消息或短信等方式通知用户。</p>' +
                '<h3>4. 隐私保护</h3>' +
                '<p>平台将按照《隐私协议》收集、使用和保护用户个人信息，未经用户同意不会向第三方披露，法律法规另有规定的除外。</p>' +
                '<h3>5. 免责声明</h3>' +
                '<p>因不可抗力、网络故障、第三方服务中断等原因导致的服务暂停或数据丢失，平台将在合理范围内协助处理，但不承担超出法律规定范围的责任。</p>'
        },
        privacy: {
            title: '冷丰商城隐私保护政策',
            html:
                '<h3>1. 信息收集</h3>' +
                '<p>我们可能收集您的手机号、收货地址、订单信息、设备信息及日志信息，用于完成交易、保障账号安全及改进服务体验。</p>' +
                '<h3>2. 信息使用</h3>' +
                '<p>收集的信息将用于身份验证、订单履约、客户服务、风险控制及符合法律法规要求的其他用途。</p>' +
                '<h3>3. 信息共享</h3>' +
                '<p>未经您同意，我们不会向第三方共享您的个人信息，但为完成配送、支付等必要服务，可能向合作方提供最小必要信息。</p>' +
                '<h3>4. 信息安全</h3>' +
                '<p>我们采取合理的技术与管理措施保护您的个人信息，防止未经授权的访问、披露或篡改。</p>'
        },
        cert: {
            title: '资质证书说明',
            html:
                '<h3>1. 营业执照</h3>' +
                '<p>上海冷丰科技有限公司依法登记成立，具备合法经营资质。相关证照信息可在小程序「关于我们」页面查看。</p>' +
                '<h3>2. 食品经营许可</h3>' +
                '<p>涉及食品类商品销售时，平台及入驻商户均应具备相应许可资质，并持续有效。</p>' +
                '<h3>3. 其他资质</h3>' +
                '<p>根据业务需要，平台可能展示其他行业资质证书，具体以页面公示内容为准。</p>'
        }
    };

    let activeTab = 'user';

    function loadTab(tabKey) {
        activeTab = tabKey;
        const data = tabContents[tabKey];
        if (!data) return;
        if (titleInput) titleInput.value = data.title;
        if (editorBody) editorBody.innerHTML = data.html;
        tabs.forEach(function (btn) {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabKey);
        });
    }

    tabs.forEach(function (btn) {
        btn.addEventListener('click', function () {
            loadTab(btn.getAttribute('data-tab'));
        });
    });

    document.querySelectorAll('.bs-editor-toolbar button[data-cmd]').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const cmd = btn.getAttribute('data-cmd');
            const val = btn.getAttribute('data-val') || null;
            if (editorBody) {
                editorBody.focus();
                document.execCommand(cmd, false, val);
            }
        });
    });

    if (saveBtn) {
        saveBtn.addEventListener('click', function () {
            if (typeof showToast === 'function') {
                showToast('已保存并配置（演示）', 'success');
            }
        });
    }

    loadTab('user');
})();
