(function () {
  var cardApi = window.StoreBindCardDemo;
  var payApi = window.StorePayPassword;
  if (!cardApi) return;

  var state = {
    view: 'list', /* list | empty | fail */
    pwd: '',
    pwdMode: '', /* add | unbind */
    unbindId: '',
    busy: false,
    loadFailOnce: false
  };

  function $(id) {
    return document.getElementById(id);
  }

  function toast(msg, ms) {
    var shell = document.querySelector('.sa-bcards-shell');
    var el = document.querySelector('.sa-bcards-toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'sa-bcards-toast';
      (shell || document.body).appendChild(el);
    }
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      el.hidden = true;
    }, ms || 2000);
  }

  function bankTone(bankId) {
    if (bankId === 'icbc') return 'is-icbc';
    if (bankId === 'abc') return 'is-abc';
    if (bankId === 'boc') return 'is-boc';
    if (bankId === 'ccb') return 'is-ccb';
    if (bankId === 'cmb') return 'is-cmb';
    if (bankId === 'citic') return 'is-citic';
    if (bankId === 'ceb') return 'is-ceb';
    if (bankId === 'comm') return 'is-comm';
    return 'is-default';
  }

  /** 参考图卡号排版：.... .... .... 8888 */
  function displayCardNo(card) {
    var tail = (card && card.cardTail) || '';
    if (!tail && cardApi.cardTail) tail = cardApi.cardTail(card && card.cardNo);
    return '.... .... .... ' + (tail || '----');
  }

  function bindUrl() {
    return (
      '../../user-app/h5/store-bind-card.html?from=store-app&return=' +
      encodeURIComponent('../../store-app/h5/bank-cards.html')
    );
  }

  function syncPwdSlots() {
    var host = $('bcardsPwdSlots');
    if (!host) return;
    var spans = host.querySelectorAll('span');
    for (var i = 0; i < spans.length; i++) {
      spans[i].classList.toggle('filled', i < state.pwd.length);
    }
  }

  function openPwdSheet(mode, cardId) {
    if (!payApi || !payApi.hasPassword()) {
      toast('请先设置支付密码');
      setTimeout(function () {
        window.location.href = 'password-edit.html?kind=pay';
      }, 800);
      return;
    }
    if (payApi.isLocked && payApi.isLocked()) {
      toast('支付密码已锁定，请重置后重试');
      return;
    }
    state.pwdMode = mode;
    state.unbindId = cardId || '';
    state.pwd = '';
    state.busy = false;
    var title = $('bcardsPwdTitle');
    if (title) title.textContent = mode === 'unbind' ? '解绑银行卡' : '添加银行卡';
    syncPwdSlots();
    var sheet = $('bcardsPwdSheet');
    if (sheet) sheet.hidden = false;
  }

  function closePwdSheet() {
    var sheet = $('bcardsPwdSheet');
    if (sheet) sheet.hidden = true;
    state.pwd = '';
    state.pwdMode = '';
    state.unbindId = '';
    state.busy = false;
    syncPwdSlots();
  }

  function onPwdComplete() {
    if (state.busy || state.pwd.length !== 6 || !payApi) return;
    state.busy = true;
    var res = payApi.verify(state.pwd);
    if (!res.ok) {
      toast(res.message || '支付密码错误');
      state.pwd = '';
      syncPwdSlots();
      state.busy = false;
      return;
    }
    if (state.pwdMode === 'add') {
      closePwdSheet();
      window.location.href = bindUrl();
      return;
    }
    if (state.pwdMode === 'unbind') {
      var del = cardApi.removeCard(state.unbindId);
      closePwdSheet();
      if (!del.ok) {
        toast(del.message || '银行卡删除失败，请稍后重试');
      } else {
        toast('解绑成功');
      }
      render();
    }
  }

  function showView(view) {
    state.view = view;
    var list = $('bcardsList');
    var empty = $('bcardsEmpty');
    var fail = $('bcardsFail');
    if (list) list.hidden = view !== 'list';
    if (empty) empty.hidden = view !== 'empty';
    if (fail) fail.hidden = view !== 'fail';
  }

  function renderList(cards) {
    var host = $('bcardsList');
    if (!host) return;
    var cardsHtml = cards
      .map(function (c) {
        var isWithdraw =
          typeof cardApi.isWithdrawCard === 'function'
            ? cardApi.isWithdrawCard(c)
            : c.purpose === 'withdraw';
        var canDel =
          typeof cardApi.canDeleteCard === 'function'
            ? cardApi.canDeleteCard(c)
            : !isWithdraw;
        var tag =
          typeof cardApi.purposeLabel === 'function'
            ? cardApi.purposeLabel(c)
            : isWithdraw
              ? '默认提现'
              : '快捷支付';
        var cardType = c.cardType || (isWithdraw ? '企业账户' : '储蓄卡');
        var title = (c.bankName || '银行卡') + cardType;
        var short = c.bankShort || '卡';
        var delBtn = canDel
          ? '<button type="button" class="sa-bcards-card__del" data-del-id="' +
            c.id +
            '" aria-label="删除银行卡">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">' +
            '<path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M8 7l1 12a1 1 0 001 1h4a1 1 0 001-1l1-12"/>' +
            '</svg></button>'
          : '';

        return (
          '<article class="sa-bcards-card ' +
          bankTone(c.bankId) +
          '" data-card-id="' +
          c.id +
          '">' +
          '<span class="sa-bcards-card__wm" aria-hidden="true">' +
          short +
          '</span>' +
          '<div class="sa-bcards-card__top">' +
          '<span class="sa-bcards-card__logo">' +
          short +
          '</span>' +
          '<span class="sa-bcards-card__title">' +
          title +
          '</span>' +
          '<span class="sa-bcards-card__tag">' +
          tag +
          '</span>' +
          delBtn +
          '</div>' +
          '<div class="sa-bcards-card__no">' +
          displayCardNo(c) +
          '</div>' +
          '</article>'
        );
      })
      .join('');

    host.innerHTML =
      cardsHtml +
      '<button type="button" class="sa-bcards-add" id="bcardsAddBtn">' +
      '<span class="sa-bcards-add__plus" aria-hidden="true">+</span>' +
      '<span>添加银行卡</span>' +
      '</button>';

    var addBtn = $('bcardsAddBtn');
    if (addBtn) addBtn.addEventListener('click', tryAdd);
  }

  function render() {
    var params = new URLSearchParams(window.location.search);
    var demo = params.get('demo') || '';
    if (demo === 'fail' || state.loadFailOnce) {
      showView('fail');
      return;
    }
    if (demo === 'empty') {
      showView('empty');
      return;
    }
    var cards = cardApi.listCards();
    if (!cards.length) {
      showView('empty');
      return;
    }
    renderList(cards);
    showView('list');
  }

  function tryAdd() {
    if (typeof cardApi.isRealNameDone === 'function' && !cardApi.isRealNameDone()) {
      toast('请先完成实名认证');
      return;
    }
    /* 添加快捷支付卡无需支付密码；解绑仍需验证 */
    window.location.href = bindUrl();
  }

  function tryDelete(cardId) {
    var cards = cardApi.listCards();
    var card = null;
    for (var i = 0; i < cards.length; i++) {
      if (cards[i].id === cardId) {
        card = cards[i];
        break;
      }
    }
    if (!card) {
      toast('银行卡删除失败，请稍后重试');
      return;
    }
    if (typeof cardApi.canDeleteCard === 'function' && !cardApi.canDeleteCard(card)) {
      toast('默认提现账户不支持删除');
      return;
    }
    openPwdSheet('unbind', cardId);
  }

  function bind() {
    render();

    var addEmpty = $('bcardsAddBtnEmpty');
    if (addEmpty) addEmpty.addEventListener('click', tryAdd);

    var list = $('bcardsList');
    if (list) {
      list.addEventListener('click', function (e) {
        var del = e.target.closest('[data-del-id]');
        if (!del) return;
        tryDelete(del.getAttribute('data-del-id'));
      });
    }

    var fail = $('bcardsFail');
    if (fail) {
      fail.addEventListener('click', function () {
        state.loadFailOnce = false;
        var url = new URL(window.location.href);
        url.searchParams.delete('demo');
        window.history.replaceState({}, '', url.pathname + url.search);
        render();
      });
    }

    document.querySelectorAll('[data-bcards-pwd-close]').forEach(function (el) {
      el.addEventListener('click', closePwdSheet);
    });

    var pad = $('bcardsPwdKeypad');
    if (pad) {
      pad.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-pwd-key]');
        if (!btn || state.busy) return;
        var key = btn.getAttribute('data-pwd-key');
        if (key === 'del') {
          state.pwd = state.pwd.slice(0, -1);
          syncPwdSlots();
          return;
        }
        if (!/^\d$/.test(key) || state.pwd.length >= 6) return;
        state.pwd += key;
        syncPwdSlots();
        if (state.pwd.length === 6) setTimeout(onPwdComplete, 80);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
