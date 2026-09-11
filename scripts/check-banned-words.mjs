/**
 * 对外文案禁语检查（依据 docs/research/04-合规红线清单.md 措辞清单 + ADR-0004）。
 * 进 `npm run check` 与 CI——README 免责声明就位并过禁语自查是一期验收项。
 *
 * 范围：对外可见的传播文案（README、应用 UI 与源码、index.html、CONTRIBUTING、devlog）。
 * 不扫内部调研/决策文档（docs/ 除 devlog、CONTEXT.md、spikes/）——它们必须引用法规原文与禁语本身。
 * docs/devlog/ 是对外传播文案，故显式纳入（ADR-0006 决定 3）。
 *
 * 扫不到的对外文案面（GitHub About/topics/Release 说明/社交预览图/未来商店文案）
 * 见 CONTRIBUTING"仓库外对外文案清单"，改动前人工过禁语清单（ADR-0006 决定 11）。
 *
 * 豁免机制：
 *  1. 免责声明的唯一来源与渲染组件整文件豁免——否定性法律声明必须点名医疗用语才能撇清；
 *  2. README 中 <!-- disclaimer:start --> … <!-- disclaimer:end --> 块豁免（三处同文的模板）；
 *  3. 行内含 `banned-ok` 标记的行豁免（用于"对外不自称XX"这类元规则表述）。
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

/** 医疗/疗效/绝对化/定性禁语（含高风险慎用词——对外文案一律不出现） */
const BANNED = [
  // 疾病治疗指向（广告法 17 条一刀切）
  '治疗', '治愈', '疗愈', '疗效', '康复', '症状', '缓解',
  // 医疗用语混淆（医疗器械边界）
  '患者', '患儿', '处方', '疗程', '临床', '数字疗法', '适应症', '禁忌症', '诊断', '筛查',
  // 高风险慎用词（对外降格：干预→辅助训练；评估→练习记录）
  '干预', '评估',
  // 绝对化用语（广告法 9 条 + 执法指南）
  '最有效', '最专业', '首个', '首款', '国家级', '权威', '治愈率', '有效率', '彻底解决',
  // 定性红线（ADR-0004：对外不自称此词）
  '游戏',
];

const SCAN = [
  'README.md',
  'CONTRIBUTING.md',
  'CODE_OF_CONDUCT.md',
  'SECURITY.md',
  'index.html',
  'src',
  'public',
  join('docs', 'devlog'),
  join('.github', 'ISSUE_TEMPLATE'),
  join('.github', 'pull_request_template.md'),
];
const EXEMPT_FILES = [
  join('src', 'disclaimer.json'),
  join('src', 'components', 'Disclaimer.tsx'),
];
const EXTS = new Set(['.md', '.html', '.ts', '.tsx', '.css', '.mjs', '.json', '.svg', '.txt']);

function* walk(p) {
  const st = statSync(p);
  if (st.isDirectory()) {
    for (const name of readdirSync(p)) yield* walk(join(p, name));
  } else {
    const ext = p.slice(p.lastIndexOf('.'));
    if (EXTS.has(ext)) yield p;
  }
}

const violations = [];

for (const entry of SCAN) {
  const full = join(ROOT, entry);
  let files = [];
  try {
    files = [...walk(full)];
  } catch {
    continue; // 目标不存在则跳过
  }
  for (const file of files) {
    const rel = relative(ROOT, file);
    if (EXEMPT_FILES.some((e) => rel === e)) continue;

    const text = readFileSync(file, 'utf8');
    const lines = text.split('\n');
    let inDisclaimer = false;

    lines.forEach((line, idx) => {
      if (line.includes('disclaimer:start')) inDisclaimer = true;
      if (line.includes('disclaimer:end')) {
        inDisclaimer = false;
        return;
      }
      if (inDisclaimer || line.includes('banned-ok')) return;

      for (const word of BANNED) {
        if (line.includes(word)) {
          violations.push(`${rel.split(sep).join('/')}:${idx + 1}  「${word}」  ${line.trim().slice(0, 60)}`);
        }
      }
    });
  }
}

if (violations.length > 0) {
  console.error('✘ 对外文案禁语检查未通过（依据 docs/research/04 措辞清单）：\n');
  for (const v of violations) console.error('  ' + v);
  console.error(`\n共 ${violations.length} 处。请改用安全措辞（辅助训练/能力练习/亲子互动等），`);
  console.error('或确认属于免责声明/元规则语境后加豁免标记。');
  process.exit(1);
} else {
  console.log('✓ 对外文案禁语检查通过');
}
