import { renderSubjectPage } from './mdm-subject-generic.js';

const MOCK = [
  ['SUP-SUB-001', '小牛供应链', '公司11号', '供应商', '牛强', '159****7788', 'sup_xn_01', '2026-04-24 08:20:01', '张三', '正常'],
  ['SUP-SUB-002', '珠宝集采中心', '公司11号', '供应商', '钱多多', '177****9271', 'sup_jewel_01', '2026-04-23 12:11:09', '王五', '冻结'],
  ['SUP-SUB-003', '华东辅料仓配', '李四', '供应商', '刘洋', '176****0317', 'sup_hd_01', '2026-04-22 09:45:33', '李四', '正常'],
];

export function render(container) {
  renderSubjectPage(container, {
    pageLabel: '供应商',
    idLabel: '主体ID',
    nameLabel: '主体名称',
    addLabel: '供应商主体',
    addModalTitle: '添加供应商主体',
    subjectTypeLabel: '供应商',
    showBindBd: false,
    disableConfirmMessage: '确定禁用此供应商吗？',
    mock: MOCK,
  });
}
