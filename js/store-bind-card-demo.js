/**
 * 门店银行卡演示（银行卡管理 / 充值选卡共用）
 * - withdraw：汇付开户绑定的默认提现对公账户（不可删、不可充值）
 * - quickpay：快捷支付银行卡（可新增/删除，用于钱包充值）
 * 客服品牌文案：丰银宝
 */
(function (global) {
  var KEY_CARDS = 'sa_demo_bind_cards_v5';
  var KEY_DRAFT = 'sa_demo_bind_card_draft';
  var KEY_REALNAME = 'sa_demo_realname_done';
  var HOLDER = '王小二';
  var SMS_CODE = '123456';
  var SERVICE_BRAND = '丰银宝';
  var SERVICE_PHONE = '400-88888888';

  var BANKS = [
    { id: 'icbc', name: '工商银行', short: '工', single: 5000, daily: 100000 },
    { id: 'abc', name: '农业银行', short: '农', single: 700, daily: 10000 },
    { id: 'boc', name: '中国银行', short: '中', single: 5000, daily: 10000 },
    { id: 'ccb', name: '建设银行', short: '建', single: 200000, daily: 200000 },
    { id: 'citic', name: '中信银行', short: '信', single: 5000, daily: 5000 },
    { id: 'ceb', name: '光大银行', short: '光', single: 200000, daily: 200000 },
    { id: 'cmb', name: '招商银行', short: '招', single: 50000, daily: 50000 },
    { id: 'comm', name: '交通银行', short: '交', single: 20000, daily: 50000 }
  ];

  /* 演示：汇付默认提现对公户 + 一张快捷支付储蓄卡 */
  var SEED_CARDS = [
    {
      id: 'BC-WITHDRAW-HF',
      purpose: 'withdraw',
      cardNo: '7559401234568888',
      bankId: 'cmb',
      bankName: '招商银行',
      bankShort: '招',
      cardTail: '8888',
      cardType: '企业账户',
      phone: '',
      single: 0,
      daily: 0,
      boundAt: 1
    },
    {
      id: 'BC-QUICK-001',
      purpose: 'quickpay',
      cardNo: '6225881234566666',
      bankId: 'cmb',
      bankName: '招商银行',
      bankShort: '招',
      cardTail: '6666',
      cardType: '储蓄卡',
      phone: '13812348001',
      single: 50000,
      daily: 50000,
      boundAt: 2
    }
  ];

  /* BIN 前缀 → 银行，用于演示自动识别 */
  var BIN_MAP = {
    '622202': 'icbc',
    '622848': 'abc',
    '621660': 'boc',
    '621700': 'ccb',
    '622690': 'citic',
    '622666': 'ceb',
    '622588': 'cmb',
    '622262': 'comm'
  };

  function readJson(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function writeJson(key, val) {
    try {
      if (val == null) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      /* ignore */
    }
  }

  function normalizeCard(c) {
    var card = Object.assign({}, c);
    if (!card.purpose) {
      /* 旧数据兜底：无 purpose 视为快捷支付 */
      card.purpose = 'quickpay';
    }
    return card;
  }

  function listCards() {
    var list = readJson(KEY_CARDS);
    if (!Array.isArray(list)) {
      list = SEED_CARDS.map(function (c) {
        return Object.assign({}, c);
      });
      saveCards(list);
    }
    return list.map(normalizeCard);
  }

  /** 仅快捷支付卡（充值选卡用；不含汇付默认提现对公户） */
  function listQuickPayCards() {
    return listCards().filter(function (c) {
      return c.purpose === 'quickpay';
    });
  }

  function saveCards(list) {
    writeJson(KEY_CARDS, list || []);
  }

  function isRealNameDone() {
    var v = readJson(KEY_REALNAME);
    if (v === null || v === undefined) return true; /* 演示默认已实名 */
    return !!v;
  }

  function setRealNameDone(done) {
    writeJson(KEY_REALNAME, !!done);
  }

  function isWithdrawCard(card) {
    return !!(card && card.purpose === 'withdraw');
  }

  function canDeleteCard(card) {
    return !!(card && card.purpose === 'quickpay');
  }

  function canRechargeCard(card) {
    return !!(card && card.purpose === 'quickpay');
  }

  function purposeLabel(card) {
    if (isWithdrawCard(card)) return '默认提现';
    return '快捷支付';
  }

  /**
   * 解绑银行卡：仅快捷支付可删
   * 卡号尾号 9999 → 演示删除失败
   */
  function removeCard(cardId) {
    var list = listCards();
    var idx = -1;
    var card = null;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === cardId) {
        idx = i;
        card = list[i];
        break;
      }
    }
    if (!card) {
      return { ok: false, message: '银行卡删除失败，请稍后重试' };
    }
    if (!canDeleteCard(card)) {
      return {
        ok: false,
        code: 'withdraw_fixed',
        message: '默认提现账户不支持删除'
      };
    }
    if (String(card.cardTail || '') === '9999') {
      return { ok: false, message: '银行卡删除失败，请稍后重试' };
    }
    list.splice(idx, 1);
    saveCards(list);
    return { ok: true };
  }

  /** 列表展示：****8888 */
  function maskedCardNo(card) {
    var tail = (card && card.cardTail) || cardTail(card && card.cardNo);
    return '****' + tail;
  }

  function getBank(id) {
    return (
      BANKS.find(function (b) {
        return b.id === id;
      }) || null
    );
  }

  function detectBankByCardNo(cardNo) {
    var s = String(cardNo || '').replace(/\s/g, '');
    var keys = Object.keys(BIN_MAP);
    for (var i = 0; i < keys.length; i++) {
      if (s.indexOf(keys[i]) === 0) return getBank(BIN_MAP[keys[i]]);
    }
    return null;
  }

  function cardTail(cardNo) {
    var s = String(cardNo || '').replace(/\s/g, '');
    return s.slice(-4) || '----';
  }

  function formatCardDisplay(cardNo) {
    var s = String(cardNo || '').replace(/\s/g, '');
    return s.replace(/(\d{4})(?=\d)/g, '$1 ');
  }

  function setDraft(draft) {
    writeJson(KEY_DRAFT, draft || null);
  }

  function getDraft() {
    return readJson(KEY_DRAFT) || {};
  }

  function clearDraft() {
    writeJson(KEY_DRAFT, null);
  }

  /**
   * 演示错误码：卡号特定后缀触发
   * 0000 无效卡 / 1111 已绑定 / 2222 受限 / 3333 发卡行不支持 / 4444 未开通无卡 / 5555 预留手机不符 / 6666 四要素不符
   */
  function bindCard(payload) {
    var cardNo = String((payload && payload.cardNo) || '').replace(/\s/g, '');
    var phone = String((payload && payload.phone) || '');
    var sms = String((payload && payload.sms) || '');
    var bankId = (payload && payload.bankId) || '';
    var bank = getBank(bankId) || detectBankByCardNo(cardNo);

    if (!cardNo || cardNo.length < 12) {
      return { ok: false, code: 'invalid', message: '你的银行卡卡号填写错误或者卡号不存在' };
    }
    if (!bank) {
      return { ok: false, code: 'unsupported', message: '发行行不支持此交易，请更换银行卡绑定。' };
    }
    if (!/^\d{11}$/.test(phone)) {
      return { ok: false, code: 'phone', message: '请输入银行预留手机号' };
    }
    if (!sms) {
      return { ok: false, code: 'sms_empty', message: '请填写验证码' };
    }
    if (sms !== SMS_CODE) {
      return { ok: false, code: 'sms_err', message: '验证码错误，请重新填写' };
    }

    var suffix = cardNo.slice(-4);
    if (suffix === '0000') {
      return { ok: false, code: 'invalid', message: '您填写的银行卡号无效或已过期，请更换银行卡绑定。' };
    }
    if (suffix === '1111') {
      return { ok: false, code: 'bound', message: '此银行卡已绑定' };
    }
    if (suffix === '2222') {
      return { ok: false, code: 'restricted', message: '该卡已受限制，请更换银行卡绑定。' };
    }
    if (suffix === '3333') {
      return { ok: false, code: 'unsupported', message: '发行行不支持此交易，请更换银行卡绑定。' };
    }
    if (suffix === '4444') {
      return { ok: false, code: 'nopay', message: '此卡未开通无卡支付，请更换银行卡绑定。' };
    }
    if (suffix === '5555') {
      return {
        ok: false,
        code: 'phone_mismatch',
        message: '银行卡预留手机号不符，请核对后再试，若银行卡预留手机号已变更，请更新手机号'
      };
    }
    if (suffix === '6666') {
      return { ok: false, code: 'mismatch', message: '您填写的信息不匹配，请核对后再试。' };
    }

    var list = listCards();
    var exists = list.some(function (c) {
      return c.cardNo === cardNo;
    });
    if (exists) {
      return { ok: false, code: 'bound', message: '此银行卡已绑定' };
    }

    var card = {
      id: 'BC' + Date.now(),
      purpose: 'quickpay',
      cardNo: cardNo,
      bankId: bank.id,
      bankName: bank.name,
      bankShort: bank.short,
      cardTail: cardTail(cardNo),
      cardType: '储蓄卡',
      phone: phone,
      single: bank.single,
      daily: bank.daily,
      boundAt: Date.now()
    };
    list.push(card);
    saveCards(list);
    clearDraft();
    return { ok: true, card: card };
  }

  global.StoreBindCardDemo = {
    HOLDER: HOLDER,
    SMS_CODE: SMS_CODE,
    SERVICE_BRAND: SERVICE_BRAND,
    SERVICE_PHONE: SERVICE_PHONE,
    BANKS: BANKS,
    listCards: listCards,
    listQuickPayCards: listQuickPayCards,
    saveCards: saveCards,
    removeCard: removeCard,
    maskedCardNo: maskedCardNo,
    isWithdrawCard: isWithdrawCard,
    canDeleteCard: canDeleteCard,
    canRechargeCard: canRechargeCard,
    purposeLabel: purposeLabel,
    isRealNameDone: isRealNameDone,
    setRealNameDone: setRealNameDone,
    getBank: getBank,
    detectBankByCardNo: detectBankByCardNo,
    cardTail: cardTail,
    formatCardDisplay: formatCardDisplay,
    setDraft: setDraft,
    getDraft: getDraft,
    clearDraft: clearDraft,
    bindCard: bindCard
  };
})(typeof window !== 'undefined' ? window : this);
