/**
 * 营销 — 积分规则说明（富文本，样式对齐会员等级/成长值规则说明）
 */
(function () {
  var STORAGE_KEY = 'mdm_marketing_points_rule_desc_v1';
  var IMAGE_MAX_BYTES = 2 * 1024 * 1024;

  var DEFAULT_DESC = {
    title: '积分规则说明',
    html:
      '<h3>一、积分获取</h3>' +
      '<p>积分可通过消费赠送、会员升级、签到、任务等方式获得，具体以平台当前生效规则为准。积分自获得之日起计算有效期，到期后失效。</p>' +
      '<h3>二、积分使用</h3>' +
      '<p><strong>积分抵现：</strong>下单时可按规则使用积分抵扣部分金额，受单笔比例与金额上限约束。</p>' +
      '<p><strong>积分商城：</strong>可在积分商城使用可用积分（不含冻结积分）兑换商品，部分商品支持积分加现金。</p>' +
      '<h3>三、冻结与售后</h3>' +
      '<p>部分场景下积分会进入冻结状态，交易完成后转为可用。积分兑换商品是否支持售后及退还规则，以积分规则配置为准。</p>' +
      '<h3>四、其他说明</h3>' +
      '<p>本说明内容可随时由运营编辑更新，最终解释权归平台所有。</p>'
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
    var imgHtml = '<img src="' + dataUrl + '" alt="积分规则说明图片">';
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
      img.alt = '积分规则说明图片';
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
    var backBtn = document.getElementById('btnBackMall');
    if (backBtn) {
      backBtn.addEventListener('click', function () {
        window.location.href = 'mdm_marketing_points_mall.html';
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
        toast('积分规则说明已保存', 'success');
      });
    }
  }

  window.MdmPointsRuleDesc = {
    load: loadDesc,
    STORAGE_KEY: STORAGE_KEY
  };

  document.addEventListener('DOMContentLoaded', function () {
    fillForm(loadDesc());
    bindEvents();
  });
})();
