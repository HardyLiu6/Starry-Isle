/**
 * 素材溯源校验：第四条红线（ADR-0007）。离线运行，进 `npm run check` 与 CI。
 *
 * public/assets/ 下每个文件都必须能被本脚本回答三问：来自哪里（来源 + 版本）、什么许可、有没有被改过。
 * 唯一来源是溯源清单 src/asset-manifest.json；语义表 src/game/catalog.json 按路径与它对接。
 * CREDITS.md 与应用内署名数据 src/asset-credits.json 由清单生成，本脚本核对它们没有漂移。
 *
 * 用法：
 *   node scripts/check-assets.mjs                  校验（先跑内置反例自检，再校验仓库）
 *   node scripts/check-assets.mjs --write-credits  由清单重新生成 CREDITS.md 与 src/asset-credits.json，再校验
 *
 * 联网重取核对不在这里做（结果不应受网络与上游状态影响），见 scripts/fetch-assets.mjs。
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const MANIFEST = 'src/asset-manifest.json';
const CATALOG = 'src/game/catalog.json';
const CREDITS_MD = 'CREDITS.md';
const CREDITS_JSON = 'src/asset-credits.json';
const ASSET_ROOT = 'public/assets';

/** 许可白名单（SPDX）。nc 为 true 的只能放在 public/assets/nc/<来源>/（ADR-0006 决定 10） */
const LICENSES = {
  'CC-BY-4.0': { nc: false },
  'CC-BY-SA-4.0': { nc: false },
  'CC0-1.0': { nc: false },
  MIT: { nc: false },
  'Apache-2.0': { nc: false },
  'OFL-1.1': { nc: false },
  'CC-BY-NC-4.0': { nc: true },
  'CC-BY-NC-SA-4.0': { nc: true },
};

/**
 * AI 图像生成器名单（ADR-0008 决定 13）：只看条款，不看中国大陆能否使用。
 * 只有 allowed 的生成器，其产出才能入库。新增或改状态要提 PR，并对照 ADR-0008 的准入条件引用条款原文。
 */
const GENERATORS = {
  'openai-image': { status: 'allowed', name: 'OpenAI 图像（ChatGPT / GPT Image API）', note: '写实儿童只能直接生成，不得在写实未成年人的图上做编辑' },
  'midjourney-paid': { status: 'allowed', name: 'Midjourney 付费档' },
  'stability-api': { status: 'allowed', name: 'Stability AI 托管 API' },
  'tencent-hunyuan-api': { status: 'allowed', name: '腾讯混元 API（腾讯云 / TokenHub）' },
  'baidu-qianfan': { status: 'allowed', name: '百度千帆' },
  'local-sdxl': { status: 'allowed', name: '本地 SDXL 1.0' },
  'local-qwen-image': { status: 'allowed', name: '本地 Qwen-Image / Qwen-Image-Edit 系列（Apache-2.0）' },
  'local-flux1-schnell': { status: 'allowed', name: '本地 FLUX.1 [schnell]（Apache-2.0）' },
  'local-flux2-klein-4b': { status: 'allowed', name: '本地 FLUX.2 [klein] 4B（Apache-2.0）' },
  'local-lumina2': { status: 'allowed', name: '本地 Lumina-Image 2.0（Apache-2.0）' },
  'gemini-api': { status: 'pending', reason: '条款禁止用于面向未满 18 岁人群的服务，离线出图是否落入待确认' },
  'adobe-firefly': { status: 'pending', reason: '禁止移除 Content Credentials，重编码会破坏它' },
  'recraft-paid': { status: 'pending', reason: '限制用产出训练 AI，与 CC0 的关系待确认' },
  'volcengine-seedream': { status: 'pending', reason: '豆包协议 2.4 限制用产出训练其他模型，与 CC0 的关系待确认' },
  'local-sd35': { status: 'pending', reason: '社区许可 IV.b 限制用产出训练基础模型，与 CC0 的关系待确认' },
  'aliyun-bailian': { status: 'pending', reason: '协议 7.5 对纯文生图的权利归属不清' },
  jimeng: { status: 'pending', reason: '协议 5.3(7) 限制向第三方提供的范围不明' },
  'flux-dev-family': { status: 'excluded', reason: 'FLUX.1 [dev]、Kontext [dev]、FLUX.2 [dev]、[klein] 9B：许可 4(a) 禁止产出用于商业或生产用途' },
  'wanxiang-consumer': { status: 'excluded', reason: '万相 C 端协议 3.1.6 仅限个人学习、研究、体验' },
  'kling-intl': { status: 'excluded', reason: '可灵国际版 4.6 未经书面许可不得商用' },
  'local-hunyuanimage': { status: 'excluded', reason: 'HunyuanImage 2.1 / 3.0 许可 5(c) 禁止在限定地区以外展示产出' },
  'recraft-free': { status: 'excluded', reason: '免费档产出归 Recraft 所有' },
};

const METHODS = ['manual', 'assisted', 'ai'];
const AI_SOURCE_TYPES = [
  'http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia',
  'http://cv.iptc.org/newscodes/digitalsourcetype/compositeWithTrainedAlgorithmicMedia',
  'http://cv.iptc.org/newscodes/digitalsourcetype/compositeSynthetic',
];
const EMOTIONS = ['happy', 'sad', 'angry', 'scared'];
const INTENSITIES = ['high', 'mid', 'low'];
const STATUSES = ['validated', 'pending', 'failed'];
const MIN_RATERS = 20; // ADR-0008 决定 8

const RECORD_KEYS = {
  common: ['path', 'kind', 'source', 'sha256', 'title', 'note'],
  fetched: ['upstreamPath', 'upstreamSha256', 'modifications'],
  authored: ['method', 'author', 'createdAt', 'generation', 'original', 'postProcessing', 'humanEdits', 'review'],
};
const SOURCE_KEYS = [
  'name', 'homepage', 'license', 'licenseEvidence', 'attribution', 'attributionEvidence',
  'copyright', 'copyrightEvidence', 'dirs', 'repo', 'ref', 'commit', 'fetch',
];

const HEX64 = /^[0-9a-f]{64}$/;
const HEX40 = /^[0-9a-f]{40}$/;
const DATE = /^\d{4}-\d{2}-\d{2}/;

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
const isObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const nonEmpty = (x) => typeof x === 'string' && x.trim() !== '';

// ───────────────────────── 署名生成（CREDITS.md 与应用内署名数据的唯一生成器） ─────────────────────────

function summarize(manifest) {
  const bySource = new Map();
  for (const a of manifest.assets ?? []) {
    if (!bySource.has(a.source)) bySource.set(a.source, []);
    bySource.get(a.source).push(a);
  }
  const used = [];
  for (const [id, src] of Object.entries(manifest.sources ?? {})) {
    const assets = bySource.get(id);
    if (!assets) continue;
    const dirs = new Map();
    for (const a of assets) {
      const dir = a.path.slice(0, a.path.lastIndexOf('/') + 1);
      dirs.set(dir, (dirs.get(dir) ?? 0) + 1);
    }
    used.push({
      id,
      src,
      assets,
      dirs: [...dirs.entries()].sort(([a], [b]) => a.localeCompare(b)),
      license: manifest.licenses?.[src.license] ?? { title: src.license, url: '' },
      nc: LICENSES[src.license]?.nc === true,
      ai: assets.some((a) => a.method === 'ai'),
      fetched: assets.some((a) => a.kind === 'fetched'),
      modified: assets.some((a) => (a.modifications ?? []).length > 0),
      titles: assets.map((a) => a.title).filter(Boolean).sort(),
    });
  }
  return used;
}

export function generateCredits(manifest) {
  const used = summarize(manifest);
  const hasNc = used.some((u) => u.nc);
  const hasAi = used.some((u) => u.ai);

  const md = [
    '<!-- 本文件由 scripts/check-assets.mjs 依据 src/asset-manifest.json 生成，请勿手改。改素材后运行：npm run assets:credits -->',
    '# 素材署名 / Asset Credits',
    '',
    '星屿的代码与素材分开授权：代码按 MIT（见 `LICENSE`），素材按下列各来源的原始许可。每个素材文件的来源、版本、许可、哈希与修改记录登记在溯源清单 `src/asset-manifest.json`，由 `npm run check` 机器校验（ADR-0007）。应用内"给家长"页的"素材署名"一节与本文件出自同一份清单。',
    '',
    '星灵、海岛、星星进度等界面图形由星屿项目自己绘制，是前端代码的一部分，随代码按 MIT 授权，不在本文件列出（ADR-0007 决定 7）。',
    '',
    hasNc
      ? '**当前状态：本仓库含 NC（非商业）素材**，集中在 `public/assets/nc/`，含这些素材的整体分发不得用于商业用途（ADR-0006 决定 10）。'
      : '**当前状态：本仓库不含任何 NC（非商业）素材**，全部素材均可商业再分发。',
    '',
    hasAi
      ? '带"AI 生成"角标的图片由 AI 离线生成，人物均为虚构，按 CC0 1.0 发布；生成器、模型与生成记录见溯源清单（ADR-0008）。'
      : '本仓库目前不含 AI 生成的素材。',
  ];
  for (const u of used) {
    const lic = u.license.url ? `[${u.license.title}](${u.license.url})` : u.license.title;
    md.push('', `## ${u.src.name}`, '');
    md.push(`- 文件：${u.dirs.map(([d, n]) => `\`${d}\`（${n} 个）`).join('、')}`);
    if (u.src.ref) md.push(`- 版本：\`${u.src.ref}\`（commit \`${u.src.commit}\`，仓库 ${u.src.repo}）`);
    if (u.titles.length) md.push(`- 内容：${u.titles.join('、')}`);
    md.push(`- 署名：${u.src.attribution}`);
    if (u.src.copyright) md.push(`- 版权：${u.src.copyright}`);
    md.push(`- 许可：${lic}`);
    const evidence = [u.src.licenseEvidence, u.src.attributionEvidence, u.src.copyrightEvidence].filter(Boolean);
    if (evidence.length) md.push(`- 许可与署名要求出处：${[...new Set(evidence)].join(' ；')}`);
    if (u.fetched) {
      md.push(
        u.modified
          ? '- 修改：部分文件有修改，逐项记录见溯源清单的 modifications。'
          : '- 修改：未作修改，全部文件与上游钉住版本逐字节一致。',
      );
    }
  }
  md.push('');

  const json = {
    note: '由 scripts/check-assets.mjs 依据 src/asset-manifest.json 生成，请勿手改；供应用内"素材署名"一节使用。',
    hasNc,
    hasAi,
    sources: used.map((u) => ({
      id: u.id,
      name: u.src.name,
      attribution: u.src.attribution,
      ...(u.src.copyright ? { copyright: u.src.copyright } : {}),
      license: { id: u.src.license, title: u.license.title, url: u.license.url },
      count: u.assets.length,
      ...(u.src.ref ? { version: u.src.ref } : {}),
      ...(u.titles.length ? { titles: u.titles } : {}),
      ...(u.fetched ? { modified: u.modified } : {}),
      ai: u.ai,
    })),
  };

  return { md: md.join('\n'), json: JSON.stringify(json, null, 2) + '\n' };
}

// ───────────────────────── 不变量 ─────────────────────────

export function runChecks({ manifest, catalog, files, srcRefs, credits }) {
  const problems = [];
  const P = (m) => problems.push(m);

  if (manifest?.manifestVersion !== 1) P(`${MANIFEST}：manifestVersion 必须为 1`);
  const sources = isObj(manifest?.sources) ? manifest.sources : {};
  const licenses = isObj(manifest?.licenses) ? manifest.licenses : {};
  const assets = Array.isArray(manifest?.assets) ? manifest.assets : [];

  // 来源表：许可白名单、NC 隔离、目录不重叠、拉取来源不可变
  const dirOwner = new Map();
  for (const [id, s] of Object.entries(sources)) {
    for (const k of Object.keys(s)) if (!SOURCE_KEYS.includes(k)) P(`来源 ${id}：未知字段 ${k}`);
    if (!nonEmpty(s.name) || !nonEmpty(s.attribution)) P(`来源 ${id}：缺 name 或 attribution`);
    if (!LICENSES[s.license]) P(`来源 ${id}：许可 ${s.license} 不在白名单里`);
    else if (!nonEmpty(licenses[s.license]?.title) || !/^https:\/\//.test(licenses[s.license]?.url ?? '')) {
      P(`来源 ${id}：许可 ${s.license} 在清单 licenses 里缺 title 或 url`);
    }
    const nc = LICENSES[s.license]?.nc === true;
    if (!Array.isArray(s.dirs) || s.dirs.length === 0) P(`来源 ${id}：缺 dirs（它的文件放在哪些目录）`);
    for (const d of s.dirs ?? []) {
      if (nc !== d.startsWith('nc/')) {
        P(`来源 ${id}：目录 ${d} 违反 NC 隔离——NC 素材只能且必须放在 public/assets/nc/<来源>/（ADR-0006 决定 10）`);
      }
      for (const [other, owner] of dirOwner) {
        if (d === other || d.startsWith(other + '/') || other.startsWith(d + '/')) {
          P(`来源 ${id} 与 ${owner} 的目录重叠：${d} / ${other}`);
        }
      }
      dirOwner.set(d, id);
    }
    if (s.fetch !== undefined) {
      if (!HEX40.test(s.commit ?? '')) P(`来源 ${id}：commit 必须是 40 位 SHA（tag 可以被改指，ADR-0007 决定 3）`);
      if (!nonEmpty(s.repo) || !nonEmpty(s.ref)) P(`来源 ${id}：缺 repo 或 ref`);
      if (!/\{commit\}/.test(s.fetch) || !/\{upstreamPath\}/.test(s.fetch) || /\{ref\}/.test(s.fetch)) {
        P(`来源 ${id}：fetch 模板必须用 {commit} 与 {upstreamPath}，不得用 {ref}`);
      }
    }
  }

  // 逐文件记录
  const byPath = new Map();
  for (const a of assets) {
    const where = `清单条目 ${a.path ?? '（无 path）'}`;
    if (!nonEmpty(a.path) || !a.path.startsWith(`${ASSET_ROOT}/`)) {
      P(`${where}：path 必须以 ${ASSET_ROOT}/ 开头`);
      continue;
    }
    if (byPath.has(a.path)) P(`${where}：重复登记`);
    byPath.set(a.path, a);

    const allowed = [...RECORD_KEYS.common, ...(RECORD_KEYS[a.kind] ?? [])];
    for (const k of Object.keys(a)) if (!allowed.includes(k)) P(`${where}：未知字段 ${k}`);

    const s = sources[a.source];
    if (!s) {
      P(`${where}：来源 ${a.source} 未在来源表登记`);
      continue;
    }
    const rel = a.path.slice(ASSET_ROOT.length + 1);
    if (!(s.dirs ?? []).some((d) => rel.startsWith(d + '/'))) {
      P(`${where}：不在来源 ${a.source} 登记的目录（${(s.dirs ?? []).join('、')}）下`);
    }
    if (!HEX64.test(a.sha256 ?? '')) P(`${where}：sha256 缺失或格式不对`);

    const file = files.get(a.path);
    if (!file) P(`${where}：文件不存在（清单与仓库脱节）`);
    else if (HEX64.test(a.sha256 ?? '') && sha256(file) !== a.sha256) {
      P(`${where}：哈希不符——文件被改过、被换行符规则改写，或拉取时拿到了别的版本`);
    }

    if (a.kind === 'fetched') {
      if (s.fetch === undefined) P(`${where}：kind 为 fetched，但来源 ${a.source} 没有 fetch 模板，无法重取`);
      if (!nonEmpty(a.upstreamPath)) P(`${where}：缺 upstreamPath`);
      if (!HEX64.test(a.upstreamSha256 ?? '')) P(`${where}：缺 upstreamSha256`);
      if (!Array.isArray(a.modifications)) P(`${where}：缺 modifications（未修改写空数组）`);
      else {
        const modified = a.sha256 !== a.upstreamSha256;
        if (modified !== a.modifications.length > 0) {
          P(
            `${where}：修改标记与事实不符——交付哈希${modified ? '≠' : '='}上游哈希，` +
              `modifications 却${a.modifications.length > 0 ? '非空' : '为空'}（CC 4.0 §3(a)(1)(B) 要求标明修改）`,
          );
        }
        for (const m of a.modifications) {
          if (!DATE.test(m?.date ?? '') || !nonEmpty(m?.tool) || !nonEmpty(m?.description)) {
            P(`${where}：每条 modification 需有 date、tool、description`);
          }
        }
      }
    } else if (a.kind === 'authored') {
      if (s.fetch !== undefined) P(`${where}：kind 为 authored，不应挂在拉取来源 ${a.source} 下`);
      if (!METHODS.includes(a.method)) P(`${where}：method 必须是 ${METHODS.join(' / ')}`);
      if (!nonEmpty(a.author) || !DATE.test(a.createdAt ?? '')) P(`${where}：缺 author 或 createdAt`);
      if (a.method === 'ai') checkAi(a, s, where, P);
      else if (a.method && s.license !== 'CC-BY-SA-4.0') {
        P(`${where}：非 AI 生成的自制素材按 CC BY-SA 4.0 发布（ADR-0006 决定 9），来源 ${a.source} 的许可是 ${s.license}`);
      }
    } else {
      P(`${where}：kind 必须是 fetched 或 authored`);
    }
  }

  // 目录全覆盖：每个文件恰有一条记录
  for (const path of files.keys()) {
    if (!byPath.has(path)) P(`${path}：未在溯源清单 ${MANIFEST} 登记——答不出来源、许可与是否修改`);
  }

  // SVG 不得含脚本或外部引用（零收集红线：素材不能成为运行时网络请求或脚本的入口）
  for (const [path, buf] of files) {
    if (!path.endsWith('.svg')) continue;
    const text = buf.toString('utf8');
    if (/<script\b/i.test(text)) P(`${path}：SVG 含 <script> 脚本`);
    if (/<foreignObject\b/i.test(text)) P(`${path}：SVG 含 <foreignObject>`);
    if (/\son[a-z]+\s*=/i.test(text)) P(`${path}：SVG 含事件属性（on*=）`);
    if (/(?:xlink:)?href\s*=\s*["']\s*(?:https?:)?\/\//i.test(text) || /url\(\s*["']?\s*(?:https?:)?\/\//i.test(text)) {
      P(`${path}：SVG 引用了外部资源`);
    }
  }

  // 语义表 ↔ 溯源清单
  const cards = Array.isArray(catalog?.cards) ? catalog.cards : [];
  const scenes = Array.isArray(catalog?.scenes) ? catalog.scenes : [];
  const seen = new Set();
  for (const c of cards) {
    const where = `语义表卡片 ${c.path}`;
    if (seen.has(c.path)) P(`${where}：重复`);
    seen.add(c.path);
    const rec = byPath.get(`public/${c.path}`);
    if (!rec) P(`${where}：未在溯源清单登记`);
    if (!EMOTIONS.includes(c.emotion) || !INTENSITIES.includes(c.intensity)) P(`${where}：情绪或强度不合法`);
    if (!nonEmpty(c.cues)) P(`${where}：缺面部线索 cues`);
    const v = c.validation ?? {};
    if (!STATUSES.includes(v.status)) P(`${where}：验证状态必须是 ${STATUSES.join(' / ')}`);
    if (rec?.kind === 'authored' && v.status !== 'validated') {
      P(`${where}：自制或 AI 素材未经效度验证不得进语义表（ADR-0008 决定 8），当前状态 ${v.status}`);
    }
    if (v.status === 'validated') {
      if (!(Number.isInteger(v.raters) && v.raters >= MIN_RATERS)) P(`${where}：验证需至少 ${MIN_RATERS} 名评分者`);
      if (!(typeof v.hitRate === 'number' && v.hitRate >= 0 && v.hitRate <= 1)) P(`${where}：验证缺 hitRate（0–1）`);
      if (!DATE.test(v.date ?? '')) P(`${where}：验证缺 date`);
    }
  }
  for (const s of scenes) {
    const where = `语义表情境图 ${s.path}`;
    if (!byPath.has(`public/${s.path}`)) P(`${where}：未在溯源清单登记`);
    if (!EMOTIONS.includes(s.common)) P(`${where}：常见感受不合法`);
    if (!nonEmpty(s.alt) || !nonEmpty(s.text)) P(`${where}：缺 alt 或 text`);
  }

  // 代码里直接写死的素材路径也必须登记
  for (const { file, ref } of srcRefs) {
    if (!byPath.has(`public/${ref}`)) P(`${file}：引用了未登记的素材 ${ref}`);
  }

  // 署名由清单生成，不得漂移
  const want = generateCredits({ ...manifest, sources, licenses, assets });
  const norm = (t) => (t ?? '').replace(/\r\n/g, '\n');
  if (norm(credits.md) !== want.md) {
    P(`${CREDITS_MD} 与溯源清单不一致——请运行 npm run assets:credits 重新生成，不要手改`);
  }
  if (norm(credits.json) !== want.json) {
    P(`${CREDITS_JSON} 与溯源清单不一致——请运行 npm run assets:credits 重新生成，不要手改`);
  }

  return problems;
}

function checkAi(a, s, where, P) {
  if (s.license !== 'CC0-1.0') {
    P(`${where}：AI 生成素材按 CC0 1.0 发布（ADR-0008 决定 9），来源 ${a.source} 的许可是 ${s.license}`);
  }
  const g = a.generation ?? {};
  const gen = GENERATORS[g.generator];
  if (!gen) P(`${where}：生成器 ${g.generator} 不在名单里（ADR-0008 决定 13）`);
  else if (gen.status !== 'allowed') P(`${where}：生成器 ${g.generator} 状态为 ${gen.status}，产出不得入库：${gen.reason}`);
  for (const k of ['model', 'termsUrl', 'prompt', 'promptAuthor']) if (!nonEmpty(g[k])) P(`${where}：生成记录缺 ${k}`);
  if (!DATE.test(g.termsCheckedAt ?? '') || !DATE.test(g.generatedAt ?? '')) {
    P(`${where}：生成记录缺 termsCheckedAt 或 generatedAt`);
  }
  if (!AI_SOURCE_TYPES.includes(g.digitalSourceType)) P(`${where}：digitalSourceType 须为 IPTC 的 AI 类取值`);
  const o = a.original ?? {};
  if (!HEX64.test(o.sha256 ?? '') || !nonEmpty(o.format) || !nonEmpty(o.release)) {
    P(`${where}：缺生成器原件记录（original.sha256 / format / release，ADR-0008 决定 11）`);
  }
  if (!Array.isArray(a.postProcessing)) P(`${where}：缺 postProcessing（没有后处理写空数组）`);
  const r = a.review ?? {};
  if (!nonEmpty(r.by) || !DATE.test(r.at ?? '') || r.fictional !== true || r.noRealPhotoInput !== true) {
    P(`${where}：缺审核声明（review.by / at，fictional 与 noRealPhotoInput 须为 true，ADR-0008 决定 12）`);
  }
}

// ───────────────────────── 读取仓库 ─────────────────────────

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else yield p;
  }
}
const toRel = (p) => relative(ROOT, p).split(sep).join('/');
const readOpt = (rel) => (existsSync(join(ROOT, rel)) ? readFileSync(join(ROOT, rel), 'utf8') : null);

function gather() {
  const files = new Map();
  if (existsSync(join(ROOT, ASSET_ROOT))) {
    for (const p of walk(join(ROOT, ASSET_ROOT))) files.set(toRel(p), readFileSync(p));
  }
  const srcRefs = [];
  const LITERAL = /(["'`])(assets\/[^"'`\s]+?\.(?:svg|webp|png|jpe?g))\1/g;
  for (const p of walk(join(ROOT, 'src'))) {
    if (!/\.(ts|tsx)$/.test(p) || /\.test\.ts$/.test(p)) continue;
    const text = readFileSync(p, 'utf8');
    for (const m of text.matchAll(LITERAL)) {
      if (!m[2].includes('${')) srcRefs.push({ file: toRel(p), ref: m[2] });
    }
  }
  return {
    manifest: JSON.parse(readFileSync(join(ROOT, MANIFEST), 'utf8')),
    catalog: JSON.parse(readFileSync(join(ROOT, CATALOG), 'utf8')),
    files,
    srcRefs,
    credits: { md: readOpt(CREDITS_MD), json: readOpt(CREDITS_JSON) },
  };
}

// ───────────────────────── 自检：每条不变量都要真的会报错 ─────────────────────────

function selfTest(base) {
  const failures = [];
  if (runChecks(base).length > 0) return failures; // 仓库本身不过时由正式校验报告，这里不重复

  const clone = () => ({
    manifest: structuredClone(base.manifest),
    catalog: structuredClone(base.catalog),
    files: new Map(base.files),
    srcRefs: [...base.srcRefs],
    credits: { ...base.credits },
  });
  const firstFetched = (x) => x.manifest.assets.find((a) => a.kind === 'fetched');
  const recredit = (x) => {
    const g = generateCredits(x.manifest);
    x.credits = { md: g.md, json: g.json };
  };
  const aiRecord = (path, buf, generator) => ({
    path,
    kind: 'authored',
    source: 'starry-isle-ai',
    method: 'ai',
    sha256: sha256(buf),
    author: '测试',
    createdAt: '2026-09-27',
    generation: {
      generator,
      model: 'm',
      termsUrl: 'https://example.org/terms',
      prompt: 'p',
      promptAuthor: 'a',
      termsCheckedAt: '2026-09-27',
      generatedAt: '2026-09-27',
      digitalSourceType: AI_SOURCE_TYPES[0],
    },
    original: { sha256: '1'.repeat(64), format: 'png', release: 'assets-src-test/sample.png' },
    postProcessing: [],
    review: { by: '测试', at: '2026-09-27', fictional: true, noRealPhotoInput: true },
  });

  const cases = [
    ['未登记的文件', '未在溯源清单', (x) => x.files.set(`${ASSET_ROOT}/emotions/openmoji/FFFF.svg`, Buffer.from('<svg/>'))],
    ['悬空记录', '文件不存在', (x) => x.files.delete(firstFetched(x).path)],
    ['哈希不符', '哈希不符', (x) => x.files.set(firstFetched(x).path, Buffer.from('<svg>changed</svg>'))],
    ['来源用 tag 而非 commit', '40 位 SHA', (x) => {
      x.manifest.sources[firstFetched(x).source].commit = 'main';
    }],
    ['许可不在白名单', '不在白名单', (x) => {
      x.manifest.sources[firstFetched(x).source].license = 'CC-BY-ND-4.0';
      recredit(x);
    }],
    ['NC 素材未隔离', 'NC 隔离', (x) => {
      x.manifest.licenses['CC-BY-NC-SA-4.0'] = {
        title: 'CC BY-NC-SA 4.0',
        url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
      };
      x.manifest.sources[firstFetched(x).source].license = 'CC-BY-NC-SA-4.0';
      recredit(x);
    }],
    ['文件不在来源目录', '登记的目录', (x) => {
      const a = firstFetched(x);
      const moved = a.path.replace(/emotions\/[^/]+\//, 'emotions/elsewhere/');
      x.files.set(moved, x.files.get(a.path));
      x.files.delete(a.path);
      a.path = moved;
      recredit(x);
    }],
    ['改了字节却没记修改', '修改标记与事实不符', (x) => {
      firstFetched(x).upstreamSha256 = '0'.repeat(64);
    }],
    ['语义表引用未登记文件', '未在溯源清单登记', (x) => {
      x.catalog.cards[0].path = 'assets/emotions/openmoji/0000.svg';
    }],
    ['代码引用未登记文件', '未登记的素材', (x) => {
      x.srcRefs.push({ file: 'src/x.tsx', ref: 'assets/nowhere.svg' });
    }],
    ['署名漂移', 'CREDITS.md', (x) => {
      x.credits.md = (x.credits.md ?? '') + '\n手改的一行\n';
    }],
    ['SVG 含脚本', '<script>', (x) => {
      const a = firstFetched(x);
      const buf = Buffer.from('<svg><script>fetch("//x")</script></svg>');
      x.files.set(a.path, buf);
      a.sha256 = sha256(buf);
      a.upstreamSha256 = a.sha256;
    }],
    ['未准入的生成器', '不得入库', (x) => {
      const buf = Buffer.from('<svg/>');
      const path = `${ASSET_ROOT}/ai/sample.svg`;
      x.files.set(path, buf);
      x.manifest.assets.push(aiRecord(path, buf, 'flux-dev-family'));
      recredit(x);
    }],
    ['自制素材未验证就进语义表', '未经效度验证', (x) => {
      const buf = Buffer.from('<svg/>');
      const path = `${ASSET_ROOT}/original/sample.svg`;
      x.files.set(path, buf);
      x.manifest.assets.push({
        path,
        kind: 'authored',
        source: 'starry-isle',
        method: 'manual',
        sha256: sha256(buf),
        author: '测试',
        createdAt: '2026-09-28',
      });
      recredit(x);
      x.catalog.cards.push({
        path: path.slice('public/'.length),
        emotion: 'happy',
        intensity: 'high',
        cues: '测试',
        validation: { status: 'pending' },
      });
    }],
  ];

  // 反向对照：一条合规的 AI 记录不应报错
  {
    const x = clone();
    const buf = Buffer.from('<svg/>');
    const path = `${ASSET_ROOT}/ai/ok.svg`;
    x.files.set(path, buf);
    x.manifest.assets.push(aiRecord(path, buf, 'local-flux2-klein-4b'));
    recredit(x);
    const got = runChecks(x);
    if (got.length > 0) failures.push(`自检"合规的 AI 记录"不应报错，实际：${got.join(' | ')}`);
  }

  for (const [name, expect, mutate] of cases) {
    const x = clone();
    mutate(x);
    const got = runChecks(x);
    if (!got.some((p) => p.includes(expect))) {
      failures.push(`自检"${name}"没有报错（期望含"${expect}"），实际：${got.join(' | ') || '无'}`);
    }
  }
  return failures;
}

// ───────────────────────── 入口 ─────────────────────────

const args = process.argv.slice(2);
let input = gather();

if (args.includes('--write-credits')) {
  const { md, json } = generateCredits(input.manifest);
  writeFileSync(join(ROOT, CREDITS_MD), md);
  writeFileSync(join(ROOT, CREDITS_JSON), json);
  console.log(`已由 ${MANIFEST} 重新生成 ${CREDITS_MD} 与 ${CREDITS_JSON}`);
  input = gather();
}

const selfFailures = selfTest(input);
if (selfFailures.length > 0) {
  console.error('✘ 素材校验脚本自检失败（某条不变量不会报错，校验形同虚设）：\n');
  for (const f of selfFailures) console.error('  ' + f);
  process.exit(1);
}

const problems = runChecks(input);
if (problems.length > 0) {
  console.error(`✘ 素材溯源校验未通过（第四条红线，ADR-0007；唯一来源：${MANIFEST}）：\n`);
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log(`✓ 素材溯源校验通过（${input.manifest.assets.length} 个文件：来源、许可、哈希、修改记录与署名一致；自检 15 例全部生效）`);
