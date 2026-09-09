/**
 * 会员规则说明 / 成长值规则说明（富文本编辑，支持上传图片）
 * kind=member → C 端会员中心「规则说明」
 * kind=growth → C 端成长值明细「规则」
 */
(function (global) {
    var IMAGE_MAX_BYTES = 2 * 1024 * 1024;

    var KINDS = {
        member: {
            storageKey: 'mdm_member_level_rule_desc_v1',
            saveToast: '会员规则说明已保存',
            defaultDesc: {
                title: '会员规则说明',
                html:
                    '<h3>一、会员等级</h3>' +
                    '<p>会员等级依据当前有效成长值划分。当有效成长值达到某等级门槛时，自动升至满足条件的最高等级，达标后立即生效。</p>' +
                    '<p>当有效成长值低于当前等级门槛时，将降至满足条件的最高等级，于每日统一处理。</p>' +
                    '<h3>二、会员权益</h3>' +
                    '<p>不同等级可配置赠送积分、赠送优惠券、商品会员折扣、消费积分等级赠送比例及生日送券等权益。赠送券与生日券支持累计 / 每月 / 每日发放，并可配置多种优惠券及数量。</p>' +
                    '<h3>三、其他说明</h3>' +
                    '<p>会员等级最多可设置 15 个，列表按成长值从低到高排列。成长值如何获取与有效期，详见成长值规则说明。本说明内容可随时编辑更新。</p>'
            }
        },
        growth: {
            storageKey: 'mdm_member_growth_rule_desc_v1',
            saveToast: '成长值规则说明已保存',
            defaultDesc: {
                title: '成长值规则说明',
                html:
                    '<h3>一、什么是成长值</h3>' +
                    '<p>成长值用于衡量会员消费与活跃情况，是会员等级升降的依据。页面展示的当前成长值次日更新。</p>' +
                    '<h3>二、如何获取</h3>' +
                    '<p>开启消费获成长值后，每支付约定金额可获得对应成长值（具体以「成长值规则」配置为准）。订单售后成功时，按获取时的比例扣除对应成长值。</p>' +
                    '<h3>三、有效期</h3>' +
                    '<p>成长值可设置为永久有效或滚动有效期。滚动有效期自获得之日起计算，到期后该笔成长值失效，并可能影响当前会员等级。</p>' +
                    '<h3>四、其他说明</h3>' +
                    '<p>成长值不足 1、发放时点（支付完成 / 交易完成）等细则以「成长值规则」配置为准。本说明内容可随时编辑更新。</p>'
            }
        }
    };

    function toast(msg, type) {
        if (typeof showToast === 'function') {
            showToast(msg, type || 'success');
            return;
        }
        window.alert(msg);
    }

    function resolveKind(explicit) {
        if (explicit && KINDS[explicit]) return explicit;
        var host = document.querySelector('[data-rule-desc-kind]');
        if (host) {
            var k = host.getAttribute('data-rule-desc-kind');
            if (KINDS[k]) return k;
        }
        return 'member';
    }

    function loadDesc(kind) {
        var cfg = KINDS[resolveKind(kind)];
        try {
            var raw = localStorage.getItem(cfg.storageKey);
            if (!raw) return { title: cfg.defaultDesc.title, html: cfg.defaultDesc.html };
            var parsed = JSON.parse(raw);
            return {
                title: parsed.title || cfg.defaultDesc.title,
                html: parsed.html || cfg.defaultDesc.html
            };
        } catch (e) {
            return { title: cfg.defaultDesc.title, html: cfg.defaultDesc.html };
        }
    }

    function fillForm(data) {
        var titleEl = document.getElementById('ruleDescTitle');
        var editor = document.getElementById('ruleDescEditor');
        if (titleEl) titleEl.value = data.title || '';
        if (editor) editor.innerHTML = data.html || '';
    }

    function insertImageAtCursor(editor, dataUrl) {
        editor.focus();
        var imgHtml = '<img src="' + dataUrl + '" alt="规则说明图片">';
        if (document.queryCommandSupported && document.queryCommandSupported('insertHTML')) {
            document.execCommand('insertHTML', false, imgHtml);
            return;
        }
        var sel = window.getSelection();
        if (sel && sel.rangeCount) {
            var range = sel.getRangeAt(0);
            range.deleteContents();
            var img = document.createElement('img');
            img.src = dataUrl;
            img.alt = '规则说明图片';
            range.insertNode(img);
            range.setStartAfter(img);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
            return;
        }
        editor.insertAdjacentHTML('beforeend', imgHtml);
    }

    function bindImageUpload() {
        var btn = document.getElementById('btnInsertImage');
        var input = document.getElementById('ruleDescImageInput');
        var editor = document.getElementById('ruleDescEditor');
        if (!btn || !input || !editor) return;

        btn.addEventListener('click', function (e) {
            e.preventDefault();
            input.click();
        });

        input.addEventListener('change', function () {
            var file = input.files && input.files[0];
            input.value = '';
            if (!file) return;
            if (!/^image\/(jpeg|png|gif|webp)$/i.test(file.type)) {
                toast('请上传 JPG/PNG/GIF/WEBP 格式图片', 'warning');
                return;
            }
            if (file.size > IMAGE_MAX_BYTES) {
                toast('图片大小不能超过 2MB', 'warning');
                return;
            }
            var reader = new FileReader();
            reader.onload = function () {
                insertImageAtCursor(editor, String(reader.result || ''));
                toast('图片已插入', 'success');
            };
            reader.onerror = function () {
                toast('图片读取失败', 'error');
            };
            reader.readAsDataURL(file);
        });
    }

    function bindGotoPage() {
        document.querySelectorAll('[data-goto-page]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var name = btn.getAttribute('data-goto-page');
                if (!name) return;
                window.location.href = (window.wmsPath && typeof window.wmsPath.page === 'function')
                    ? window.wmsPath.page(name)
                    : name;
            });
        });
    }

    function bindEditor(kind) {
        var cfg = KINDS[resolveKind(kind)];
        var editor = document.getElementById('ruleDescEditor');
        if (!editor) return;

        document.querySelectorAll('.ml-editor-toolbar button[data-cmd]').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                editor.focus();
                var cmd = btn.getAttribute('data-cmd');
                var val = btn.getAttribute('data-val') || null;
                if (cmd === 'formatBlock' && val) {
                    document.execCommand(cmd, false, val);
                    return;
                }
                document.execCommand(cmd, false, val);
            });
        });

        bindImageUpload();

        var resetBtn = document.getElementById('btnDescReset');
        if (resetBtn) {
            resetBtn.addEventListener('click', function () {
                fillForm(cfg.defaultDesc);
                toast('已恢复默认内容（尚未保存）', 'info');
            });
        }

        var saveBtn = document.getElementById('btnDescSave');
        if (saveBtn) {
            saveBtn.addEventListener('click', function () {
                var title = ((document.getElementById('ruleDescTitle') || {}).value || '').trim();
                var html = editor.innerHTML || '';
                var plain = (editor.innerText || '').trim();
                var hasImage = !!editor.querySelector('img');
                if (!title) {
                    toast('请输入说明标题', 'warning');
                    return;
                }
                if (!plain && !hasImage) {
                    toast('请填写说明正文', 'warning');
                    return;
                }
                localStorage.setItem(cfg.storageKey, JSON.stringify({ title: title, html: html }));
                toast(cfg.saveToast, 'success');
            });
        }
    }

    function gotoPage(name) {
        if (!name) return;
        window.location.href = (window.wmsPath && typeof window.wmsPath.page === 'function')
            ? window.wmsPath.page(name)
            : name;
    }

    global.MdmMemberRuleDesc = {
        load: loadDesc,
        kinds: KINDS,
        bindGotoPage: bindGotoPage,
        gotoPage: gotoPage
    };

    document.addEventListener('DOMContentLoaded', function () {
        bindGotoPage();
        var editor = document.getElementById('ruleDescEditor');
        if (!editor) return;
        var kind = resolveKind();
        fillForm(loadDesc(kind));
        bindEditor(kind);
    });
})(window);
