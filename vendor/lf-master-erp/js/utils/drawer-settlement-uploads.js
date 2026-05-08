/**
 * 结算信息上传区：左标签（*必填 + 冒号）与右侧上传框对齐，与设计稿一致。
 */
import { el } from './dom.js';

/**
 * @returns {HTMLElement}
 */
export function createSettlementUploadSection() {
  const wrap = el('div', 'drawer-settlement-uploads');

  function rowLabel(text, required) {
    const lab = el('div', 'drawer-upload-line__label');
    if (required) {
      const ast = el('span', 'drawer-upload-req', '*');
      lab.appendChild(ast);
    }
    lab.appendChild(document.createTextNode(text));
    lab.appendChild(document.createTextNode('：'));
    return lab;
  }

  const bankGroup = el('div', 'drawer-upload-group drawer-upload-group--bank');
  const bankLine = el('div', 'drawer-upload-line');
  bankLine.appendChild(rowLabel('银行卡照片', true));
  const bankCtrl = el('div', 'drawer-upload-line__control');
  bankCtrl.appendChild(el('div', 'drawer-upload-zone drawer-upload-zone--wide', '点击上传'));
  bankLine.appendChild(bankCtrl);
  bankGroup.appendChild(bankLine);

  const idGroup = el('div', 'drawer-upload-group drawer-upload-group--id');
  const idLine = el('div', 'drawer-upload-line');
  idLine.appendChild(rowLabel('身份证照片', true));
  const idCtrl = el('div', 'drawer-upload-line__control drawer-upload-line__control--dual');
  ['上传身份证人像面', '上传身份证国徽面'].forEach((caption) => {
    const item = el('div', 'drawer-upload-item');
    item.appendChild(el('div', 'drawer-upload-zone', '点击上传'));
    item.appendChild(el('div', 'drawer-upload-caption', caption));
    idCtrl.appendChild(item);
  });
  idLine.appendChild(idCtrl);
  idGroup.appendChild(idLine);

  wrap.appendChild(bankGroup);
  wrap.appendChild(idGroup);

  return wrap;
}
