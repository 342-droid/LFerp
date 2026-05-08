import { renderSubjectPage } from './mdm-subject-generic.js';

const MOCK = [
  ['LIVE-SUB-001', '品牌日播间-A', '官方直播组', '直播间', '周琳', '139****8899', 'live_a_01', '2026-04-24 09:00:00', '系统', '正常'],
  ['LIVE-SUB-002', '区域直播-沪南', '区域直播组', '直播间', '吴悦', '136****6677', 'live_hn_01', '2026-04-23 20:15:33', '李四', '正常'],
  ['LIVE-SUB-003', '工厂溯源专场', '定向直播组', '直播间', '郑可', '135****5544', 'live_trace_01', '2026-04-22 13:40:18', '王五', '停用'],
];

export function render(container) {
  renderSubjectPage(container, {
    contactPersonLabel: '负责人',
    pageLabel: '直播间',
    idLabel: '主体ID',
    nameLabel: '主体名称',
    addLabel: '直播间主体',
    addModalTitle: '添加直播间主体',
    subjectTypeLabel: '直播间',
    showBindBd: false,
    bindColumnLabel: '归属分组',
    manageTitle: '直播间主体管理',
    listTitle: '直播间主体列表',
    disableConfirmMessage: '确定禁用此直播间吗？',
    mock: MOCK,
    pageFootNote:
      '说明：本页为直播间签约主体（MDM）。具体「直播间」主数据（名称、直播类型、主播、观看权限等）在资源中心「直播间档案」维护并关联本主体；业务系统在该直播间下创建场次与配置场次商品。',
  });
}
