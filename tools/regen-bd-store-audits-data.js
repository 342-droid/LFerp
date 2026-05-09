/**
 * 将 js/mdm-bd-store-audits.json 写成 js/mdm-bd-store-audits-data.js（window.__BD_STORE_AUDITS__）
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const jsonPath = path.join(root, 'js', 'mdm-bd-store-audits.json');
const outPath = path.join(root, 'js', 'mdm-bd-store-audits-data.js');

const arr = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const hdr =
  '/**\n * 由 mdm-bd-store-audits.json 生成，勿手改。\n * 生成命令：node tools/regen-bd-store-audits-data.js\n */\n';

fs.writeFileSync(outPath, hdr + 'window.__BD_STORE_AUDITS__ = ' + JSON.stringify(arr) + ';\n');
console.log('Wrote', outPath);
