import { renderSubjectPage } from './mdm-subject-generic.js';

const MOCK = [
  ['STORE-SUB-001', '冷丰演示门店', '张三', '门店', '赵小九', '138****2211', 'store_demo_01', '2026-04-24 10:22:11', '系统', '正常'],
  ['STORE-SUB-002', '五角场体验店', '李四', '门店', '孙丽', '188****7765', 'store_wjc_01', '2026-04-23 15:01:44', '李四', '正常'],
  ['STORE-SUB-003', '张江快闪店', '—', '门店', '陈晨', '186****9001', 'store_zj_01', '2026-04-22 09:33:02', '系统', '停用'],
];

export function render(container) {
  renderSubjectPage(container, {
    pageLabel: '门店',
    idLabel: '主体ID',
    nameLabel: '主体名称',
    addLabel: '门店主体',
    addModalTitle: '添加门店主体',
    subjectTypeLabel: '门店',
    showBindBd: true,
    compactStoreSubjectForm: true,
    disableConfirmMessage: '确定禁用此门店吗？',
    mock: MOCK,
  });
}
