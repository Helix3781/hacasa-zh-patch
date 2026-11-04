#!/usr/bin/env node
/**
 * 给 HaCasa Nova 注入简体中文语言包
 *
 * 用法:
 *   node build-zh.js <官方 hacasa-nova.js> [输出路径]
 *
 * 例:
 *   node build-zh.js ~/Downloads/hacasa-nova.js dist/hacasa-nova-zh.js
 */
const fs = require('fs');
const path = require('path');

const srcPath = process.argv[2];
const outPath = process.argv[3] || path.join(__dirname, '..', 'dist', 'hacasa-nova-zh.js');

if (!srcPath) {
  console.error('用法: node build-zh.js <官方 hacasa-nova.js> [输出路径]');
  process.exit(1);
}

let src = fs.readFileSync(srcPath, 'utf8');

// 加载词典模块（CommonJS），再序列化成内联 JS 对象字面量
const zhDictPath = path.join(__dirname, '..', 'dist', 'zh-dict.js');
const zhDict = require(zhDictPath);
const zhJs = '{' + Object.entries(zhDict)
  .map(([k, v]) => JSON.stringify(k) + ':' + JSON.stringify(v))
  .join(',') + '}';
console.log(`✓ 已加载词典 ${Object.keys(zhDict).length} 条`);

// ---- 0. 幂等检查：已打过补丁就跳过注入 ----
if (src.includes('var zhMeta=')) {
  console.log('⚠  该文件已包含中文语言包，跳过注入步骤');
} else {
  // ---- 1. 在语言表前插入中文定义，并把 zh 注册进 no ----
  const anchor = 'var no={de:ya,en:$a,es:Da};';
  if (!src.includes(anchor)) {
    console.error('✗ 未找到语言表锚点，可能官方版本已变更结构');
    process.exit(2);
  }
  const replacement =
    'var zhMeta={name:"简体中文",locale:"zh-CN"},zhDict=' + zhJs + ';' +
    'var no={de:ya,en:$a,es:Da,zh:{meta:zhMeta,default:zhDict}};';
  src = src.replace(anchor, replacement);
  console.log('✓ 已注入 1281 条中文词条并注册 zh 语种');
}

// ---- 2. 修正硬编码的荷兰语属性 ----
let fixes = 0;

// 2a. 裸 alt="sluiten"
const beforeAlt = (src.match(/alt="sluiten"/g) || []).length;
src = src.split('alt="sluiten"').join('alt="关闭"');
fixes += beforeAlt;

// 2b. 缺引号的 title=${n("Sluiten")} —— 浏览器会把值当裸字面量解析
const beforeTitle = (src.match(/title=\$\{n\("Sluiten"\)\}/g) || []).length;
src = src.split('title=${n("Sluiten")}').join('title="${n("Sluiten")}"');
fixes += beforeTitle;

// 2c. 嵌套双引号 null 掉属性值
const beforeNest = (src.match(/alt="\$\{n\("sluiten"\)\}"/g) || []).length;
src = src.split('alt="${n("sluiten")}"').join("alt=\"${n('sluiten')}\"");
fixes += beforeNest;

console.log(`✓ 已修正 ${fixes} 处硬编码/引号问题`);

// ---- 3. 校验 ----
const checks = [
  ['包含简体中文', src.includes('简体中文')],
  ['zh 已注册', src.includes('es:Da,zh:{meta:zhMeta')],
  ['无 alt="sluiten" 残留', !src.includes('alt="sluiten"')],
];
let ok = true;
for (const [name, pass] of checks) {
  console.log(`  ${pass ? '✓' : '✗'} ${name}`);
  if (!pass) ok = false;
}
if (!ok) process.exit(3);

// ---- 4. 写出 ----
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, src);
const kb = (Buffer.byteLength(src) / 1024).toFixed(0);
console.log(`\n✓ 已写出 ${outPath} (${kb} KB)`);
