/**
 * 直播评论敏感词风控（原型演示）
 * 中控新增一键评论/快捷回复、发送弹幕，以及 C 端评论（含一键评论）共用。
 * 验收开关写入 ua_live_sw_demo_v1：lexicon 按词库、hit 强制命中、pass 强制放行。
 */
(function (global) {
  'use strict';

  var DEMO_KEY = 'ua_live_sw_demo_v1';
  var MSG = '内容包含敏感词，请修改后再试';
  var WORDS = ['微信', '加v', '加V', 'qq', '发票', '返现', '代购', '赌博', '色情'];

  function demoMode() {
    try {
      var v = localStorage.getItem(DEMO_KEY);
      if (v === 'hit' || v === 'pass' || v === 'lexicon') return v;
    } catch (e) {}
    return 'lexicon';
  }

  function hitWord(text) {
    var s = String(text || '');
    if (!s) return '';
    var lower = s.toLowerCase();
    var i;
    for (i = 0; i < WORDS.length; i++) {
      var w = WORDS[i];
      if (!w) continue;
      if (s.indexOf(w) >= 0 || lower.indexOf(String(w).toLowerCase()) >= 0) return w;
    }
    return '';
  }

  function check(text) {
    var mode = demoMode();
    if (mode === 'pass') return { blocked: false, word: '', message: MSG };
    if (mode === 'hit') return { blocked: true, word: '敏感词', message: MSG };
    var word = hitWord(text);
    return { blocked: !!word, word: word, message: MSG };
  }

  global.MdmLiveSensitiveWords = {
    demoKey: DEMO_KEY,
    message: MSG,
    words: WORDS.slice(),
    demoMode: demoMode,
    check: check,
    hit: function (text) {
      var r = check(text);
      return r.blocked ? r.word : '';
    }
  };
})(typeof window !== 'undefined' ? window : this);
