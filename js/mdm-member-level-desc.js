/**
 * 会员等级 — 规则说明（富文本编辑，支持上传图片）
 */
(function () {
    var STORAGE_KEY = 'mdm_member_level_rule_desc_v1';
    var IMAGE_MAX_BYTES = 2 * 1024 * 1024;

    var DEFAULT_DESC = {
        title: '会员等级规则说明',
        html:
            '<h3>一、成长值获取</h3>' +
            '<p>成长值可通过消费与活跃两种方式获取，具体规则以「成长值规则」配置为准。成长值可设置有效期，过期后失效。</p>' +
            '<h3>二、升降级策略</h3>' +
            '<p><strong>升级：</strong>当会员当前有效成长值达到某等级门槛时，系统自动升至满足条件的最高等级，达标后立即生效。</p>' +
            '<p><strong>降级：</strong>当会员当前有效成长值低于当前等级门槛时，系统将降至满足条件的最高等级，于每月 1 号统一处理。</p>' +
            '<h3>三、会员权益</h3>' +
            '<p>不同等级可配置赠送积分、赠送优惠券、商品会员折扣、积分倍率及生日送券等权益。赠送券与生日券支持累计 / 每月 / 每日发放，并可配置多种优惠券及数量。</p>' +
            '<h3>四、其他说明</h3>' +
            '<p>会员等级最多可设置 10 个，列表按成长值从低到高排列。本说明内容可随时编辑更新。</p>'
    };

    function toast(msg, type) {
        if (typeof showToast === 'function') {
            showToast(msg, type || 'success');
            return;
        }
        window.alert(msg);
    }

    function loadDesc() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return { title: DEFAULT_DESC.title, html: DEFAULT_DESC.html };
            var parsed = JSON.parse(raw);
            return {
                title: parsed.title || DEFAULT_DESC.title,
                html: parsed.html || DEFAULT_DESC.html
            };
        } catch (e) {
            return { title: DEFAULT_DESC.title, html: DEFAULT_DESC.html };
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

    function bindEvents() {
        var backBtn = document.getElementById('btnBackLevel');
        if (backBtn) {
            backBtn.addEventListener('click', function () {
                window.location.href = 'mdm_member_level.html';
            });
        }

        document.querySelectorAll('.ml-editor-toolbar button[data-cmd]').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                var editor = document.getElementById('ruleDescEditor');
                if (!editor) return;
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
                fillForm(DEFAULT_DESC);
                toast('已恢复默认内容（尚未保存）', 'info');
            });
        }

        var saveBtn = document.getElementById('btnDescSave');
        if (saveBtn) {
            saveBtn.addEventListener('click', function () {
                var title = ((document.getElementById('ruleDescTitle') || {}).value || '').trim();
                var editor = document.getElementById('ruleDescEditor');
                var html = editor ? editor.innerHTML : '';
                var plain = editor ? (editor.innerText || '').trim() : '';
                var hasImage = !!(editor && editor.querySelector('img'));
                if (!title) {
                    toast('请输入说明标题', 'warning');
                    return;
                }
                if (!plain && !hasImage) {
                    toast('请填写说明正文', 'warning');
                    return;
                }
                localStorage.setItem(STORAGE_KEY, JSON.stringify({ title: title, html: html }));
                toast('规则说明已保存', 'success');
            });
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        fillForm(loadDesc());
        bindEvents();
    });
})();
