# AGENTS.md

星屿：面向孤独症谱系儿童家庭的公益开源辅助训练应用。纯静态前端、零数据收集、对外措辞受法规约束——这三条决定了下面所有规矩。

## 动工前先定案

关键取舍先与项目主逐题定案、写进 `docs/adr/`，再写码：技术栈、产品方向、合规姿态，以及**每个 T 级任务内部的取舍**（部署策略、许可细节、流程约定这类"工程常识级"决定同样算）。ADR 经项目主确认才转 `accepted`。按已定案方案写码、改 typo 这类纯执行细节直接做。

输出与现有 ADR 冲突时明说，不静默覆盖。

## 四条红线

动对外文案、玩法、素材或依赖之前，读 `CONTRIBUTING.md` 的红线节：

- **措辞**：对外文案过禁语清单（`npm run check:words` 强制，依据 `docs/research/04`）；免责声明的单一来源是 `src/disclaimer.json`。
- **零收集**：无统计/上报/广告 SDK、无账号、运行时除自身静态资源外零网络请求；新增运行时依赖默认拒绝。
- **设计**：每个玩法 ≥1 项泛化机制；回合有上限、有结束预告与收尾仪式；不做签到/连击/排行榜；美术年龄中性。
- **素材溯源**：`public/assets/` 下每个文件都登记在溯源清单 `src/asset-manifest.json`（来源与钉住的 commit、许可、哈希、修改记录），`npm run check:assets` 强制。改素材先改清单；CREDITS.md 与应用内署名一律由 `npm run assets:credits` 从清单生成。项目自绘的界面图形（星灵、海岛、图标）是前端代码，以内联 SVG 写在组件里、按 MIT；第三方图形一律按素材登记。AI 生成素材的准入规则见 ADR-0008。

## 完成判据

`npm run check` 全绿（禁语 + 免责声明同文 + 素材溯源 + 类型 + 逻辑不变量）；改了构建或 CI 则 `npm run build` 也要过。

**验收标准是准绳**——允许顺延，不允许降验收（`docs/planning/`）。

## 代码布局

`src/game/` 是与框架无关的纯 TS 逻辑（情绪素材映射、回合生成）：玩法规则写这里，配不变量测试。`src/screens/`、`src/components/` 是 React 视图层，保持薄。

## 领域文档

单上下文布局。术语准绳见 `CONTEXT.md` 词库——输出里提到领域概念时照用词库的词，不换同义词；决策见 `docs/adr/`，动某块之前先读相关 ADR。约定见 `docs/agents/domain.md`。

## 本机环境

- `gh` 已登录，但 PATH 不稳，用绝对路径 `"/c/Program Files/GitHub CLI/gh.exe"`。
- bash 里 `/tmp` 会解析成 `C:\tmp`，临时文件用 `$TEMP`。

## Issue 跟踪

Issues 与规格在 GitHub `HardyLiu6/Starry-Isle`，用 `gh` 操作，约定见 `docs/agents/issue-tracker.md`。分诊标签直接用五个标准名：`needs-triage`、`needs-info`、`ready-for-agent`、`ready-for-human`、`wontfix`（映射见 `docs/agents/triage-labels.md`）。
