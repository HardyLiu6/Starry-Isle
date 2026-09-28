import creditsData from '../asset-credits.json';

/** src/asset-credits.json 的形状（由 scripts/check-assets.mjs 的 generateCredits 生成） */
interface CreditSource {
  id: string;
  name: string;
  attribution: string;
  copyright?: string;
  license: { id: string; title: string; url: string };
  count: number;
  version?: string;
  titles?: string[];
  modified?: boolean;
  ai: boolean;
}
const credits = creditsData as { hasNc: boolean; hasAi: boolean; sources: CreditSource[] };

/**
 * 应用内素材署名（ADR-0007 决定 8）。数据由 scripts/check-assets.mjs 依据溯源清单生成，
 * 与仓库里的 CREDITS.md 出自同一份清单；随包离线，许可链接只作文本显示，不发任何网络请求。
 */
export function AssetCredits() {
  return (
    <div>
      <p>星屿里的表情与情境图片来自下面这些来源，都按各自的开源许可使用。完整清单见代码仓库里的 CREDITS.md。</p>
      <ul>
        {credits.sources.map((s) => (
          <li key={s.id}>
            <strong>{s.name}</strong>：{s.attribution}
            {s.copyright ? `（${s.copyright}）` : ''}。许可：{s.license.title}，{s.license.url}。
            {s.titles ? `包括${s.titles.join('、')}。` : ''}
            {s.modified === undefined ? '' : s.modified ? '部分文件有修改，记录见 CREDITS.md。' : '未作修改。'}
          </li>
        ))}
      </ul>
      {credits.hasAi && (
        <p>带"AI 生成"角标的图片由 AI 离线生成，画中人物均为虚构，按 CC0 1.0 发布。</p>
      )}
      <p>星灵、海岛等界面图形由星屿项目自己绘制，随代码按 MIT 许可开源。</p>
    </div>
  );
}
