/**
 * Remix Icon 辅助（需在 index.html 引入 remixicon.css）
 * 文档：https://remixicon.com/
 */

/**
 * @param {string} remixClass 完整类名，如 ri-home-5-line
 * @param {string} [extraClass] 附加 class
 * @returns {HTMLElement}
 */
export function riIcon(remixClass, extraClass = '') {
  const node = document.createElement('i');
  node.className = [remixClass, extraClass].filter(Boolean).join(' ');
  node.setAttribute('aria-hidden', 'true');
  return node;
}
