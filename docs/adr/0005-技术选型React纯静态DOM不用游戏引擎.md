# 技术选型：React 纯静态 DOM 应用，不用游戏引擎

硬约束（总体规划 T1 + ADR-0004）：纯静态前端、无服务器依赖、可离线（PWA 方向）、开源技术栈、目标设备为家用平板/手机浏览器、零数据收集。选型经触摸交互 spike（`spikes/touch-interaction/`）实证 + 2026-09-10 grill 会话逐项确认。

## 决定（8 项）

1. **渲染形态：DOM + CSS，不用游戏引擎。** spike 证实卡片点选/光晕/星星动画在纯 DOM 下响应 <20ms、动画走合成层满帧。DOM 免费提供三样硬需求：原生可访问性（焦点/读屏/系统字号）、`prefers-reduced-motion` 感官友好降级（研 01 §2.5）、系统字体中文排版（零打包零请求）。全部已规划玩法（P1-P3、岛屿地图、家长视图、摄像头镜像、任务卡导出、社交故事、主题包）逐项核对均为 DOM 主场；DOM 真正吃力的形态（粒子密集、全屏逐帧、大世界）与设计原则 5"克制奖励"及 ADR-0001 排除感统的边界天然错开。同领域先例同侧：EmotiPlay 是网页应用，Cboard/AsTeRICS Grid 均为 DOM 应用（研 02）。
2. **框架：React（react + react-dom）。** 项目主定案：最大生态与最普及技能池优先，接受 +~40KB gzip 的包体代价。星屿所需的动画/音频类轮子（GSAP、howler 等）本就框架无关，不受框架选择影响。
3. **语言：TypeScript strict**，`tsc --noEmit` 进 CI。类型即文档，服务"可被接手"目标。
4. **样式：Tailwind CSS v4 单独使用**（`@tailwindcss/vite`，纯 devDependency）。设计 token 走 `@theme`（即 CSS 变量），天然承接 ADR-0003"主题包可替换"预留口；高复用组件样式放 `@layer components`，一次性布局用 utility；keyframes 与 reduced-motion 全局覆盖保留原生 CSS。
5. **兼容基线：ES2019 / 近三年 iOS Safari 与 Android Chrome/WebView**，不引 polyfill。**复议钩子：机构访谈 C9 的家庭设备数据回来后重新评估**；若需下探为老旧平板服务，降级 build target 是配置级改动。
6. **测试：vitest 只锁 `src/game/` 纯逻辑不变量**（选项互不同情绪、目标必在场、共玩两次目标不同、10 回合结构恒定——这些坏了是"静默教错"）；UI 层人工验收。
7. **离线缓存（Service Worker/PWA）后移开发二期**，与 T12 分发定案一起设计缓存更新策略；一期验收"打开即玩 + 运行时零请求"已不依赖它。
8. **供应链策略**：`package-lock.json` 入库，CI 一律 `npm ci`；运行时依赖默认拒绝新增，新增须在 PR 论证并复跑"运行时零网络请求"自查（规则进 CONTRIBUTING）；不开自动依赖升级，每期收口人工 `npm audit` + 集中升级；不 vendor 化依赖源码。GSAP 预录"白名单候选"——二期若出现时间线编排需求直接引入，不再逐案争论。

## Considered Options

- **Godot HTML5 / Phaser / PixiJS / 原生 Canvas**（规划 T1 原候选集，全 canvas 系）：包体、可访问性、中文排版、贡献门槛全面劣于 DOM，且为星屿不存在的玩法形态（精灵动画密集）付成本，拒绝。逃生通道保留：远期个别玩法确需引擎时，在该玩法组件内局部嵌入，不推翻全局。
- **Preact**：调研推荐项（3KB、React API 兼容、与 OpenAAC 生态同栈），grill 会话中项目主权衡后**选择 React 本尊**——生态与技能池最大化优先于包体优化。记录在案：若未来包体成为低端设备实测瓶颈，Preact（经 `preact/compat`）是保真降级路径。
- **Vue 3 / Svelte / 零框架 vanilla**：Vue 中文社区强但与 TSX 严格类型及 OpenAAC 生态错位；Svelte 贡献者池小且有大版本迁移税；零框架的状态-视图手工同步是长期 bug 面。均拒绝。
- **Tailwind + SCSS**（grill 中的初始意向）：Tailwind v4 官方不支持与 Sass 组合，v4 已内置嵌套与变量，SCSS 冗余——修正为 Tailwind v4 单独使用。
- **一期即做 PWA**：SW 缓存更新策略是真实的坑，挤占一期收口，拒绝（规划原文允许后移）。
- **vendor 化依赖**：极端供应链防御的收益小于偏离 npm 常规流程的贡献者成本，拒绝。

## Consequences

- 运行时依赖为 react + react-dom 两包；升级面小，逐期 `npm audit` 可覆盖；无第三方 SDK 夹带渠道，支撑"DevTools 复核零请求"验收。
- 玩法逻辑（回合状态机、题目生成、情绪素材映射）保持与框架无关的纯 TS 模块（`src/game/`），视图层薄——框架若需更换（含 Preact 降级路径），逻辑层零改动。
- 包体基线实测 78KB gzip（React 19 + 应用码 + Tailwind 产物，一期收口时数据），仍满足"陌生设备打开即玩"；若 C9 设备数据揭示极低端设备占比高，先降 build target，再议 Preact 降级。
- 放弃引擎的场景管理，以 <100 行屏幕状态机自建，代价可接受（已实现）。
- 真机触摸清单（spike README 底部 6 项）待项目主在实体平板/手机各过一遍；任何一项不过，回本 ADR 重议。

## Status

accepted（2026-09-10，grill 会话逐项确认：Q1-Q5 采纳推荐，Q6 项目主定 React，Q7 项目主定 Tailwind 并按 v4 事实修正，Q8 默认采纳）
