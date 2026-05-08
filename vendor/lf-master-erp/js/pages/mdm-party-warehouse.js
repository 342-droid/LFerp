import { renderSubjectPage } from './mdm-subject-generic.js';

const MOCK = [
  ['WH-SUB-001', '沪南一号仓', '李四', '仓库', '周仓', '137****0098', 'wh_hn_01', '2026-04-24 18:20:01', '李四', '正常'],
  ['WH-SUB-002', '合作仓-苏州', '张三', '仓库', '孙杰', '133****0000', 'wh_sz_01', '2026-04-23 11:00:55', '系统', '正常'],
  ['WH-SUB-003', '自建仓-杭州', '—', '仓库', '王敏', '138****2210', 'wh_hz_01', '2026-04-22 07:45:12', '王五', '停用'],
];

export function render(container) {
  renderSubjectPage(container, {
    pageLabel: '仓库',
    idLabel: '主体ID',
    nameLabel: '主体名称',
    addLabel: '仓库主体',
    addModalTitle: '添加仓库主体',
    subjectTypeLabel: '仓库',
    showBindBd: false,
    disableConfirmMessage: '确定禁用此仓库吗？',
    mock: MOCK,
  });
}
