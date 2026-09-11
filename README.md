# 星屿 Starry Isle

**公益、免费、开源的儿童情绪认知辅助训练应用**——为孤独症（自闭症）谱系儿童的家庭设计，家长陪着一起玩。

星屿是一款面向儿童的公益开源互动训练软件，不是医疗器械，也不是网络游戏运营服务。<!-- banned-ok：定性句，依据内部合规调研的否定式表述 -->

> 🚧 项目处于早期开发阶段（开发一期：工程底座 + 第一个练习"认表情"）。

## 它是什么

从「高兴 / 难过 / 生气 / 害怕」四种基础表情开始的亲子练习：孩子认屏幕上的表情，也认**家长真实的脸**——每一局都内置"轮到家长做表情、孩子来猜"的共玩回合，把屏幕里学到的带进真实生活。

**为家庭做的设计承诺：**

- **完全本地运行**：无账号、无广告、无第三方统计，不收集也不上传任何数据（代码开源，可以查证）；
- **克制的节奏**：每次固定 10 个小回合，有结束预告和收尾仪式；不做签到、连击、排行榜，答错没有惩罚；
- **家长是玩伴而不是旁观者**：所有提示语由家长读给孩子听，共玩环节是练习的核心组成；
- **感官友好**：声音默认关闭、音量克制；跟随系统"减弱动态效果"设置自动减少动画；
- **年龄中性的画面**：星空与海岛，没有低幼卡通——发展阶段相仿但年龄更大的孩子也能安心使用。

练习结构参考了公开发表的教育与发展心理学研究资料（如表情认知的强度递进、多样本呈现、亲子共同参与等公开研究思路）。

## 快速开始

**直接使用**：用平板或手机浏览器打开发布地址即可，无需安装、无需注册。（发布地址将在第一个版本就绪后提供。）

**本地开发**：

```bash
npm ci        # 安装依赖
npm run dev   # 开发服务器
npm run check # 措辞检查 + 类型检查 + 逻辑不变量检查
npm run build # 构建纯静态产物（dist/，任意静态目录可运行）
```

技术栈：React 19 + TypeScript(strict) + Tailwind CSS v4 + Vite，纯静态前端、零服务器依赖。选型依据与全部权衡见 [ADR-0005](docs/adr/0005-技术选型React纯静态DOM不用游戏引擎.md)。<!-- banned-ok：技术文档文件名引用（"引擎"为技术名词） -->

## 参与贡献

请先读 [CONTRIBUTING.md](CONTRIBUTING.md) 与项目词库 [CONTEXT.md](CONTEXT.md)——本项目对措辞有严格约束（`npm run check:words` 会强制检查）。设计决策记录在 [docs/adr/](docs/adr/)，产品规划见 [docs/planning/](docs/planning/)。

## 许可

- **代码**：[MIT](LICENSE)
- **素材**：与代码分开授权，逐来源署名见 [CREDITS.md](CREDITS.md)（OpenMoji CC BY-SA 4.0、Twemoji CC BY 4.0、自制素材 CC BY-SA 4.0）。当前全部素材可商业再分发；若将来引入 NC（非商业）素材，会在 CREDITS 与此处明确标注。

其他：[安全策略](SECURITY.md)（漏洞请私密上报）· [行为准则](CODE_OF_CONDUCT.md)

## 重要声明 / Disclaimer

<!-- disclaimer:start 与应用内首启页、项目主页三处同文，修改须三处同步 -->

星屿（Starry Isle）是一款公益、免费、开源的儿童互动训练软件，仅供学习、练习与家庭亲子互动使用。

- 本软件**不是医疗器械**，未经任何药品监督管理部门注册或审批；不用于任何疾病（包括孤独症谱系障碍）的**诊断、治疗、预防、监护或缓解**，不构成医疗建议。
- 本软件**不能替代**专业医疗诊断、康复干预或特殊教育服务。关于儿童发育与健康的任何问题，请咨询医师或专业干预机构。
- 软件内的练习内容参考了公开的教育与发展心理学资料，但**不对任何使用效果作出承诺或保证**；效果因人而异。
- 建议儿童在**监护人陪同**下使用本软件，并遵循适度使用原则（建议单次不超过 20 分钟）。
- 本软件按"现状（AS IS）"提供，按 MIT 许可证授权，在法律允许的最大范围内不提供任何明示或默示的担保；使用本软件的风险由使用者自行承担。

This software is **not a medical device** and is not intended to diagnose, treat, cure, prevent, or mitigate any disease or condition, including autism spectrum disorder. It does not provide medical advice and is not a substitute for professional evaluation, therapy, or special education services. All content is for educational and informational purposes only. Use at your own risk; provided "AS IS" without warranty of any kind. Children should use this software under the supervision of a parent or guardian.

<!-- disclaimer:end -->
