import { renderSubjectPage } from './mdm-subject-generic.js';

const MOCK = [
  ['CAR-SUB-001', '顺丰同城承运', '公司11号', '承运商', '刘强', '139****1100', 'carrier_sf_01', '2026-04-24 11:00:00', '系统', '正常'],
  ['CAR-SUB-002', '德邦干线承运', '李四', '承运商', '马涛', '137****2200', 'carrier_db_01', '2026-04-23 16:30:22', '李四', '正常'],
  ['CAR-SUB-003', '区域城配联盟', '—', '承运商', '周宁', '186****3300', 'carrier_union_01', '2026-04-22 09:15:40', '王五', '停用'],
];

export function render(container) {
  renderSubjectPage(container, {
    pageLabel: '承运商',
    idLabel: '主体ID',
    nameLabel: '主体名称',
    addLabel: '承运商主体',
    addModalTitle: '添加承运商主体',
    subjectTypeLabel: '承运商',
    showBindBd: false,
    bindColumnLabel: '所属组织',
    manageTitle: '承运商主体管理',
    listTitle: '承运商主体列表',
    disableConfirmMessage: '确定禁用此承运商吗？',
    mock: MOCK,
  });
}
