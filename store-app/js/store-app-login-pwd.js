/**
 * 门店 APP · 登录密码规则与深色全键盘（字母 / 数字符号）
 */
(function (global) {
  /* 与键盘可输入特殊字符对齐 */
  var SPECIAL =
    '!@#$%^&*()_+-=[]{}|;:\'",.<>?/\\¥。、~`€£•·°™\u201c\u201d';
  var PLACEHOLDER = '6-16位，支持数字、字母、特殊字符';
  var LETTERS_TOP = 'qwertyuiop';
  var LETTERS_MID = 'asdfghjkl';
  var LETTERS_BOT = 'zxcvbnm';
  var NUMS = '1234567890';
  var SYM_ROW2 = '-/:;()¥@';
  var SYM_ROW3 = '。,、?!.';
  var MORE_ROW1 = '[]{}#%^*+=';
  var MORE_ROW2 = '_\\|~<>$€£•';
  var MORE_ROW3 = "·'&^°™";

  var ICON_SHIFT =
    '<svg class="sa-pwd-fullkbd__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4l7 8h-4v7H9v-7H5l7-8z"/></svg>';
  var ICON_DEL =
    '<svg class="sa-pwd-fullkbd__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8.5 6H20a1 1 0 011 1v10a1 1 0 01-1 1H8.5L3 12l5.5-6z"/><path d="M11 10l4 4M15 10l-4 4"/></svg>';
  var ICON_EMOJI =
    '<svg class="sa-pwd-fullkbd__icon sa-pwd-fullkbd__icon--emoji" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r="1.1" fill="currentColor" stroke="none"/><path d="M8.5 14.5c1.2 1.4 2.5 2 3.5 2s2.3-.6 3.5-2" stroke-linecap="round"/></svg>';

  function isAllowedChar(ch) {
    if (!ch || ch.length !== 1) return false;
    if (/[A-Za-z0-9]/.test(ch)) return true;
    return SPECIAL.indexOf(ch) !== -1;
  }

  function cleanPassword(raw) {
    var s = String(raw || '');
    var out = '';
    for (var i = 0; i < s.length && out.length < 16; i++) {
      var ch = s.charAt(i);
      if (isAllowedChar(ch)) out += ch;
    }
    return out;
  }

  /** 连续 4 位及以上数字/字母连号（升降序） */
  function hasConsecutiveRun(pwd) {
    var s = String(pwd || '');
    var run = 1;
    var dir = 0;
    for (var i = 0; i < s.length - 1; i++) {
      var a = s.charAt(i).toLowerCase();
      var b = s.charAt(i + 1).toLowerCase();
      var ca = a.charCodeAt(0);
      var cb = b.charCodeAt(0);
      var bothDigit = ca >= 48 && ca <= 57 && cb >= 48 && cb <= 57;
      var bothLetter = ca >= 97 && ca <= 122 && cb >= 97 && cb <= 122;
      if (!bothDigit && !bothLetter) {
        run = 1;
        dir = 0;
        continue;
      }
      var step = cb - ca;
      if (step === 1 || step === -1) {
        if (dir === step) run += 1;
        else {
          dir = step;
          run = 2;
        }
        if (run >= 4) return true;
      } else {
        run = 1;
        dir = 0;
      }
    }
    return false;
  }

  function isAllSameChar(pwd) {
    var s = String(pwd || '');
    if (s.length < 2) return false;
    var first = s.charAt(0);
    for (var i = 1; i < s.length; i++) {
      if (s.charAt(i) !== first) return false;
    }
    return true;
  }

  function typeCount(pwd) {
    var s = String(pwd || '');
    var hasL = false;
    var hasD = false;
    var hasS = false;
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i);
      if (/[A-Za-z]/.test(ch)) hasL = true;
      else if (/\d/.test(ch)) hasD = true;
      else if (isAllowedChar(ch)) hasS = true;
    }
    return (hasL ? 1 : 0) + (hasD ? 1 : 0) + (hasS ? 1 : 0);
  }

  /**
   * @returns {string} 空字符串表示通过
   */
  function validateNewPassword(pwd) {
    var s = String(pwd || '');
    if (!s) return '请输入新密码';
    if (s.length < 6 || s.length > 16) return '密码长度为6～16位';
    for (var i = 0; i < s.length; i++) {
      if (!isAllowedChar(s.charAt(i))) {
        return '密码需包含字母、数字、特殊字符中的至少2类';
      }
    }
    if (isAllSameChar(s)) return '密码不能全部为相同字符';
    if (typeCount(s) < 2) return '密码需包含字母、数字、特殊字符中的至少2类';
    if (hasConsecutiveRun(s)) return '密码不能包含连续的数字或字母';
    return '';
  }

  function escAttr(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;');
  }

  function keyBtn(ch, cls, labelHtml) {
    return (
      '<button type="button" class="sa-pwd-fullkbd__key' +
      (cls ? ' ' + cls : '') +
      '" data-key="' +
      escAttr(ch) +
      '">' +
      (labelHtml != null ? labelHtml : escAttr(ch)) +
      '</button>'
    );
  }

  function rowKeys(chars) {
    var r = '<div class="sa-pwd-fullkbd__row">';
    for (var i = 0; i < chars.length; i++) {
      r += keyBtn(chars.charAt(i));
    }
    r += '</div>';
    return r;
  }

  function bottomBar(leftLabel, leftKey) {
    return (
      '<div class="sa-pwd-fullkbd__row sa-pwd-fullkbd__row--bottom">' +
      keyBtn(leftKey, 'sa-pwd-fullkbd__key--util sa-pwd-fullkbd__key--mode', leftLabel) +
      keyBtn('emoji', 'sa-pwd-fullkbd__key--util sa-pwd-fullkbd__key--emoji', ICON_EMOJI) +
      keyBtn('space', 'sa-pwd-fullkbd__key--space', '空格') +
      keyBtn('done', 'sa-pwd-fullkbd__key--send', '确定') +
      '</div>'
    );
  }

  function renderPanel(host, state) {
    if (!host) return;
    var mode = state.mode || 'letter'; /* letter | number | more */
    var shift = !!state.shift;
    var html = '<div class="sa-pwd-fullkbd" data-fullkbd="1">';

    if (mode === 'letter') {
      html += rowKeys(shift ? LETTERS_TOP.toUpperCase() : LETTERS_TOP);
      html += '<div class="sa-pwd-fullkbd__row sa-pwd-fullkbd__row--mid">';
      var mid = shift ? LETTERS_MID.toUpperCase() : LETTERS_MID;
      for (var m = 0; m < mid.length; m++) html += keyBtn(mid.charAt(m));
      html += '</div>';
      html += '<div class="sa-pwd-fullkbd__row">';
      html += keyBtn(
        'shift',
        'sa-pwd-fullkbd__key--util sa-pwd-fullkbd__key--shift' + (shift ? ' is-on' : ''),
        ICON_SHIFT
      );
      var bot = shift ? LETTERS_BOT.toUpperCase() : LETTERS_BOT;
      for (var b = 0; b < bot.length; b++) html += keyBtn(bot.charAt(b));
      html += keyBtn('del', 'sa-pwd-fullkbd__key--util sa-pwd-fullkbd__key--del', ICON_DEL);
      html += '</div>';
      html += bottomBar('123', 'to-number');
    } else if (mode === 'number') {
      html += rowKeys(NUMS);
      html += '<div class="sa-pwd-fullkbd__row">';
      var quotes = ['\u201c', '\u201d'];
      for (var i = 0; i < 8; i++) html += keyBtn(SYM_ROW2.charAt(i));
      html += keyBtn(quotes[0]);
      html += keyBtn(quotes[1]);
      html += '</div>';
      html += '<div class="sa-pwd-fullkbd__row">';
      html += keyBtn('to-more', 'sa-pwd-fullkbd__key--util sa-pwd-fullkbd__key--mode', '#+=');
      for (var j = 0; j < SYM_ROW3.length; j++) html += keyBtn(SYM_ROW3.charAt(j));
      html += keyBtn('del', 'sa-pwd-fullkbd__key--util sa-pwd-fullkbd__key--del', ICON_DEL);
      html += '</div>';
      html += bottomBar('拼音', 'to-letter');
    } else {
      html += rowKeys(MORE_ROW1);
      html += rowKeys(MORE_ROW2);
      html += '<div class="sa-pwd-fullkbd__row">';
      html += keyBtn('to-number', 'sa-pwd-fullkbd__key--util sa-pwd-fullkbd__key--mode', '123');
      for (var k = 0; k < MORE_ROW3.length; k++) html += keyBtn(MORE_ROW3.charAt(k));
      html += keyBtn('del', 'sa-pwd-fullkbd__key--util sa-pwd-fullkbd__key--del', ICON_DEL);
      html += '</div>';
      html += bottomBar('拼音', 'to-letter');
    }

    html += '</div>';
    host.innerHTML = html;
  }

  /**
   * 将容器变为登录密码全键盘
   * @param {HTMLElement} host
   * @param {{ onChar: function(string), onDel: function(), onDone?: function() }} handlers
   */
  function mountFullKeypad(host, handlers) {
    if (!host) return { destroy: function () {} };
    var state = { mode: 'letter', shift: false };
    handlers = handlers || {};

    function paint() {
      renderPanel(host, state);
    }

    function onClick(e) {
      var keyBtnEl = e.target.closest('[data-key]');
      if (!keyBtnEl) return;
      var key = keyBtnEl.getAttribute('data-key');
      if (key === 'to-letter') {
        state.mode = 'letter';
        state.shift = false;
        paint();
        return;
      }
      if (key === 'to-number') {
        state.mode = 'number';
        state.shift = false;
        paint();
        return;
      }
      if (key === 'to-more') {
        state.mode = 'more';
        state.shift = false;
        paint();
        return;
      }
      if (key === 'shift') {
        state.shift = !state.shift;
        paint();
        return;
      }
      if (key === 'del') {
        if (typeof handlers.onDel === 'function') handlers.onDel();
        return;
      }
      if (key === 'done') {
        if (typeof handlers.onDone === 'function') handlers.onDone();
        return;
      }
      if (key === 'emoji' || key === 'space') {
        /* 密码不支持空格 / emoji */
        return;
      }
      if (key && typeof handlers.onChar === 'function') {
        handlers.onChar(key);
        if (state.shift && state.mode === 'letter' && /^[A-Za-z]$/.test(key)) {
          state.shift = false;
          paint();
        }
      }
    }

    host.classList.add('sa-pwd-keypad--full');
    host.setAttribute('aria-label', '登录密码键盘');
    paint();
    host.addEventListener('click', onClick);
    return {
      destroy: function () {
        host.removeEventListener('click', onClick);
        host.classList.remove('sa-pwd-keypad--full');
        host.innerHTML = '';
      },
      repaint: paint
    };
  }

  global.StoreAppLoginPwd = {
    SPECIAL: SPECIAL,
    PLACEHOLDER: PLACEHOLDER,
    isAllowedChar: isAllowedChar,
    cleanPassword: cleanPassword,
    validateNewPassword: validateNewPassword,
    mountFullKeypad: mountFullKeypad
  };
})(typeof window !== 'undefined' ? window : this);
