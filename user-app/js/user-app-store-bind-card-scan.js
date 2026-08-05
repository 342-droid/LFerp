(function () {
  var api = window.StoreBindCardDemo;
  if (!api) return;

  var DEMO_CARD = '6228481235489632156';

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

  function bind() {
    var holder = $('bcsHolder');
    if (holder) holder.textContent = api.HOLDER;

    var back = $('bcsBack');
    if (back) back.setAttribute('href', 'store-bind-card.html' + keepFrom());

    var info = $('bcsHolderInfo');
    var modal = $('bcsHolderModal');
    if (info && modal) {
      info.addEventListener('click', function () {
        modal.hidden = false;
      });
    }
    document.querySelectorAll('[data-bcs-close]').forEach(function (el) {
      el.addEventListener('click', function () {
        if (modal) modal.hidden = true;
      });
    });

    var capture = $('bcsCapture');
    if (capture) {
      capture.addEventListener('click', function () {
        var tip = $('bcsFrameTip');
        var demo = $('bcsDemoCard');
        if (tip) tip.hidden = true;
        if (demo) {
          demo.hidden = false;
          var no = $('bcsDemoNo');
          if (no) no.textContent = api.formatCardDisplay(DEMO_CARD);
        }
        var draft = api.getDraft();
        draft.scanCardNo = DEMO_CARD;
        draft.cardNo = DEMO_CARD;
        api.setDraft(draft);
        setTimeout(function () {
          window.location.href = 'store-bind-card-confirm.html' + keepFrom();
        }, 500);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
