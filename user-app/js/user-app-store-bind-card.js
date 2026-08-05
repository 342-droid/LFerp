(function () {
  var api = window.StoreBindCardDemo;
  if (!api) return;

  var state = {
    bankId: '',
    smsLeft: 0,
    smsTimer: null
  };

  function $(id) {
    return document.getElementById(id);
  }

  function qs() {
    return new URLSearchParams(window.location.search);
  }

  function keepFrom() {
    var from = qs().get('from') || '';
    var ret = qs().get('return') || '';
    var q = new URLSearchParams();
    if (from) q.set('from', from);
    if (ret) q.set('return', ret);
    var s = q.toString();
    return s ? '?' + s : '';
  }

  function backHref() {
    var ret = qs().get('return') || '';
    if (ret) {
      try {
        return decodeURIComponent(ret);
      } catch (e) {
        return ret;
      }
    }
    return 'store-recharge.html' + keepFrom();
  }

  function successHref(cardId) {
    var ret = qs().get('return') || '';
    if (ret) {
      try {
        return decodeURIComponent(ret);
      } catch (e2) {
        return ret;
      }
    }
    var q = keepFrom();
    var join = q ? '&' : '?';
    return 'store-recharge.html' + q + join + 'cardId=' + encodeURIComponent(cardId || '');
  }

  function toast(msg, ms) {
    var shell = document.querySelector('.ua-bc-page');
    var el = document.querySelector('.ua-bc-toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'ua-bc-toast';
      (shell || document.body).appendChild(el);
    }
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      el.hidden = true;
    }, ms || 1800);
  }

  function showModal(id) {
    var el = $(id);
    if (el) el.hidden = false;
  }

  function hideModal(id) {
    var el = $(id);
    if (el) el.hidden = true;
  }

  function showErr(msg) {
    var t = $('bcErrText');
    if (t) t.textContent = msg;
    showModal('bcErrModal');
  }

  function onlyDigits(s, max) {
    return String(s || '')
      .replace(/\D/g, '')
      .slice(0, max || 99);
  }

  function syncBankBtn() {
    var btn = $('bcBankBtn');
    if (!btn) return;
    var bank = api.getBank(state.bankId);
    if (bank) {
      btn.textContent = bank.name;
      btn.classList.remove('is-placeholder');
    } else {
      btn.textContent = '请选择开户银行';
      btn.classList.add('is-placeholder');
    }
  }

  function syncSubmit() {
    var cardNo = onlyDigits(($('bcCardNo') || {}).value, 19);
    var phone = onlyDigits(($('bcPhone') || {}).value, 11);
    var sms = onlyDigits(($('bcSms') || {}).value, 6);
    var ok = cardNo.length >= 12 && !!state.bankId && phone.length === 11 && sms.length >= 4;
    var btn = $('bcSubmit');
    if (btn) btn.disabled = !ok;
  }

  function detectBank() {
    var cardNo = onlyDigits(($('bcCardNo') || {}).value, 19);
    var bank = api.detectBankByCardNo(cardNo);
    if (bank && !state.bankId) {
      state.bankId = bank.id;
      syncBankBtn();
    }
  }

  function openBankSheet() {
    var list = $('bcBankList');
    var sheet = $('bcBankSheet');
    if (!list || !sheet) return;
    list.innerHTML = api.BANKS.map(function (b) {
      return (
        '<button type="button" class="ua-bc-bank-opt" data-bank-id="' +
        b.id +
        '">' +
        '<span><div class="ua-bc-bank-opt__name">' +
        b.name +
        '</div><div class="ua-bc-bank-opt__tip">单笔限额' +
        (b.single >= 10000 ? b.single / 10000 + '万' : b.single) +
        '，单日限额' +
        (b.daily >= 10000 ? b.daily / 10000 + '万' : b.daily) +
        '</div></span></button>'
      );
    }).join('');
    sheet.hidden = false;
  }

  function startSmsCd() {
    state.smsLeft = 60;
    var btn = $('bcSmsBtn');
    function tick() {
      if (!btn) return;
      if (state.smsLeft <= 0) {
        btn.disabled = false;
        btn.textContent = '获取验证码';
        return;
      }
      btn.disabled = true;
      btn.textContent = state.smsLeft + 'S';
      state.smsLeft -= 1;
      state.smsTimer = setTimeout(tick, 1000);
    }
    clearTimeout(state.smsTimer);
    tick();
  }

  function persistDraft() {
    api.setDraft({
      cardNo: onlyDigits(($('bcCardNo') || {}).value, 19),
      bankId: state.bankId,
      phone: onlyDigits(($('bcPhone') || {}).value, 11)
    });
  }

  function restoreDraft() {
    var d = api.getDraft();
    var cardInput = $('bcCardNo');
    var phoneInput = $('bcPhone');
    if (d.cardNo && cardInput) cardInput.value = api.formatCardDisplay(d.cardNo);
    if (d.phone && phoneInput) phoneInput.value = d.phone;
    if (d.bankId) {
      state.bankId = d.bankId;
    } else if (d.cardNo) {
      var bank = api.detectBankByCardNo(d.cardNo);
      if (bank) state.bankId = bank.id;
    }
    syncBankBtn();
    syncSubmit();
  }

  function bind() {
    var gate = window.StoreOnboardingGate;
    if (gate) {
      var idCheck = gate.checkIdentityForBindCard();
      if (!idCheck.ok) {
        if (idCheck.goOnboarding && typeof gate.blockAndGoOnboarding === 'function') {
          gate.blockAndGoOnboarding(idCheck.message, {
            from: 'store-app',
            returnUrl: 'store-bind-card.html' + keepFrom()
          });
        } else {
          gate.toast(idCheck.message || '身份信息校验失败，请完成商户进件后再充值。');
        }
        return;
      }
    }

    var holder = $('bcHolderName');
    if (holder) holder.textContent = api.HOLDER;

    var back = $('bcBack');
    if (back) back.setAttribute('href', backHref());

    restoreDraft();

    var cardInput = $('bcCardNo');
    if (cardInput) {
      cardInput.addEventListener('input', function () {
        var raw = onlyDigits(cardInput.value, 19);
        cardInput.value = api.formatCardDisplay(raw);
        detectBank();
        persistDraft();
        syncSubmit();
      });
    }

    ['bcPhone', 'bcSms'].forEach(function (id) {
      var el = $(id);
      if (!el) return;
      el.addEventListener('input', function () {
        el.value = onlyDigits(el.value, id === 'bcPhone' ? 11 : 6);
        if (id === 'bcPhone') persistDraft();
        syncSubmit();
      });
    });

    var scanBtn = $('bcScanBtn');
    if (scanBtn) {
      scanBtn.addEventListener('click', function () {
        persistDraft();
        window.location.href = 'store-bind-card-scan.html' + keepFrom();
      });
    }

    var bankBtn = $('bcBankBtn');
    if (bankBtn) bankBtn.addEventListener('click', openBankSheet);

    document.querySelectorAll('[data-bc-bank-close]').forEach(function (el) {
      el.addEventListener('click', function () {
        var sheet = $('bcBankSheet');
        if (sheet) sheet.hidden = true;
      });
    });

    var bankList = $('bcBankList');
    if (bankList) {
      bankList.addEventListener('click', function (e) {
        var opt = e.target.closest('[data-bank-id]');
        if (!opt) return;
        state.bankId = opt.getAttribute('data-bank-id');
        syncBankBtn();
        persistDraft();
        syncSubmit();
        var sheet = $('bcBankSheet');
        if (sheet) sheet.hidden = true;
      });
    }

    var holderInfo = $('bcHolderInfo');
    if (holderInfo) {
      holderInfo.addEventListener('click', function () {
        showModal('bcHolderModal');
      });
    }

    var phoneInfo = $('bcPhoneInfo');
    if (phoneInfo) {
      phoneInfo.addEventListener('click', function () {
        showModal('bcPhoneModal');
      });
    }

    document.querySelectorAll('[data-bc-modal-close]').forEach(function (el) {
      el.addEventListener('click', function () {
        hideModal(el.getAttribute('data-bc-modal-close'));
      });
    });

    var csBtn = $('bcCsBtn');
    if (csBtn) {
      csBtn.addEventListener('click', function () {
        showErr('请致电' + api.SERVICE_BRAND + '客服' + api.SERVICE_PHONE);
      });
    }

    var smsBtn = $('bcSmsBtn');
    if (smsBtn) {
      smsBtn.addEventListener('click', function () {
        if (smsBtn.disabled) return;
        var phone = onlyDigits(($('bcPhone') || {}).value, 11);
        if (phone.length !== 11) {
          showErr('请输入银行预留手机号');
          return;
        }
        toast('验证码已发送（演示码 ' + api.SMS_CODE + '）');
        startSmsCd();
      });
    }

    var submit = $('bcSubmit');
    if (submit) {
      submit.addEventListener('click', function () {
        if (submit.disabled) return;
        var gate2 = window.StoreOnboardingGate;
        if (gate2) {
          var idCheck2 = gate2.checkIdentityForBindCard();
          if (!idCheck2.ok) {
            if (idCheck2.goOnboarding && typeof gate2.blockAndGoOnboarding === 'function') {
              gate2.blockAndGoOnboarding(idCheck2.message, {
                from: 'store-app',
                returnUrl: 'store-bind-card.html' + keepFrom()
              });
            } else {
              gate2.toast(idCheck2.message || '身份信息校验失败，请完成商户进件后再充值。');
            }
            return;
          }
        }
        var res = api.bindCard({
          cardNo: onlyDigits(($('bcCardNo') || {}).value, 19),
          bankId: state.bankId,
          phone: onlyDigits(($('bcPhone') || {}).value, 11),
          sms: onlyDigits(($('bcSms') || {}).value, 6)
        });
        if (!res.ok) {
          if (res.code === 'sms_empty' || res.code === 'sms_err' || res.code === 'phone') {
            toast(res.message);
          } else {
            showErr(res.message || '绑定银行卡失败，请重新绑定。');
          }
          return;
        }
        toast('绑定成功', 3000);
        setTimeout(function () {
          window.location.href = successHref(res.card && res.card.id);
        }, 1200);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
