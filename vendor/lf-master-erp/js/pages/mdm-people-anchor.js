import { renderPeopleRolePage } from './mdm-people-role-shared.js';

const DEPT_OPTIONS = [
  { value: 'content', label: '内容运营中心' },
  { value: 'train', label: '直播培训组' },
];

const MOCK = [
  {
    id: 'ANC5001',
    name: '周琳',
    phone: '139****8899',
    phoneRaw: '13988991234',
    deptKey: 'content',
    deptLabel: '内容运营中心',
    jobStatusKey: 'on',
    jobStatusLabel: '在岗',
    org: '上海冷丰科技有限公司',
    withdrawPhone: '139****8899',
    withdrawPhoneRaw: '13988991234',
    updateTime: '2026-04-24 21:00:00',
    enabled: true,
  },
  {
    id: 'ANC5002',
    name: '吴悦',
    phone: '136****6677',
    phoneRaw: '13666771234',
    deptKey: 'content',
    deptLabel: '内容运营中心',
    jobStatusKey: 'on',
    jobStatusLabel: '在岗',
    org: '上海冷丰科技有限公司',
    withdrawPhone: '136****6677',
    withdrawPhoneRaw: '13666771234',
    updateTime: '2026-04-23 22:40:18',
    enabled: true,
  },
  {
    id: 'ANC5003',
    name: '郑可',
    phone: '135****5544',
    phoneRaw: '13555441234',
    deptKey: 'train',
    deptLabel: '直播培训组',
    jobStatusKey: 'on',
    jobStatusLabel: '在岗',
    org: '上海冷丰科技有限公司',
    withdrawPhone: '—',
    withdrawPhoneRaw: '',
    updateTime: '2026-04-22 18:09:55',
    enabled: true,
  },
];

export function render(container) {
  renderPeopleRolePage(container, {
    roleLabel: '主播',
    manageTitle: '主播管理',
    listTitle: '主播列表',
    idLabel: '主播ID',
    deptLabel: '所属组别',
    idPrefix: 'ANC',
    deptOptions: DEPT_OPTIONS,
    detailTitle: '主播详情',
    detailMeta: (r) => `主播ID：${r.id ?? '—'} · ${r.phone ?? '—'}`,
    detailTabs: ['基础信息', '直播场次', '合约与排期', '结算信息'],
    detailRoleKind: 'anchor',
    baseFields: (r) => [
      ['主播ID', r.id],
      ['姓名', r.name],
      ['手机号码', r.phone],
      ['所属组别', r.deptLabel],
      ['岗位状态', r.jobStatusLabel],
      ['绑定组织', r.org],
    ],
    mock: MOCK,
    pageFootNote:
      '说明：主播为主数据，供业务系统创建直播间时选择「主播」及资源中心「直播间档案」关联（主播ID 与档案一致）。',
  });
}
