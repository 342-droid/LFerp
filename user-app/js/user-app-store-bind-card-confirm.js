(function () {
  var api = window.StoreBindCardDemo;
  if (!api) return;

  function $(id) {
    return document.getElementById(id);
  }

  function keepFrom() {
    var qs = new URLSearchParams(window.location.search);
    var from = qs.get('from') || '';
    var ret = qs.get('return') || '';
    var q = new URLSearchParams();
    if (from) q.set('from', from);
    if (ret) q.set('return', ret);
    var s = q.toString();
    return s ? '?' + s : '';
  }

  function onlyDigits(s, max) {
    return String(s || '')
      .replace(/\D/g, '')
      .slice(0, max || 99);
  }

  function fullCardNo() {
    return onlyDigits(($('bccPart1') || {}).value, 6) + onlyDigits(($('bccPart2') || {}).value, 19);
  }

  function syncPreview() {
    var preview = $('bccPreview');
    if (preview) preview.textContent = api.formatCardDisplay(fullCardNo());
  }

  function showErr(msg) {
    var t = $('bccErrText');
    var m = $('bccErrModal');
    if (t) t.textContent = msg;
    if (m) m.hidden = false;
  }

  function bind() {
    var back = $('bccBack');
    if (back) back.setAttribute('href', 'store-bind-card-scan.html' + keepFrom());

    var draft = api.getDraft();
    var cardNo = onlyDigits(draft.scanCardNo || draft.cardNo || '6228481235489632156', 19);
    var p1 = $('bccPart1');
    var p2 = $('bccPart2');
    if (p1) p1.value = cardNo.slice(0, 6);
    if (p2) p2.value = cardNo.slice(6);
    syncPreview();

    [p1, p2].forEach(function (el) {
      if (!el) return;
      el.addEventListener('input', function () {
        el.value = onlyDigits(el.value, el === p1 ? 6 : 19);
        syncPreview();
      });
    });

    document.querySelectorAll('[data-bcc-close]').forEach(function (el) {
      el.addEventListener('click', function () {
        var m = $('bccErrModal');
        if (m) m.hidden = true;
      });
    });

    var ok = $('bccOk');
    if (ok) {
      ok.addEventListener('click', function () {
        var no = fullCardNo();
        if (no.length < 12) {
          showErr('你的银行卡卡号填写错误或者卡号不存在');
          return;
        }
        if (!api.detectBankByCardNo(no) && !api.detectBankByCardNo(no.slice(0, 6))) {
          /* 622848 在 BIN_MAP 中；其他无映射也允许带回填写页手动选银行 */
        }
        var list = api.listCards();
        if (
          list.some(function (c) {
            return c.cardNo === no;
          })
        ) {
          showErr('此银行卡已绑定');
          return;
        }
        var d = api.getDraft();
        d.cardNo = no;
        d.scanCardNo = no;
        var bank = api.detectBankByCardNo(no);
        if (bank) d.bankId = bank.id;
        api.setDraft(d);
        window.location.href = 'store-bind-card.html' + keepFrom();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
