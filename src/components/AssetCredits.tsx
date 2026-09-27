import credits from '../asset-credits.json';

/**
 * 应用内素材署名（ADR-0007 决定 8）。数据由 scripts/check-assets.mjs 依据溯源清单生成，
 * 与仓库里的 CREDITS.md 出自同一份清单；随包离线，许可链接只作文本显示，不发任何网络请求。
 */
export function AssetCredits() {
  return (
    <div>
      <p>星屿里的图片来自下面这些来源，都按各自的开源许可使用。完整清单见代码仓库里的 CREDITS.md。</p>
      <ul>
        {credits.sources.map((s) => (
          <li key={s.id}>
            <strong>{s.name}</strong>：{s.attribution}
            {'copyright' in s && s.copyright ? `（${s.copyright}）` : ''}。许可：{s.license.title}，{s.license.url}。
            {'titles' in s && s.titles ? `包括${s.titles.join('、')}。` : ''}
            {'modified' in s ? (s.modified ? '部分文件有修改，记录见 CREDITS.md。' : '未作修改。') : ''}
          </li>
        ))}
      </ul>
      {credits.hasAi && (
        <p>带"AI 生成"角标的图片由 AI 离线生成，画中人物均为虚构，按 CC0 1.0 发布。</p>
      )}
    </div>
  );
}
