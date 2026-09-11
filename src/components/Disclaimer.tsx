/**
 * 免责声明——与 README、（未来的）项目主页三处同文（ADR-0004 / 研 04 §六模板）。
 * 文本的唯一来源是 src/disclaimer.json（ADR-0006 决定 13）：改那里即可，
 * README 是否同步由 `npm run check:disclaimer` 机器校验，不再依赖人工记忆。
 */
import disclaimer from '../disclaimer.json';

/** 把 **强调** 标记渲染为 <strong>（与 README 的 markdown 加粗同一份源文本） */
function withEmphasis(text: string) {
  return text.split('**').map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part));
}

export function Disclaimer() {
  return (
    <div className="box" role="note">
      <strong>重要声明</strong>
      <ul>
        <li>{withEmphasis(disclaimer.intro)}</li>
        {disclaimer.items.map((item) => (
          <li key={item.slice(0, 12)}>{withEmphasis(item)}</li>
        ))}
      </ul>
      <p className="sub">{withEmphasis(disclaimer.en)}</p>
    </div>
  );
}
