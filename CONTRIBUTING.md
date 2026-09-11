# 参与星屿

感谢你的兴趣。星屿是单人发起的公益项目，非常欢迎接续与共建——本文把"不能妥协的规矩"和"上手路径"讲清楚。

## 三条不能妥协的红线

1. **措辞红线**：所有对外可见文案（README、应用内 UI、页面 title/meta、发布物描述）必须通过 `npm run check:words`。这不是文风偏好——依据是内部合规调研（`docs/research/04`），涉及真实的法规边界。安全措辞示例：辅助训练、能力练习、亲子互动；对产品的定性表述以 README 首段与免责声明为准。词语规范详见项目词库 [CONTEXT.md](CONTEXT.md)（例如正式文案统一用"孤独症"）。

   **仓库外对外文案清单**（脚本扫不到，改动前必须对照禁语清单人工过一遍——它们往往是传播链路上最先被看到的字）：GitHub 仓库 About 描述与 topics、社交预览图、Release 说明与 tag 描述、GitHub Pages 站点标题、未来的应用商店文案与宣传物料、对外发布的 devlog 摘要（`docs/devlog/` 内的正文已纳入脚本扫描）。
2. **零收集红线**：不引入任何统计/上报/广告 SDK、不加第三方远程脚本、不加账号体系；构建产物在运行时除自身静态资源外必须零网络请求。任何新增**运行时依赖**默认拒绝，确需引入须在 PR 中回答"准入三问"：需求真实存在吗？平台原生能力不够吗？候选库是否框架无关、自身零依赖、长期稳定？（预先认可的白名单候选：GSAP——待时间线编排需求出现时引入。）
3. **设计红线**：每个玩法 ≥1 项泛化机制（家长共玩/线下迁移/真人素材）；回合有上限、有结束预告与收尾仪式；不做签到、连击、排行榜、开箱式奖励；美术年龄中性。完整六条设计原则见 [docs/planning/总体规划与分期计划.md](docs/planning/总体规划与分期计划.md)。

## 上手

```bash
npm ci
npm run dev     # 本地开发
npm run check   # 措辞 + 类型 + 逻辑不变量（提交前必须绿）
npm run build   # 纯静态产物
```

- **架构**：`src/game/` 是与框架无关的纯 TS 逻辑层（情绪素材映射、回合生成），配有不变量测试（`npm test`）；`src/screens/`、`src/components/` 是 React 视图层。技术选型的全部权衡见 [ADR-0005](docs/adr/0005-技术选型React纯静态DOM不用游戏引擎.md)。<!-- banned-ok：技术文档文件名引用 -->
- **样式**：Tailwind v4。设计 token 在 `src/styles.css` 的 `@theme`（改主题=改 token）；高复用组件类在 `@layer components`；一次性布局用 utility 写在 JSX。
- **素材**：新素材进仓库前过 `docs/assets/素材授权核查清单.md` 末尾的"准入四问"，并同步登记 [CREDITS.md](CREDITS.md)。真人照片一律不入库。NC（非商业）素材可用但必须放进隔离目录 `public/assets/nc/<来源>/`；同类需求优先选无 NC 的来源。
- **免责声明**：唯一来源是 `src/disclaimer.json`，只改这一处——应用内组件直接渲染它，README 声明块由 `npm run check:disclaimer` 校验同文。
- **决策**：改变产品方向/技术栈的讨论走 ADR（`docs/adr/`），沿用现有格式。仓库工程化与开源治理的既有定案见 [ADR-0006](docs/adr/0006-仓库工程化与开源治理策略.md)（部署、供应链、许可、社区文件、issue 体系）。
- **行为准则**：参与讨论请遵守 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)；安全问题请走 [SECURITY.md](SECURITY.md) 的私密上报，不要发公开 issue。

## PR 检查单

- [ ] `npm run check` 全绿（措辞/免责声明同文/类型/测试）
- [ ] 无新增运行时依赖，或已过"准入三问"论证
- [ ] 涉及素材：过"准入四问"，CREDITS.md 已更新，NC 素材已隔离目录
- [ ] 涉及玩法：对照六条设计原则逐条自查
- [ ] 涉及免责声明：只改了 `src/disclaimer.json`，并把 README 声明块同步到与之一致
- [ ] 涉及仓库外对外文案（About/topics/Release 说明等）：已对照禁语清单人工核对
