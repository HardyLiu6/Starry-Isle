/**
 * 免责声明"三处同文"机器校验（ADR-0006 决定 13）。
 *
 * 唯一来源：src/disclaimer.json。应用内 Disclaimer.tsx 直接渲染它；
 * README 的 <!-- disclaimer:start --> … <!-- disclaimer:end --> 块由本脚本核对是否逐段一致。
 * 三处同文是合规姿态的组成部分（ADR-0004 / 研 04 §六），靠注释提醒人工同步是最易腐烂的约定。
 *
 * 第三处（家长说明页/发布页）出现时，把它的路径加进 TARGETS 即可纳入同一校验。
 */
import { readFileSync } from 'node:fs';

const SOURCE = 'src/disclaimer.json';
const TARGETS = ['README.md'];

const disclaimer = JSON.parse(readFileSync(new URL('../src/disclaimer.json', import.meta.url), 'utf8'));

/** 由唯一来源生成 markdown 形态的声明块（README 内块的期望内容） */
const expected = [disclaimer.intro, '', ...disclaimer.items.map((i) => `- ${i}`), '', disclaimer.en];

const problems = [];

for (const target of TARGETS) {
  const text = readFileSync(new URL(`../${target}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
  const block = text.match(/<!--\s*disclaimer:start[\s\S]*?-->\n([\s\S]*?)<!--\s*disclaimer:end\s*-->/);

  if (!block) {
    problems.push(`${target}：找不到 <!-- disclaimer:start --> … <!-- disclaimer:end --> 声明块`);
    continue;
  }

  const actual = block[1].split('\n').map((l) => l.trim()).filter((l) => l !== '');
  const want = expected.filter((l) => l !== '');

  if (actual.length !== want.length) {
    problems.push(`${target}：声明块共 ${actual.length} 段，唯一来源共 ${want.length} 段`);
  }
  want.forEach((line, i) => {
    if (actual[i] !== line) {
      problems.push(
        `${target} 第 ${i + 1} 段不一致：\n      来源：${line}\n      实际：${actual[i] ?? '（缺失）'}`,
      );
    }
  });
}

if (problems.length > 0) {
  console.error(`✘ 免责声明同文校验未通过（唯一来源：${SOURCE}）：\n`);
  for (const p of problems) console.error('  ' + p);
  console.error(`\n请把 ${SOURCE} 的内容同步到上述位置（源文本的 **加粗** 标记在 markdown 中原样保留）。`);
  process.exit(1);
} else {
  console.log(`✓ 免责声明同文校验通过（${SOURCE} ↔ ${TARGETS.join('、')}）`);
}
