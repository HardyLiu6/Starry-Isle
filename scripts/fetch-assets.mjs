/**
 * 按溯源清单从钉住的上游 commit 重取素材（ADR-0007 决定 3、6）。需要联网，不进 CI，每期收口时手动运行。
 *
 *   node scripts/fetch-assets.mjs           核对：下载每个 fetched 条目，比对上游哈希与本地文件，不写盘
 *   node scripts/fetch-assets.mjs --write   重取：下载并写入 public/assets/；上游哈希与清单不符即中止，不写入
 *
 * 零依赖：只用 Node 内置的 fetch 与 crypto（engines.node >= 20.19）。
 * 已记录修改的文件（sha256 ≠ upstreamSha256）无法靠下载复现，--write 会跳过它们并提示按 modifications 重做。
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const MANIFEST = 'src/asset-manifest.json';
const WRITE = process.argv.includes('--write');

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
const manifest = JSON.parse(readFileSync(join(ROOT, MANIFEST), 'utf8'));

async function download(url) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (e) {
      lastError = e;
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  throw lastError;
}

const fetched = manifest.assets.filter((a) => a.kind === 'fetched');
const problems = [];
let ok = 0;
let written = 0;

for (const a of fetched) {
  const s = manifest.sources[a.source];
  const url = s.fetch.replace('{commit}', s.commit).replace('{upstreamPath}', a.upstreamPath);
  let buf;
  try {
    buf = await download(url);
  } catch (e) {
    problems.push(`${a.path}：下载失败（${e.message}）——${url}`);
    continue;
  }
  const got = sha256(buf);
  if (got !== a.upstreamSha256) {
    problems.push(`${a.path}：上游文件哈希与清单不符（清单 ${a.upstreamSha256.slice(0, 12)}…，下载 ${got.slice(0, 12)}…）——${url}`);
    continue;
  }
  const local = join(ROOT, a.path);
  const modified = a.sha256 !== a.upstreamSha256;
  if (WRITE) {
    if (modified) {
      problems.push(`${a.path}：清单记录了修改，下载只能得到上游原件，请按 modifications 重做后再更新清单`);
      continue;
    }
    mkdirSync(dirname(local), { recursive: true });
    writeFileSync(local, buf);
    written++;
  } else if (!existsSync(local)) {
    problems.push(`${a.path}：本地文件不存在（可用 --write 重取）`);
    continue;
  } else if (!modified && sha256(readFileSync(local)) !== got) {
    problems.push(`${a.path}：本地文件与上游钉住版本不一致`);
    continue;
  }
  ok++;
}

const today = new Date().toISOString().slice(0, 10);
const pins = Object.values(manifest.sources)
  .filter((s) => s.commit)
  .map((s) => `${s.name} ${s.ref}（${s.commit.slice(0, 12)}）`)
  .join('、');

if (problems.length > 0) {
  console.error(`✘ 上游重取核对未通过（${ok}/${fetched.length} 个一致）：\n`);
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log(
  WRITE
    ? `✓ ${today} 已从钉住的上游重取并写入 ${written} 个文件，哈希与清单一致：${pins}`
    : `✓ ${today} ${ok}/${fetched.length} 个上游素材与钉住的 commit 逐字节一致：${pins}`,
);
