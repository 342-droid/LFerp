/**
 * 直播营销记录
 * 先选直播场次，再按优惠券 / 福袋 / 签到 / 观看任务 / 现金红包查看领取记录。
 * 现金红包页签统计本场次在直播中控「发送现金红包」发出的领取记录。
 * 每一行是一名用户的领取结果。列表展示红包模版、名称、金额和领取状态。
 * 福袋状态只有中奖（已领取、待领取、已过期）和未中奖。未中奖不进现金红包统计。
 * 现金红包状态只有已领取、未领取、已过期，没有发放失败。已领取金额只累计已领取。
 * 福袋开出的现金红包需要手动领取：福袋待领取对应未领取，福袋已过期对应已过期。奖品内容只显示金额，如 ¥1.50。
 * 签到关联的现金红包在点击签到时自动打款，记为已领取。
 * 观看任务关联的现金红包在达到观看门槛时自动打款，完成时间即打款时间，记为已领取。
 * 签到演示数据按序号倒序，首页与运营后台样例一致，共 10499 条。
 */
(function () {
  'use strict';

  var TABS = [
    {
      id: 'coupon',
      label: '优惠券',
      columns: ['序号', '记录ID', '用户ID', '用户昵称', '手机号', '优惠券名称', '类型', '面额', '门槛', '模板ID', '领取时间', '状态'],
      fields: ['seq', 'recordId', 'userId', 'nickname', 'phone', 'couponName', 'couponType', 'faceValue', 'threshold', 'templateId', 'claimedAt', 'status']
    },
    {
      id: 'bag',
      label: '福袋',
      filter: 'status',
      columns: ['序号', '记录ID', '用户ID', '用户昵称', '手机号', '福袋名称', '奖品类型', '奖品内容', '模板ID', '领取时间', '状态'],
      fields: ['seq', 'recordId', 'userId', 'nickname', 'phone', 'bagName', 'prizeType', 'prizeContent', 'templateId', 'claimedAt', 'status']
    },
    {
      id: 'sign',
      label: '签到',
      columns: ['序号', '记录ID', '用户ID', '用户昵称', '手机号', '奖励类型', '奖励内容', '模板ID', '签到时间'],
      fields: ['seq', 'recordId', 'userId', 'nickname', 'phone', 'rewardType', 'rewardContent', 'templateId', 'signedAt']
    },
    {
      id: 'task',
      label: '观看任务',
      columns: ['序号', '记录ID', '用户ID', '用户昵称', '手机号', '任务门槛', '奖励类型', '奖励内容', '发放积分', '模板ID', '完成时间'],
      fields: ['seq', 'recordId', 'userId', 'nickname', 'phone', 'threshold', 'rewardType', 'rewardContent', 'points', 'templateId', 'completedAt']
    },
    {
      id: 'redpack',
      label: '现金红包',
      filter: 'claim',
      columns: ['序号', '记录ID', '用户ID', '用户昵称', '手机号', '红包名称', '金额', '红包模版ID', '领取时间', '领取状态'],
      fields: ['seq', 'recordId', 'userId', 'nickname', 'phone', 'redpackName', 'amountText', 'redpackId', 'claimedAt', 'status']
    }
  ];

  var BAG_STATUS = ['全部', '已领取', '待领取', '已过期', '未中奖'];
  var CASH_CLAIM_STATUS = ['全部', '已领取', '未领取', '已过期'];
  var PAGE_SIZES = [10, 20, 50, 100];

  var SESSIONS = [
    {
      id: 'live-l923',
      name: 'L9.23冷丰特选晚间',
      roomName: 'L9.23冷丰特选晚间',
      anchor: '飞扬',
      startAt: '2026-09-23 18:30:00',
      endAt: '2026-09-23 19:30:00',
      status: '已结束'
    },
    {
      id: 'live-test',
      name: '测试',
      roomName: '测试',
      anchor: '陈洁',
      startAt: '2026-09-22 23:29:00',
      endAt: '2026-09-25 00:00:00',
      status: '已结束'
    }
  ];

  var SIGN_HEAD = [
    { seq: 10499, recordId: '361110450000010499', userId: '356378503286915072', nickname: '木子一', phone: '13993751634', rewardType: '积分', rewardContent: '2积分', templateId: '25', signedAt: '2026-09-23 19:24:01' },
    { seq: 10498, recordId: '361110450000010498', userId: '356695562541629440', nickname: '清水', phone: '18018101646', rewardType: '积分', rewardContent: '2积分', templateId: '25', signedAt: '2026-09-23 19:24:01' },
    { seq: 10497, recordId: '361110450000010497', userId: '361026129714233344', nickname: '冷丰zLwIXS', phone: '13861702257', rewardType: '积分', rewardContent: '2积分', templateId: '25', signedAt: '2026-09-23 19:24:00' },
    { seq: 10496, recordId: '361110450000010496', userId: '356687604817349976', nickname: '冷丰lsfTDN', phone: '15345601373', rewardType: '积分', rewardContent: '2积分', templateId: '25', signedAt: '2026-09-23 19:24:00' }
  ];

  var PEOPLE = {
    muzi: { userId: '356378503286915072', nickname: '木子一', phone: '13993751634' },
    qing: { userId: '356695562541629440', nickname: '清水', phone: '18018101646' },
    zlw: { userId: '361026129714233344', nickname: '冷丰zLwIXS', phone: '13861702257' },
    lsf: { userId: '356687604817349976', nickname: '冷丰lsfTDN', phone: '15345601373' },
    zhou: { userId: '356700112233445501', nickname: '周周', phone: '13700001111' },
    ning: { userId: '356700112233445502', nickname: '阿宁', phone: '13600002222' },
    ktm: { userId: '356700112233445503', nickname: '冷丰kTm9', phone: '13100003333' },
    man: { userId: '356700112233445504', nickname: '小满', phone: '15800004444' }
  };

  var state = {
    sessionId: SESSIONS[0].id,
    tab: 'coupon',
    page: 1,
    pageSize: 20,
    draft: blankFilter(),
    applied: blankFilter()
  };

  function blankFilter() {
    return { userId: '', nickname: '', phone: '', status: '全部', source: '全部' };
  }

  function yuan(amount) {
    return '¥' + Number(amount).toFixed(2);
  }

  function person(who, extra) {
    var base = PEOPLE[who];
    var row = {
      userId: base.userId,
      nickname: base.nickname,
      phone: base.phone
    };
    var key;
    for (key in extra) {
      if (Object.prototype.hasOwnProperty.call(extra, key)) row[key] = extra[key];
    }
    return row;
  }

  function cashSign(seq, who, amount, status, time) {
    return person(who, {
      seq: seq,
      recordId: '36111045' + pad(seq, 10),
      rewardType: '现金红包',
      rewardContent: '审核通过红包 ' + yuan(amount),
      templateId: '10086010',
      signedAt: time,
      redpackName: '审核通过红包',
      redpackId: 'CRPT10006',
      amount: amount,
      amountText: yuan(amount),
      cashStatus: status,
      sourceName: '现金红包签到',
      sortAt: time
    });
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function pad(n, len) {
    var s = String(n);
    while (s.length < len) s = '0' + s;
    return s;
  }

  function tabMeta() {
    var i;
    for (i = 0; i < TABS.length; i++) {
      if (TABS[i].id === state.tab) return TABS[i];
    }
    return TABS[0];
  }

  function currentSession() {
    var i;
    for (i = 0; i < SESSIONS.length; i++) {
      if (SESSIONS[i].id === state.sessionId) return SESSIONS[i];
    }
    return SESSIONS[0];
  }

  function clockText(value) {
    var text = String(value || '');
    var date = text.slice(5, 10);
    var time = text.slice(11, 16);
    return { date: date, time: time };
  }

  function rangeText(sess) {
    var start = clockText(sess.startAt);
    var end = clockText(sess.endAt);
    if (start.date === end.date) return start.date + ' ' + start.time + ' - ' + end.time;
    return start.date + ' ' + start.time + ' - ' + end.date + ' ' + end.time;
  }

  var SIGN_CASH_L923 = [
    cashSign(10490, 'qing', 1.2, '已领取', '2026-09-23 19:18:26'),
    cashSign(10485, 'zlw', 1.2, '已领取', '2026-09-23 19:16:02'),
    cashSign(10480, 'man', 1.2, '已领取', '2026-09-23 19:12:44'),
    cashSign(10200, 'ktm', 1.2, '已领取', '2026-09-23 18:51:09')
  ];

  var SIGN_CASH_SEQ = {};
  SIGN_CASH_L923.forEach(function (row) { SIGN_CASH_SEQ[row.seq] = row; });

  var SIGN_TEST = [
    person('muzi', { seq: 6, recordId: '361110460000000006', rewardType: '积分', rewardContent: '2积分', templateId: '25', signedAt: '2026-09-24 21:06:18' }),
    person('qing', { seq: 5, recordId: '361110460000000005', rewardType: '现金红包', rewardContent: '审核通过红包 ¥1.20', templateId: '10086010', signedAt: '2026-09-24 20:41:03', redpackName: '审核通过红包', redpackId: 'CRPT10006', amount: 1.2, amountText: '¥1.20', cashStatus: '已领取', sourceName: '现金红包签到', sortAt: '2026-09-24 20:41:03' }),
    person('zhou', { seq: 4, recordId: '361110460000000004', rewardType: '积分', rewardContent: '5积分', templateId: '10086006', signedAt: '2026-09-23 11:20:44' }),
    person('ning', { seq: 3, recordId: '361110460000000003', rewardType: '现金红包', rewardContent: '审核通过红包 ¥1.20', templateId: '10086010', signedAt: '2026-09-23 11:02:17', redpackName: '审核通过红包', redpackId: 'CRPT10006', amount: 1.2, amountText: '¥1.20', cashStatus: '已领取', sourceName: '现金红包签到', sortAt: '2026-09-23 11:02:17' }),
    person('lsf', { seq: 2, recordId: '361110460000000002', rewardType: '积分', rewardContent: '2积分', templateId: '25', signedAt: '2026-09-23 10:16:52' }),
    person('man', { seq: 1, recordId: '361110460000000001', rewardType: '积分', rewardContent: '2积分', templateId: '25', signedAt: '2026-09-23 09:48:30' })
  ];

  function couponRows(sessionId) {
    if (sessionId === 'live-test') {
      return [
        person('muzi', { seq: 4, recordId: '361210460000000004', couponName: '满99减10券', couponType: '满减券', faceValue: '¥10.00', threshold: '满99元', templateId: '10086001', claimedAt: '2026-09-24 18:12:06', status: '已领取' }),
        person('qing', { seq: 3, recordId: '361210460000000003', couponName: '新人专享券', couponType: '无门槛券', faceValue: '¥5.00', threshold: '无门槛', templateId: '10086002', claimedAt: '2026-09-23 16:40:22', status: '已使用' }),
        person('zhou', { seq: 2, recordId: '361210460000000002', couponName: '果蔬满减券', couponType: '满减券', faceValue: '¥8.00', threshold: '满59元', templateId: '10086003', claimedAt: '2026-09-23 12:08:41', status: '已领取' }),
        person('ning', { seq: 1, recordId: '361210460000000001', couponName: '满99减10券', couponType: '满减券', faceValue: '¥10.00', threshold: '满99元', templateId: '10086001', claimedAt: '2026-09-23 09:26:15', status: '已过期' })
      ];
    }
    return [
      person('muzi', { seq: 8, recordId: '361210450000000008', couponName: '满99减10券', couponType: '满减券', faceValue: '¥10.00', threshold: '满99元', templateId: '10086001', claimedAt: '2026-09-23 19:21:18', status: '已领取' }),
      person('qing', { seq: 7, recordId: '361210450000000007', couponName: '满99减10券', couponType: '满减券', faceValue: '¥10.00', threshold: '满99元', templateId: '10086001', claimedAt: '2026-09-23 19:18:42', status: '已使用' }),
      person('zlw', { seq: 6, recordId: '361210450000000006', couponName: '新人专享券', couponType: '无门槛券', faceValue: '¥5.00', threshold: '无门槛', templateId: '10086002', claimedAt: '2026-09-23 19:11:05', status: '已领取' }),
      person('lsf', { seq: 5, recordId: '361210450000000005', couponName: '果蔬满减券', couponType: '满减券', faceValue: '¥8.00', threshold: '满59元', templateId: '10086003', claimedAt: '2026-09-23 19:02:37', status: '已过期' }),
      person('zhou', { seq: 4, recordId: '361210450000000004', couponName: '满99减10券', couponType: '满减券', faceValue: '¥10.00', threshold: '满99元', templateId: '10086001', claimedAt: '2026-09-23 18:56:14', status: '已领取' }),
      person('ning', { seq: 3, recordId: '361210450000000003', couponName: '新人专享券', couponType: '无门槛券', faceValue: '¥5.00', threshold: '无门槛', templateId: '10086002', claimedAt: '2026-09-23 18:48:29', status: '已使用' }),
      person('ktm', { seq: 2, recordId: '361210450000000002', couponName: '果蔬满减券', couponType: '满减券', faceValue: '¥8.00', threshold: '满59元', templateId: '10086003', claimedAt: '2026-09-23 18:41:53', status: '已领取' }),
      person('man', { seq: 1, recordId: '361210450000000001', couponName: '满99减10券', couponType: '满减券', faceValue: '¥10.00', threshold: '满99元', templateId: '10086001', claimedAt: '2026-09-23 18:36:08', status: '已领取' })
    ];
  }

  function bagRows(sessionId) {
    if (sessionId === 'live-test') {
      return [
        person('muzi', { seq: 5, recordId: '361310460000000005', bagName: '开播福袋', prizeType: '积分', prizeContent: '100积分', templateId: '10086004', claimedAt: '2026-09-24 19:02:11', status: '已领取' }),
        person('qing', { seq: 4, recordId: '361310460000000004', bagName: '现金红包福袋', prizeType: '现金红包', prizeContent: '¥1.60', templateId: '10086009', claimedAt: '2026-09-24 18:26:40', status: '已领取', redpackName: '新人注册红包', redpackId: 'CRPT10001', amount: 1.6, amountText: '¥1.60', cashStatus: '已领取', sourceName: '现金红包福袋', sortAt: '2026-09-24 18:26:40', claimAt: '2026-09-24 18:26:40' }),
        person('zhou', { seq: 3, recordId: '361310460000000003', bagName: '整点福袋', prizeType: '优惠券', prizeContent: '满99减10券', templateId: '10086005', claimedAt: '', status: '已过期' }),
        person('ning', { seq: 2, recordId: '361310460000000002', bagName: '现金红包福袋', prizeType: '现金红包', prizeContent: '¥0.50', templateId: '10086009', claimedAt: '', status: '待领取', redpackName: '新人注册红包', redpackId: 'CRPT10001', amount: 0.5, amountText: '¥0.50', cashStatus: '未领取', sourceName: '现金红包福袋', sortAt: '2026-09-23 14:02:16', claimAt: '' }),
        person('man', { seq: 1, recordId: '361310460000000001', bagName: '开播福袋', prizeType: '—', prizeContent: '—', templateId: '10086004', claimedAt: '', status: '未中奖' })
      ];
    }
    return [
      person('muzi', { seq: 8, recordId: '361310450000000008', bagName: '现金红包福袋', prizeType: '现金红包', prizeContent: '¥1.50', templateId: '10086009', claimedAt: '2026-09-23 19:22:06', status: '已领取', redpackName: '新人注册红包', redpackId: 'CRPT10001', amount: 1.5, amountText: '¥1.50', cashStatus: '已领取', sourceName: '现金红包福袋', sortAt: '2026-09-23 19:22:06', claimAt: '2026-09-23 19:22:06' }),
      person('qing', { seq: 7, recordId: '361310450000000007', bagName: '开播福袋', prizeType: '积分', prizeContent: '100积分', templateId: '10086004', claimedAt: '2026-09-23 19:20:33', status: '已领取' }),
      person('zlw', { seq: 6, recordId: '361310450000000006', bagName: '整点福袋', prizeType: '优惠券', prizeContent: '满99减10券', templateId: '10086005', claimedAt: '2026-09-23 19:15:47', status: '已领取' }),
      person('lsf', { seq: 5, recordId: '361310450000000005', bagName: '现金红包福袋', prizeType: '现金红包', prizeContent: '¥0.80', templateId: '10086009', claimedAt: '2026-09-23 19:08:19', status: '已领取', redpackName: '新人注册红包', redpackId: 'CRPT10001', amount: 0.8, amountText: '¥0.80', cashStatus: '已领取', sourceName: '现金红包福袋', sortAt: '2026-09-23 19:08:19', claimAt: '2026-09-23 19:08:19' }),
      person('zhou', { seq: 4, recordId: '361310450000000004', bagName: '现金红包福袋', prizeType: '现金红包', prizeContent: '¥2.00', templateId: '10086009', claimedAt: '', status: '待领取', redpackName: '新人注册红包', redpackId: 'CRPT10001', amount: 2, amountText: '¥2.00', cashStatus: '未领取', sourceName: '现金红包福袋', sortAt: '2026-09-23 19:10:00', claimAt: '' }),
      person('ning', { seq: 3, recordId: '361310450000000003', bagName: '现金红包福袋', prizeType: '现金红包', prizeContent: '¥1.20', templateId: '10086009', claimedAt: '', status: '已过期', redpackName: '审核通过红包', redpackId: 'CRPT10006', amount: 1.2, amountText: '¥1.20', cashStatus: '已过期', sourceName: '现金红包福袋', sortAt: '2026-09-23 18:58:42', claimAt: '' }),
      person('ktm', { seq: 2, recordId: '361310450000000002', bagName: '开播福袋', prizeType: '商品', prizeContent: '云南高山西红柿', templateId: '10086004', claimedAt: '2026-09-23 18:46:11', status: '已领取' }),
      person('man', { seq: 1, recordId: '361310450000000001', bagName: '整点福袋', prizeType: '—', prizeContent: '—', templateId: '10086005', claimedAt: '', status: '未中奖' })
    ];
  }

  function taskRows(sessionId) {
    if (sessionId === 'live-test') {
      return [
        person('muzi', { seq: 4, recordId: '361410460000000004', threshold: '观看满10分钟', rewardType: '积分', rewardContent: '20积分', points: '20', templateId: '10086007', completedAt: '2026-09-24 20:18:36' }),
        person('qing', { seq: 3, recordId: '361410460000000003', threshold: '观看满5分钟', rewardType: '现金红包', rewardContent: '新人注册红包 ¥0.90', points: '', templateId: '10086011', completedAt: '2026-09-24 19:33:12', redpackName: '新人注册红包', redpackId: 'CRPT10001', amount: 0.9, amountText: '¥0.90', cashStatus: '已领取', sourceName: '现金红包观看', sortAt: '2026-09-24 19:33:12' }),
        person('zhou', { seq: 2, recordId: '361410460000000002', threshold: '观看满30分钟', rewardType: '积分', rewardContent: '30积分', points: '30', templateId: '10086008', completedAt: '2026-09-23 18:02:55' }),
        person('ning', { seq: 1, recordId: '361410460000000001', threshold: '观看满5分钟', rewardType: '现金红包', rewardContent: '新人注册红包 ¥1.00', points: '', templateId: '10086011', completedAt: '2026-09-23 13:44:08', redpackName: '新人注册红包', redpackId: 'CRPT10001', amount: 1, amountText: '¥1.00', cashStatus: '已领取', sourceName: '现金红包观看', sortAt: '2026-09-23 13:44:08' })
      ];
    }
    return [
      person('muzi', { seq: 6, recordId: '361410450000000006', threshold: '观看满5分钟', rewardType: '现金红包', rewardContent: '新人注册红包 ¥0.50', points: '', templateId: '10086011', completedAt: '2026-09-23 19:26:41', redpackName: '新人注册红包', redpackId: 'CRPT10001', amount: 0.5, amountText: '¥0.50', cashStatus: '已领取', sourceName: '现金红包观看', sortAt: '2026-09-23 19:26:41' }),
      person('qing', { seq: 5, recordId: '361410450000000005', threshold: '观看满10分钟', rewardType: '积分', rewardContent: '20积分', points: '20', templateId: '10086007', completedAt: '2026-09-23 19:19:08' }),
      person('zhou', { seq: 4, recordId: '361410450000000004', threshold: '观看满5分钟', rewardType: '现金红包', rewardContent: '新人注册红包 ¥1.80', points: '', templateId: '10086011', completedAt: '2026-09-23 19:05:27', redpackName: '新人注册红包', redpackId: 'CRPT10001', amount: 1.8, amountText: '¥1.80', cashStatus: '已领取', sourceName: '现金红包观看', sortAt: '2026-09-23 19:05:27' }),
      person('zlw', { seq: 3, recordId: '361410450000000003', threshold: '观看满30分钟', rewardType: '积分', rewardContent: '30积分', points: '30', templateId: '10086008', completedAt: '2026-09-23 18:57:16' }),
      person('ning', { seq: 2, recordId: '361410450000000002', threshold: '观看满5分钟', rewardType: '现金红包', rewardContent: '新人注册红包 ¥1.00', points: '', templateId: '10086011', completedAt: '2026-09-23 18:44:39', redpackName: '新人注册红包', redpackId: 'CRPT10001', amount: 1, amountText: '¥1.00', cashStatus: '已领取', sourceName: '现金红包观看', sortAt: '2026-09-23 18:44:39' }),
      person('lsf', { seq: 1, recordId: '361410450000000001', threshold: '观看满10分钟', rewardType: '积分', rewardContent: '10积分', points: '10', templateId: '10086007', completedAt: '2026-09-23 18:38:22' })
    ];
  }

  function signRow(seq) {
    if (SIGN_CASH_SEQ[seq]) return SIGN_CASH_SEQ[seq];
    var i;
    for (i = 0; i < SIGN_HEAD.length; i++) {
      if (SIGN_HEAD[i].seq === seq) return SIGN_HEAD[i];
    }
    var second = seq % 60;
    return {
      seq: seq,
      recordId: '36111045' + pad(seq, 10),
      userId: '356' + pad(seq, 15),
      nickname: '观众' + seq,
      phone: '139' + pad(seq, 8),
      rewardType: '积分',
      rewardContent: '2积分',
      templateId: '25',
      signedAt: '2026-09-23 19:23:' + pad(second, 2)
    };
  }

  function signRows(sessionId) {
    if (sessionId === 'live-l923') {
      var rows = [];
      var seq;
      for (seq = 10499; seq >= 1; seq--) rows.push(signRow(seq));
      return rows;
    }
    if (sessionId === 'live-test') return SIGN_TEST.slice();
    return [];
  }

  function claimTime(row) {
    if (Object.prototype.hasOwnProperty.call(row, 'claimAt')) return row.claimAt;
    return row.signedAt || row.completedAt || row.claimedAt || '';
  }

  function bagCashStatus(row) {
    if (row.status === '待领取') return '未领取';
    if (row.status === '已过期') return '已过期';
    return '已领取';
  }

  function autoPayStatus() {
    return '已领取';
  }

  function asCash(row, source) {
    var status = source === '福袋' ? bagCashStatus(row) : (row.cashStatus || '已领取');
    var claimedAt = claimTime(row);
    if (source === '签到' || source === '观看任务') {
      status = autoPayStatus(row);
      claimedAt = (source === '签到' ? row.signedAt : row.completedAt) || claimedAt;
    }
    return {
      recordId: row.recordId,
      userId: row.userId,
      nickname: row.nickname,
      phone: row.phone,
      source: source,
      sourceName: row.sourceName || '',
      redpackName: row.redpackName || '',
      amount: Number(row.amount) || 0,
      amountText: row.amountText || yuan(row.amount),
      redpackId: row.redpackId || '',
      templateId: row.templateId,
      claimedAt: claimedAt,
      status: status,
      sortAt: row.sortAt || claimedAt || ''
    };
  }

  function sendRound(base, who, extra) {
    return person(who, Object.assign({
      redpackName: base.redpackName,
      redpackId: base.redpackId,
      roundNo: base.roundNo,
      quantityText: base.quantityText,
      perUserText: base.perUserText,
      preheatText: base.preheatText,
      durationText: base.durationText,
      roundStatus: base.roundStatus,
      amount: extra.amount,
      amountText: extra.amount == null ? '—' : yuan(extra.amount)
    }, extra));
  }

  function cashRows(sessionId) {
    var rounds = sessionId === 'live-test' ? [
      { redpackName: '审核通过红包', redpackId: 'CRPT10006', roundNo: '1', quantityText: '4 个', perUserText: '1 次', preheatText: '1 分钟', durationText: '5 分钟', roundStatus: '已结束' }
    ] : [
      { redpackName: '新人注册红包', redpackId: 'CRPT10001', roundNo: '3', quantityText: '3 个', perUserText: '1 次', preheatText: '1 分钟', durationText: '3 分钟', roundStatus: '已中断' },
      { redpackName: '审核通过红包', redpackId: 'CRPT10006', roundNo: '2', quantityText: '6 个', perUserText: '1 次', preheatText: '1 分钟', durationText: '5 分钟', roundStatus: '已结束' },
      { redpackName: '新人注册红包', redpackId: 'CRPT10001', roundNo: '1', quantityText: '5 个', perUserText: '1 次', preheatText: '2 分钟', durationText: '8 分钟', roundStatus: '已结束' }
    ];
    var rows = sessionId === 'live-test' ? [
      sendRound(rounds[0], 'qing', { recordId: '361510460000000004', amount: 1.2, claimedAt: '2026-09-24 19:12:06', status: '已领取', sortAt: '2026-09-24 19:12:06' }),
      sendRound(rounds[0], 'muzi', { recordId: '361510460000000003', amount: 1.2, claimedAt: '2026-09-24 19:08:41', status: '已领取', sortAt: '2026-09-24 19:08:41' }),
      sendRound(rounds[0], 'ning', { recordId: '361510460000000002', amount: 1.2, claimedAt: '', status: '未领取', sortAt: '2026-09-24 19:06:00' }),
      sendRound(rounds[0], 'zhou', { recordId: '361510460000000001', amount: 1.2, claimedAt: '', status: '已过期', sortAt: '2026-09-24 19:05:00' })
    ] : [
      sendRound(rounds[0], 'zhou', { recordId: '361510450000000014', amount: 1.6, claimedAt: '2026-09-23 19:25:02', status: '已领取', sortAt: '2026-09-23 19:25:02' }),
      sendRound(rounds[0], 'man', { recordId: '361510450000000013', amount: 0.9, claimedAt: '', status: '未领取', sortAt: '2026-09-23 19:24:20' }),
      sendRound(rounds[0], 'ktm', { recordId: '361510450000000012', amount: 1.1, claimedAt: '', status: '未领取', sortAt: '2026-09-23 19:24:10' }),
      sendRound(rounds[1], 'muzi', { recordId: '361510450000000011', amount: 1.2, claimedAt: '2026-09-23 19:22:06', status: '已领取', sortAt: '2026-09-23 19:22:06' }),
      sendRound(rounds[1], 'qing', { recordId: '361510450000000010', amount: 1.2, claimedAt: '2026-09-23 19:21:40', status: '已领取', sortAt: '2026-09-23 19:21:40' }),
      sendRound(rounds[1], 'zlw', { recordId: '361510450000000009', amount: 1.2, claimedAt: '2026-09-23 19:21:11', status: '已领取', sortAt: '2026-09-23 19:21:11' }),
      sendRound(rounds[1], 'man', { recordId: '361510450000000008', amount: 1.2, claimedAt: '2026-09-23 19:20:48', status: '已领取', sortAt: '2026-09-23 19:20:48' }),
      sendRound(rounds[1], 'zhou', { recordId: '361510450000000007', amount: 1.2, claimedAt: '', status: '未领取', sortAt: '2026-09-23 19:20:10' }),
      sendRound(rounds[1], 'ning', { recordId: '361510450000000006', amount: 1.2, claimedAt: '', status: '已过期', sortAt: '2026-09-23 19:20:00' }),
      sendRound(rounds[2], 'qing', { recordId: '361510450000000005', amount: 0.8, claimedAt: '2026-09-23 19:12:20', status: '已领取', sortAt: '2026-09-23 19:12:20' }),
      sendRound(rounds[2], 'lsf', { recordId: '361510450000000004', amount: 1.5, claimedAt: '2026-09-23 19:10:05', status: '已领取', sortAt: '2026-09-23 19:10:05' }),
      sendRound(rounds[2], 'muzi', { recordId: '361510450000000003', amount: 0.5, claimedAt: '2026-09-23 19:08:33', status: '已领取', sortAt: '2026-09-23 19:08:33' }),
      sendRound(rounds[2], 'ktm', { recordId: '361510450000000002', amount: 2, claimedAt: '', status: '未领取', sortAt: '2026-09-23 19:06:40' }),
      sendRound(rounds[2], 'ning', { recordId: '361510450000000001', amount: 1.2, claimedAt: '', status: '已过期', sortAt: '2026-09-23 19:06:20' })
    ];
    rows.sort(function (a, b) {
      if (a.sortAt === b.sortAt) return 0;
      return a.sortAt < b.sortAt ? 1 : -1;
    });
    rows.forEach(function (row, index) { row.seq = rows.length - index; });
    return rows;
  }

  function sourceRows() {
    var id = currentSession().id;
    if (state.tab === 'coupon') return couponRows(id);
    if (state.tab === 'bag') return bagRows(id);
    if (state.tab === 'sign') return signRows(id);
    if (state.tab === 'task') return taskRows(id);
    if (state.tab === 'redpack') return cashRows(id);
    return [];
  }

  function matchUser(row, filter) {
    var userId = String(filter.userId || '').trim();
    var nickname = String(filter.nickname || '').trim();
    var phone = String(filter.phone || '').trim();
    if (userId && String(row.userId).indexOf(userId) < 0) return false;
    if (nickname && String(row.nickname).indexOf(nickname) < 0) return false;
    if (phone && String(row.phone).indexOf(phone) < 0) return false;
    if ((state.tab === 'bag' || state.tab === 'redpack') && filter.status && filter.status !== '全部' && row.status !== filter.status) return false;
    return true;
  }

  function records() {
    var filter = state.applied;
    return sourceRows().filter(function (row) { return matchUser(row, filter); });
  }

  function cashStatusOf(row) {
    if (row.prizeType === '现金红包') return bagCashStatus(row);
    if (row.rewardType === '现金红包') return autoPayStatus(row);
    return row.cashStatus || '已领取';
  }

  function readDraft() {
    state.draft = {
      userId: (document.getElementById('lmrUserId') || {}).value || '',
      nickname: (document.getElementById('lmrNickname') || {}).value || '',
      phone: (document.getElementById('lmrPhone') || {}).value || '',
      status: (document.getElementById('lmrStatus') || {}).value || '全部',
      source: (document.getElementById('lmrSource') || {}).value || '全部'
    };
  }

  function renderSessionOptions() {
    var sel = document.getElementById('lmrSession');
    if (!sel) return;
    sel.innerHTML = SESSIONS.map(function (sess) {
      return '<option value="' + escapeHtml(sess.id) + '"' + (sess.id === state.sessionId ? ' selected' : '') + '>' + escapeHtml(sess.name) + '</option>';
    }).join('');
  }

  function renderMeta() {
    var box = document.getElementById('lmrMeta');
    var sess = currentSession();
    if (!box) return;
    var statusClass = sess.status === '直播中' ? 'lmr-status lmr-status--live' : 'lmr-status';
    box.innerHTML =
      '<span><b>直播间名称：</b>' + escapeHtml(sess.roomName) + '</span>' +
      '<span><b>主播：</b>' + escapeHtml(sess.anchor) + '</span>' +
      '<span><b>开播时间：</b>' + escapeHtml(rangeText(sess)) + '</span>' +
      '<span><b>状态：</b><em class="' + statusClass + '">' + escapeHtml(sess.status) + '</em></span>';
  }

  function renderTabs() {
    var box = document.getElementById('lmrTabs');
    if (!box) return;
    box.innerHTML = TABS.map(function (tab) {
      return '<button type="button" data-tab="' + tab.id + '"' + (tab.id === state.tab ? ' class="is-active"' : '') + '>' + tab.label + '</button>';
    }).join('');
  }

  function renderFilters() {
    var meta = tabMeta();
    var box = document.getElementById('lmrFilters');
    if (!box) return;
    var draft = state.draft;
    var statusHtml = '';
    if (meta.filter === 'status') {
      statusHtml =
        '<label class="lmr-field lmr-field--break"><span>状态</span><select id="lmrStatus">' +
        BAG_STATUS.map(function (item) {
          return '<option value="' + item + '"' + (draft.status === item ? ' selected' : '') + '>' + item + '</option>';
        }).join('') +
        '</select></label>';
    } else if (meta.filter === 'claim') {
      statusHtml =
        '<label class="lmr-field lmr-field--break"><span>领取状态</span><select id="lmrStatus">' +
        CASH_CLAIM_STATUS.map(function (item) {
          return '<option value="' + item + '"' + (draft.status === item ? ' selected' : '') + '>' + item + '</option>';
        }).join('') +
        '</select></label>';
    }
    box.innerHTML =
      '<label class="lmr-field"><span>用户ID</span><input id="lmrUserId" placeholder="请输入用户ID" value="' + escapeHtml(draft.userId) + '" autocomplete="off"></label>' +
      '<label class="lmr-field"><span>用户昵称</span><input id="lmrNickname" placeholder="请输入昵称" value="' + escapeHtml(draft.nickname) + '" autocomplete="off"></label>' +
      '<label class="lmr-field"><span>手机号</span><input id="lmrPhone" placeholder="请输入手机号" value="' + escapeHtml(draft.phone) + '" autocomplete="off"></label>' +
      '<div class="lmr-actions">' +
      '<button type="button" class="lmr-btn lmr-btn--primary" id="lmrQuery"><svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><circle cx="6" cy="6" r="4.2" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M9.2 9.2L12 12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>查询</button>' +
      '<button type="button" class="lmr-btn lmr-btn--plain" id="lmrReset"><svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 7a4 4 0 1 0 1.2-2.8" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M3 2.8V5.2h2.4" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>重置</button>' +
      '</div>' +
      statusHtml;
  }

  function renderHead() {
    var head = document.getElementById('lmrHead');
    var meta = tabMeta();
    if (!head) return;
    head.innerHTML = '<tr>' + meta.columns.map(function (name) {
      return '<th>' + escapeHtml(name) + '</th>';
    }).join('') + '</tr>';
  }

  function fieldValue(row, field) {
    if (field === 'prizeContent' && row.prizeType === '现金红包') {
      if (row.amountText) return row.amountText;
      if (row.amount != null && row.amount !== '') return yuan(row.amount);
    }
    if (row[field] == null || row[field] === '') return '';
    return String(row[field]);
  }

  function cellText(row, field) {
    if (field === 'recordId') return '<span class="lmr-id" title="' + escapeHtml(row.recordId) + '">' + escapeHtml(row.recordId) + '</span>';
    var text = fieldValue(row, field);
    return escapeHtml(text || '—');
  }

  function pageButtons(totalPages) {
    var html = '';
    var current = state.page;
    function btn(label, page, extra) {
      var disabled = extra === 'disabled';
      var active = page === current && extra !== 'ellipsis' && extra !== 'disabled';
      return '<button type="button" data-page="' + (page || '') + '"' +
        (active ? ' class="is-active"' : '') +
        (disabled || extra === 'ellipsis' ? ' disabled' : '') +
        '>' + label + '</button>';
    }
    html += btn('‹', current - 1, current <= 1 ? 'disabled' : '');
    var pages = [];
    if (totalPages <= 7) {
      var n;
      for (n = 1; n <= totalPages; n++) pages.push(n);
    } else if (current <= 4) {
      pages = [1, 2, 3, 4, 5, 6, '…', totalPages];
    } else if (current >= totalPages - 3) {
      pages = [1, '…', totalPages - 5, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    } else {
      pages = [1, '…', current - 2, current - 1, current, current + 1, current + 2, '…', totalPages];
    }
    pages.forEach(function (item) {
      if (item === '…') html += btn('…', '', 'ellipsis');
      else html += btn(String(item), item);
    });
    html += btn('›', current + 1, current >= totalPages ? 'disabled' : '');
    return html;
  }

  function renderPager(total) {
    var box = document.getElementById('lmrPager');
    if (!box) return;
    var totalPages = Math.max(1, Math.ceil(total / state.pageSize) || 1);
    box.innerHTML =
      '<span>共 ' + total + ' 条</span>' +
      '<select class="lmr-pager__size" id="lmrPageSize">' +
      PAGE_SIZES.map(function (size) {
        return '<option value="' + size + '"' + (size === state.pageSize ? ' selected' : '') + '>' + size + '条/页</option>';
      }).join('') +
      '</select>' +
      '<div class="lmr-pager__pages">' + pageButtons(totalPages) + '</div>' +
      '<label class="lmr-pager__jump">前往 <input id="lmrJump" value="' + state.page + '"> 页</label>';
  }

  function renderSummary(rows) {
    var box = document.getElementById('lmrSummary');
    if (!box) return;
    var tab = state.tab;
    if (tab !== 'bag' && tab !== 'sign' && tab !== 'task' && tab !== 'redpack') {
      box.hidden = true;
      box.innerHTML = '';
      return;
    }
    var list = tab === 'redpack' ? rows : rows.filter(function (row) {
      return row.prizeType === '现金红包' || row.rewardType === '现金红包';
    });
    var claimed = 0;
    var pending = 0;
    var expired = 0;
    var amount = 0;
    var users = {};
    var rounds = {};
    list.forEach(function (row) {
      var status = tab === 'redpack' ? row.status : cashStatusOf(row);
      if (status === '未领取') pending += 1;
      else if (status === '已过期') expired += 1;
      else {
        claimed += 1;
        amount += Number(row.amount) || 0;
      }
      if (row.userId) users[row.userId] = true;
      if (tab === 'redpack' && row.roundNo) rounds[row.redpackId + '#' + row.roundNo] = true;
    });
    box.hidden = false;
    box.innerHTML =
      '<span>' + (tab === 'redpack' ? '现金红包合计' : '关联现金红包') + '</span>' +
      (tab === 'redpack' ? '<span>发放轮次 <b>' + Object.keys(rounds).length + '</b></span>' : '') +
      '<span>发放 <b>' + list.length + '</b> 笔</span>' +
      '<span>已领取金额 <b>¥' + amount.toFixed(2) + '</b></span>' +
      '<span>涉及用户 <b>' + Object.keys(users).length + '</b></span>' +
      '<span>已领取 <b>' + claimed + '</b></span>' +
      '<span>未领取 <b>' + pending + '</b></span>' +
      '<span>已过期 <b>' + expired + '</b></span>';
  }

  function renderTable(rows) {
    var meta = tabMeta();
    var body = document.getElementById('lmrBody');
    var empty = document.getElementById('lmrEmpty');
    if (!rows) rows = records();
    var total = rows.length;
    var totalPages = Math.max(1, Math.ceil(total / state.pageSize) || 1);
    if (state.page > totalPages) state.page = totalPages;
    if (state.page < 1) state.page = 1;
    var start = (state.page - 1) * state.pageSize;
    var slice = rows.slice(start, start + state.pageSize);
    if (body) {
      body.innerHTML = slice.map(function (row) {
        return '<tr>' + meta.fields.map(function (field) {
          return '<td>' + cellText(row, field) + '</td>';
        }).join('') + '</tr>';
      }).join('');
    }
    if (empty) empty.hidden = total > 0;
    renderPager(total);
  }

  function paintList() {
    var rows = records();
    renderSummary(rows);
    renderTable(rows);
  }

  function render() {
    renderSessionOptions();
    renderMeta();
    renderTabs();
    renderFilters();
    renderHead();
    paintList();
  }

  function exportRows() {
    var meta = tabMeta();
    var rows = records();
    if (!rows.length) {
      if (typeof showToast === 'function') showToast('当前没有可导出的记录', 'warning');
      return;
    }
    var lines = [meta.columns.join(',')];
    rows.forEach(function (row) {
      lines.push(meta.fields.map(function (field) {
        var text = fieldValue(row, field).replace(/"/g, '""');
        return '"' + text + '"';
      }).join(','));
    });
    var blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '直播营销记录-' + tabMeta().label + '.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (typeof showToast === 'function') showToast('已导出 ' + rows.length + ' 条' + meta.label + '记录', 'success');
  }

  function bind() {
    var root = document.querySelector('.lmr-page');
    if (!root) return;
    root.addEventListener('change', function (ev) {
      if (ev.target.id === 'lmrSession') {
        state.sessionId = ev.target.value;
        state.page = 1;
        renderMeta();
        paintList();
      } else if (ev.target.id === 'lmrPageSize') {
        state.pageSize = Number(ev.target.value) || 20;
        state.page = 1;
        paintList();
      }
    });
    root.addEventListener('click', function (ev) {
      var tabBtn = ev.target.closest('[data-tab]');
      if (tabBtn) {
        state.tab = tabBtn.getAttribute('data-tab') || 'coupon';
        state.page = 1;
        state.draft = blankFilter();
        state.applied = blankFilter();
        if (location.hash !== '#' + state.tab) history.replaceState(null, '', '#' + state.tab);
        renderTabs();
        renderFilters();
        renderHead();
        paintList();
        return;
      }
      if (ev.target.closest('#lmrQuery')) {
        readDraft();
        state.applied = {
          userId: state.draft.userId,
          nickname: state.draft.nickname,
          phone: state.draft.phone,
          status: state.draft.status,
          source: state.draft.source
        };
        state.page = 1;
        paintList();
        return;
      }
      if (ev.target.closest('#lmrReset')) {
        state.draft = blankFilter();
        state.applied = blankFilter();
        state.page = 1;
        renderFilters();
        paintList();
        return;
      }
      var pageBtn = ev.target.closest('.lmr-pager__pages button');
      if (pageBtn && !pageBtn.disabled) {
        var page = Number(pageBtn.getAttribute('data-page'));
        if (page) {
          state.page = page;
          paintList();
        }
        return;
      }
      if (ev.target.closest('#lmrExport')) exportRows();
    });
    root.addEventListener('keydown', function (ev) {
      if (ev.target.id === 'lmrJump' && ev.key === 'Enter') {
        ev.preventDefault();
        var total = records().length;
        var totalPages = Math.max(1, Math.ceil(total / state.pageSize) || 1);
        var page = parseInt(ev.target.value, 10);
        if (!page || page < 1) page = 1;
        if (page > totalPages) page = totalPages;
        state.page = page;
        paintList();
      }
    });
  }

  function boot() {
    var hash = String(location.hash || '').replace('#', '');
    if (TABS.some(function (tab) { return tab.id === hash; })) state.tab = hash;
    bind();
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
